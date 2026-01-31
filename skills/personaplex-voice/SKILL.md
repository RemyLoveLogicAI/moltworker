---
name: personaplex-voice
description: Voice interaction skill using Cloudflare Workers AI (Deepgram Aura TTS/STT) powered by NVIDIA GPUs. Provides intelligent voice-to-voice conversations with customizable personas. Supports fallback to NVIDIA NIM endpoints.
---

# PersonaPlex Voice Interaction

Voice interaction skill using Cloudflare Workers AI with NVIDIA-powered Deepgram Aura models for natural, low-latency TTS and STT.

## Prerequisites

One of the following TTS/STT provider configurations:

### Cloudflare Workers AI (Recommended)
- No additional setup required
- Uses Workers AI binding configured in wrangler.jsonc
- Models: Deepgram Aura TTS (`@cf/deepgram/aura-*`), Nova STT (`@cf/deepgram/nova-2`)

### NVIDIA NIM
- `NVIDIA_NIM_ENDPOINT` environment variable set to your NIM instance
- `NVIDIA_NIM_API_KEY` environment variable set (if required)
- Models: Riva TTS, Riva ASR

### OpenAI / ElevenLabs
- `OPENAI_API_KEY` or `ELEVENLABS_API_KEY` environment variable set
- Standard OpenAI/ElevenLabs models

## Configuration

Set the following environment variables:

```bash
# Use Workers AI (Deepgram Aura) - NVIDIA GPU-powered
TTS_PROVIDER=workersai
STT_PROVIDER=workersai
TTS_VOICE=aura-asteria-en  # or aura-asteria-en, aura-orion-en, aura-luna-en

# Alternative: Use NVIDIA NIM endpoint
TTS_PROVIDER=nim
STT_PROVIDER=nim
NVIDIA_NIM_ENDPOINT=https://your-nim-host:8000
NVIDIA_NIM_API_KEY=your-api-key

# Alternative: Use OpenAI
TTS_PROVIDER=openai
STT_PROVIDER=openai
TTS_VOICE=tts-1
```

## Quick Start

### Voice Interaction via Web UI
1. Navigate to the Moltbot Control UI
2. Use the voice-call plugin (if enabled) for telephony-based voice calls
3. Speak naturally and receive AI responses in real-time

### Programmatic Usage
```bash
# Record audio, transcribe, process, and respond
cat <<'EOF' | node 
const { transcribeAudio, synthesizeSpeech } = require('./voice-utils.js');

// Transcribe input audio
const text = await transcribeAudio('input.wav');
console.log('Transcribed:', text);

// Synthesize response
const audio = await synthesizeSpeech('Hello! How can I help you?');
// Save or play audio
EOF
```

## Supported TTS Models

### Workers AI (Deepgram Aura)
| Model | Voice | Description |
|-------|-------|-------------|
| `aura-asteria-en` | Asteria | Natural, expressive English voice |
| `aura-orion-en` | Orion | Deep, authoritative English voice |
| `aura-luna-en` | Luna | Warm, friendly English voice |
| `aura-stella-en` | Stella | Professional English voice |

### NVIDIA NIM (Riva)
- English, Spanish, French voices
- Zero-shot voice cloning
- Custom voice adapters

### OpenAI
- `tts-1`, `tts-1-hd` models
- Voices: alloy, echo, fable, onyx, nova, shimmer

## Supported STT Models

### Workers AI (Deepgram Nova)
| Model | Description |
|-------|-------------|
| `nova-2` | Real-time speech-to-text, multilingual |

### NVIDIA NIM (Riva ASR)
- Multilingual support
- Punctuation and capitalization
- Speaker diarization

### OpenAI
- `whisper-1` - General purpose transcription

## Persona Customization

### System Prompt Configuration

Create a persona prompt file:

```json
{
  "persona": {
    "name": "AI Assistant",
    "role": "You are a helpful, intelligent AI assistant",
    "traits": ["friendly", "professional", "concise"],
    "voice_style": "warm and conversational"
  }
}
```

### Voice Conditioning (NVIDIA NIM)

```bash
# Use a reference audio for voice cloning
curl -X POST "${NVIDIA_NIM_ENDPOINT}/v1/audio/synthesize" \
  -H "Authorization: Bearer ${NVIDIA_NIM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test.",
    "voice_reference": "path/to/voice_sample.wav"
  }'
```

## Integration with Voice-Call Plugin

The skill integrates with Moltbot's voice-call plugin for telephony-based voice interactions:

```json
{
  "plugins": {
    "voice-call": {
      "enabled": true,
      "tts": {
        "provider": "workersai",
        "model": "@cf/deepgram/aura-asteria-en"
      },
      "stt": {
        "provider": "workersai",
        "model": "@cf/deepgram/nova-2"
      }
    }
  }
}
```

## API Endpoints (NVIDIA NIM)

### TTS Synthesis
```
POST ${NVIDIA_NIM_ENDPOINT}/v1/audio/synthesize
Content-Type: application/json
Authorization: Bearer ${NVIDIA_NIM_API_KEY}

{
  "text": "Hello, world!",
  "voice": "en-US",
  "output_format": "wav"
}
```

### STT Transcription
```
POST ${NVIDIA_NIM_ENDPOINT}/v1/audio/transcribe
Content-Type: multipart/form-data
Authorization: Bearer ${NVIDIA_NIM_API_KEY}

--boundary
Content-Disposition: form-data; name="audio"; filename="audio.wav"
Content-Type: audio/wav

[binary audio data]
--boundary--
```

## Performance Characteristics

| Provider | Latency | Quality | Notes |
|----------|---------|---------|-------|
| Workers AI | ~200ms | High | NVIDIA GPU-powered at edge |
| NVIDIA NIM | ~150ms | Highest | Self-hosted, low latency |
| OpenAI | ~300ms | Good | General purpose |
| ElevenLabs | ~400ms | Excellent | Premium quality |

## Troubleshooting

### Workers AI Not Working
- Verify AI binding is configured in `wrangler.jsonc`
- Check Workers AI quota in Cloudflare Dashboard
- Ensure worker has AI permissions

### NVIDIA NIM Connection Issues
- Verify `NVIDIA_NIM_ENDPOINT` is accessible
- Check firewall rules for outbound connections
- Validate API key if authentication fails

### Audio Quality Issues
- For Workers AI, try different aura models
- Ensure audio input is 16kHz or 44.1kHz
- Check for network latency issues

## Advanced Features

### Streaming TTS
Workers AI and NVIDIA NIM support streaming audio synthesis for lower latency:

```javascript
// Streaming response with Workers AI
const response = await fetch(
  'https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/ai/run/@cf/deepgram/aura-asteria-en',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "Hello, this is streaming audio.",
      stream: true
    })
  }
);
```

### Multilingual Support
Workers AI Deepgram models support multiple languages:

| Model | Language |
|-------|----------|
| `aura-asteria-en` | English |
| `aura-orion-es` | Spanish |
| Custom | Other languages via model fine-tuning |

## NVIDIA PersonaPlex Integration Note

NVIDIA PersonaPlex is a full-duplex speech-to-speech model that requires GPU compute and Python runtime. It cannot run directly in Cloudflare Sandbox containers.

**Alternatives for PersonaPlex-like functionality:**
1. **Workers AI (Deepgram Aura)** - NVIDIA GPU-powered TTS/STT with human-like voices
2. **NVIDIA NIM** - Deploy PersonaPlex externally and connect via NIM endpoint
3. **OpenAI Realtime API** - Streaming voice-to-voice conversations

To use PersonaPlex directly:
1. Deploy PersonaPlex on GPU infrastructure (separate from Cloudflare)
2. Configure `NVIDIA_NIM_ENDPOINT` to point to your PersonaPlex instance
3. Use TTS/STT via NIM endpoints as shown above
