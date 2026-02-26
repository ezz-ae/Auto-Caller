import { WebSocketServer, WebSocket } from 'ws';
import { Deepgram } from '@deepgram/sdk';

// TODO: Replace with your Deepgram API Key
const deepgramApiKey = process.env.DEEPGRAM_API_KEY || 'YOUR_DEEPGRAM_API_KEY';

if (deepgramApiKey === 'YOUR_DEEPGRAM_API_KEY') {
  console.log('Please replace YOUR_DEEPGRAM_API_KEY with your actual Deepgram API key.');
}

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');

  const deepgram = new Deepgram(deepgramApiKey);
  const deepgramLive = deepgram.transcription.live({
    interim_results: true,
    punctuate: true,
    endpointing: true,
    vad_events: true,
  });

  deepgramLive.addListener('open', () => {
    console.log('Deepgram connection opened');
  });

  deepgramLive.addListener('transcript', (data) => {
    const transcript = data.channel.alternatives[0].transcript;
    if (transcript) {
      console.log('Transcript:', transcript);
    }
  });

  deepgramLive.addListener('error', (error) => {
    console.error('Deepgram error:', error);
  });

  deepgramLive.addListener('close', () => {
    console.log('Deepgram connection closed');
  });

  ws.on('message', (message: Buffer) => {
    // This is where the audio stream from Twilio will be forwarded
    if (deepgramLive.getReadyState() === 1) {
      deepgramLive.send(message);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (deepgramLive.getReadyState() === 1) {
      deepgramLive.finish();
    }
  });
});

console.log('WebSocket server started on port 8080');
