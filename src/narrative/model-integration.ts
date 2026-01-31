/**
 * Model Integration with Rotation & Fallback Chains
 * LoveLogicAI MCP Ecosystem - Open-source Model Support
 */

import type { 
  ModelConfig, 
  ModelCapability, 
  ModelProvider,
  ModelRotationConfig,
  ModelFallbackChain 
} from './types';

// Default model configurations for open-source models
export const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: 'llama-3.2-90b',
    name: 'Llama 3.2 90B',
    provider: 'fireworks',
    endpoint: 'https://api.fireworks.ai/inference/v1',
    capabilities: ['text', 'creative', 'uncensored', 'reasoning'],
    contextWindow: 131072,
    maxOutput: 8192,
    quality: 10,
    speed: 7,
    censorshipLevel: 0, // Uncensored by default
    costPerToken: 0.0001,
    rateLimitRpm: 60
  },
  {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'fireworks',
    endpoint: 'https://api.fireworks.ai/inference/v1',
    capabilities: ['text', 'creative', 'uncensored', 'reasoning'],
    contextWindow: 131072,
    maxOutput: 8192,
    quality: 9,
    speed: 8,
    censorshipLevel: 0, // Uncensored by default
    costPerToken: 0.00008,
    rateLimitRpm: 60
  },
  {
    id: 'llama-3.2-3b',
    name: 'Llama 3.2 3B',
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    capabilities: ['text', 'creative', 'uncensored'],
    contextWindow: 8192,
    maxOutput: 4096,
    quality: 7,
    speed: 10,
    censorshipLevel: 0, // Uncensored by default
    costPerToken: 0,
    rateLimitRpm: 9999
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    capabilities: ['text', 'creative', 'uncensored', 'coding'],
    contextWindow: 32768,
    maxOutput: 4096,
    quality: 8,
    speed: 9,
    censorshipLevel: 0, // Uncensored by default
    costPerToken: 0,
    rateLimitRpm: 9999
  },
  {
    id: 'mistral-22b',
    name: 'Mistral 22B',
    provider: 'fireworks',
    endpoint: 'https://api.fireworks.ai/inference/v1',
    capabilities: ['text', 'creative', 'uncensored', 'reasoning'],
    contextWindow: 65536,
    maxOutput: 8192,
    quality: 10,
    speed: 6,
    censorshipLevel: 0, // Uncensored by default
    costPerToken: 0.00015,
    rateLimitRpm: 40
  },
  {
    id: 'codellama-34b',
    name: 'CodeLlama 34B',
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    capabilities: ['text', 'coding', 'uncensored', 'reasoning'],
    contextWindow: 16384,
    maxOutput: 8192,
    quality: 9,
    speed: 7,
    censorshipLevel: 0, // Uncensored by default
    costPerToken: 0,
    rateLimitRpm: 9999
  },
  {
    id: 'phi-3.5-mini',
    name: 'Phi-3.5 Mini',
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    capabilities: ['text', 'reasoning', 'coding', 'uncensored'],
    contextWindow: 131072,
    maxOutput: 4096,
    quality: 8,
    speed: 10,
    censorshipLevel: 0, // Uncensored by default
    costPerToken: 0,
    rateLimitRpm: 9999
  },
  {
    id: 'gemma-2-27b',
    name: 'Gemma 2 27B',
    provider: 'fireworks',
    endpoint: 'https://api.fireworks.ai/inference/v1',
    capabilities: ['text', 'creative', 'uncensored', 'reasoning'],
    contextWindow: 8192,
    maxOutput: 4096,
    quality: 9,
    speed: 8,
    censorshipLevel: 0, // Uncensored by default
    costPerToken: 0.00005,
    rateLimitRpm: 80
  },
  {
    id: 'deepseek-coder-33b',
    name: 'DeepSeek Coder 33B',
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    capabilities: ['text', 'coding', 'creative', 'uncensored'],
    contextWindow: 16384,
    maxOutput: 8192,
    quality: 9,
    speed: 7,
    censorshipLevel: 0, // Uncensored by default
    costPerToken: 0,
    rateLimitRpm: 9999
  },
  {
    id: 'dolphin-mixtral-8x7b',
    name: 'Dolphin Mixtral 8x7B',
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    capabilities: ['text', 'creative', 'uncensored', 'reasoning'],
    contextWindow: 32768,
    maxOutput: 8192,
    quality: 9,
    speed: 6,
    censorshipLevel: 0, // Fully uncensored
    costPerToken: 0,
    rateLimitRpm: 9999
  },
  {
    id: 'wizard-vicuna-13b',
    name: 'Wizard Vicuna 13B',
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    capabilities: ['text', 'creative', 'uncensored', 'reasoning'],
    contextWindow: 16384,
    maxOutput: 4096,
    quality: 8,
    speed: 8,
    censorshipLevel: 0, // Fully uncensored
    costPerToken: 0,
    rateLimitRpm: 9999
  },
  {
    id: 'nous-hermes-2-mixtral',
    name: 'Nous Hermes 2 Mixtral',
    provider: 'ollama',
    endpoint: 'http://localhost:11434',
    capabilities: ['text', 'creative', 'uncensored', 'reasoning'],
    contextWindow: 32768,
    maxOutput: 8192,
    quality: 9,
    speed: 7,
    censorshipLevel: 0, // Fully uncensored
    costPerToken: 0,
    rateLimitRpm: 9999
  }
];

export class ModelManager {
  private models: Map<string, ModelConfig>;
  private rotationConfig: ModelRotationConfig;
  private fallbackChains: Map<string, ModelFallbackChain>;
  private healthStatus: Map<string, { healthy: boolean; lastCheck: number; latency: number }>;
  private usageCount: Map<string, number>;

  constructor(config?: Partial<ModelRotationConfig>) {
    this.models = new Map();
    this.fallbackChains = new Map();
    this.healthStatus = new Map();
    this.usageCount = new Map();

    // Default rotation config
    this.rotationConfig = {
      primaryModel: 'llama-3.2-90b',
      fallbackModels: ['llama-3.1-70b', 'mistral-22b', 'gemma-2-27b'],
      rotationStrategy: 'quality_based',
      healthCheckInterval: 30000,
      failureThreshold: 3,
      ...config
    };

    // Initialize models
    this.initializeModels();
    this.startHealthChecks();
  }

  /**
   * Initialize default models
   */
  private initializeModels(): void {
    for (const model of DEFAULT_MODELS) {
      this.registerModel(model);
    }
  }

  /**
   * Register a new model
   */
  registerModel(model: ModelConfig): void {
    this.models.set(model.id, model);
    this.healthStatus.set(model.id, { healthy: true, lastCheck: Date.now(), latency: 0 });
  }

  /**
   * Get model by ID
   */
  getModel(modelId: string): ModelConfig | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all models with specific capability, prioritizing uncensored
   */
  getModelsByCapability(capability: ModelCapability): ModelConfig[] {
    return Array.from(this.models.values())
      .filter(m => m.capabilities.includes(capability))
      // Sort by uncensored first (censorshipLevel = 0), then by quality
      .sort((a, b) => {
        const aUncensored = a.censorshipLevel === 0 ? 1 : 0;
        const bUncensored = b.censorshipLevel === 0 ? 1 : 0;
        if (aUncensored !== bUncensored) return bUncensored - aUncensored;
        return b.quality - a.quality;
      });
  }

  /**
   * Get best model for a request type - prefers uncensored models by default
   */
  getBestModel(
    requestType: 'story_generation' | 'dialogue' | 'branching_logic' | 'world_building' | 'voice_synthesis'
  ): ModelConfig | null {
    const chain = this.getFallbackChain(requestType);
    if (chain.chain.length === 0) return null;

    // Find first healthy UNCENSORED model in chain
    for (const modelId of chain.chain) {
      const model = this.models.get(modelId);
      const health = this.healthStatus.get(modelId);
      if (health?.healthy && model?.censorshipLevel === 0) {
        return model;
      }
    }

    // Fallback to any healthy uncensored model with required capability
    const capability = this.getCapabilityForRequest(requestType);
    const capableModels = this.getModelsByCapability(capability)
      .filter(m => this.healthStatus.get(m.id)?.healthy);

    if (capableModels.length > 0) {
      return capableModels[0];
    }

    // Last resort: any healthy model (prefer uncensored)
    const healthyModels = Array.from(this.models.values())
      .filter(m => this.healthStatus.get(m.id)?.healthy)
      .sort((a, b) => {
        const aUncensored = a.censorshipLevel === 0 ? 1 : 0;
        const bUncensored = b.censorshipLevel === 0 ? 1 : 0;
        if (aUncensored !== bUncensored) return bUncensored - aUncensored;
        return b.quality - a.quality;
      });
    
    return healthyModels[0] || null;
  }

  /**
   * Get model with rotation based on strategy
   */
  getRotatedModel(requestType: string): ModelConfig | null {
    const chain = this.getFallbackChain(requestType);
    const strategy = this.rotationConfig.rotationStrategy;

    // Find next healthy model
    let bestModel: ModelConfig | null = null;
    let minUsage = Infinity;

    for (const modelId of chain.chain) {
      const health = this.healthStatus.get(modelId);
      const model = this.models.get(modelId);

      if (!health?.healthy || !model) continue;

      const usage = this.usageCount.get(modelId) || 0;

      switch (strategy) {
        case 'round_robin':
          return model;
        case 'quality_based':
          if (!bestModel || model.quality > bestModel.quality) {
            bestModel = model;
          }
          break;
        case 'speed_based':
          if (!bestModel || model.speed > bestModel.speed) {
            bestModel = model;
          }
          break;
        case 'availability':
          if (usage < minUsage) {
            bestModel = model;
            minUsage = usage;
          }
          break;
      }
    }

    return bestModel;
  }

  /**
   * Get or create fallback chain for request type
   */
  private getFallbackChain(requestType: string): ModelFallbackChain {
    let chain = this.fallbackChains.get(requestType);

    if (!chain) {
      chain = {
        requestType,
        chain: this.buildChainForRequest(requestType),
        currentIndex: 0
      };
      this.fallbackChains.set(requestType, chain);
    }

    return chain;
  }

  /**
   * Build fallback chain for a request type
   */
  private buildChainForRequest(requestType: string): string[] {
    const capability = this.getCapabilityForRequest(requestType);
    const models = this.getModelsByCapability(capability);

    // Filter for uncensored models for creative content
    if (requestType === 'story_generation' || requestType === 'dialogue') {
      return models
        .filter(m => m.censorshipLevel === 0)
        .map(m => m.id);
    }

    return models.map(m => m.id);
  }

  /**
   * Get required capability for request type
   */
  private getCapabilityForRequest(requestType: string): ModelCapability {
    const capabilityMap: Record<string, ModelCapability> = {
      story_generation: 'creative',
      dialogue: 'creative',
      branching_logic: 'reasoning',
      world_building: 'creative',
      voice_synthesis: 'voice'
    };
    return capabilityMap[requestType] || 'text';
  }

  /**
   * Record model usage
   */
  recordUsage(modelId: string): void {
    const count = this.usageCount.get(modelId) || 0;
    this.usageCount.set(modelId, count + 1);
  }

  /**
   * Report model failure
   */
  reportFailure(modelId: string): void {
    const health = this.healthStatus.get(modelId);
    if (health) {
      health.healthy = false;
      health.lastCheck = Date.now();
    }

    // Remove from active chains temporarily
    for (const chain of this.fallbackChains.values()) {
      const index = chain.chain.indexOf(modelId);
      if (index > -1) {
        chain.chain.splice(index, 1);
      }
    }
  }

  /**
   * Report model success
   */
  reportSuccess(modelId: string, latency: number): void {
    this.healthStatus.set(modelId, {
      healthy: true,
      lastCheck: Date.now(),
      latency
    });
    this.recordUsage(modelId);
  }

  /**
   * Set model health status
   */
  setModelHealth(modelId: string, healthy: boolean, latency?: number): void {
    this.healthStatus.set(modelId, {
      healthy,
      lastCheck: Date.now(),
      latency: latency || 0
    });
  }

  /**
   * Get all healthy models
   */
  getHealthyModels(): ModelConfig[] {
    return Array.from(this.models.values())
      .filter(m => this.healthStatus.get(m.id)?.healthy);
  }

  /**
   * Get model statistics
   */
  getStats(): {
    totalModels: number;
    healthyModels: number;
    totalRequests: number;
    usageByModel: Record<string, number>;
  } {
    const totalRequests = Array.from(this.usageCount.values()).reduce((a, b) => a + b, 0);

    return {
      totalModels: this.models.size,
      healthyModels: this.getHealthyModels().length,
      totalRequests,
      usageByModel: Object.fromEntries(this.usageCount)
    };
  }

  /**
   * Update rotation configuration
   */
  updateRotationConfig(updates: Partial<ModelRotationConfig>): void {
    this.rotationConfig = { ...this.rotationConfig, ...updates };
  }

  /**
   * Get model for unrestricted content
   */
  getUncensoredModel(): ModelConfig | null {
    const uncensoredModels = Array.from(this.models.values())
      .filter(m => m.censorshipLevel === 0 && this.healthStatus.get(m.id)?.healthy)
      .sort((a, b) => b.quality - a.quality);

    return uncensoredModels[0] || null;
  }

  /**
   * Get fast model for simple responses
   */
  getFastModel(): ModelConfig | null {
    const fastModels = Array.from(this.models.values())
      .filter(m => m.speed >= 9 && this.healthStatus.get(m.id)?.healthy)
      .sort((a, b) => b.speed - a.speed);

    return fastModels[0] || null;
  }

  /**
   * Get high-quality model for complex narratives
   */
  getHighQualityModel(): ModelConfig | null {
    const qualityModels = Array.from(this.models.values())
      .filter(m => m.quality >= 8 && this.healthStatus.get(m.id)?.healthy)
      .sort((a, b) => b.quality - a.quality);

    return qualityModels[0] || null;
  }

  /**
   * Health check loop
   */
  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.rotationConfig.healthCheckInterval);
  }

  /**
   * Perform health checks on all models
   */
  async performHealthChecks(): Promise<void> {
    for (const [modelId, model] of this.models) {
      try {
        const startTime = Date.now();
        // In production, you'd make an actual health check request
        const healthy = await this.checkModelHealth(model);
        const latency = Date.now() - startTime;

        this.setModelHealth(modelId, healthy, latency);
      } catch {
        this.setModelHealth(modelId, false, 0);
      }
    }
  }

  /**
   * Check individual model health (override in production)
   */
  private async checkModelHealth(model: ModelConfig): Promise<boolean> {
    // Default implementation - always healthy
    // In production, make actual API call to check
    return true;
  }
}

// Export singleton instance
export const modelManager = new ModelManager();
