import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

async function main(inputFile: string) {
	if (!fs.existsSync(inputFile)) {
		console.error(`Audio file not found: ${inputFile}`);
        process.exit(1);
	}

	try {
		const zai = await ZAI.create();

		const audioBuffer = fs.readFileSync(inputFile);
		const file_base64 = audioBuffer.toString('base64');

		const result = await zai.audio.asr.create({ file_base64 });

        if (result.text) {
		    console.log(result.text);
        } else {
            throw new Error('ASR failed to produce text.');
        }
	} catch (err: any) {
		console.error('ASR failed:', err?.message || err);
        process.exit(1);
	}
}

const args = process.argv.slice(2);
const inputFileIndex = args.indexOf('--input_file');
if (inputFileIndex === -1 || inputFileIndex === args.length - 1) {
  console.error('Usage: ts-node asr.ts --input_file "<path_to_audio>"');
  process.exit(1);
}

const inputFile = args[inputFileIndex + 1];
main(inputFile);
