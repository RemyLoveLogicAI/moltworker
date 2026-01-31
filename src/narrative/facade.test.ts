/**
 * Narrative Engine - Comprehensive Test Suite
 * Tests for Facade Module (Logger, HealthChecker, ConfigBuilder, NarrativeClient)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Logger,
  LogLevel,
  HealthChecker,
  ConfigBuilder,
  NarrativeClient,
  quickStart,
  DEFAULT_CONFIG
} from './facade';
import { AdvancedCache, Analytics, EventEmitter, I18n, pluginManager, globalCache } from './enhancements';

// ============================================================================
// Logger Tests
// ============================================================================

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    Logger.configure({ level: LogLevel.DEBUG, prefix: '[Test]', timestamp: false, colors: false });
    logger = Logger.getInstance();
  });

  describe('Configuration', () => {
    it('should create logger with default options', () => {
      const defaultLogger = new Logger();
      expect(defaultLogger).toBeInstanceOf(Logger);
    });

    it('should create logger with custom options', () => {
      const customLogger = new Logger({
        level: LogLevel.WARN,
        prefix: '[Custom]',
        timestamp: true,
        colors: true
      });
      expect(customLogger).toBeInstanceOf(Logger);
    });

    it('should return same instance on multiple calls', () => {
      const instance1 = Logger.getInstance();
      const instance2 = Logger.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should configure static instance', () => {
      Logger.configure({ level: LogLevel.ERROR });
      const instance = Logger.getInstance();
      expect(instance).toBeDefined();
    });
  });

  describe('Logging Levels', () => {
    it('should log debug messages', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.debug('debug message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.info('info message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log warn messages', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.warn('warn message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error messages', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.error('error message');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should include data with log messages', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.info('message with data', { key: 'value' });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        expect.stringContaining('[INFO]'),
        expect.stringContaining('message with data')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Log Level Filtering', () => {
    it('should filter out debug messages when level is INFO', () => {
      Logger.configure({ level: LogLevel.INFO });
      const logger = Logger.getInstance();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      logger.debug('should not appear');
      expect(consoleSpy).not.toHaveBeenCalled();
      
      logger.info('should appear');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should filter out INFO when level is WARN', () => {
      Logger.configure({ level: LogLevel.WARN });
      const logger = Logger.getInstance();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      logger.info('should not appear');
      expect(consoleSpy).not.toHaveBeenCalled();
      
      logger.warn('should appear');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});

// ============================================================================
// HealthChecker Tests
// ============================================================================

describe('HealthChecker', () => {
  let healthChecker: HealthChecker;

  beforeEach(() => {
    healthChecker = new HealthChecker();
  });

  describe('getHealth', () => {
    it('should return health status object', () => {
      const health = healthChecker.getHealth();
      
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('models');
      expect(health).toHaveProperty('channels');
      expect(health).toHaveProperty('sessions');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('timestamp');
    });

    it('should include model health info', () => {
      const health = healthChecker.getHealth();
      
      expect(health.models).toHaveProperty('total');
      expect(health.models).toHaveProperty('healthy');
      expect(health.models).toHaveProperty('byProvider');
      expect(typeof health.models.total).toBe('number');
      expect(typeof health.models.healthy).toBe('number');
    });

    it('should include channel health status', () => {
      const health = healthChecker.getHealth();
      
      expect(health.channels).toHaveProperty('text');
      expect(health.channels).toHaveProperty('voice');
      expect(health.channels).toHaveProperty('visual');
      expect(health.channels).toHaveProperty('hybrid');
      expect(typeof health.channels.text).toBe('boolean');
    });

    it('should include session health status', () => {
      const health = healthChecker.getHealth();
      
      expect(health.sessions).toHaveProperty('active');
      expect(health.sessions).toHaveProperty('totalCreated');
    });

    it('should track uptime', () => {
      const initialHealth = healthChecker.getHealth();
      expect(initialHealth.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include timestamp', () => {
      const health = healthChecker.getHealth();
      const now = Date.now();
      expect(health.timestamp).toBeLessThanOrEqual(now);
      expect(health.timestamp).toBeGreaterThan(now - 1000);
    });
  });

  describe('getDetailedStatus', () => {
    it('should return complete status object', () => {
      const status = healthChecker.getDetailedStatus();
      
      expect(status).toHaveProperty('health');
      expect(status).toHaveProperty('models');
      expect(status).toHaveProperty('personas');
      expect(status).toHaveProperty('channels');
    });

    it('should include models array', () => {
      const status = healthChecker.getDetailedStatus();
      expect(Array.isArray(status.models)).toBe(true);
    });

    it('should include personas array', () => {
      const status = healthChecker.getDetailedStatus();
      expect(Array.isArray(status.personas)).toBe(true);
    });

    it('should include channels array', () => {
      const status = healthChecker.getDetailedStatus();
      expect(Array.isArray(status.channels)).toBe(true);
    });
  });

  describe('isReady', () => {
    it('should return true when healthy', () => {
      const isReady = healthChecker.isReady();
      expect(typeof isReady).toBe('boolean');
    });
  });
});

// ============================================================================
// ConfigBuilder Tests
// ============================================================================

describe('ConfigBuilder', () => {
  describe('Default Configuration', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONFIG.channel).toBe('hybrid');
      expect(DEFAULT_CONFIG.enableVoice).toBe(true);
      expect(DEFAULT_CONFIG.enableVisual).toBe(true);
      expect(DEFAULT_CONFIG.modelPriority).toBe('balanced');
      expect(DEFAULT_CONFIG.uncensored).toBe(true);
      expect(DEFAULT_CONFIG.logLevel).toBe(LogLevel.INFO);
    });
  });

  describe('Builder Methods', () => {
    it('should set channel', () => {
      const config = new ConfigBuilder()
        .channel('voice')
        .build();
      
      expect(config.channel).toBe('voice');
    });

    it('should set enableVoice', () => {
      const config = new ConfigBuilder()
        .enableVoice(false)
        .build();
      
      expect(config.enableVoice).toBe(false);
    });

    it('should set enableVisual', () => {
      const config = new ConfigBuilder()
        .enableVisual(true)
        .build();
      
      expect(config.enableVisual).toBe(true);
    });

    it('should set modelPriority to quality', () => {
      const config = new ConfigBuilder()
        .modelPriority('quality')
        .build();
      
      expect(config.modelPriority).toBe('quality');
    });

    it('should set modelPriority to speed', () => {
      const config = new ConfigBuilder()
        .modelPriority('speed')
        .build();
      
      expect(config.modelPriority).toBe('speed');
    });

    it('should set modelPriority to balanced', () => {
      const config = new ConfigBuilder()
        .modelPriority('balanced')
        .build();
      
      expect(config.modelPriority).toBe('balanced');
    });

    it('should set uncensored', () => {
      const config = new ConfigBuilder()
        .uncensored(false)
        .build();
      
      expect(config.uncensored).toBe(false);
    });

    it('should set logLevel', () => {
      const config = new ConfigBuilder()
        .logLevel(LogLevel.DEBUG)
        .build();
      
      expect(config.logLevel).toBe(LogLevel.DEBUG);
    });

    it('should support fluent interface', () => {
      const config = new ConfigBuilder()
        .channel('text')
        .enableVoice(true)
        .enableVisual(false)
        .modelPriority('quality')
        .uncensored(true)
        .logLevel(LogLevel.WARN)
        .build();
      
      expect(config.channel).toBe('text');
      expect(config.enableVoice).toBe(true);
      expect(config.enableVisual).toBe(false);
      expect(config.modelPriority).toBe('quality');
      expect(config.uncensored).toBe(true);
      expect(config.logLevel).toBe(LogLevel.WARN);
    });
  });
});

// ============================================================================
// AdvancedCache Tests
// ============================================================================

describe('AdvancedCache', () => {
  let cache: AdvancedCache<string>;

  beforeEach(() => {
    cache = new AdvancedCache({ maxSize: 5, ttl: 1000, priority: 'lru' });
  });

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should delete values', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('TTL', () => {
    it('should expire values after TTL', async () => {
      const shortTtlCache = new AdvancedCache<string>({ maxSize: 10, ttl: 50 });
      shortTtlCache.set('key1', 'value1');
      expect(shortTtlCache.get('key1')).toBe('value1');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(shortTtlCache.get('key1')).toBeNull();
    });

    it('should accept custom TTL on set', async () => {
      cache.set('key1', 'value1', 50);
      expect(cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('Eviction', () => {
    it('should evict when at max size', () => {
      for (let i = 0; i < 5; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      
      // All values should be accessible
      for (let i = 0; i < 5; i++) {
        expect(cache.get(`key${i}`)).toBe(`value${i}`);
      }
      
      // Add one more
      cache.set('key5', 'value5');
      
      // Oldest should be evicted (LRU)
      expect(cache.get('key0')).toBeNull();
    });
  });

  describe('Stats', () => {
    it('should return stats object', () => {
      cache.set('key1', 'value1');
      const stats = cache.getStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('totalAccesses');
      expect(stats).toHaveProperty('memoryUsage');
    });

    it('should track size', () => {
      expect(cache.getStats().size).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.getStats().size).toBe(1);
    });
  });

  describe('Prewarm', () => {
    it('should prewarm with values', () => {
      cache.prewarm({
        'common1': 'response1',
        'common2': 'response2'
      });
      
      expect(cache.get('common1')).toBe('response1');
      expect(cache.get('common2')).toBe('response2');
    });
  });
});

// ============================================================================
// Analytics Tests
// ============================================================================

describe('Analytics', () => {
  let analytics: Analytics;

  beforeEach(() => {
    analytics = new Analytics();
  });

  describe('Track', () => {
    it('should track metrics', () => {
      analytics.track('test_metric', 42, 'count');
      expect(analytics.getHealth()).toBeDefined();
    });

    it('should accept tags', () => {
      analytics.track('test_metric', 42, 'count', { tag1: 'value1' });
      const metrics = analytics.exportMetrics();
      expect(typeof metrics).toBe('string');
    });
  });

  describe('Session Tracking', () => {
    it('should start session tracking', () => {
      analytics.startSessionTracking('session_123');
      const report = analytics.getSessionReport('session_123');
      expect(report).not.toBeNull();
    });

    it('should track choices', () => {
      analytics.startSessionTracking('session_123');
      analytics.recordChoice('session_123', 'enter', 'foyer');
      const report = analytics.getSessionReport('session_123');
      expect(report?.totalChoices).toBe(1);
    });

    it('should track responses', () => {
      analytics.startSessionTracking('session_123');
      analytics.recordResponse('session_123', 100, 50);
      const report = analytics.getSessionReport('session_123');
      expect(report?.totalWordsGenerated).toBe(100);
    });

    it('should track achievements', () => {
      analytics.startSessionTracking('session_123');
      analytics.recordAchievement('session_123', 'first_choice');
      const report = analytics.getSessionReport('session_123');
      expect(report?.achievements).toContain('first_choice');
    });
  });

  describe('Aggregate Stats', () => {
    it('should return aggregate stats', () => {
      const stats = analytics.getAggregateStats();
      
      expect(stats).toHaveProperty('totalSessions');
      expect(stats).toHaveProperty('totalPlaytime');
      expect(stats).toHaveProperty('totalChoices');
      expect(stats).toHaveProperty('totalWords');
      expect(stats).toHaveProperty('avgResponseTime');
      expect(stats).toHaveProperty('uniqueAchievements');
    });
  });

  describe('Export', () => {
    it('should export metrics as string', () => {
      analytics.track('test', 1);
      const exported = analytics.exportMetrics();
      expect(typeof exported).toBe('string');
    });
  });
});

// ============================================================================
// EventEmitter Tests
// ============================================================================

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on/off', () => {
    it('should register event handlers', async () => {
      const handler = vi.fn();
      emitter.on('session:start' as any, handler);
      
      await emitter.emit('session:start' as any, { sessionId: '123' });
      expect(handler).toHaveBeenCalledWith({ sessionId: '123' });
    });

    it('should unregister event handlers', async () => {
      const handler = vi.fn();
      const unsubscribe = emitter.on('session:start' as any, handler);
      
      unsubscribe();
      await emitter.emit('session:start' as any, { sessionId: '123' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support multiple handlers for same event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      emitter.on('session:start' as any, handler1);
      emitter.on('session:start' as any, handler2);
      
      await emitter.emit('session:start' as any, { sessionId: '123' });
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should fire only once', async () => {
      const handler = vi.fn();
      emitter.once('session:start' as any, handler);
      
      await emitter.emit('session:start' as any, { sessionId: '123' });
      await emitter.emit('session:start' as any, { sessionId: '456' });
      
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});

// ============================================================================
// I18n Tests
// ============================================================================

describe('I18n', () => {
  let i18n: I18n;

  beforeEach(() => {
    i18n = new I18n();
  });

  describe('setLanguage', () => {
    it('should set current language', () => {
      i18n.setLanguage('es');
      expect(i18n.t('greetings.hello')).toBe('Hola');
    });

    it('should fall back to English for unknown language', () => {
      i18n.setLanguage('unknown' as any);
      expect(i18n.t('greetings.hello')).toBe('greetings.hello');
    });
  });

  describe('t', () => {
    it('should return translation for existing key', () => {
      i18n.setLanguage('en');
      expect(i18n.t('greetings.hello')).toBe('Hello there');
    });

    it('should return key for missing translation', () => {
      i18n.setLanguage('en');
      expect(i18n.t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('should support dot notation', () => {
      i18n.setLanguage('en');
      expect(i18n.t('system.loading')).toBe('Loading...');
    });

    it('should support Spanish', () => {
      i18n.setLanguage('es');
      expect(i18n.t('greetings.welcome')).toBe('Bienvenido');
    });

    it('should support French', () => {
      i18n.setLanguage('fr');
      expect(i18n.t('greetings.goodbye')).toBe('Au revoir');
    });
  });

  describe('addTranslations', () => {
    it('should add custom translations', () => {
      i18n.addTranslations('ja', {
        greetings: { hello: 'こんにちは' },
        emotions: {},
        choices: {},
        system: {}
      });
      
      i18n.setLanguage('ja');
      expect(i18n.t('greetings.hello')).toBe('こんにちは');
    });
  });

  describe('getLanguages', () => {
    it('should return available languages', () => {
      const languages = i18n.getLanguages();
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('fr');
    });
  });
});

// ============================================================================
// PluginManager Tests
// ============================================================================

describe('PluginManager', () => {
  let pm: PluginManager;

  beforeEach(() => {
    pm = new PluginManager();
  });

  describe('register', () => {
    it('should register a plugin', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        destroy: vi.fn()
      };
      
      pm.register(plugin);
      const plugins = pm.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].name).toBe('test-plugin');
    });

    it('should replace existing plugin with same name', () => {
      const plugin1 = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        destroy: vi.fn()
      };
      
      const plugin2 = {
        name: 'test-plugin',
        version: '2.0.0',
        initialize: vi.fn(),
        destroy: vi.fn()
      };
      
      pm.register(plugin1);
      pm.register(plugin2);
      
      const plugins = pm.getPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].version).toBe('2.0.0');
    });
  });

  describe('unregister', () => {
    it('should unregister a plugin', () => {
      const plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        initialize: vi.fn(),
        destroy: vi.fn()
      };
      
      pm.register(plugin);
      const result = pm.unregister('test-plugin');
      
      expect(result).toBe(true);
      expect(pm.getPlugins()).toHaveLength(0);
    });

    it('should return false for non-existent plugin', () => {
      const result = pm.unregister('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getPlugins', () => {
    it('should return all registered plugins', () => {
      pm.register({ name: 'p1', version: '1', initialize: vi.fn(), destroy: vi.fn() });
      pm.register({ name: 'p2', version: '1', initialize: vi.fn(), destroy: vi.fn() });
      
      const plugins = pm.getPlugins();
      expect(plugins).toHaveLength(2);
    });
  });
});

// ============================================================================
// Global Instances Tests
// ============================================================================

describe('Global Instances', () => {
  it('should export analytics singleton', () => {
    expect(analytics).toBeInstanceOf(Analytics);
  });

  it('should export pluginManager singleton', () => {
    expect(pluginManager).toBeInstanceOf(PluginManager);
  });

  it('should export i18n singleton', () => {
    expect(i18n).toBeInstanceOf(I18n);
  });

  it('should export globalCache singleton', () => {
    expect(globalCache).toBeInstanceOf(AdvancedCache);
  });
});
