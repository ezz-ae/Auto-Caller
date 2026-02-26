import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

interface SkillParameter {
  name: string;
  type: string;
  description: string;
}

interface Skill {
  name: string;
  description: string;
  runtime: 'python' | 'typescript';
  entrypoint: string;
  parameters: SkillParameter[];
}

// Function to execute a command and return a promise
function executeCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args);
    let result = '';
    child.stdout.on('data', (data) => {
      result += data.toString();
    });
    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(`Process exited with code ${code}`);
      }
      resolve(result.trim());
    });
  });
}

// Function to load all skill manifests
async function loadAllSkills(skillsDir: string): Promise<Skill[]> {
    const skills: Skill[] = [];
    const entries = await fs.promises.readdir(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            const skillManifestPath = path.join(skillsDir, entry.name, 'skill.json');
            if (fs.existsSync(skillManifestPath)) {
                try {
                    const manifestContent = await fs.promises.readFile(skillManifestPath, 'utf-8');
                    const skill: Skill = JSON.parse(manifestContent);
                    if (skill.name !== 'workflow.run') { // Exclude self
                        skills.push(skill);
                    }
                } catch (error) {
                    console.error(`Error loading skill from ${skillManifestPath}:`, error);
                }
            }
        }
    }
    return skills;
}

// Main orchestration logic
async function main(userPrompt: string) {
  const skillsDir = path.join(__dirname, '..', '..');
  const availableSkills = await loadAllSkills(skillsDir);

  const toolsList = availableSkills.map(s => ({
    name: s.name,
    description: s.description,
    parameters: s.parameters,
  }));

  const plannerPrompt = `
    You are a workflow planner. Your job is to take a user's request and break it down into a sequence of tool calls.
    You have the following tools available:
    ${JSON.stringify(toolsList, null, 2)}

    The user's request is: "${userPrompt}"

    You must respond with a JSON object that is an array of steps. Each step should have a "tool_name" and "parameters".
    The parameters can reference the output of a previous step using the format "$steps.<step_index>.output".
    For example:
    [
      {
        "tool_name": "asr.transcribe",
        "parameters": {
          "input_file": "/path/to/meeting.wav"
        }
      },
      {
        "tool_name": "llm.chat",
        "parameters": {
          "prompt": "Please summarize the following text: $steps.0.output"
        }
      }
    ]

    Now, generate the JSON plan for the user's request.
    `;

  try {
    // 1. Call the LLM to get the plan
    const llmPath = path.join(skillsDir, 'LLM', 'scripts', 'chat.ts');
    const planString = await executeCommand('ts-node', [llmPath, '--prompt', plannerPrompt]);
    const plan = JSON.parse(planString);

    // 2. Execute the plan
    const stepOutputs: any[] = [];
    for (let i = 0; i < plan.length; i++) {
      const step = plan[i];
      const skill = availableSkills.find(s => s.name === step.tool_name);
      if (!skill) {
        throw new Error(`Unknown tool: ${step.tool_name}`);
      }

      // Resolve parameters that reference previous steps
      const resolvedParams: Record<string, string> = {};
      for (const key in step.parameters) {
        let value = step.parameters[key];
        if (typeof value === 'string' && value.startsWith('$steps.')) {
          const parts = value.split('.');
          const stepIndex = parseInt(parts[1]);
          if (stepIndex >= 0 && stepIndex < stepOutputs.length) {
            value = stepOutputs[stepIndex];
          }
        }
        resolvedParams[key] = value;
      }

      const skillEntrypoint = path.join(skillsDir, skill.runtime === 'typescript' ? path.dirname(skill.entrypoint) : '', skill.entrypoint);

      const args = Object.entries(resolvedParams).flatMap(([key, value]) => [`--${key}`, value]);
      const runtime = skill.runtime === 'python' ? 'python3' : 'ts-node';
      
      const output = await executeCommand(runtime, [skillEntrypoint, ...args]);
      stepOutputs.push(output);
    }

    // 3. Output the final result
    console.log(stepOutputs[stepOutputs.length - 1]);

  } catch (error) {
    console.error("Workflow failed:", error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const promptIndex = args.indexOf('--prompt');
if (promptIndex === -1 || promptIndex === args.length - 1) {
  console.error('Usage: ts-node run.ts --prompt "<your workflow prompt>"');
  process.exit(1);
}

const userPrompt = args[promptIndex + 1];
main(userPrompt);
