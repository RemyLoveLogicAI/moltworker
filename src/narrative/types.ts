/**
 * Extended MCP Protocol Types for Interactive Narrative Experiences
 * LoveLogicAI MCP Ecosystem - Interactive Game Flows & Omnichannel Support
 */

// ============================================================================
// Core Narrative Types
// ============================================================================

export interface NarrativeSession {
  id: string;
  storyId: string;
  playerId: string;
  channel: ChannelType;
  state: NarrativeState;
  context: NarrativeContext;
  personas: PersonaMap;
  createdAt: number;
  updatedAt: number;
  metadata: SessionMetadata;
}

export type ChannelType = 'text' | 'voice' | 'visual' | 'hybrid';

export interface NarrativeState {
  currentNode: string;
  storyPath: string[];
  choices: StoryChoice[];
  variables: Record<string, unknown>;
  emotionalTone: EmotionalTone;
  pacing: StoryPacing;
  tensionLevel: number; // 0-100
  lastActionAt: number;
}

export interface NarrativeContext {
  worldState: WorldState;
  characterStates: Map<string, CharacterState>;
  plotProgression: number; // 0-100
  activeThreads: string[];
  completedMilestones: string[];
  foreshadowing: string[];
  playerPreferences: PlayerPreferences;
}

export interface StoryChoice {
  id: string;
  text: string;
  description?: string;
  targetNode: string;
  conditions?: ChoiceCondition[];
  consequences?: StoryConsequence[];
  emotionalImpact?: EmotionalImpact;
  voiceProfile?: string;
}

export interface ChoiceCondition {
  type: 'variable' | 'state' | 'time' | 'random' | 'custom';
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'exists';
  variable: string;
  value?: unknown;
}

export interface StoryConsequence {
  type: 'variable' | 'state' | 'branch' | 'event' | 'voice';
  target: string;
  value?: unknown;
  delay?: number;
}

export interface EmotionalTone {
  primary: string;
  secondary?: string;
  intensity: number; // 0-1
  transitions: EmotionalTransition[];
}

export interface EmotionalTransition {
  from: string;
  to: string;
  trigger: string;
  duration: number;
}

export type StoryPacing = 'slow' | 'moderate' | 'fast' | 'intense';

export interface WorldState {
  timeOfDay: string;
  location: string;
  weather?: string;
  activeCharacters: string[];
  recentEvents: string[];
  environmentalFactors: Record<string, unknown>;
}

export interface CharacterState {
  id: string;
  name: string;
  disposition: number; // -100 to 100
  relationship: string;
  emotionalState: string;
  knowledge: string[];
  secrets: string[];
  voiceProfile?: VoiceProfile;
}

export interface PlayerPreferences {
  preferredGenres: string[];
  matureContentAllowed: boolean;
  violenceLevel: 'none' | 'mild' | 'moderate' | 'intense';
  romanceLevel: 'none' | 'subtle' | 'moderate' | 'explicit';
  pacingPreference: StoryPacing;
  voiceSpeed: number;
  voiceStyle: string;
}

export interface SessionMetadata {
  totalPlaytime: number;
  sessionCount: number;
  savePoints: SavePoint[];
  achievements: string[];
  customFlags: Record<string, boolean>;
}

export interface SavePoint {
  id: string;
  nodeId: string;
  timestamp: number;
  description: string;
  thumbnail?: string;
}

// ============================================================================
// Persona Management Types
// ============================================================================

export interface PersonaMap {
  [characterId: string]: Persona;
}

export interface Persona {
  id: string;
  name: string;
  role: PersonaRole;
  voiceProfile: VoiceProfile;
  personality: PersonalityTraits;
  backstory: string;
  speechPatterns: SpeechPattern[];
  emotionalRange: string[];
  relationships: PersonaRelationship[];
  uncensored: boolean;
  appearance?: VisualDescription;
}

export type PersonaRole = 'protagonist' | 'antagonist' | 'npc' | 'ally' | 'love_interest' | 'mentor' | 'villain' | 'custom';

export interface VoiceProfile {
  id: string;
  provider: VoiceProvider;
  model: string;
  voiceId: string;
  accent?: string;
  pitch: number; // -12 to 12
  speed: number; // 0.5 to 2.0
  emotion: string;
  warmth: number; // 0-1
  assertiveness: number; // 0-1
  breathiness: number; // 0-1
}

export type VoiceProvider = 'elevenlabs' | 'workersai' | 'openai' | 'nim' | 'custom';

export interface PersonalityTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  customTraits: Record<string, number>;
}

export interface SpeechPattern {
  triggers: string[];
  patterns: string[];
  replacement: string;
  probability: number;
}

export interface PersonaRelationship {
  withPersonaId: string;
  type: 'friend' | 'enemy' | 'romantic' | 'family' | 'colleague' | 'rival';
  strength: number;
  dynamic: string;
}

export interface VisualDescription {
  race?: string;
  age?: string;
  build?: string;
  features: string[];
  clothing: string[];
  imagePrompt?: string;
}

// ============================================================================
// MCP Protocol Extensions for Interactive Narratives
// ============================================================================

export interface NarrativeMCPMessage {
  type: NarrativeMessageType;
  sessionId: string;
  timestamp: number;
  payload: NarrativePayload;
  channel: ChannelType;
}

export type NarrativeMessageType = 
  | 'story_start' 
  | 'story_continue' 
  | 'story_branch' 
  | 'story_choice' 
  | 'story_update'
  | 'voice_output'
  | 'voice_input'
  | 'visual_render'
  | 'state_save'
  | 'state_load'
  | 'persona_update'
  | 'emotion_modulate'
  | 'game_master_action';

export interface NarrativePayload {
  nodeId?: string;
  content?: string;
  choices?: StoryChoice[];
  voiceData?: VoiceData;
  visualData?: VisualData;
  stateDelta?: Partial<NarrativeState>;
  contextUpdates?: Partial<NarrativeContext>;
  personaId?: string;
  emotionTarget?: EmotionalTone;
  gmAction?: GameMasterAction;
}

export interface VoiceData {
  text: string;
  voiceProfileId: string;
  emotion: string;
  speed?: number;
  pitch?: number;
}

export interface VisualData {
  type: 'scene' | 'character' | 'item' | 'effect' | 'map';
  prompt: string;
  style?: string;
  animation?: boolean;
}

export interface GameMasterAction {
  type: 'narrative_insert' | 'character_appearance' | 'event_trigger' | 'world_change' | 'reveal';
  target: string;
  parameters: Record<string, unknown>;
}

// ============================================================================
// Model Integration Types
// ============================================================================

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  endpoint?: string;
  capabilities: ModelCapability[];
  contextWindow: number;
  maxOutput: number;
  quality: number; // 1-10
  speed: number; // 1-10
  censorshipLevel: number; // 0-10 (0 = unrestricted)
  costPerToken: number;
  rateLimitRpm: number;
}

export type ModelProvider = 'ollama' | 'fireworks' | 'deepgram' | 'nim' | 'openrouter' | 'custom';

export type ModelCapability = 'text' | 'voice' | 'vision' | 'reasoning' | 'coding' | 'creative' | 'uncensored';

export interface ModelRotationConfig {
  primaryModel: string;
  fallbackModels: string[];
  rotationStrategy: 'round_robin' | 'quality_based' | 'speed_based' | 'availability';
  healthCheckInterval: number;
  failureThreshold: number;
}

export interface ModelFallbackChain {
  requestType: 'story_generation' | 'dialogue' | 'voice_synthesis' | 'branching_logic' | 'world_building';
  chain: string[];
  currentIndex: number;
}

// ============================================================================
// Omnichannel Types
// ============================================================================

export interface OmnichannelConfig {
  channels: ChannelConfig[];
  defaultChannel: ChannelType;
  channelRouting: ChannelRoutingRule[];
  fallbackChain: ChannelType[];
}

export interface ChannelConfig {
  type: ChannelType;
  enabled: boolean;
  adapter: string;
  settings: Record<string, unknown>;
  capabilities: string[];
}

export interface ChannelRoutingRule {
  condition: string;
  routeTo: ChannelType;
  priority: number;
}

// ============================================================================
// Cache & Performance Types
// ============================================================================

export interface NarrativeCache {
  storySegments: CacheEntry<StorySegment>[];
  voiceGenerations: CacheEntry<VoiceGeneration>[];
  visualGenerations: CacheEntry<VisualGeneration>[];
  stateSnapshots: CacheEntry<NarrativeState>[];
}

export interface CacheEntry<T> {
  key: string;
  data: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface StorySegment {
  nodeId: string;
  content: string;
  voiceProfileId?: string;
  emotionalTone: EmotionalTone;
  hash: string;
}

export interface VoiceGeneration {
  text: string;
  voiceProfileId: string;
  emotion: string;
  audioData: string;
  hash: string;
}

export interface VisualGeneration {
  prompt: string;
  style: string;
  imageData: string;
  hash: string;
}
