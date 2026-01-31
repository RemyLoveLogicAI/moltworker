/**
 * Narrative Engine Enhancements
 * LoveLogicAI MCP Ecosystem - Advanced Features & Performance
 */

import type {
  NarrativeSession,
  NarrativeState,
  NarrativeContext,
  StoryChoice,
  Persona,
  VoiceProfile,
  EmotionalTone
} from './types';
import { sessionManager } from './session';
import { modelManager } from './model-integration';
import { personaManager } from './persona';
import { narrativeEngine } from './engine';
import { log, LogLevel } from './facade';

// ============================================================================
// Advanced LRU Cache
// ============================================================================

export interface CacheOptions {
  maxSize: number;
  ttl: number; // milliseconds
  priority: 'lru' | 'lfu' | 'fifo';
}

export class AdvancedCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttl: number;
  private priority: 'lru' | 'lfu' | 'fifo';
  private accessOrder: string[];
  private accessCounts: Map<string, number>;

  constructor(options?: Partial<CacheOptions>) {
    this.cache = new Map();
    this.maxSize = options?.maxSize ?? 1000;
    this.ttl = options?.ttl ?? 5 * 60 * 1000; // 5 minutes
    this.priority = options?.priority ?? 'lru';
    this.accessOrder = [];
    this.accessCounts = new Map();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    // Update access metadata
    this.updateAccess(key);
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Evict if at max size
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1,
      expiresAt: Date.now() + (ttl ?? this.ttl)
    };

    this.cache.set(key, entry);
    this.accessOrder.push(key);
    this.accessCounts.set(key, 1);
  }

  /**
   * Delete key from cache
   */
  delete(key: string): boolean {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessCounts.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.accessCounts.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let totalAccesses = 0;
    for (const count of this.accessCounts.values()) {
      totalAccesses += count;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      totalAccesses,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Pre-warm cache with common entries
   */
  prewarm(entries: Record<string, T>): void {
    for (const [key, value] of Object.entries(entries)) {
      this.set(key, value, this.ttl * 2); // Double TTL for prewarmed entries
    }
  }

  private updateAccess(key: string): void {
    if (this.priority === 'lru') {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    }
    
    const count = this.accessCounts.get(key) || 0;
    this.accessCounts.set(key, count + 1);
  }

  private evict(): void {
    if (this.accessOrder.length === 0) return;

    let keyToEvict: string | undefined;

    switch (this.priority) {
      case 'lru':
        keyToEvict = this.accessOrder.shift();
        break;
      case 'lfu':
        let minCount = Infinity;
        for (const [key, count] of this.accessCounts) {
          if (count < minCount) {
            minCount = count;
            keyToEvict = key;
          }
        }
        break;
      case 'fifo':
        keyToEvict = this.accessOrder.shift();
        break;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
    }
  }

  private calculateHitRate(): number {
    // Simplified - would track hits/misses in production
    return this.cache.size / this.maxSize;
  }

  private estimateMemoryUsage(): number {
    // Rough estimate in bytes
    return this.cache.size * 200; // ~200 bytes per entry average
  }
}

interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  expiresAt: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  totalAccesses: number;
  memoryUsage: number;
}

// ============================================================================
// Analytics & Metrics
// ============================================================================

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
}

export interface SessionMetrics {
  sessionId: string;
  totalPlaytime: number;
  totalChoices: number;
  totalWordsGenerated: number;
  averageResponseTime: number;
  emotionalJourney: EmotionalMetric[];
  branchingPath: BranchMetric[];
  achievements: string[];
}

interface EmotionalMetric {
  emotion: string;
  duration: number;
  percentage: number;
}

interface BranchMetric {
  sceneId: string;
  visitCount: number;
  timeSpent: number;
}

export class Analytics {
  private metrics: Metric[];
  private sessionMetrics: Map<string, SessionMetrics>;
  private eventLog: AnalyticsEvent[];

  constructor() {
    this.metrics = [];
    this.sessionMetrics = new Map();
    this.eventLog = [];
  }

  /**
   * Track a metric
   */
  track(name: string, value: number, unit: string = 'count', tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags: tags || {}
    });
  }

  /**
   * Start tracking session metrics
   */
  startSessionTracking(sessionId: string): void {
    this.sessionMetrics.set(sessionId, {
      sessionId,
      totalPlaytime: 0,
      totalChoices: 0,
      totalWordsGenerated: 0,
      averageResponseTime: 0,
      emotionalJourney: [],
      branchingPath: [],
      achievements: []
    });
  }

  /**
   * Record choice made
   */
  recordChoice(sessionId: string, choiceId: string, sceneId: string): void {
    const metrics = this.sessionMetrics.get(sessionId);
    if (metrics) {
      metrics.totalChoices++;
      metrics.branchingPath.push({
        sceneId,
        visitCount: 1,
        timeSpent: Date.now()
      });
    }

    this.logEvent('choice_made', { sessionId, choiceId, sceneId });
  }

  /**
   * Record response generated
   */
  recordResponse(sessionId: string, wordCount: number, responseTime: number): void {
    const metrics = this.sessionMetrics.get(sessionId);
    if (metrics) {
      metrics.totalWordsGenerated += wordCount;
      
      // Update moving average
      const total = metrics.totalChoices || 1;
      metrics.averageResponseTime = 
        ((metrics.averageResponseTime * (total - 1)) + responseTime) / total;
    }

    this.logEvent('response_generated', { sessionId, wordCount, responseTime });
  }

  /**
   * Record emotion change
   */
  recordEmotion(sessionId: string, emotion: string, duration: number): void {
    const metrics = this.sessionMetrics.get(sessionId);
    if (metrics) {
      metrics.emotionalJourney.push({
        emotion,
        duration,
        percentage: 0 // Calculated later
      });
    }
  }

  /**
   * Record achievement unlocked
   */
  recordAchievement(sessionId: string, achievement: string): void {
    const metrics = this.sessionMetrics.get(sessionId);
    if (metrics && !metrics.achievements.includes(achievement)) {
      metrics.achievements.push(achievement);
      this.logEvent('achievement_unlocked', { sessionId, achievement });
    }
  }

  /**
   * Get session report
   */
  getSessionReport(sessionId: string): SessionMetrics | null {
    return this.sessionMetrics.get(sessionId) || null;
  }

  /**
   * Get aggregate statistics
   */
  getAggregateStats(): AggregateStats {
    const sessions = Array.from(this.sessionMetrics.values());
    
    return {
      totalSessions: sessions.length,
      totalPlaytime: sessions.reduce((sum, s) => sum + s.totalPlaytime, 0),
      totalChoices: sessions.reduce((sum, s) => sum + s.totalChoices, 0),
      totalWords: sessions.reduce((sum, s) => sum + s.totalWordsGenerated, 0),
      avgResponseTime: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.averageResponseTime, 0) / sessions.length 
        : 0,
      uniqueAchievements: new Set(sessions.flatMap(s => s.achievements)).size
    };
  }

  /**
   * Export metrics for external monitoring (Prometheus, etc.)
   */
  exportMetrics(): string {
    const lines = this.metrics.map(m => 
      `${m.name}{${Object.entries(m.tags).map(([k, v]) => `${k}="${v}"`).join(',')}} ${m.value}`
    );
    return lines.join('\n');
  }

  private logEvent(type: string, data: Record<string, unknown>): void {
    this.eventLog.push({
      type,
      data,
      timestamp: Date.now()
    });

    // Keep only last 1000 events
    if (this.eventLog.length > 1000) {
      this.eventLog.shift();
    }
  }
}

interface AnalyticsEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: number;
}

interface AggregateStats {
  totalSessions: number;
  totalPlaytime: number;
  totalChoices: number;
  totalWords: number;
  avgResponseTime: number;
  uniqueAchievements: number;
}

// ============================================================================
// Event System
// ============================================================================

export type EventHandler = (data: unknown) => void | Promise<void>;

export interface EventMap {
  'session:start': { sessionId: string; storyId: string };
  'session:end': { sessionId: string; reason: string };
  'choice:made': { sessionId: string; choiceId: string; sceneId: string };
  'scene:entered': { sessionId: string; sceneId: string };
  'emotion:changed': { sessionId: string; from: string; to: string };
  'tension:changed': { sessionId: string; oldValue: number; newValue: number };
  'achievement:unlocked': { sessionId: string; achievement: string };
  'error:occurred': { sessionId: string; error: Error };
  'model:rotated': { sessionId: string; oldModel: string; newModel: string };
}

export class EventEmitter<E extends EventMap = EventMap> {
  private listeners: Map<keyof E, Set<EventHandler>>;

  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to event
   */
  on<K extends keyof E>(event: K, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from event
   */
  off<K extends keyof E>(event: K, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  /**
   * Emit event
   */
  async emit<K extends keyof E>(event: K, data: E[K]): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    const promises = Array.from(handlers).map(handler => handler(data));
    await Promise.all(promises);
  }

  /**
   * Emit once (auto-unsubscribe after first event)
   */
  once<K extends keyof E>(event: K, handler: EventHandler): void {
    const wrappedHandler = async (data: unknown) => {
      await handler(data);
      this.off(event, wrappedHandler);
    };
    this.on(event, wrappedHandler);
  }
}

// Global event emitter
export const narrativeEvents = new EventEmitter<EventMap>();

// ============================================================================
// Plugin System
// ============================================================================

export interface Plugin {
  name: string;
  version: string;
  initialize(): Promise<void> | void;
  destroy(): Promise<void> | void;
  hooks?: Partial<Record<keyof EventMap, EventHandler>>;
}

export class PluginManager {
  private plugins: Map<string, Plugin>;
  private eventEmitter: EventEmitter;

  constructor() {
    this.plugins = new Map();
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      log.warn(`Plugin ${plugin.name} already registered, replacing...`);
    }

    this.plugins.set(plugin.name, plugin);
    
    // Register hooks
    if (plugin.hooks) {
      for (const [event, handler] of Object.entries(plugin.hooks)) {
        this.eventEmitter.on(event as keyof EventMap, handler);
      }
    }

    log.info(`Registered plugin: ${plugin.name} v${plugin.version}`);
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): boolean {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    // Remove hooks
    if (plugin.hooks) {
      for (const [event, handler] of Object.entries(plugin.hooks)) {
        this.eventEmitter.off(event as keyof EventMap, handler);
      }
    }

    // Destroy plugin
    plugin.destroy();

    this.plugins.delete(name);
    log.info(`Unregistered plugin: ${name}`);
    return true;
  }

  /**
   * Initialize all plugins
   */
  async initializeAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.initialize();
    }
  }

  /**
   * Destroy all plugins
   */
  async destroyAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.destroy();
    }
    this.plugins.clear();
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

// ============================================================================
// Advanced Story Templates
// ============================================================================

export const STORY_TEMPLATES = {
  mystery: {
    id: 'template_mystery',
    title: 'Mystery Template',
    description: 'A classic whodunit mystery',
    structure: {
      opening: 'discovery',
      risingAction: ['investigation_1', 'investigation_2', 'investigation_3'],
      climax: 'confrontation',
      fallingAction: 'revelation',
      resolution: 'case_closed'
    },
    emotions: ['curious', 'tense', 'suspicious', 'shocked', 'satisfied'],
    recommendedPersonas: ['detective', 'victim', 'suspect', 'witness']
  },
  romance: {
    id: 'template_romance',
    title: 'Romance Template',
    description: 'A sweeping love story',
    structure: {
      opening: 'meet_cute',
      risingAction: ['growing_closer', 'obstacle', 'conflict'],
      climax: 'declaration',
      fallingAction: 'happily_ever_after',
      resolution: 'epilogue'
    },
    emotions: ['happy', 'loving', 'anxious', 'passionate', 'heartbroken', 'joyful'],
    recommendedPersonas: ['love_interest', 'rival', 'friend', 'mentor']
  },
  horror: {
    id: 'template_horror',
    title: 'Horror Template',
    description: 'A spine-tingling horror experience',
    structure: {
      opening: 'arrival',
      risingAction: ['uncovering', 'chase_1', 'chase_2'],
      climax: 'final_confrontation',
      fallingAction: 'escape_or_perish',
      resolution: 'survival_or_doom'
    },
    emotions: ['fearful', 'suspicious', 'terrified', 'desperate', 'relieved', 'doomed'],
    recommendedPersonas: ['victim', 'monster', 'survivor', 'antagonist']
  },
  adventure: {
    id: 'template_adventure',
    title: 'Adventure Template',
    description: 'An epic quest adventure',
    structure: {
      opening: 'call_to_adventure',
      risingAction: ['journey', 'challenges', 'companions'],
      climax: 'final_battle',
      fallingAction: 'return_home',
      resolution: 'legend_legacy'
    },
    emotions: ['determined', 'brave', 'fearful', 'triumphant', 'satisfied', 'proud'],
    recommendedPersonas: ['hero', 'mentor', 'sidekick', 'villain', 'ally']
  },
  noir: {
    id: 'template_noir',
    title: 'Noir Template',
    description: 'A gritty noir detective story',
    structure: {
      opening: 'case_taken',
      risingAction: ['leads', 'betrayal', 'double_cross'],
      climax: 'truth_revealed',
      fallingAction: 'aftermath',
      resolution: 'justice_or_not'
    },
    emotions: ['suspicious', 'tired', 'bitter', 'satisfied', 'hollow'],
    recommendedPersonas: ['detective', 'femme_fatale', 'criminal', 'witness']
  }
};

// ============================================================================
// Multi-Language Support
// ============================================================================

export interface TranslationSet {
  greetings: Record<string, string>;
  emotions: Record<string, string>;
  choices: Record<string, string>;
  system: Record<string, string>;
}

export const DEFAULT_TRANSLATIONS: Record<string, TranslationSet> = {
  en: {
    greetings: {
      hello: 'Hello there',
      welcome: 'Welcome',
      goodbye: 'Until we meet again'
    },
    emotions: {
      happy: 'happy',
      sad: 'sad',
      angry: 'angry',
      fearful: 'fearful',
      loving: 'loving',
      mysterious: 'mysterious'
    },
    choices: {
      continue: 'Continue',
      back: 'Go back',
      investigate: 'Investigate',
      leave: 'Leave'
    },
    system: {
      loading: 'Loading...',
      saving: 'Saving...',
      error: 'Something went wrong',
      saved: 'Game saved'
    }
  },
  es: {
    greetings: {
      hello: 'Hola',
      welcome: 'Bienvenido',
      goodbye: 'Hasta que nos veamos'
    },
    emotions: {
      happy: 'feliz',
      sad: 'triste',
      angry: 'enojado',
      fearful: 'miedoso',
      loving: 'amoroso',
      mysterious: 'misterioso'
    },
    choices: {
      continue: 'Continuar',
      back: 'Volver',
      investigate: 'Investigar',
      leave: 'Salir'
    },
    system: {
      loading: 'Cargando...',
      saving: 'Guardando...',
      error: 'Algo salió mal',
      saved: 'Juego guardado'
    }
  },
  fr: {
    greetings: {
      hello: 'Bonjour',
      welcome: 'Bienvenue',
      goodbye: 'Au revoir'
    },
    emotions: {
      happy: 'heureux',
      sad: 'triste',
      angry: 'fâché',
      fearful: 'effrayé',
      loving: 'amoureux',
      mysterious: 'mystérieux'
    },
    choices: {
      continue: 'Continuer',
      back: 'Retour',
      investigate: 'Enquêter',
      leave: 'Partir'
    },
    system: {
      loading: 'Chargement...',
      saving: 'Sauvegarde...',
      error: 'Quelque chose s\'est mal passé',
      saved: 'Jeu sauvegardé'
    }
  }
};

export class I18n {
  private currentLanguage: string = 'en';
  private translations: Map<string, TranslationSet>;

  constructor() {
    this.translations = new Map(Object.entries(DEFAULT_TRANSLATIONS));
  }

  /**
   * Set current language
   */
  setLanguage(lang: string): void {
    if (this.translations.has(lang)) {
      this.currentLanguage = lang;
    } else {
      log.warn(`Language ${lang} not found, falling back to English`);
      this.currentLanguage = 'en';
    }
  }

  /**
   * Get translation
   */
  t(key: string, lang?: string): string {
    const translations = this.translations.get(lang || this.currentLanguage);
    if (!translations) return key;

    const keys = key.split('.');
    let value: unknown = translations;
    
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
      if (value === undefined) return key;
    }

    return value as string;
  }

  /**
   * Add custom translations
   */
  addTranslations(lang: string, translations: TranslationSet): void {
    const existing = this.translations.get(lang);
    if (existing) {
      this.translations.set(lang, {
        greetings: { ...existing.greetings, ...translations.greetings },
        emotions: { ...existing.emotions, ...translations.emotions },
        choices: { ...existing.choices, ...translations.choices },
        system: { ...existing.system, ...translations.system }
      });
    } else {
      this.translations.set(lang, translations);
    }
  }

  /**
   * Get available languages
   */
  getLanguages(): string[] {
    return Array.from(this.translations.keys());
  }
}

// ============================================================================
// Export Enhancements
// ============================================================================

export const analytics = new Analytics();
export const pluginManager = new PluginManager();
export const i18n = new I18n();
export const globalCache = new AdvancedCache();

// Pre-warm cache with common patterns
globalCache.prewarm({
  'greeting_morning': 'Good morning, adventurer.',
  'greeting_evening': 'The night is upon us.',
  'greeting_night': 'Darkness falls...',
  'scene_transition': 'The story continues...',
  'choice_prompt': 'What will you do?'
});

log.info('Narrative enhancements loaded');
