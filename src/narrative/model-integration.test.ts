/**
 * Narrative Engine - Model Integration Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ModelRegistry,
  ModelConfig,
  ModelProvider,
  ModelCapability,
  StreamingHandler,
  ResponseMetrics,
  ModelRouter
} from './model-integration';
import { Logger, LogLevel } from './facade';

// Mock Logger
vi.mock('./facade', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    })),
    configure: vi.fn()
  },
  LogLevel: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  }
}));

// ============================================================================
// ModelRegistry Tests
// ============================================================================

describe('ModelRegistry', () => {
  let registry: ModelRegistry;

  beforeEach(() => {
    registry = new ModelRegistry();
  });

  describe('registerModel', () => {
    it('should register a model with all required fields', () => {
      const config: ModelConfig = {
        id: 'claude-sonnet',
        name: 'Claude Sonnet',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT, ModelCapability.VISION],
        contextWindow: 200000,
        maxOutputTokens: 8192,
        latency: 150,
        costPerToken: 0.000003,
        tier: 1,
        uncensored: true,
        config: {
          endpoint: 'https://api.anthropic.com',
          apiKey: 'test-key'
        }
      };
      
      registry.registerModel(config);
      
      const model = registry.getModel('claude-sonnet');
      expect(model).toBeDefined();
      expect(model?.name).toBe('Claude Sonnet');
      expect(model?.provider).toBe(ModelProvider.ANTHROPIC);
    });

    it('should allow registering multiple models', () => {
      const config1: ModelConfig = {
        id: 'model-1',
        name: 'Model 1',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 100000,
        maxOutputTokens: 4096,
        latency: 200,
        costPerToken: 0.000001,
        tier: 2
      };
      
      const config2: ModelConfig = {
        id: 'model-2',
        name: 'Model 2',
        provider: ModelProvider.OPENAI,
        capabilities: [ModelCapability.TEXT, ModelCapability.STREAMING],
        contextWindow: 128000,
        maxOutputTokens: 4096,
        latency: 100,
        costPerToken: 0.000002,
        tier: 1
      };
      
      registry.registerModel(config1);
      registry.registerModel(config2);
      
      expect(registry.getModel('model-1')).toBeDefined();
      expect(registry.getModel('model-2')).toBeDefined();
    });
  });

  describe('unregisterModel', () => {
    it('should remove a registered model', () => {
      registry.registerModel({
        id: 'test-model',
        name: 'Test Model',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 100000,
        maxOutputTokens: 4096,
        latency: 200,
        costPerToken: 0.000001,
        tier: 2
      });
      
      registry.unregisterModel('test-model');
      
      expect(registry.getModel('test-model')).toBeUndefined();
    });
  });

  describe('getModel', () => {
    it('should return undefined for unregistered model', () => {
      const result = registry.getModel('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('listModels', () => {
    it('should list all registered models', () => {
      registry.registerModel({
        id: 'model-1',
        name: 'Model 1',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 100000,
        maxOutputTokens: 4096,
        latency: 200,
        costPerToken: 0.000001,
        tier: 2
      });
      
      registry.registerModel({
        id: 'model-2',
        name: 'Model 2',
        provider: ModelProvider.OPENAI,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 128000,
        maxOutputTokens: 4096,
        latency: 100,
        costPerToken: 0.000002,
        tier: 1
      });
      
      const models = registry.listModels();
      
      expect(models).toHaveLength(2);
    });

    it('should filter by capability', () => {
      registry.registerModel({
        id: 'text-model',
        name: 'Text Model',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 100000,
        maxOutputTokens: 4096,
        latency: 200,
        costPerToken: 0.000001,
        tier: 2
      });
      
      registry.registerModel({
        id: 'vision-model',
        name: 'Vision Model',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT, ModelCapability.VISION],
        contextWindow: 100000,
        maxOutputTokens: 4096,
        latency: 200,
        costPerToken: 0.000003,
        tier: 1
      });
      
      const visionModels = registry.listModels({ capability: ModelCapability.VISION });
      
      expect(visionModels).toHaveLength(1);
      expect(visionModels[0].id).toBe('vision-model');
    });

    it('should filter by tier', () => {
      registry.registerModel({
        id: 'tier-1',
        name: 'Tier 1',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 200000,
        maxOutputTokens: 8192,
        latency: 100,
        costPerToken: 0.000005,
        tier: 1
      });
      
      registry.registerModel({
        id: 'tier-2',
        name: 'Tier 2',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 100000,
        maxOutputTokens: 4096,
        latency: 200,
        costPerToken: 0.000001,
        tier: 2
      });
      
      const tier1Models = registry.listModels({ tier: 1 });
      
      expect(tier1Models).toHaveLength(1);
      expect(tier1Models[0].id).toBe('tier-1');
    });
  });

  describe('getBestModel', () => {
    it('should return best model for capability', () => {
      registry.registerModel({
        id: 'fast-model',
        name: 'Fast Model',
        provider: ModelProvider.OPENAI,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 128000,
        maxOutputTokens: 4096,
        latency: 50,
        costPerToken: 0.000005,
        tier: 1
      });
      
      registry.registerModel({
        id: 'slow-model',
        name: 'Slow Model',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 200000,
        maxOutputTokens: 8192,
        latency: 500,
        costPerToken: 0.000003,
        tier: 1
      });
      
      const best = registry.getBestModel(ModelCapability.TEXT, { priority: 'speed' });
      
      expect(best?.id).toBe('fast-model');
    });

    it('should prefer uncensored models', () => {
      registry.registerModel({
        id: 'censored',
        name: 'Censored',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 100000,
        maxOutputTokens: 4096,
        latency: 100,
        costPerToken: 0.000001,
        tier: 1,
        uncensored: false
      });
      
      registry.registerModel({
        id: 'uncensored',
        name: 'Uncensored',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 100000,
        maxOutputTokens: 4096,
        latency: 100,
        costPerToken: 0.000001,
        tier: 1,
        uncensored: true
      });
      
      const uncensored = registry.getBestModel(ModelCapability.TEXT, { preferUncensored: true });
      
      expect(uncensored?.id).toBe('uncensored');
    });
  });
});

// ============================================================================
// ModelRouter Tests
// ============================================================================

describe('ModelRouter', () => {
  let router: ModelRouter;
  let registry: ModelRegistry;

  beforeEach(() => {
    registry = new ModelRegistry();
    router = new ModelRouter(registry);
  });

  describe('selectModel', () => {
    it('should select model based on task type', () => {
      registry.registerModel({
        id: 'reasoning-model',
        name: 'Reasoning Model',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT, ModelCapability.REASONING],
        contextWindow: 200000,
        maxOutputTokens: 8192,
        latency: 500,
        costPerToken: 0.000005,
        tier: 1,
        uncensored: true
      });
      
      const selected = router.selectModel('reasoning');
      
      expect(selected?.id).toBe('reasoning-model');
    });

    it('should fall back to default model', () => {
      const selected = router.selectModel('creative');
      
      expect(selected).toBeDefined();
    });

    it('should route based on priority setting', () => {
      registry.registerModel({
        id: 'expensive-fast',
        name: 'Expensive Fast',
        provider: ModelProvider.ANTHROPIC,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 200000,
        maxOutputTokens: 8192,
        latency: 50,
        costPerToken: 0.000010,
        tier: 1
      });
      
      registry.registerModel({
        id: 'cheap-slow',
        name: 'Cheap Slow',
        provider: ModelProvider.OPENAI,
        capabilities: [ModelCapability.TEXT],
        contextWindow: 128000,
        maxOutputTokens: 4096,
        latency: 500,
        costPerToken: 0.000001,
        tier: 2
      });
      
      const fastModel = router.selectModel('general', { priority: 'speed' });
      const cheapModel = router.selectModel('general', { priority: 'cost' });
      
      expect(fastModel?.id).toBe('expensive-fast');
      expect(cheapModel?.id).toBe('cheap-slow');
    });
  });

  describe('selectTTSModel', () => {
    it('should return TTS model for voice', () => {
      registry.registerModel({
        id: 'tts-model',
        name: 'TTS Model',
        provider: ModelProvider.DEEPGRAM,
        capabilities: [ModelCapability.TTS],
        contextWindow: 16000,
        maxOutputTokens: 4096,
        latency: 100,
        costPerToken: 0.000010,
        tier: 1
      });
      
      const selected = router.selectTTSModel();
      
      expect(selected?.id).toBe('tts-model');
    });
  });

  describe('selectSTTModel', () => {
    it('should return STT model for speech-to-text', () => {
      registry.registerModel({
        id: 'stt-model',
        name: 'STT Model',
        provider: ModelProvider.DEEPGRAM,
        capabilities: [ModelCapability.STT],
        contextWindow: 16000,
        maxOutputTokens: 1024,
        latency: 50,
        costPerToken: 0.000005,
        tier: 1
      });
      
      const selected = router.selectSTTModel();
      
      expect(selected?.id).toBe('stt-model');
    });
  });

  describe('selectVoiceModel', () => {
    it('should return voice model for speech-to-speech', () => {
      registry.registerModel({
        id: 'voice-model',
        name: 'Voice Model',
        provider: ModelProvider.NVIDIA,
        capabilities: [ModelCapability.SPEECH_TO_SPEECH],
        contextWindow: 32000,
        maxOutputTokens: 2048,
        latency: 200,
        costPerToken: 0.000020,
        tier: 1,
        uncensored: true
      });
      
      const selected = router.selectVoiceModel();
      
      expect(selected?.id).toBe('voice-model');
    });
  });
});

// ============================================================================
// StreamingHandler Tests
// ============================================================================

describe('StreamingHandler', () => {
  let handler: StreamingHandler;
  let chunks: string[];
  let onChunk: vi.Mock;
  let onComplete: vi.Mock;

  beforeEach(() => {
    chunks = [];
    onChunk = vi.fn();
    onComplete = vi.fn();
    
    handler = new StreamingHandler({
      onChunk: (chunk) => {
        chunks.push(chunk);
        onChunk(chunk);
      },
      onComplete: (fullText, metrics) => {
        onComplete(fullText, metrics);
      },
      onError: vi.fn()
    });
  });

  describe('processChunk', () => {
    it('should accumulate chunks', () => {
      handler.processChunk('Hello ');
      handler.processChunk('world');
      handler.processChunk('!');
      
      expect(chunks).toEqual(['Hello ', 'world', '!']);
    });

    it('should track word count', () => {
      handler.processChunk('Hello world');
      
      expect(handler.wordCount).toBe(2);
    });

    it('should track token count', () => {
      handler.processChunk('Hello world');
      
      expect(handler.tokenCount).toBe(2); // Approximate
    });
  });

  describe('complete', () => {
    it('should call onComplete with full text', () => {
      handler.processChunk('Hello ');
      handler.processChunk('world');
      handler.complete();
      
      expect(onComplete).toHaveBeenCalledWith('Hello world', expect.any(Object));
    });

    it('should include metrics', () => {
      handler.processChunk('Test response');
      handler.complete();
      
      const [fullText, metrics] = onComplete.mock.calls[0];
      expect(fullText).toBe('Test response');
      expect(metrics.wordCount).toBe(2);
      expect(metrics.durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('reset', () => {
    it('should clear accumulated chunks', () => {
      handler.processChunk('Hello ');
      handler.reset();
      
      expect(handler.getAccumulatedText()).toBe('');
    });
  });
});

// ============================================================================
// ResponseMetrics Tests
// ============================================================================

describe('ResponseMetrics', () => {
  it('should calculate throughput', () => {
    const metrics: ResponseMetrics = {
      firstTokenLatencyMs: 50,
      totalLatencyMs: 500,
      tokensGenerated: 500,
      wordCount: 400,
      costUSD: 0.001
    };
    
    const tokensPerSecond = metrics.tokensGenerated / (metrics.totalLatencyMs / 1000);
    
    expect(tokensPerSecond).toBe(1000);
  });

  it('should calculate cost efficiency', () => {
    const metrics: ResponseMetrics = {
      firstTokenLatencyMs: 50,
      totalLatencyMs: 500,
      tokensGenerated: 500,
      wordCount: 400,
      costUSD: 0.001
    };
    
    const costPerWord = metrics.costUSD / metrics.wordCount;
    
    expect(costPerWord).toBe(0.0000025);
  });
});

// ============================================================================
// ModelProvider Tests
// ============================================================================

describe('ModelProvider', () => {
  it('should have all expected providers', () => {
    expect(ModelProvider.ANTHROPIC).toBe('anthropic');
    expect(ModelProvider.OPENAI).toBe('openai');
    expect(ModelProvider.DEEPGRAM).toBe('deepgram');
    expect(ModelProvider.NVIDIA).toBe('nvidia');
    expect(ModelProvider.CLOUDFLARE).toBe('cloudflare');
    expect(ModelProvider.OPENROUTER).toBe('openrouter');
    expect(ModelProvider.GOOGLE).toBe('google');
    expect(ModelProvider.XAI).toBe('xai');
    expect(ModelProvider.LOCAL).toBe('local');
  });
});

// ============================================================================
// ModelCapability Tests
// ============================================================================

describe('ModelCapability', () => {
  it('should have all expected capabilities', () => {
    expect(ModelCapability.TEXT).toBe('text');
    expect(ModelCapability.VISION).toBe('vision');
    expect(ModelCapability.REASONING).toBe('reasoning');
    expect(ModelCapability.CODE).toBe('code');
    expect(ModelCapability.STREAMING).toBe('streaming');
    expect(ModelCapability.TTS).toBe('tts');
    expect(ModelCapability.STT).toBe('stt');
    expect(ModelCapability.SPEECH_TO_SPEECH).toBe('speech_to_speech');
    expect(ModelCapability.FUNCTION_CALLING).toBe('function_calling');
  });
});
