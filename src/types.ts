import type { Sandbox } from '@cloudflare/sandbox';

/**
 * Environment bindings for the Moltbot Worker
 */
export interface MoltbotEnv {
  Sandbox: DurableObjectNamespace<Sandbox>;
  ASSETS: Fetcher; // Assets binding for admin UI static files
  MOLTBOT_BUCKET: R2Bucket; // R2 bucket for persistent storage
  // AI Gateway configuration (preferred)
  AI_GATEWAY_API_KEY?: string; // API key for the provider configured in AI Gateway
  AI_GATEWAY_BASE_URL?: string; // AI Gateway URL (e.g., https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/anthropic)
  // Legacy direct provider configuration (fallback)
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  MOLTBOT_GATEWAY_TOKEN?: string; // Gateway token (mapped to CLAWDBOT_GATEWAY_TOKEN for container)

  CLAWDBOT_BIND_MODE?: string;
  DEV_MODE?: string; // Set to 'true' for local dev (skips CF Access auth + moltbot device pairing)
  DEBUG_ROUTES?: string; // Set to 'true' to enable /debug/* routes
  SANDBOX_SLEEP_AFTER?: string; // How long before sandbox sleeps: 'never' (default), or duration like '10m', '1h'
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_DM_POLICY?: string;
  DISCORD_BOT_TOKEN?: string;
  DISCORD_DM_POLICY?: string;
  SLACK_BOT_TOKEN?: string;
  SLACK_APP_TOKEN?: string;
  // Cloudflare Access configuration for admin routes
  CF_ACCESS_TEAM_DOMAIN?: string; // e.g., 'myteam.cloudflareaccess.com'
  CF_ACCESS_AUD?: string; // Application Audience (AUD) tag
  // R2 credentials for bucket mounting (set via wrangler secret)
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  CF_ACCOUNT_ID?: string; // Cloudflare account ID for R2 endpoint
  // Browser Rendering binding for CDP shim
  BROWSER?: Fetcher;
  CDP_SECRET?: string; // Shared secret for CDP endpoint authentication
  WORKER_URL?: string; // Public URL of the worker (for CDP endpoint)
  // TTS/STT configuration for voice interactions
  TTS_PROVIDER?: string; // TTS provider: 'openai', 'elevenlabs', 'workersai', 'nim'
  STT_PROVIDER?: string; // STT provider: 'openai', 'workersai', 'nim'
  NVIDIA_NIM_ENDPOINT?: string; // NVIDIA NIM endpoint URL (e.g., https://your-nim-host:8000)
  NVIDIA_NIM_API_KEY?: string; // API key for NVIDIA NIM endpoint
  TTS_VOICE?: string; // Voice model/name to use (e.g., 'aura-asteria-en' for Workers AI)
  ELEVENLABS_API_KEY?: string; // ElevenLabs API key for TTS
  DEEPGRAM_API_KEY?: string; // Deepgram API key for STT (Workers AI)
  // Additional AI providers
  OPENROUTER_API_KEY?: string;
  GEMINI_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  FIREWORKS_API_KEY?: string;
  X1_API_KEY?: string;
  DEEPSHOT_KIMI2_API_KEY?: string;
  MINIMAX_API_KEY?: string;
  // Vector database
  QDRANT_API_KEY?: string;
  QDRANT_URL?: string; // Qdrant server URL
  // GitHub
  GITHUB_API_KEY?: string;
  GITHUB_PAT?: string;
  // Other providers
  YOU_API_KEY?: string;
  DROID_API_KEY?: string;
  OLLAMA_API_KEY?: string;
  ZAI_API_KEY?: string;
  TESTSPRITE_API_KEY?: string;
  CLOUDFLARE_API_TOKEN?: string;
  // Advanced features
  CACHE_ENABLED?: string; // Enable response caching
  RATE_LIMIT_ENABLED?: string; // Enable rate limiting
  WEB_SEARCH_ENABLED?: string; // Enable web search
  // Memory configuration
  MEMORY_CHUNK_SIZE?: string; // Chunk size for memory storage
  MEMORY_COLLECTION_NAME?: string; // Qdrant collection name for memory
}

/**
 * Authenticated user from Cloudflare Access
 */
export interface AccessUser {
  email: string;
  name?: string;
}

/**
 * Hono app environment type
 */
export type AppEnv = {
  Bindings: MoltbotEnv;
  Variables: {
    sandbox: Sandbox;
    accessUser?: AccessUser;
  };
};

/**
 * JWT payload from Cloudflare Access
 */
export interface JWTPayload {
  aud: string[];
  email: string;
  exp: number;
  iat: number;
  iss: string;
  name?: string;
  sub: string;
  type: string;
}
