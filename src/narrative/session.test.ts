/**
 * Narrative Engine - Session Module Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SessionManager,
  Session,
  SessionState,
  Choice,
  NarrativeContext,
  ChoiceOutcome,
  SessionEventMap
} from './session';
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
// SessionManager Tests
// ============================================================================

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  describe('createSession', () => {
    it('should create a new session', () => {
      const context: Partial<NarrativeContext> = {
        initialLocation: 'foyer',
        modelPriority: 'balanced'
      };
      
      const session = manager.createSession(context as NarrativeContext);
      
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.location).toBe('foyer');
      expect(session.choicesMade).toBe(0);
    });

    it('should generate unique session IDs', () => {
      const session1 = manager.createSession({ initialLocation: 'start' });
      const session2 = manager.createSession({ initialLocation: 'start' });
      
      expect(session1.id).not.toBe(session2.id);
    });

    it('should set default context values', () => {
      const session = manager.createSession({});
      
      expect(session.location).toBe('unknown');
      expect(session.modelPriority).toBe('balanced');
      expect(session.choicesMade).toBe(0);
      expect(session.createdAt).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should retrieve existing session', () => {
      const session = manager.createSession({ initialLocation: 'foyer' });
      const retrieved = manager.getSession(session.id);
      
      expect(retrieved).toBe(session);
    });

    it('should return undefined for non-existent session', () => {
      const result = manager.getSession('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('updateSession', () => {
    it('should update session location', () => {
      const session = manager.createSession({ initialLocation: 'foyer' });
      
      const updated = manager.updateSession(session.id, { location: 'kitchen' });
      
      expect(updated?.location).toBe('kitchen');
    });

    it('should return undefined for non-existent session', () => {
      const result = manager.updateSession('nonexistent', { location: 'kitchen' });
      expect(result).toBeUndefined();
    });
  });

  describe('recordChoice', () => {
    it('should record a choice', () => {
      const session = manager.createSession({ initialLocation: 'foyer' });
      
      const choice: Choice = {
        id: 'enter',
        text: 'Enter the room',
        location: 'foyer',
        destination: 'living_room'
      };
      
      const outcome: ChoiceOutcome = {
        success: true,
        response: 'You enter the room',
        locationChange: true
      };
      
      const result = manager.recordChoice(session.id, choice, outcome);
      
      expect(result).toBe(true);
      expect(session.choicesMade).toBe(1);
    });

    it('should return false for non-existent session', () => {
      const choice: Choice = { id: 'test', text: 'Test', location: 'test', destination: 'test' };
      const outcome: ChoiceOutcome = { success: true, response: 'Test', locationChange: false };
      
      const result = manager.recordChoice('nonexistent', choice, outcome);
      expect(result).toBe(false);
    });
  });

  describe('recordResponse', () => {
    it('should record response metrics', () => {
      const session = manager.createSession({ initialLocation: 'foyer' });
      
      const result = manager.recordResponse(session.id, 150, 75);
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent session', () => {
      const result = manager.recordResponse('nonexistent', 100, 50);
      expect(result).toBe(false);
    });
  });

  describe('endSession', () => {
    it('should end session', () => {
      const session = manager.createSession({ initialLocation: 'foyer' });
      
      const result = manager.endSession(session.id);
      
      expect(result).toBe(true);
      expect(session.endedAt).toBeDefined();
    });

    it('should return false for non-existent session', () => {
      const result = manager.endSession('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getActiveSessions', () => {
    it('should return only active sessions', () => {
      const session1 = manager.createSession({ initialLocation: 'foyer' });
      const session2 = manager.createSession({ initialLocation: 'kitchen' });
      manager.endSession(session2.id);
      
      const active = manager.getActiveSessions();
      
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(session1.id);
    });
  });

  describe('getSessionStats', () => {
    it('should return session statistics', () => {
      manager.createSession({ initialLocation: 'foyer' });
      manager.createSession({ initialLocation: 'kitchen' });
      manager.createSession({ initialLocation: 'garden' });
      
      const stats = manager.getSessionStats();
      
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(3);
    });
  });

  describe('cleanup', () => {
    it('should remove ended sessions', () => {
      const session1 = manager.createSession({ initialLocation: 'foyer' });
      const session2 = manager.createSession({ initialLocation: 'kitchen' });
      manager.endSession(session1.id);
      
      manager.cleanup();
      
      expect(manager.getSession(session1.id)).toBeUndefined();
      expect(manager.getSession(session2.id)).toBeDefined();
    });
  });
});

// ============================================================================
// Session Tests
// ============================================================================

describe('Session', () => {
  describe('State Machine', () => {
    it('should start in active state', () => {
      const session = new Session({
        id: 'test-id',
        location: 'start',
        modelPriority: 'balanced'
      });
      
      expect(session.state).toBe(SessionState.ACTIVE);
    });

    it('should transition to ended state', () => {
      const session = new Session({
        id: 'test-id',
        location: 'start',
        modelPriority: 'balanced'
      });
      
      session.end();
      
      expect(session.state).toBe(SessionState.ENDED);
    });

    it('should track choices made', () => {
      const session = new Session({
        id: 'test-id',
        location: 'start',
        modelPriority: 'balanced'
      });
      
      session.recordChoice({
        id: 'choice1',
        text: 'Test choice',
        location: 'start',
        destination: 'next'
      }, {
        success: true,
        response: 'Response',
        locationChange: true
      });
      
      expect(session.choicesMade).toBe(1);
    });

    it('should track response metrics', () => {
      const session = new Session({
        id: 'test-id',
        location: 'start',
        modelPriority: 'balanced'
      });
      
      session.recordResponse(100, 50);
      
      expect(session.totalWordsGenerated).toBe(100);
      expect(session.totalResponseTime).toBe(50);
    });
  });
});

// ============================================================================
// Choice Tests
// ============================================================================

describe('Choice', () => {
  it('should create a valid choice', () => {
    const choice: Choice = {
      id: 'enter_room',
      text: 'Enter the room',
      location: 'foyer',
      destination: 'living_room',
      metadata: {
        tone: 'neutral',
        urgency: 'low'
      }
    };
    
    expect(choice.id).toBe('enter_room');
    expect(choice.text).toBe('Enter the room');
    expect(choice.location).toBe('foyer');
    expect(choice.destination).toBe('living_room');
  });

  it('should support optional metadata', () => {
    const choice: Choice = {
      id: 'test',
      text: 'Test',
      location: 'start',
      destination: 'end'
    };
    
    expect(choice.metadata).toBeUndefined();
  });
});

// ============================================================================
// NarrativeContext Tests
// ============================================================================

describe('NarrativeContext', () => {
  it('should create context with required fields', () => {
    const context: NarrativeContext = {
      initialLocation: 'foyer',
      modelPriority: 'balanced',
      enableVoice: true,
      enableVisual: true
    };
    
    expect(context.initialLocation).toBe('foyer');
    expect(context.modelPriority).toBe('balanced');
  });

  it('should support all model priority options', () => {
    const balanced: NarrativeContext = { initialLocation: 'start', modelPriority: 'balanced' };
    const quality: NarrativeContext = { initialLocation: 'start', modelPriority: 'quality' };
    const speed: NarrativeContext = { initialLocation: 'start', modelPriority: 'speed' };
    
    expect(balanced.modelPriority).toBe('balanced');
    expect(quality.modelPriority).toBe('quality');
    expect(speed.modelPriority).toBe('speed');
  });
});

// ============================================================================
// SessionEventEmitter Tests
// ============================================================================

describe('SessionEventEmitter', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  it('should emit session:created event', async () => {
    const handler = vi.fn();
    manager.on('session:created', handler);
    
    manager.createSession({ initialLocation: 'start' });
    
    await Promise.resolve();
    expect(handler).toHaveBeenCalled();
  });

  it('should emit session:ended event', async () => {
    const handler = vi.fn();
    manager.on('session:ended', handler);
    
    const session = manager.createSession({ initialLocation: 'start' });
    manager.endSession(session.id);
    
    await Promise.resolve();
    expect(handler).toHaveBeenCalled();
  });

  it('should emit choice:made event', async () => {
    const handler = vi.fn();
    manager.on('choice:made', handler);
    
    const session = manager.createSession({ initialLocation: 'foyer' });
    manager.recordChoice(session.id, {
      id: 'test',
      text: 'Test',
      location: 'foyer',
      destination: 'kitchen'
    }, {
      success: true,
      response: 'Response',
      locationChange: true
    });
    
    await Promise.resolve();
    expect(handler).toHaveBeenCalled();
  });
});
