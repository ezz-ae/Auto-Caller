import ZAI, { ChatMessage } from "z-ai-web-dev-sdk";

async function main(prompt: string) {
  try {
    const zai = await ZAI.create();

    const messages: ChatMessage[] = [
      {
        role: "assistant",
        content: "You are a helpful assistant."
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    const response = await zai.chat.completions.create({
      messages,
      stream: false,
      thinking: { type: "disabled" },
    });

    const reply = response.choices?.[0]?.message?.content;
    if (reply) {
      console.log(reply);
    } else {
      throw new Error("No reply from LLM");
    }
  } catch (err: any) {
    console.error("Chat failed:", err?.message || err);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const promptIndex = args.indexOf('--prompt');
if (promptIndex === -1 || promptIndex === args.length - 1) {
  console.error('Usage: ts-node chat.ts --prompt "<your prompt>"');
  process.exit(1);
}

const prompt = args[promptIndex + 1];
main(prompt);
