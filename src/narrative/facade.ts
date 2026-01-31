/**
 * Narrative Engine Facade - Simple, User-Friendly API
 * LoveLogicAI MCP Ecosystem - Easy-to-Use Interface
 */

import type {
  Story,
  StoryNode,
  Persona,
  VoiceProfile,
  ChannelType,
  StoryChoice
} from './types';
import { 
  narrativeEngine, 
  registerExampleStory 
} from './engine';
import { 
  modelManager, 
  DEFAULT_MODELS 
} from './model-integration';
import { 
  personaManager, 
  DEFAULT_PERSONAS,
  VOICE_PROFILE_PRESETS 
} from './persona';
import { omnichannelRouter } from './omnichannel';
import { sessionManager } from './session';

// ============================================================================
// Logging & Observability
// ============================================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LoggerOptions {
  level: LogLevel;
  prefix: string;
  timestamp: boolean;
  colors: boolean;
}

export class Logger {
  private options: LoggerOptions;
  private static instance: Logger;

  private constructor(options?: Partial<LoggerOptions>) {
    this.options = {
      level: options?.level ?? LogLevel.INFO,
      prefix: options?.prefix ?? '[Narrative]',
      timestamp: options?.timestamp ?? true,
      colors: options?.colors ?? true
    };
  }

  static getInstance(options?: Partial<LoggerOptions>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
    return Logger.instance;
  }

  static configure(options: Partial<LoggerOptions>): void {
    Logger.instance = new Logger(options);
  }

  debug(message: string, data?: unknown): void {
    this.log('DEBUG', message, data, '\x1b[36m'); // Cyan
  }

  info(message: string, data?: unknown): void {
    this.log('INFO', message, data, '\x1b[32m'); // Green
  }

  warn(message: string, data?: unknown): void {
    this.log('WARN', message, data, '\x1b[33m'); // Yellow
  }

  error(message: string, data?: unknown): void {
    this.log('ERROR', message, data, '\x1b[31m'); // Red
  }

  private log(level: string, message: string, data: unknown, color: string): void {
    if (this.options.level > LogLevel[level as keyof typeof LogLevel]) return;

    const timestamp = this.options.timestamp 
      ? new Date().toISOString().split('T')[1].slice(0, -1) 
      : '';
    const colorReset = '\x1b[0m';
    const prefix = this.options.colors ? `${color}${this.options.prefix}${colorReset}` : this.options.prefix;
    const levelStr = this.options.colors ? `${color}[${level}]${colorReset}` : `[${level}]`;
    
    const parts = [prefix, timestamp, levelStr, message];
    console.log(parts.filter(Boolean).join(' '));

    if (data !== undefined) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  setLevel(level: LogLevel): void {
    this.options.level = level;
  }
}

export const log = Logger.getInstance();

// ============================================================================
// Health & Status Checks
// ============================================================================

export interface HealthStatus {
  healthy: boolean;
  models: ModelHealthInfo;
  channels: ChannelHealthInfo;
  sessions: SessionHealthInfo;
  uptime: number;
  timestamp: number;
}

export interface ModelHealthInfo {
  total: number;
  healthy: number;
  byProvider: Record<string, number>;
}

export interface ChannelHealthInfo {
  text: boolean;
  voice: boolean;
  visual: boolean;
  hybrid: boolean;
}

export interface SessionHealthInfo {
  active: number;
  totalCreated: number;
}

export class HealthChecker {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get complete system health status
   */
  getHealth(): HealthStatus {
    const modelStats = modelManager.getStats();
    const channelStatus = omnichannelRouter.getChannelStatus();
    const engineStats = narrativeEngine.getStats();

    return {
      healthy: modelStats.healthyModels > 0,
      models: {
        total: modelStats.totalModels,
        healthy: modelStats.healthyModels,
        byProvider: this.getModelsByProvider()
      },
      channels: {
        text: channelStatus.text,
        voice: channelStatus.voice,
        visual: channelStatus.visual,
        hybrid: channelStatus.hybrid
      },
      sessions: {
        active: engineStats.activeSessions,
        totalCreated: modelStats.totalRequests // Approximation
      },
      uptime: Date.now() - this.startTime,
      timestamp: Date.now()
    };
  }

  /**
   * Get detailed status report
   */
  getDetailedStatus(): {
    health: HealthStatus;
    models: { id: string; healthy: boolean; latency: number; quality: number }[];
    personas: string[];
    channels: string[];
  } {
    const health = this.getHealth();
    const modelList = Array.from(DEFAULT_MODELS).map(m => ({
      id: m.id,
      healthy: modelManager.getModel(m.id) !== undefined,
      latency: 0, // Would be populated from health checks
      quality: m.quality
    }));
    const personaList = Object.keys(DEFAULT_PERSONAS);

    return {
      health,
      models: modelList,
      personas: personaList,
      channels: ['text', 'voice', 'visual', 'hybrid']
    };
  }

  private getModelsByProvider(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const model of DEFAULT_MODELS) {
      counts[model.provider] = (counts[model.provider] || 0) + 1;
    }
    return counts;
  }

  /**
   * Check if system is ready
   */
  isReady(): boolean {
    const health = this.getHealth();
    return health.healthy && health.models.healthy > 0;
  }
}

// ============================================================================
// Simple Configuration Builder
// ============================================================================

export interface NarrativeConfig {
  channel: ChannelType;
  enableVoice: boolean;
  enableVisual: boolean;
  modelPriority: 'quality' | 'speed' | 'balanced';
  uncensored: boolean;
  logLevel: LogLevel;
}

export const DEFAULT_CONFIG: NarrativeConfig = {
  channel: 'hybrid',
  enableVoice: true,
  enableVisual: true,
  modelPriority: 'balanced',
  uncensored: true,
  logLevel: LogLevel.INFO
};

export class ConfigBuilder {
  private config: NarrativeConfig;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  channel(channel: ChannelType): ConfigBuilder {
    this.config.channel = channel;
    return this;
  }

  enableVoice(enabled: boolean): ConfigBuilder {
    this.config.enableVoice = enabled;
    return this;
  }

  enableVisual(enabled: boolean): ConfigBuilder {
    this.config.enableVisual = enabled;
    return this;
  }

  modelPriority(priority: 'quality' | 'speed' | 'balanced'): ConfigBuilder {
    this.config.modelPriority = priority;
    return this;
  }

  uncensored(enabled: boolean): ConfigBuilder {
    this.config.uncensored = enabled;
    return this;
  }

  logLevel(level: LogLevel): ConfigBuilder {
    this.config.logLevel = level;
    log.setLevel(level);
    return this;
  }

  build(): NarrativeConfig {
    return { ...this.config };
  }
}

// ============================================================================
// Simple Story Builder
// ============================================================================

export interface SimpleChoice {
  text: string;
  description?: string;
  nextScene: string;
}

export interface SimpleScene {
  id: string;
  description: string;
  choices?: SimpleChoice[];
  emotion?: string;
  voicePersona?: string;
}

export class StoryBuilder {
  private storyId: string;
  private title: string;
  private description: string;
  private scenes: Map<string, SimpleScene> = new Map();
  private startingScene: string = 'start';
  private personas: Record<string, Partial<Persona>> = {};

  constructor(storyId: string, title: string, description: string) {
    this.storyId = storyId;
    this.title = title;
    this.description = description;
  }

  startScene(id: string): StoryBuilder {
    this.startingScene = id;
    return this;
  }

  scene(scene: SimpleScene): StoryBuilder {
    this.scenes.set(scene.id, scene);
    return this;
  }

  addPersona(id: string, template: Partial<Persona>): StoryBuilder {
    this.personas[id] = template;
    return this;
  }

  build(): Story {
    const nodes: Record<string, StoryNode> = {};
    
    for (const [id, scene] of this.scenes) {
      nodes[id] = {
        id,
        type: scene.choices && scene.choices.length > 0 ? 'choice' : 'scene',
        content: scene.description,
        emotionalTone: scene.emotion || 'neutral',
        voiceProfileId: scene.voicePersona,
        choices: scene.choices?.map(c => ({
          id: `choice_${c.nextScene}`,
          text: c.text,
          description: c.description,
          targetNode: c.nextScene
        })) || [],
        nextNodes: scene.choices?.reduce((acc, c) => {
          acc[c.text] = c.nextScene;
          return acc;
        }, {} as Record<string, string>)
      };
    }

    const story: Story = {
      id: this.storyId,
      title: this.title,
      description: this.description,
      genre: ['interactive', 'adventure'],
      startingNode: this.startingScene,
      nodes,
      personas: this.personas,
      metadata: {
        estimatedDuration: this.scenes.size * 5,
        maturityLevel: 'mature',
        branchingFactor: this.scenes.size > 5 ? 3 : 2,
        saveSlots: 5
      }
    };

    return story;
  }

  register(): Story {
    const story = this.build();
    narrativeEngine.registerStory(story);
    log.info(`Registered story: ${story.title}`);
    return story;
  }
}

// ============================================================================
// Easy-to-Use Narrative Client
// ============================================================================

export interface PlayOptions {
  channel?: ChannelType;
  autoSave?: boolean;
  logLevel?: LogLevel;
}

export interface PlayResult {
  sessionId: string;
  response: string;
  choices: StoryChoice[];
  state: {
    scene: string;
    emotion: string;
    tension: number;
  };
}

export class NarrativeClient {
  private config: NarrativeConfig;
  private healthChecker: HealthChecker;
  private autoSaveEnabled: boolean = false;
  private currentSessionId: string | null = null;

  constructor(config?: Partial<NarrativeConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.healthChecker = new HealthChecker();
    
    // Configure logging
    log.setLevel(this.config.logLevel);

    // Register example story if none exists
    this.ensureStoriesExist();
  }

  private ensureStoriesExist(): void {
    const existingStories = narrativeEngine.getStory('mystery_manor');
    if (!existingStories) {
      registerExampleStory();
      log.info('Registered example story: Mystery Manor');
    }
  }

  /**
   * Start a new story session - SIMPLE API
   */
  async play(
    storyId: string,
    playerId: string,
    options?: PlayOptions
  ): Promise<{ sessionId: string; response: string; choices: StoryChoice[] } | null> {
    const channel = options?.channel || this.config.channel;
    
    log.info(`Starting story: ${storyId} for player: ${playerId}`);

    const result = await narrativeEngine.startSession(storyId, playerId, channel);
    
    if (!result) {
      log.error(`Failed to start story: ${storyId}`);
      return null;
    }

    this.currentSessionId = result.session;
    this.autoSaveEnabled = options?.autoSave ?? false;

    // Deliver initial content
    await narrativeEngine.deliverContent(
      result.session.id,
      result.initialContent,
      result.session.state.choices
    );

    log.info(`Session started: ${result.session.id}`);

    return {
      sessionId: result.session.id,
      response: result.initialContent,
      choices: result.session.state.choices
    };
  }

  /**
   * Continue the story with player input - SIMPLE API
   */
  async continue(input: string): Promise<PlayResult | null> {
    if (!this.currentSessionId) {
      log.error('No active session. Call play() first.');
      return null;
    }

    const result = await narrativeEngine.processInput(
      this.currentSessionId,
      input,
      'text'
    );

    if (!result) {
      log.error('Failed to process input');
      return null;
    }

    // Deliver response
    await narrativeEngine.deliverContent(
      this.currentSessionId,
      result.response,
      result.choices
    );

    // Auto-save if enabled
    if (this.autoSaveEnabled) {
      await this.save('Auto-save');
    }

    return {
      sessionId: this.currentSessionId,
      response: result.response,
      choices: result.choices,
      state: {
        scene: result.session.state.currentNode,
        emotion: result.session.state.emotionalTone.primary,
        tension: result.session.state.tensionLevel
      }
    };
  }

  /**
   * Make a choice - SIMPLE API
   */
  async choose(choiceId: string): Promise<PlayResult | null> {
    if (!this.currentSessionId) {
      log.error('No active session. Call play() first.');
      return null;
    }

    const result = await narrativeEngine.processInput(
      this.currentSessionId,
      choiceId,
      'choice'
    );

    if (!result) {
      log.error('Failed to process choice');
      return null;
    }

    await narrativeEngine.deliverContent(
      this.currentSessionId,
      result.response,
      result.choices
    );

    return {
      sessionId: this.currentSessionId,
      response: result.response,
      choices: result.choices,
      state: {
        scene: result.session.state.currentNode,
        emotion: result.session.state.emotionalTone.primary,
        tension: result.session.state.tensionLevel
      }
    };
  }

  /**
   * Save game state
   */
  async save(description?: string): Promise<string | null> {
    if (!this.currentSessionId) {
      log.error('No active session.');
      return null;
    }

    return narrativeEngine.saveGame(
      this.currentSessionId,
      description || 'Manual save'
    );
  }

  /**
   * Load saved game
   */
  async load(savePointId: string): Promise<boolean> {
    if (!this.currentSessionId) {
      log.error('No active session.');
      return false;
    }

    return narrativeEngine.loadGame(this.currentSessionId, savePointId);
  }

  /**
   * End current session
   */
  async end(): Promise<void> {
    if (this.currentSessionId) {
      await narrativeEngine.endSession(this.currentSessionId);
      log.info(`Session ended: ${this.currentSessionId}`);
      this.currentSessionId = null;
    }
  }

  /**
   * Get current state
   */
  getState(): { scene: string; emotion: string; tension: number; playtime: number } | null {
    if (!this.currentSessionId) {
      return null;
    }

    const session = sessionManager.getSession(this.currentSessionId);
    if (!session) return null;

    return {
      scene: session.state.currentNode,
      emotion: session.state.emotionalTone.primary,
      tension: session.state.tensionLevel,
      playtime: session.metadata.totalPlaytime
    };
  }

  /**
   * Set emotional tone
   */
  setEmotion(emotion: string, intensity?: number): void {
    if (!this.currentSessionId) return;
    narrativeEngine.triggerEvent(this.currentSessionId, 'set_emotion', {
      emotion,
      intensity: intensity || 0.5
    });
  }

  /**
   * Adjust tension
   */
  adjustTension(delta: number): void {
    if (!this.currentSessionId) return;
    const method = delta > 0 ? 'increase_tension' : 'decrease_tension';
    narrativeEngine.triggerEvent(this.currentSessionId, method);
  }

  /**
   * Get system health
   */
  getHealth(): HealthStatus {
    return this.healthChecker.getHealth();
  }

  /**
   * Get detailed status
   */
  getStatus() {
    return this.healthChecker.getDetailedStatus();
  }
}

// ============================================================================
// Quick Start Helper
// ============================================================================

export async function quickStart(
  storyId: string = 'mystery_manor',
  playerId: string = 'player_1'
): Promise<{ client: NarrativeClient; result: Awaited<ReturnType<typeof NarrativeClient.prototype.play>> }> {
  const client = new NarrativeClient();
  
  // Check health
  const health = client.getHealth();
  if (!health.healthy) {
    log.warn('System not fully healthy, but continuing...');
  }

  const result = await client.play(storyId, playerId);
  
  return { client, result };
}

// ============================================================================
// Export Simple API
// ============================================================================

export {
  // Easy client
  NarrativeClient,
  quickStart,

  // Configuration
  ConfigBuilder,
  DEFAULT_CONFIG,

  // Story building
  StoryBuilder,
  SimpleScene,
  SimpleChoice,

  // Health & logging
  HealthChecker,
  Logger,
  log,
  LogLevel
};
