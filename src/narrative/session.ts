/**
 * Stateful Session Management for Persistent Game Worlds
 * LoveLogicAI MCP Ecosystem - Narrative Session Handling
 */

import type { 
  NarrativeSession, 
  NarrativeState, 
  NarrativeContext, 
  StoryChoice,
  ChannelType,
  SavePoint,
  PersonaMap,
  EmotionalTone
} from './types';
import { v4 as uuidv4 } from 'uuid';

// In-memory session store (replace with Redis/Durable Objects in production)
const sessions = new Map<string, NarrativeSession>();
const sessionExpiry = new Map<string, number>();

const DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class SessionManager {
  private expiryMs: number;

  constructor(expiryMs: number = DEFAULT_EXPIRY_MS) {
    this.expiryMs = expiryMs;
    this.cleanupLoop();
  }

  /**
   * Create a new narrative session
   */
  createSession(
    storyId: string,
    playerId: string,
    channel: ChannelType = 'text',
    initialNode: string = 'start',
    personas: PersonaMap = {}
  ): NarrativeSession {
    const sessionId = uuidv4();
    const now = Date.now();

    const session: NarrativeSession = {
      id: sessionId,
      storyId,
      playerId,
      channel,
      state: {
        currentNode: initialNode,
        storyPath: [initialNode],
        choices: [],
        variables: {},
        emotionalTone: {
          primary: 'neutral',
          intensity: 0.5,
          transitions: []
        },
        pacing: 'moderate',
        tensionLevel: 0,
        lastActionAt: now
      },
      context: {
        worldState: {
          timeOfDay: 'day',
          location: 'unknown',
          activeCharacters: [],
          recentEvents: [],
          environmentalFactors: {}
        },
        characterStates: new Map(),
        plotProgression: 0,
        activeThreads: [],
        completedMilestones: [],
        foreshadowing: [],
        playerPreferences: {
          preferredGenres: [],
          matureContentAllowed: false,
          violenceLevel: 'none',
          romanceLevel: 'none',
          pacingPreference: 'moderate',
          voiceSpeed: 1.0,
          voiceStyle: 'natural'
        }
      },
      personas,
      createdAt: now,
      updatedAt: now,
      metadata: {
        totalPlaytime: 0,
        sessionCount: 1,
        savePoints: [],
        achievements: [],
        customFlags: {}
      }
    };

    sessions.set(sessionId, session);
    sessionExpiry.set(sessionId, now + this.expiryMs);

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): NarrativeSession | null {
    const session = sessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // Check expiry
    const expiry = sessionExpiry.get(sessionId);
    if (expiry && Date.now() > expiry) {
      this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session state
   */
  updateState(
    sessionId: string, 
    updates: Partial<NarrativeState>
  ): NarrativeSession | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    session.state = { ...session.state, ...updates };
    session.state.lastActionAt = Date.now();
    session.updatedAt = Date.now();

    // Track story path
    if (updates.currentNode && 
        updates.currentNode !== session.state.currentNode) {
      session.state.storyPath.push(updates.currentNode);
    }

    sessions.set(sessionId, session);
    return session;
  }

  /**
   * Update session context
   */
  updateContext(
    sessionId: string,
    updates: Partial<NarrativeContext>
  ): NarrativeSession | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    session.context = this.deepMerge(session.context, updates);
    session.updatedAt = Date.now();

    sessions.set(sessionId, session);
    return session;
  }

  /**
   * Set choices for current node
   */
  setChoices(sessionId: string, choices: StoryChoice[]): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.state.choices = choices;
    session.updatedAt = Date.now();
    sessions.set(sessionId, session);
  }

  /**
   * Make a choice and transition to next node
   */
  makeChoice(
    sessionId: string,
    choiceId: string
  ): { session: NarrativeSession | null; nextNode: string | null } {
    const session = this.getSession(sessionId);
    if (!session) return { session: null, nextNode: null };

    const choice = session.state.choices.find(c => c.id === choiceId);
    if (!choice) return { session: null, nextNode: null };

    // Apply consequences
    this.applyConsequences(session, choice);

    // Update state
    session.state.currentNode = choice.targetNode;
    session.state.storyPath.push(choice.targetNode);
    session.state.choices = [];

    // Update emotional tone based on choice
    if (choice.emotionalImpact) {
      session.state.emotionalTone.primary = choice.emotionalImpact.primary;
      session.state.emotionalTone.intensity = choice.emotionalImpact.intensity;
    }

    session.updatedAt = Date.now();
    sessions.set(sessionId, session);

    return { session, nextNode: choice.targetNode };
  }

  /**
   * Update emotional tone
   */
  setEmotionalTone(sessionId: string, tone: EmotionalTone): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.state.emotionalTone = tone;
    session.updatedAt = Date.now();
    sessions.set(sessionId, session);
  }

  /**
   * Set player variable
   */
  setVariable(sessionId: string, key: string, value: unknown): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.state.variables[key] = value;
    session.updatedAt = Date.now();
    sessions.set(sessionId, session);
  }

  /**
   * Get player variable
   */
  getVariable<T>(sessionId: string, key: string): T | undefined {
    const session = this.getSession(sessionId);
    if (!session) return undefined;

    return session.state.variables[key] as T;
  }

  /**
   * Check choice conditions
   */
  evaluateConditions(
    session: NarrativeSession,
    conditions: Array<{ type: string; operator: string; variable: string; value?: unknown }>
  ): boolean {
    return conditions.every(condition => {
      const actualValue = this.getValueFromSession(session, condition.variable);
      
      switch (condition.operator) {
        case 'eq': return actualValue === condition.value;
        case 'ne': return actualValue !== condition.value;
        case 'gt': return (actualValue as number) > (condition.value as number);
        case 'lt': return (actualValue as number) < (condition.value as number);
        case 'gte': return (actualValue as number) >= (condition.value as number);
        case 'lte': return (actualValue as number) <= (condition.value as number);
        case 'contains': return String(actualValue).includes(String(condition.value));
        case 'exists': return actualValue !== undefined;
        default: return true;
      }
    });
  }

  /**
   * Add a save point
   */
  createSavePoint(
    sessionId: string,
    description: string,
    thumbnail?: string
  ): SavePoint | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const savePoint: SavePoint = {
      id: uuidv4(),
      nodeId: session.state.currentNode,
      timestamp: Date.now(),
      description,
      thumbnail
    };

    session.metadata.savePoints.push(savePoint);
    session.updatedAt = Date.now();
    sessions.set(sessionId, session);

    return savePoint;
  }

  /**
   * Load from save point
   */
  loadSavePoint(sessionId: string, savePointId: string): NarrativeSession | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    const savePoint = session.metadata.savePoints.find(sp => sp.id === savePointId);
    if (!savePoint) return null;

    // In a real implementation, you'd restore full state from storage
    session.state.currentNode = savePoint.nodeId;
    session.updatedAt = Date.now();
    sessions.set(sessionId, session);

    return session;
  }

  /**
   * Update player preferences
   */
  updatePreferences(
    sessionId: string,
    preferences: Partial<NarrativeSession['context']['playerPreferences']>
  ): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.context.playerPreferences = {
      ...session.context.playerPreferences,
      ...preferences
    };
    session.updatedAt = Date.now();
    sessions.set(sessionId, session);
  }

  /**
   * Add session playtime
   */
  addPlaytime(sessionId: string, milliseconds: number): void {
    const session = this.getSession(sessionId);
    if (!session) return;

    session.metadata.totalPlaytime += milliseconds;
    session.updatedAt = Date.now();
    sessions.set(sessionId, session);
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): boolean {
    const deleted = sessions.delete(sessionId);
    sessionExpiry.delete(sessionId);
    return deleted;
  }

  /**
   * Get all sessions for a player
   */
  getPlayerSessions(playerId: string): NarrativeSession[] {
    const playerSessions: NarrativeSession[] = [];
    
    for (const session of sessions.values()) {
      if (session.playerId === playerId) {
        playerSessions.push(session);
      }
    }

    return playerSessions;
  }

  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    return sessions.size;
  }

  /**
   * Export session for persistence
   */
  exportSession(sessionId: string): string | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    // Convert Maps to Objects for JSON serialization
    const exportData = {
      ...session,
      context: {
        ...session.context,
        characterStates: Object.fromEntries(session.context.characterStates)
      }
    };

    return JSON.stringify(exportData);
  }

  /**
   * Import session from persistence
   */
  importSession(data: string): NarrativeSession | null {
    try {
      const parsed = JSON.parse(data) as NarrativeSession;
      
      // Restore Maps
      parsed.context.characterStates = new Map(Object.entries(parsed.context.characterStates));
      
      sessions.set(parsed.id, parsed);
      sessionExpiry.set(parsed.id, Date.now() + this.expiryMs);
      
      return parsed;
    } catch {
      return null;
    }
  }

  // Private helper methods

  private applyConsequences(
    session: NarrativeSession,
    choice: StoryChoice
  ): void {
    if (!choice.consequences) return;

    for (const consequence of choice.consequences) {
      switch (consequence.type) {
        case 'variable':
          session.state.variables[consequence.target] = consequence.value;
          break;
        case 'state':
          this.applyStateChange(session, consequence.target, consequence.value);
          break;
        case 'branch':
          session.state.storyPath.push(consequence.target);
          break;
        case 'event':
          session.context.activeThreads.push(consequence.target);
          break;
      }
    }
  }

  private applyStateChange(
    session: NarrativeSession,
    target: string,
    value: unknown
  ): void {
    const parts = target.split('.');
    if (parts.length === 1) {
      // Direct state property
      (session.state as Record<string, unknown>)[target] = value;
    } else if (parts[0] === 'context') {
      // Context property
      const contextKey = parts[1] as keyof NarrativeContext;
      const nestedKey = parts[2];
      if (nestedKey && typeof session.context[contextKey] === 'object') {
        (session.context[contextKey] as Record<string, unknown>)[nestedKey] = value;
      }
    }
  }

  private getValueFromSession(
    session: NarrativeSession,
    path: string
  ): unknown {
    const parts = path.split('.');
    let current: unknown = session.state.variables;

    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };
    
    for (const key of Object.keys(source)) {
      if (key in target && typeof target[key] === 'object' && typeof source[key] === 'object') {
        result[key] = this.deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>
        );
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  private cleanupLoop(): void {
    setInterval(() => {
      const now = Date.now();
      
      for (const [sessionId, expiry] of sessionExpiry.entries()) {
        if (now > expiry) {
          this.deleteSession(sessionId);
        }
      }
    }, 60 * 1000); // Run every minute
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
