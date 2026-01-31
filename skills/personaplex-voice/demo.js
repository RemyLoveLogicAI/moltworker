/**
 * Demo script for PersonaPlex Voice skill
 * Demonstrates voice-to-voice interaction with Moltbot
 */

const voiceUtils = require('./voice-utils.js');

// Demo LLM processor - in production, this would call Moltbot
async function demoLlmProcessor(text) {
  console.log(`[LLM] Processing: "${text}"`);
  
  // Simple echo/response for demo
  const responses = [
    `I understand you said: "${text}". How can I help you further?`,
    `That's interesting! You mentioned "${text}". Tell me more.`,
    `I heard: "${text}". Let me think about that for a moment.`,
    `Thank you for saying: "${text}". I'm here to assist you.`,
    `Acknowledged. You said: "${text}". What would you like to do next?`
  ];
  
  // Simple hash-based selection for deterministic but varied responses
  const index = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % responses.length;
  return responses[index];
}

/**
 * Run voice interaction demo
 */
async function runDemo(inputAudioPath) {
  console.log('=== PersonaPlex Voice Demo ===');
  console.log('Provider Configuration:');
  console.log(`  TTS Provider: ${process.env.TTS_PROVIDER || 'openai'}`);
  console.log(`  STT Provider: ${process.env.STT_PROVIDER || 'openai'}`);
  console.log(`  TTS Voice: ${process.env.TTS_VOICE || 'default'}`);
  console.log('');

  if (!inputAudioPath) {
    console.error('Error: Input audio path required');
    console.log('Usage: node demo.js <input_audio.wav>');
    process.exit(1);
  }

  try {
    // Perform voice interaction
    const outputAudio = await voiceUtils.voiceInteraction(
      inputAudioPath,
      demoLlmProcessor
    );

    // Save output audio
    const outputPath = 'output_response.wav';
    require('fs').writeFileSync(outputPath, outputAudio);
    console.log('');
    console.log('=== Demo Complete ===');
    console.log(`Output saved to: ${outputPath}`);
    console.log(`Duration: ~${outputAudio.length / 16000 / 2} seconds (estimated)`);
  } catch (error) {
    console.error('Demo failed:', error.message);
    process.exit(1);
  }
}

// Simple TTS-only demo
async function runTTSDemo() {
  console.log('=== TTS-only Demo ===');
  
  const text = process.argv[2] || 'Hello! This is a demonstration of the PersonaPlex Voice skill using Cloudflare Workers AI with NVIDIA-powered Deepgram Aura models.';
  
  try {
    const audio = await voiceUtils.synthesizeSpeech(text);
    
    const outputPath = 'tts_output.wav';
    require('fs').writeFileSync(outputPath, audio);
    console.log(`TTS complete. Output saved to: ${outputPath}`);
    console.log(`Text: "${text}"`);
    console.log(`Audio size: ${audio.length} bytes`);
  } catch (error) {
    console.error('TTS demo failed:', error.message);
    process.exit(1);
  }
}

// Simple STT-only demo
async function runSTTDemo() {
  console.log('=== STT-only Demo ===');
  
  const inputAudioPath = process.argv[2];
  if (!inputAudioPath) {
    console.error('Error: Input audio path required');
    console.log('Usage: node demo.js stt <input_audio.wav>');
    process.exit(1);
  }

  try {
    const text = await voiceUtils.transcribeAudio(inputAudioPath);
    console.log('STT complete.');
    console.log(`Input: ${inputAudioPath}`);
    console.log(`Transcribed: "${text}"`);
  } catch (error) {
    console.error('STT demo failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'tts':
    runTTSDemo();
    break;
  case 'stt':
    runSTTDemo();
    break;
  default:
    if (command && !command.startsWith('-')) {
      runDemo(command);
    } else {
      console.log('PersonaPlex Voice Demo');
      console.log('');
      console.log('Usage:');
      console.log('  node demo.js <input_audio.wav>        Full voice interaction demo');
      console.log('  node demo.js tts <text>              TTS-only demo');
      console.log('  node demo.js stt <input_audio.wav>   STT-only demo');
      console.log('');
      console.log('Environment Variables:');
      console.log('  TTS_PROVIDER=workersai|nim|openai');
      console.log('  STT_PROVIDER=workersai|nim|openai');
      console.log('  TTS_VOICE=aura-asteria-en|tts-1|...');
      console.log('  NVIDIA_NIM_ENDPOINT=https://...');
      console.log('  NVIDIA_NIM_API_KEY=...');
      console.log('  OPENAI_API_KEY=...');
    }
}
