/**
 * Voice utilities for PersonaPlex Voice skill
 * Supports Cloudflare Workers AI, NVIDIA NIM, OpenAI, and ElevenLabs
 */

const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration from environment
const TTS_PROVIDER = process.env.TTS_PROVIDER || 'openai';
const STT_PROVIDER = process.env.STT_PROVIDER || 'openai';
const NVIDIA_NIM_ENDPOINT = process.env.NVIDIA_NIM_ENDPOINT;
const NVIDIA_NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;
const TTS_VOICE = process.env.TTS_VOICE || (TTS_PROVIDER === 'workersai' ? 'aura-asteria-en' : 'tts-1');

/**
 * Make an HTTP/HTTPS request with promise support
 */
function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = protocol.request(reqOptions, (res) => {
      let body = [];
      res.on('data', chunk => body.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(body);
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: buffer,
            json: res.headers['content-type']?.includes('application/json') 
              ? JSON.parse(buffer.toString()) 
              : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: buffer });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : Buffer.from(data));
    }

    req.end();
  });
}

/**
 * Synthesize speech using Workers AI (Deepgram Aura)
 */
async function synthesizeWithWorkersAI(text, voice = TTS_VOICE) {
  console.log(`[Workers AI TTS] Synthesizing: "${text.slice(0, 50)}..." with voice: ${voice}`);
  
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
  if (!CF_ACCOUNT_ID) {
    throw new Error('CF_ACCOUNT_ID environment variable required for Workers AI');
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${voice}`;
  
  const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.AI_GATEWAY_API_KEY;
  if (!CF_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN or AI_GATEWAY_API_KEY required for Workers AI');
  }

  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({ text }));

  if (response.status !== 200) {
    throw new Error(`Workers AI TTS failed: ${response.status} - ${response.json?.errors?.[0]?.message || 'Unknown error'}`);
  }

  return response.data;
}

/**
 * Synthesize speech using NVIDIA NIM
 */
async function synthesizeWithNIM(text, voice = TTS_VOICE) {
  console.log(`[NVIDIA NIM TTS] Synthesizing: "${text.slice(0, 50)}..."`);
  
  if (!NVIDIA_NIM_ENDPOINT) {
    throw new Error('NVIDIA_NIM_ENDPOINT environment variable required for NIM provider');
  }

  const url = `${NVIDIA_NIM_ENDPOINT}/v1/audio/synthesize`;
  const headers = {
    'Content-Type': 'application/json'
  };
  if (NVIDIA_NIM_API_KEY) {
    headers['Authorization'] = `Bearer ${NVIDIA_NIM_API_KEY}`;
  }

  const response = await makeRequest(url, {
    method: 'POST',
    headers
  }, JSON.stringify({ 
    text,
    voice: voice || 'en-US',
    output_format: 'wav'
  }));

  if (response.status !== 200) {
    throw new Error(`NIM TTS failed: ${response.status}`);
  }

  return response.data;
}

/**
 * Synthesize speech using OpenAI
 */
async function synthesizeWithOpenAI(text, voice = 'alloy') {
  console.log(`[OpenAI TTS] Synthesizing: "${text.slice(0, 50)}..."`);
  
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable required for OpenAI TTS');
  }

  const url = 'https://api.openai.com/v1/audio/speech';
  
  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    model: 'tts-1',
    input: text,
    voice: voice
  }));

  if (response.status !== 200) {
    throw new Error(`OpenAI TTS failed: ${response.status}`);
  }

  return response.data;
}

/**
 * Transcribe audio using Workers AI (Deepgram Nova)
 */
async function transcribeWithWorkersAI(audioPath) {
  console.log(`[Workers AI STT] Transcribing: ${audioPath}`);
  
  const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
  if (!CF_ACCOUNT_ID) {
    throw new Error('CF_ACCOUNT_ID environment variable required for Workers AI');
  }

  const audioBuffer = fs.readFileSync(audioPath);
  const base64Audio = audioBuffer.toString('base64');

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/deepgram/nova-2`;
  
  const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.AI_GATEWAY_API_KEY;
  if (!CF_API_TOKEN) {
    throw new Error('CLOUDFLARE_API_TOKEN or AI_GATEWAY_API_KEY required for Workers AI');
  }

  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }, JSON.stringify({
    audio: base64Audio
  }));

  if (response.status !== 200) {
    throw new Error(`Workers AI STT failed: ${response.status}`);
  }

  return response.json?.text?.text || '';
}

/**
 * Transcribe audio using NVIDIA NIM (Riva ASR)
 */
async function transcribeWithNIM(audioPath) {
  console.log(`[NVIDIA NIM STT] Transcribing: ${audioPath}`);
  
  if (!NVIDIA_NIM_ENDPOINT) {
    throw new Error('NVIDIA_NIM_ENDPOINT environment variable required for NIM provider');
  }

  const url = `${NVIDIA_NIM_ENDPOINT}/v1/audio/transcribe`;
  const headers = {
    'Content-Type': 'multipart/form-data'
  };
  if (NVIDIA_NIM_API_KEY) {
    headers['Authorization'] = `Bearer ${NVIDIA_NIM_API_KEY}`;
  }

  // For multipart form data, we'd need to use FormData, simplified here
  const audioBuffer = fs.readFileSync(audioPath);
  
  // This is a simplified version - in production, use proper multipart/form-data
  const response = await makeRequest(url, {
    method: 'POST',
    headers
  }, audioBuffer);

  if (response.status !== 200) {
    throw new Error(`NIM STT failed: ${response.status}`);
  }

  return response.json?.text || '';
}

/**
 * Transcribe audio using OpenAI Whisper
 */
async function transcribeWithOpenAI(audioPath) {
  console.log(`[OpenAI STT] Transcribing: ${audioPath}`);
  
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable required for OpenAI STT');
  }

  const url = 'https://api.openai.com/v1/audio/transcriptions';
  const audioBuffer = fs.readFileSync(audioPath);

  // Create multipart/form-data boundary
  const boundary = '----form-data-' + Date.now();
  const formData = [];

  formData.push(`--${boundary}`);
  formData.push('Content-Disposition: form-data; name="file"; filename="audio.wav"');
  formData.push('Content-Type: audio/wav');
  formData.push('');
  formData.push(audioBuffer.toString('binary'));
  formData.push(`--${boundary}`);
  formData.push('Content-Disposition: form-data; name="model"');
  formData.push('');
  formData.push('whisper-1');
  formData.push(`--${boundary}--`);

  const body = formData.join('\r\n');

  const response = await makeRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    }
  }, body);

  if (response.status !== 200) {
    throw new Error(`OpenAI STT failed: ${response.status}`);
  }

  return response.json?.text || '';
}

/**
 * Synthesize speech using the configured provider
 */
async function synthesizeSpeech(text, voice = null) {
  const provider = (TTS_PROVIDER || 'openai').toLowerCase();
  const voiceToUse = voice || TTS_VOICE;
  
  console.log(`[TTS] Using provider: ${provider}, voice: ${voiceToUse}`);
  
  switch (provider) {
    case 'workersai':
      return synthesizeWithWorkersAI(text, voiceToUse);
    case 'nim':
      return synthesizeWithNIM(text, voiceToUse);
    case 'elevenlabs':
      // ElevenLabs would need separate implementation
      throw new Error('ElevenLabs provider not yet implemented');
    case 'openai':
    default:
      return synthesizeWithOpenAI(text, voiceToUse);
  }
}

/**
 * Transcribe audio using the configured provider
 */
async function transcribeAudio(audioPath) {
  const provider = (STT_PROVIDER || 'openai').toLowerCase();
  
  console.log(`[STT] Using provider: ${provider}`);
  
  switch (provider) {
    case 'workersai':
      return transcribeWithWorkersAI(audioPath);
    case 'nim':
      return transcribeWithNIM(audioPath);
    case 'openai':
    default:
      return transcribeWithOpenAI(audioPath);
  }
}

/**
 * Full voice interaction: transcribe -> (process with LLM) -> synthesize
 * @param {string} inputAudioPath - Path to input audio file
 * @param {Function} llmProcessor - Optional async function to process transcribed text with LLM
 * @returns {Promise<Buffer>} Audio buffer with synthesized response
 */
async function voiceInteraction(inputAudioPath, llmProcessor = null) {
  try {
    // Step 1: Transcribe input audio
    const transcribedText = await transcribeAudio(inputAudioPath);
    console.log(`[Voice] Transcribed: "${transcribedText}"`);

    // Step 2: Process with LLM (if provided)
    const responseText = llmProcessor
      ? await llmProcessor(transcribedText)
      : `I heard: "${transcribedText}"`;
    
    console.log(`[Voice] Response: "${responseText}"`);

    // Step 3: Synthesize response audio
    const audioBuffer = await synthesizeSpeech(responseText);
    
    console.log(`[Voice] Synthesized ${audioBuffer.length} bytes of audio`);
    return audioBuffer;
  } catch (error) {
    console.error('[Voice] Interaction failed:', error);
    throw error;
  }
}

module.exports = {
  synthesizeSpeech,
  transcribeAudio,
  voiceInteraction,
  // Provider-specific exports
  synthesizeWithWorkersAI,
  synthesizeWithNIM,
  synthesizeWithOpenAI,
  transcribeWithWorkersAI,
  transcribeWithNIM,
  transcribeWithOpenAI
};
