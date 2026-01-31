import type { MoltbotEnv } from '../types';

/**
 * Build environment variables to pass to the Moltbot container process
 * 
 * @param env - Worker environment bindings
 * @returns Environment variables record
 */
export function buildEnvVars(env: MoltbotEnv): Record<string, string> {
  const envVars: Record<string, string> = {};

  // Normalize the base URL by removing trailing slashes
  const normalizedBaseUrl = env.AI_GATEWAY_BASE_URL?.replace(/\/+$/, '');
  const isOpenAIGateway = normalizedBaseUrl?.endsWith('/openai');

  // AI Gateway vars take precedence
  // Map to the appropriate provider env var based on the gateway endpoint
  if (env.AI_GATEWAY_API_KEY) {
    if (isOpenAIGateway) {
      envVars.OPENAI_API_KEY = env.AI_GATEWAY_API_KEY;
    } else {
      envVars.ANTHROPIC_API_KEY = env.AI_GATEWAY_API_KEY;
    }
  }

  // Fall back to direct provider keys
  if (!envVars.ANTHROPIC_API_KEY && env.ANTHROPIC_API_KEY) {
    envVars.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  }
  if (!envVars.OPENAI_API_KEY && env.OPENAI_API_KEY) {
    envVars.OPENAI_API_KEY = env.OPENAI_API_KEY;
  }

  // Pass base URL (used by start-moltbot.sh to determine provider)
  if (normalizedBaseUrl) {
    envVars.AI_GATEWAY_BASE_URL = normalizedBaseUrl;
    // Also set the provider-specific base URL env var
    if (isOpenAIGateway) {
      envVars.OPENAI_BASE_URL = normalizedBaseUrl;
    } else {
      envVars.ANTHROPIC_BASE_URL = normalizedBaseUrl;
    }
  } else if (env.ANTHROPIC_BASE_URL) {
    envVars.ANTHROPIC_BASE_URL = env.ANTHROPIC_BASE_URL;
  }
  // Map MOLTBOT_GATEWAY_TOKEN to CLAWDBOT_GATEWAY_TOKEN (container expects this name)
  if (env.MOLTBOT_GATEWAY_TOKEN) envVars.CLAWDBOT_GATEWAY_TOKEN = env.MOLTBOT_GATEWAY_TOKEN;
  if (env.DEV_MODE) envVars.CLAWDBOT_DEV_MODE = env.DEV_MODE; // Pass DEV_MODE as CLAWDBOT_DEV_MODE to container
  if (env.CLAWDBOT_BIND_MODE) envVars.CLAWDBOT_BIND_MODE = env.CLAWDBOT_BIND_MODE;
  if (env.TELEGRAM_BOT_TOKEN) envVars.TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
  if (env.TELEGRAM_DM_POLICY) envVars.TELEGRAM_DM_POLICY = env.TELEGRAM_DM_POLICY;
  if (env.DISCORD_BOT_TOKEN) envVars.DISCORD_BOT_TOKEN = env.DISCORD_BOT_TOKEN;
  if (env.DISCORD_DM_POLICY) envVars.DISCORD_DM_POLICY = env.DISCORD_DM_POLICY;
  if (env.SLACK_BOT_TOKEN) envVars.SLACK_BOT_TOKEN = env.SLACK_BOT_TOKEN;
  if (env.SLACK_APP_TOKEN) envVars.SLACK_APP_TOKEN = env.SLACK_APP_TOKEN;
  if (env.CDP_SECRET) envVars.CDP_SECRET = env.CDP_SECRET;
  if (env.WORKER_URL) envVars.WORKER_URL = env.WORKER_URL;

  // TTS/STT configuration for voice interactions
  if (env.TTS_PROVIDER) envVars.TTS_PROVIDER = env.TTS_PROVIDER;
  if (env.STT_PROVIDER) envVars.STT_PROVIDER = env.STT_PROVIDER;
  if (env.NVIDIA_NIM_ENDPOINT) envVars.NVIDIA_NIM_ENDPOINT = env.NVIDIA_NIM_ENDPOINT;
  if (env.NVIDIA_NIM_API_KEY) envVars.NVIDIA_NIM_API_KEY = env.NVIDIA_NIM_API_KEY;
  if (env.TTS_VOICE) envVars.TTS_VOICE = env.TTS_VOICE;
  if (env.ELEVENLABS_API_KEY) envVars.ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
  if (env.DEEPGRAM_API_KEY) envVars.DEEPGRAM_API_KEY = env.DEEPGRAM_API_KEY;

  // Additional AI providers (passed as-is to container)
  if (env.OPENROUTER_API_KEY) envVars.OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;
  if (env.GEMINI_API_KEY) envVars.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.MISTRAL_API_KEY) envVars.MISTRAL_API_KEY = env.MISTRAL_API_KEY;
  if (env.FIREWORKS_API_KEY) envVars.FIREWORKS_API_KEY = env.FIREWORKS_API_KEY;
  if (env.X1_API_KEY) envVars.X1_API_KEY = env.X1_API_KEY;
  if (env.DEEPSHOT_KIMI2_API_KEY) envVars.DEEPSHOT_KIMI2_API_KEY = env.DEEPSHOT_KIMI2_API_KEY;
  if (env.MINIMAX_API_KEY) envVars.MINIMAX_API_KEY = env.MINIMAX_API_KEY;

  // Vector database
  if (env.QDRANT_API_KEY) envVars.QDRANT_API_KEY = env.QDRANT_API_KEY;

  // GitHub
  if (env.GITHUB_API_KEY) envVars.GITHUB_API_KEY = env.GITHUB_API_KEY;
  if (env.GITHUB_PAT) envVars.GITHUB_PAT = env.GITHUB_PAT;

  // Other providers
  if (env.YOU_API_KEY) envVars.YOU_API_KEY = env.YOU_API_KEY;
  if (env.DROID_API_KEY) envVars.DROID_API_KEY = env.DROID_API_KEY;
  if (env.OLLAMA_API_KEY) envVars.OLLAMA_API_KEY = env.OLLAMA_API_KEY;
  if (env.ZAI_API_KEY) envVars.ZAI_API_KEY = env.ZAI_API_KEY;
  if (env.TESTSPRITE_API_KEY) envVars.TESTSPRITE_API_KEY = env.TESTSPRITE_API_KEY;
  if (env.CLOUDFLARE_API_TOKEN) envVars.CLOUDFLARE_API_TOKEN = env.CLOUDFLARE_API_TOKEN;

  // Advanced features
  if (env.QDRANT_URL) envVars.QDRANT_URL = env.QDRANT_URL;
  if (env.CACHE_ENABLED) envVars.CACHE_ENABLED = env.CACHE_ENABLED;
  if (env.RATE_LIMIT_ENABLED) envVars.RATE_LIMIT_ENABLED = env.RATE_LIMIT_ENABLED;
  if (env.WEB_SEARCH_ENABLED) envVars.WEB_SEARCH_ENABLED = env.WEB_SEARCH_ENABLED;
  if (env.MEMORY_CHUNK_SIZE) envVars.MEMORY_CHUNK_SIZE = env.MEMORY_CHUNK_SIZE;
  if (env.MEMORY_COLLECTION_NAME) envVars.MEMORY_COLLECTION_NAME = env.MEMORY_COLLECTION_NAME;

  return envVars;
}
