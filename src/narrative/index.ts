/**
 * Narrative Engine - LoveLogicAI MCP Ecosystem
 * Interactive Narrative Experiences with CYOA Game Flows
 * 
 * @example
 * // Quick start - 3 lines to begin a story
 * import { quickStart } from './narrative';
 * const { client, result } = await quickStart('mystery_manor', 'player_1');
 * await client.continue('I want to explore the manor');
 */

// Core Types
export * from './types';

// Session Management
export { SessionManager, sessionManager } from './session';

// Model Integration
export { ModelManager, modelManager, DEFAULT_MODELS } from './model-integration';

// Persona Management
export { 
  PersonaManager, 
  personaManager, 
  EmotionModulator,
  DEFAULT_PERSONAS,
  VOICE_PROFILE_PRESETS 
} from './persona';

// Omnichannel
export { 
  OmnichannelRouter, 
  omnichannelRouter,
  ChannelAdapter,
  TextChannelAdapter,
  VoiceChannelAdapter,
  VisualChannelAdapter,
  HybridChannelAdapter,
  ChannelMessage,
  ChannelResponse,
  ChannelInput
} from './omnichannel';

// Narrative Engine / Game Master
export { 
  NarrativeEngine, 
  narrativeEngine,
  StoryNode,
  Story,
  registerExampleStory 
} from './engine';

// ============================================================================
// Easy-to-Use Facade (Recommended for New Users)
// ============================================================================

export {
  // Simple Client
  NarrativeClient,
  quickStart,
  PlayOptions,
  PlayResult,
  
  // Configuration
  ConfigBuilder,
  DEFAULT_CONFIG,
  NarrativeConfig,
  
  // Story Building
  StoryBuilder,
  SimpleScene,
  SimpleChoice,
  
  // Health & Observability
  HealthChecker,
  HealthStatus,
  Logger,
  log,
  LogLevel
} from './facade';

// ============================================================================
// Advanced Enhancements
// ============================================================================

export {
  // Caching
  AdvancedCache,
  CacheOptions,
  CacheStats,
  
  // Analytics
  Analytics,
  Metric,
  SessionMetrics,
  
  // Events
  EventEmitter,
  EventMap,
  narrativeEvents,
  
  // Plugins
  Plugin,
  PluginManager,
  
  // i18n
  I18n,
  TranslationSet,
  DEFAULT_TRANSLATIONS,
  
  // Templates
  STORY_TEMPLATES
} from './enhancements';

// Export enhancement singletons
export { analytics, pluginManager, i18n, globalCache } from './enhancements';

// ============================================================================
// Convenience Re-exports
// ============================================================================

export type {
  NarrativeSession,
  NarrativeState,
  NarrativeContext,
  StoryChoice,
  ChannelType,
  Persona,
  VoiceProfile,
  EmotionalTone,
  ModelConfig,
  ModelCapability,
  Story
} from './types';

// ============================================================================
// Version Info
// ============================================================================

export const VERSION = '1.0.0';
export const NARRATIVE_ENGINE_VERSION = '1.0.0';

// ============================================================================
// Complete Usage Examples
// ============================================================================

/**
 * Example 1: Ultra-Simple Quick Start
 * 
 * ```typescript
 * import { quickStart } from './narrative';
 * 
 * const { client, result } = await quickStart('mystery_manor', 'player_123');
 * await client.continue('I enter through the front door');
 * ```
 */

/**
 * Example 2: Full Configuration
 * 
 * ```typescript
 * import { ConfigBuilder, NarrativeClient } from './narrative';
 * 
 * const config = new ConfigBuilder()
 *   .channel('hybrid')
 *   .enableVoice(true)
 *   .enableVisual(true)
 *   .modelPriority('quality')
 *   .uncensored(true)
 *   .logLevel(LogLevel.DEBUG)
 *   .build();
 * 
 * const client = new NarrativeClient(config);
 * ```
 */

/**
 * Example 3: Custom Story Builder
 * 
 * ```typescript
 * import { StoryBuilder } from './narrative';
 * 
 * const story = new StoryBuilder('my_adventure', 'My Adventure', 'An epic tale')
 *   .startScene('start')
 *   .scene({
 *     id: 'start',
 *     description: 'You wake up in a mysterious forest...',
 *     choices: [
 *       { text: 'Go north', nextScene: 'mountain' },
 *       { text: 'Go south', nextScene: 'river' }
 *     ],
 *     emotion: 'mysterious'
 *   })
 *   .scene({
 *     id: 'mountain',
 *     description: 'An ancient temple appears...',
 *     emotion: 'tense'
 *   })
 *   .register();
 * ```
 */

/**
 * Example 4: Health Monitoring
 * 
 * ```typescript
 * import { HealthChecker, log, LogLevel } from './narrative';
 * 
 * const health = new HealthChecker();
 * 
 * // Check readiness
 * if (health.isReady()) {
 *   log.info('System is ready!');
 * }
 * 
 * // Get full status
 * const status = health.getDetailedStatus();
 * console.log(status.health);
 * console.log(status.models);
 * console.log(status.personas);
 * ```
 */

/**
 * Example 5: Analytics Tracking
 * 
 * ```typescript
 * import { analytics } from './narrative';
 * 
 * // Track custom metrics
 * analytics.track('user_action', 1, 'count', { action: 'story_start' });
 * analytics.track('response_time', 150, 'ms', { model: 'llama' });
 * 
 * // Get session report
 * const report = analytics.getSessionReport('session_123');
 * console.log(report);
 * 
 * // Export for Prometheus
 * console.log(analytics.exportMetrics());
 * ```
 */

/**
 * Example 6: Event System
 * 
 * ```typescript
 * import { narrativeEvents } from './narrative';
 * 
 * narrativeEvents.on('session:start', ({ sessionId }) => {
 *   console.log(`Session started: ${sessionId}`);
 * });
 * 
 * narrativeEvents.on('achievement:unlocked', ({ achievement }) => {
 *   console.log(`Achievement: ${achievement}`);
 * });
 * ```
 */

/**
 * Example 7: Plugin System
 * 
 * ```typescript
 * import { pluginManager, Plugin } from './narrative';
 * 
 * const myPlugin: Plugin = {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   initialize() {
 *     console.log('Plugin initialized');
 *   },
 *   destroy() {
 *     console.log('Plugin destroyed');
 *   },
 *   hooks: {
 *     session:start: ({ sessionId }) => console.log(sessionId)
 *   }
 * };
 * 
 * pluginManager.register(myPlugin);
 * ```
 */

/**
 * Example 8: Internationalization
 * 
 * ```typescript
 * import { i18n } from './narrative';
 * 
 * i18n.setLanguage('es');
 * console.log(i18n.t('greetings.hello'));  // "Hola"
 * console.log(i18n.t('choices.continue')); // "Continuar"
 * 
 * i18n.setLanguage('fr');
 * console.log(i18n.t('greetings.welcome')); // "Bienvenue"
 * ```
 */

/**
 * Example 9: Story Templates
 * 
 * ```typescript
 * import { STORY_TEMPLATES, StoryBuilder } from './narrative';
 * 
 * const mysteryTemplate = STORY_TEMPLATES.mystery;
 * 
 * const story = new StoryBuilder(
 *   'mystery_case',
 *   mysteryTemplate.title,
 *   mysteryTemplate.description
 * );
 * 
 * // Use template structure
 * story.startScene(mysteryTemplate.structure.opening);
 * ```
 */

/**
 * Example 10: Advanced Caching
 * 
 * ```typescript
 * import { globalCache } from './narrative';
 * 
 * // Check cache stats
 * console.log(globalCache.getStats());
 * 
 * // Pre-warm cache
 * globalCache.prewarm({
 *   common_response: 'The story continues...'
 * });
 * ```
 */

/**
 * Example 11: Direct Engine Access (Advanced)
 * 
 * ```typescript
 * import { narrativeEngine, registerExampleStory } from './narrative';
 * 
 * registerExampleStory();
 * 
 * const { session, initialContent } = await narrativeEngine.startSession(
 *   'mystery_manor',
 *   'player_123',
 *   'hybrid'
 * );
 * 
 * const result = await narrativeEngine.processInput(session.id, 'Hello there');
 * ```
 */

/**
 * Example 12: Complete Workflow
 * 
 * ```typescript
 * import { 
 *   quickStart, 
 *   analytics, 
 *   narrativeEvents,
 *   i18n 
 * } from './narrative';
 * 
 * // Enable analytics
 * analytics.startSessionTracking('player_1');
 * 
 * // Listen for events
 * narrativeEvents.on('choice:made', ({ choiceId }) => {
 *   analytics.track('choice', 1, 'count', { choice: choiceId });
 * });
 * 
 * // Start playing
 * const { client, result } = await quickStart('mystery_manor', 'player_1');
 * 
 * // Play
 * await client.continue('I explore the manor');
 * await client.choose('enter');
 * 
 * // Get report
 * console.log(analytics.getSessionReport('player_1'));
 * ```
 */
