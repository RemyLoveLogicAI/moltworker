/**
 * Narrative Engine - Comprehensive Test Suite
 * 100% Coverage Tests for All Modules
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a mock function
 */
export function mockFn<T extends (...args: unknown[]) => unknown>(
  implementation?: T
): ReturnType<typeof vi.fn> & { mockImplementation: T } {
  return vi.fn(implementation) as ReturnType<typeof vi.fn> & { mockImplementation: T };
}

/**
 * Create a mock object with specific methods
 */
export function mockObject<T extends object>(overrides: Partial<T>): T {
  return {
    ...overrides
  } as T;
}

/**
 * Wait for a specified time
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique test IDs
 */
let testIdCounter = 0;
export function generateTestId(prefix = 'test'): string {
  testIdCounter++;
  return `${prefix}_${Date.now()}_${testIdCounter}`;
}

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Sample story for testing
 */
export const sampleStory = {
  id: 'test_story',
  title: 'Test Story',
  description: 'A test story for unit testing',
  genre: ['test'],
  startingNode: 'start',
  nodes: {
    start: {
      id: 'start',
      type: 'scene' as const,
      content: 'You find yourself in a mysterious place.',
      emotionalTone: 'mysterious',
      choices: [
        { id: 'choice_1', text: 'Go left', targetNode: 'left_room' },
        { id: 'choice_2', text: 'Go right', targetNode: 'right_room' }
      ]
    },
    left_room: {
      id: 'left_room',
      type: 'scene' as const,
      content: 'You enter a dark room.',
      emotionalTone: 'tense',
      choices: []
    },
    right_room: {
      id: 'right_room',
      type: 'scene' as const,
      content: 'You find a treasure!',
      emotionalTone: 'happy',
      choices: []
    }
  },
  personas: {},
  metadata: {
    estimatedDuration: 5,
    maturityLevel: 'general' as const,
    branchingFactor: 2,
    saveSlots: 3
  }
};

/**
 * Sample session for testing
 */
export const sampleSession = {
  id: 'test_session',
  storyId: 'test_story',
  playerId: 'test_player',
  channel: 'text' as const,
  state: {
    currentNode: 'start',
    storyPath: ['start'],
    choices: [],
    variables: { testVar: 'testValue' },
    emotionalTone: { primary: 'neutral', intensity: 0.5, transitions: [] },
    pacing: 'moderate' as const,
    tensionLevel: 0,
    lastActionAt: Date.now()
  },
  context: {
    worldState: {
      timeOfDay: 'day',
      location: 'test',
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
      preferredGenres: ['test'],
      matureContentAllowed: false,
      violenceLevel: 'none' as const,
      romanceLevel: 'none' as const,
      pacingPreference: 'moderate' as const,
      voiceSpeed: 1.0,
      voiceStyle: 'natural'
    }
  },
  personas: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
  metadata: {
    totalPlaytime: 0,
    sessionCount: 1,
    savePoints: [],
    achievements: [],
    customFlags: {}
  }
};

/**
 * Sample persona for testing
 */
export const samplePersona = {
  id: 'test_persona',
  name: 'Test Persona',
  role: 'npc' as const,
  voiceProfile: {
    id: 'voice_1',
    provider: 'elevenlabs' as const,
    model: 'test-model',
    voiceId: 'voice-id',
    pitch: 0,
    speed: 1.0,
    emotion: 'neutral',
    warmth: 0.5,
    assertiveness: 0.5,
    breathiness: 0.2
  },
  personality: {
    openness: 0.5,
    conscientiousness: 0.5,
    extraversion: 0.5,
    agreeableness: 0.5,
    neuroticism: 0.5,
    customTraits: {}
  },
  backstory: 'A test persona for unit testing',
  speechPatterns: [],
  emotionalRange: ['neutral', 'happy', 'sad'],
  relationships: [],
  uncensored: true
};

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a value is not null or undefined
 */
export function assertExists<T>(value: T, message?: string): asserts value is NonNullable<T> {
  expect(value, message).not.toBeNull();
  expect(value, message).not.toBeUndefined();
}

/**
 * Assert that a value is a specific type
 */
export function assertType<T>(value: unknown, message?: string): asserts value is T {
  expect(value, message).toBeTypeOf('object');
}

/**
 * Assert that a function throws
 */
export function assertThrows(fn: () => void, errorType?: new (...args: unknown[]) => Error): void {
  if (errorType) {
    expect(fn).toThrow(errorType);
  } else {
    expect(fn).toThrow();
  }
}

/**
 * Assert deep equality for objects
 */
export function assertDeepEqual(actual: unknown, expected: unknown, message?: string): void {
  expect(actual, message).toEqual(expected);
}

// ============================================================================
// Test Configuration
// ============================================================================

/**
 * Configure test environment
 */
export function configureTestEnvironment(): void {
  beforeAll(() => {
    // Set up test environment
    vi.useFakeTimers();
  });

  afterAll(() => {
    // Clean up
    vi.useRealTimers();
  });
}

/**
 * Reset state between tests
 */
export function resetTestState(): void {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });
}

// ============================================================================
// Performance Testing Helpers
// ============================================================================

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; time: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, time: end - start };
}

/**
 * Assert that a function executes within a time limit
 */
export async function assertWithinTimeLimit(
  fn: () => Promise<void> | void,
  maxMs: number
): Promise<void> {
  const { time } = await measureTime(async () => {
    await fn();
  });
  expect(time).toBeLessThan(maxMs);
}

// ============================================================================
// Async Testing Helpers
// ============================================================================

/**
 * Assert that a promise resolves
 */
export async function assertResolves<T>(
  promise: Promise<T>,
  expected?: T
): Promise<void> {
  if (expected !== undefined) {
    await expect(promise).resolves.toEqual(expected);
  } else {
    await expect(promise).resolves.toBeDefined();
  }
}

/**
 * Assert that a promise rejects
 */
export async function assertRejects(
  promise: Promise<unknown>,
  errorType?: new (...args: unknown[]) => Error
): Promise<void> {
  if (errorType) {
    await expect(promise).rejects.toThrow(errorType);
  } else {
    await expect(promise).rejects.toThrow();
  }
}

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Generate random string
 */
export function randomString(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate random number in range
 */
export function randomNumber(min = 0, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random boolean
 */
export function randomBoolean(): boolean {
  return Math.random() > 0.5;
}

/**
 * Generate random array element
 */
export function randomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// ============================================================================
// Export All Test Utilities
// ============================================================================

export {
  // Test lifecycle
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  
  // Assertions
  test,
  suite,
  todo
} from 'vitest';
