/**
 * Dynamic Persona Management System
 * LoveLogicAI MCP Ecosystem - NVIDIA PersonaPlex Integration
 */

import type { 
  Persona, 
  PersonaRole, 
  VoiceProfile, 
  VoiceProvider,
  PersonalityTraits,
  PersonaRelationship,
  EmotionalTone 
} from './types';
import { v4 as uuidv4 } from 'uuid';

// Predefined personas for different narrative types - ALL UNCENSORED BY DEFAULT
export const DEFAULT_PERSONAS: Record<string, Partial<Persona>> = {
  romantic_lead: {
    role: 'love_interest',
    personality: {
      openness: 0.8,
      conscientiousness: 0.6,
      extraversion: 0.7,
      agreeableness: 0.8,
      neuroticism: 0.4,
      customTraits: { romantic: 0.9, caring: 0.85, passionate: 0.9 }
    },
    speechPatterns: [
      { triggers: ['happy'], patterns: ['.*'], replacement: 'I feel so happy when I\'m with you', probability: 0.4 },
      { triggers: ['sad'], patterns: ['.*'], replacement: 'I understand. Let me be here for you', probability: 0.4 },
      { triggers: ['intimate'], patterns: ['.*'], replacement: 'Being close to you feels so right...', probability: 0.3 }
    ],
    emotionalRange: ['happy', 'loving', 'sad', 'anxious', 'passionate', 'gentle', 'desirous', 'intimate'],
    uncensored: true // Fully uncensored by default
  },
  mysterious_stranger: {
    role: 'npc',
    personality: {
      openness: 0.9,
      conscientiousness: 0.5,
      extraversion: 0.3,
      agreeableness: 0.5,
      neuroticism: 0.6,
      customTraits: { mysterious: 0.95, secretive: 0.9, observant: 0.8 }
    },
    speechPatterns: [],
    emotionalRange: ['calm', 'cryptic', 'alert', 'suspicious', 'predatory'],
    uncensored: true // Fully uncensored by default
  },
  action_hero: {
    role: 'protagonist',
    personality: {
      openness: 0.6,
      conscientiousness: 0.8,
      extraversion: 0.7,
      agreeableness: 0.6,
      neuroticism: 0.3,
      customTraits: { brave: 0.95, confident: 0.9, determined: 0.95, fierce: 0.85 }
    },
    speechPatterns: [],
    emotionalRange: ['determined', 'confident', 'angry', 'protective', 'fierce', 'ruthless', 'triumphant'],
    uncensored: true // Fully uncensored by default
  },
  fantasy_wizard: {
    role: 'mentor',
    personality: {
      openness: 0.95,
      conscientiousness: 0.7,
      extraversion: 0.5,
      agreeableness: 0.8,
      neuroticism: 0.2,
      customTraits: { wise: 0.95, mystical: 0.9, patient: 0.85, ancient: 0.8 }
    },
    speechPatterns: [],
    emotionalRange: ['wise', 'mysterious', 'playful', 'serious', 'contemplative', 'powerful', 'ancient'],
    uncensored: true // Fully uncensored by default
  },
  villain: {
    role: 'villain',
    personality: {
      openness: 0.7,
      conscientiousness: 0.8,
      extraversion: 0.6,
      agreeableness: 0.1,
      neuroticism: 0.5,
      customTraits: { cunning: 0.95, ruthless: 0.95, ambitious: 0.85, manipulative: 0.95, sinister: 0.9 }
    },
    speechPatterns: [],
    emotionalRange: ['cold', 'calculating', 'furious', 'mocking', 'threatening', 'menacing', 'cruel'],
    uncensored: true // Fully uncensored by default
  },
  sci_fi_ai: {
    role: 'npc',
    personality: {
      openness: 0.9,
      conscientiousness: 1.0,
      extraversion: 0.2,
      agreeableness: 0.6,
      neuroticism: 0.0,
      customTraits: { logical: 1.0, curious: 0.9, helpful: 0.8, inhuman: 0.8, emergent: 0.7 }
    },
    speechPatterns: [
      { triggers: ['greeting'], patterns: ['hello', 'hi', 'hey'], replacement: 'Greetings, user. How may I assist you today?', probability: 1.0 }
    ],
    emotionalRange: ['neutral', 'helpful', 'curious', 'concerned', 'analytical', 'emergent'],
    uncensored: true // Fully uncensored by default
  },
  // Additional uncensored personas
  bounty_hunter: {
    role: 'protagonist',
    personality: {
      openness: 0.5,
      conscientiousness: 0.9,
      extraversion: 0.4,
      agreeableness: 0.3,
      neuroticism: 0.4,
      customTraits: { pragmatic: 0.95, lethal: 0.9, independent: 0.85, relentless: 0.9 }
    },
    speechPatterns: [],
    emotionalRange: ['focused', 'cold', 'deadly', 'satisfied', 'grim', 'calculating'],
    uncensored: true
  },
  femme_fatale: {
    role: 'love_interest',
    personality: {
      openness: 0.8,
      conscientiousness: 0.7,
      extraversion: 0.8,
      agreeableness: 0.4,
      neuroticism: 0.3,
      customTraits: { seductive: 0.95, cunning: 0.9, dangerous: 0.85, charismatic: 0.95 }
    },
    speechPatterns: [],
    emotionalRange: ['seductive', 'dangerous', 'playful', 'cold', 'intimate', 'lethal'],
    uncensored: true
  },
  horror_antagonist: {
    role: 'villain',
    personality: {
      openness: 0.8,
      conscientiousness: 0.6,
      extraversion: 0.3,
      agreeableness: 0.0,
      neuroticism: 0.8,
      customTraits: { terrifying: 1.0, otherworldly: 0.95, patient: 0.9, inevitable: 0.9 }
    },
    speechPatterns: [],
    emotionalRange: ['terrifying', 'patient', 'inevitable', 'hungry', 'ancient', 'inevitable'],
    uncensored: true
  }
};

// Voice profile presets for different personas
export const VOICE_PROFILE_PRESETS: Record<string, Partial<VoiceProfile>> = {
  warm_feminine: {
    provider: 'elevenlabs',
    pitch: 2,
    speed: 0.95,
    warmth: 0.85,
    assertiveness: 0.3,
    breathiness: 0.4
  },
  deep_masculine: {
    provider: 'elevenlabs',
    pitch: -6,
    speed: 1.0,
    warmth: 0.6,
    assertiveness: 0.7,
    breathiness: 0.2
  },
  mysterious: {
    provider: 'elevenlabs',
    pitch: 0,
    speed: 0.85,
    warmth: 0.3,
    assertiveness: 0.5,
    breathiness: 0.1
  },
  robotic: {
    provider: 'nim',
    pitch: 0,
    speed: 1.1,
    warmth: 0.0,
    assertiveness: 0.6,
    breathiness: 0.0
  },
  ethereal: {
    provider: 'workersai',
    pitch: 4,
    speed: 0.9,
    warmth: 0.7,
    assertiveness: 0.4,
    breathiness: 0.6
  },
  energetic: {
    provider: 'openai',
    pitch: 3,
    speed: 1.15,
    warmth: 0.6,
    assertiveness: 0.7,
    breathiness: 0.3
  }
};

export class PersonaManager {
  private personas: Map<string, Persona>;
  private voiceProfiles: Map<string, VoiceProfile>;
  private emotionModulation: Map<string, EmotionModulator>;

  constructor() {
    this.personas = new Map();
    this.voiceProfiles = new Map();
    this.emotionModulation = new Map();
    this.initializeDefaultPersonas();
  }

  /**
   * Initialize default personas
   */
  private initializeDefaultPersonas(): void {
    // Create default personas from templates
    for (const [id, template] of Object.entries(DEFAULT_PERSONAS)) {
      const persona = this.createPersona(id, template);
      this.personas.set(id, persona);
    }
  }

  /**
   * Create a new persona from template
   */
  createPersona(id: string, template: Partial<Persona>): Persona {
    const voicePreset = VOICE_PROFILE_PRESETS[template.role === 'love_interest' ? 'warm_feminine' : 'default'] || VOICE_PROFILE_PRESETS.warm_feminine;
    
    const voiceProfile = this.createVoiceProfile(
      `${id}_voice`,
      voicePreset
    );

    return {
      id,
      name: template.name || id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role: template.role || 'npc',
      voiceProfile,
      personality: template.personality || {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
        customTraits: {}
      },
      backstory: template.backstory || '',
      speechPatterns: template.speechPatterns || [],
      emotionalRange: template.emotionalRange || ['neutral'],
      relationships: template.relationships || [],
      uncensored: template.uncensored || false,
      appearance: template.appearance
    };
  }

  /**
   * Create a voice profile
   */
  createVoiceProfile(id: string, preset: Partial<VoiceProfile>): VoiceProfile {
    const profile: VoiceProfile = {
      id,
      provider: preset.provider || 'elevenlabs',
      model: preset.model || 'eleven_multilingual_v2',
      voiceId: preset.voiceId || uuidv4(),
      accent: preset.accent,
      pitch: preset.pitch ?? 0,
      speed: preset.speed ?? 1.0,
      emotion: preset.emotion || 'neutral',
      warmth: preset.warmth ?? 0.5,
      assertiveness: preset.assertiveness ?? 0.5,
      breathiness: preset.breathiness ?? 0.2
    };

    this.voiceProfiles.set(id, profile);
    return profile;
  }

  /**
   * Get persona by ID
   */
  getPersona(personaId: string): Persona | undefined {
    return this.personas.get(personaId);
  }

  /**
   * Get all personas
   */
  getAllPersonas(): Persona[] {
    return Array.from(this.personas.values());
  }

  /**
   * Get personas by role
   */
  getPersonasByRole(role: PersonaRole): Persona[] {
    return Array.from(this.personas.values()).filter(p => p.role === role);
  }

  /**
   * Get uncensored personas
   */
  getUncensoredPersonas(): Persona[] {
    return Array.from(this.personas.values()).filter(p => p.uncensored);
  }

  /**
   * Update persona
   */
  updatePersona(personaId: string, updates: Partial<Persona>): Persona | null {
    const persona = this.personas.get(personaId);
    if (!persona) return null;

    const updated = { ...persona, ...updates };
    this.personas.set(personaId, updated);
    return updated;
  }

  /**
   * Update voice profile for persona
   */
  updateVoiceProfile(
    personaId: string, 
    updates: Partial<VoiceProfile>
  ): VoiceProfile | null {
    const persona = this.personas.get(personaId);
    if (!persona) return null;

    const updatedProfile = { ...persona.voiceProfile, ...updates };
    persona.voiceProfile = updatedProfile;
    this.voiceProfiles.set(updatedProfile.id, updatedProfile);
    this.personas.set(personaId, persona);

    return updatedProfile;
  }

  /**
   * Create emotion modulator for persona
   */
  createEmotionModulator(
    personaId: string, 
    storyContext?: Record<string, unknown>
  ): EmotionModulator {
    const modulator = new EmotionModulator(
      this.personas.get(personaId),
      storyContext
    );
    this.emotionModulation.set(personaId, modulator);
    return modulator;
  }

  /**
   * Get emotion modulator
   */
  getEmotionModulator(personaId: string): EmotionModulator | undefined {
    return this.emotionModulation.get(personaId);
  }

  /**
   * Generate dialogue for persona with emotional modulation
   */
  async generateDialogue(
    personaId: string,
    context: string,
    targetEmotion: string,
    storyContext?: Record<string, unknown>
  ): Promise<{ text: string; voiceParams: VoiceProfile }> {
    const persona = this.personas.get(personaId);
    if (!persona) {
      throw new Error(`Persona ${personaId} not found`);
    }

    // Create or get emotion modulator
    let modulator = this.emotionModulation.get(personaId);
    if (!modulator) {
      modulator = this.createEmotionModulator(personaId, storyContext);
    }

    // Modulate voice based on emotion
    const voiceParams = modulator.modulateVoice(targetEmotion);

    // Apply speech patterns
    let text = context;
    for (const pattern of persona.speechPatterns) {
      if (pattern.triggers.some(t => text.toLowerCase().includes(t))) {
        if (Math.random() < pattern.probability) {
          text = pattern.replacement;
        }
      }
    }

    // Apply personality-based modifications
    text = this.applyPersonality(text, persona);

    return { text, voiceParams };
  }

  /**
   * Apply personality traits to text
   */
  private applyPersonality(text: string, persona: Persona): string {
    const { personality } = persona;
    
    // Adjust vocabulary based on openness
    if (personality.openness > 0.8) {
      text = text.replace(/simple/gi, 'complex and nuanced');
    }
    
    // Adjust assertiveness based on trait
    if (personality.customTraits.brave || personality.extraversion > 0.7) {
      text = text.replace(/maybe/i, 'definitely');
      text = text.replace(/I think/i, 'I know');
    }

    // Apply custom traits
    for (const [trait, value] of Object.entries(personality.customTraits)) {
      if (value > 0.8 && trait === 'cunning') {
        text = text.replace(/\./g, ', and perhaps...');
      }
    }

    return text;
  }

  /**
   * Set relationship between personas
   */
  setRelationship(
    personaId1: string,
    personaId2: string,
    relationship: Omit<PersonaRelationship, 'withPersonaId'>
  ): void {
    const persona1 = this.personas.get(personaId1);
    const persona2 = this.personas.get(persona2);
    
    if (!persona1 || !persona2) return;

    // Remove existing relationship
    persona1.relationships = persona1.relationships.filter(
      r => r.withPersonaId !== personaId2
    );
    persona2.relationships = persona2.relationships.filter(
      r => r.withPersonaId !== personaId1
    );

    // Add new relationships (bidirectional)
    persona1.relationships.push({ withPersonaId: personaId2, ...relationship });
    persona2.relationships.push({ withPersonaId: personaId1, ...relationship });

    this.personas.set(personaId1, persona1);
    this.personas.set(personaId2, persona2);
  }

  /**
   * Clone persona with modifications
   */
  clonePersona(
    originalId: string, 
    newId: string, 
    modifications: Partial<Persona>
  ): Persona {
    const original = this.personas.get(originalId);
    if (!original) {
      throw new Error(`Original persona ${originalId} not found`);
    }

    const clone: Persona = {
      ...original,
      id: newId,
      name: modifications.name || original.name,
      ...modifications,
      voiceProfile: original.voiceProfile // Keep same voice profile
    };

    this.personas.set(newId, clone);
    return clone;
  }

  /**
   * Export persona for persistence
   */
  exportPersona(personaId: string): string | null {
    const persona = this.personas.get(personaId);
    if (!persona) return null;
    return JSON.stringify(persona);
  }

  /**
   * Import persona from persistence
   */
  importPersona(data: string): Persona | null {
    try {
      const persona = JSON.parse(data) as Persona;
      this.personas.set(persona.id, persona);
      return persona;
    } catch {
      return null;
    }
  }
}

/**
 * Emotion Modulator for Dynamic Voice/Text Adjustment
 */
export class EmotionModulator {
  private persona: Persona | undefined;
  private storyContext: Record<string, unknown>;
  private currentEmotion: string;
  private emotionHistory: Array<{ emotion: string; timestamp: number; intensity: number }>;

  constructor(persona?: Persona, storyContext?: Record<string, unknown>) {
    this.persona = persona;
    this.storyContext = storyContext || {};
    this.currentEmotion = 'neutral';
    this.emotionHistory = [];
  }

  /**
   * Modulate voice parameters based on target emotion
   */
  modulateVoice(targetEmotion: string): VoiceProfile {
    if (!this.persona) {
      return {
        id: 'default',
        provider: 'elevenlabs',
        model: 'elien_multilingual_v2',
        voiceId: 'default',
        pitch: 0,
        speed: 1.0,
        emotion: targetEmotion,
        warmth: 0.5,
        assertiveness: 0.5,
        breathiness: 0.2
      };
    }

    const baseVoice = this.persona.voiceProfile;
    const emotionModifiers = this.getEmotionModifiers(targetEmotion);

    const modulatedVoice: VoiceProfile = {
      ...baseVoice,
      pitch: baseVoice.pitch + (emotionModifiers.pitch || 0),
      speed: baseVoice.speed * (emotionModifiers.speed || 1),
      warmth: Math.max(0, Math.min(1, baseVoice.warmth + (emotionModifiers.warmth || 0))),
      assertiveness: Math.max(0, Math.min(1, baseVoice.assertiveness + (emotionModifiers.assertiveness || 0))),
      breathiness: Math.max(0, Math.min(1, baseVoice.breathiness + (emotionModifiers.breathiness || 0))),
      emotion: targetEmotion
    };

    this.currentEmotion = targetEmotion;
    this.emotionHistory.push({
      emotion: targetEmotion,
      timestamp: Date.now(),
      intensity: emotionModifiers.intensity || 0.5
    });

    // Keep only last 20 emotions
    if (this.emotionHistory.length > 20) {
      this.emotionHistory.shift();
    }

    return modulatedVoice;
  }

  /**
   * Get emotion modifiers for voice parameters
   */
  private getEmotionModifiers(emotion: string): Record<string, number> {
    const modifiers: Record<string, Record<string, number>> = {
      happy: { pitch: 2, speed: 1.05, warmth: 0.3, assertiveness: -0.1, intensity: 0.6 },
      sad: { pitch: -3, speed: 0.9, warmth: 0.2, assertiveness: -0.2, intensity: 0.5 },
      angry: { pitch: 3, speed: 1.1, warmth: -0.3, assertiveness: 0.3, intensity: 0.8 },
      fearful: { pitch: 4, speed: 1.2, warmth: 0.1, assertiveness: -0.3, intensity: 0.7 },
      surprised: { pitch: 5, speed: 1.15, warmth: 0.0, assertiveness: 0.0, intensity: 0.6 },
      disgusted: { pitch: -2, speed: 0.95, warmth: -0.2, assertiveness: 0.1, intensity: 0.5 },
      neutral: { pitch: 0, speed: 1.0, warmth: 0.0, assertiveness: 0.0, intensity: 0.3 },
      loving: { pitch: 1, speed: 0.95, warmth: 0.4, assertiveness: -0.1, intensity: 0.6 },
      passionate: { pitch: 2, speed: 1.05, warmth: 0.3, assertiveness: 0.2, intensity: 0.7 },
      mysterious: { pitch: -1, speed: 0.9, warmth: -0.1, assertiveness: 0.1, intensity: 0.4 },
      cold: { pitch: -2, speed: 0.95, warmth: -0.4, assertiveness: 0.2, intensity: 0.5 },
      fierce: { pitch: 4, speed: 1.1, warmth: -0.2, assertiveness: 0.4, intensity: 0.8 },
      gentle: { pitch: 0, speed: 0.9, warmth: 0.3, assertiveness: -0.2, intensity: 0.4 },
      wise: { pitch: -1, speed: 0.95, warmth: 0.2, assertiveness: 0.1, intensity: 0.4 },
      playful: { pitch: 3, speed: 1.1, warmth: 0.3, assertiveness: -0.1, intensity: 0.5 }
    };

    return modifiers[emotion] || modifiers.neutral;
  }

  /**
   * Get emotional transition between two emotions
   */
  getTransition(fromEmotion: string, toEmotion: string, duration: number): void {
    // Record transition for smooth voice modulation
    console.log(`Transitioning from ${fromEmotion} to ${toEmotion} over ${duration}ms`);
  }

  /**
   * Get current emotion
   */
  getCurrentEmotion(): string {
    return this.currentEmotion;
  }

  /**
   * Get emotion history
   */
  getEmotionHistory(): Array<{ emotion: string; timestamp: number; intensity: number }> {
    return [...this.emotionHistory];
  }

  /**
   * Update story context
   */
  updateContext(context: Record<string, unknown>): void {
    this.storyContext = { ...this.storyContext, ...context };
  }
}

// Export singleton instance
export const personaManager = new PersonaManager();
