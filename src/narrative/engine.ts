/**
 * Narrative Engine - Game Master AI
 * LoveLogicAI MCP Ecosystem - Interactive Storytelling Orchestration
 */

import type {
  NarrativeSession,
  NarrativeState,
  NarrativeContext,
  StoryChoice,
  ChannelType,
  Persona,
  VoiceProfile,
  EmotionalTone,
  ModelConfig
} from './types';
import { sessionManager } from './session';
import { modelManager } from './model-integration';
import { personaManager } from './persona';
import { omnichannelRouter, ChannelMessage } from './omnichannel';

// Story node definition
export interface StoryNode {
  id: string;
  type: 'scene' | 'dialogue' | 'choice' | 'event' | 'branch';
  content: string;
  voiceProfileId?: string;
  emotionalTone: string;
  choices: StoryChoice[];
  nextNodes?: Record<string, string>;
  conditions?: Array<{ type: string; value: unknown }>;
  metadata?: Record<string, unknown>;
}

// Story definition
export interface Story {
  id: string;
  title: string;
  description: string;
  genre: string[];
  startingNode: string;
  nodes: Record<string, StoryNode>;
  personas: Record<string, Partial<Persona>>;
  metadata: {
    estimatedDuration: number;
    maturityLevel: 'general' | 'teen' | 'mature' | 'adult';
    branchingFactor: number;
    saveSlots: number;
  };
}

export class NarrativeEngine {
  private stories: Map<string, Story>;
  private activeSessions: Map<string, NarrativeSession>;
  private cache: Map<string, { data: unknown; expiresAt: number }>;

  constructor() {
    this.stories = new Map();
    this.activeSessions = new Map();
    this.cache = new Map();
  }

  /**
   * Register a story
   */
  registerStory(story: Story): void {
    this.stories.set(story.id, story);
  }

  /**
   * Get story by ID
   */
  getStory(storyId: string): Story | undefined {
    return this.stories.get(storyId);
  }

  /**
   * Start a new narrative session
   */
  async startSession(
    storyId: string,
    playerId: string,
    channel: ChannelType = 'text',
    playerVariables?: Record<string, unknown>
  ): Promise<{ session: NarrativeSession; initialContent: string } | null> {
    const story = this.stories.get(storyId);
    if (!story) {
      console.error(`Story ${storyId} not found`);
      return null;
    }

    // Create personas from story definition
    const personas: Record<string, Persona> = {};
    for (const [personaId, template] of Object.entries(story.personas || {})) {
      const persona = personaManager.createPersona(personaId, template);
      personas[personaId] = persona;
    }

    // Create session
    const session = sessionManager.createSession(
      storyId,
      playerId,
      channel,
      story.startingNode,
      personas
    );

    // Apply player variables
    if (playerVariables) {
      for (const [key, value] of Object.entries(playerVariables)) {
        sessionManager.setVariable(session.id, key, value);
      }
    }

    // Start channel session
    await omnichannelRouter.startSession(session);

    // Get initial content
    const node = story.nodes[story.startingNode];
    const content = await this.renderNode(session, node);

    this.activeSessions.set(session.id, session);

    return { session, initialContent: content };
  }

  /**
   * Process player input and advance story
   */
  async processInput(
    sessionId: string,
    input: string,
    inputType: 'text' | 'voice' | 'choice' = 'text'
  ): Promise<{ 
    response: string; 
    choices?: StoryChoice[];
    voiceData?: VoiceProfile;
    session: NarrativeSession;
  } | null> {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return null;
    }

    const story = this.stories.get(session.storyId);
    if (!story) {
      console.error(`Story ${session.storyId} not found`);
      return null;
    }

    // Handle choice selection
    if (inputType === 'choice') {
      const result = sessionManager.makeChoice(sessionId, input);
      if (!result.session) {
        return null;
      }
      
      const nextNode = story.nodes[result.nextNode!];
      if (!nextNode) {
        return { response: 'The story has reached its end.', choices: [], session: result.session };
      }

      const content = await this.renderNode(result.session, nextNode);
      
      return {
        response: content,
        choices: nextNode.choices,
        session: result.session
      };
    }

    // Handle text/voice input - generate response using Game Master
    const currentNode = story.nodes[session.state.currentNode];
    
    // Use model to generate contextual response
    const response = await this.generateResponse(
      session,
      input,
      currentNode
    );

    // Update session
    sessionManager.updateState(sessionId, { lastActionAt: Date.now() });
    sessionManager.addPlaytime(sessionId, 1000); // Add 1 second playtime

    return {
      response,
      choices: currentNode.choices,
      session: sessionManager.getSession(sessionId)!
    };
  }

  /**
   * Render a story node
   */
  private async renderNode(
    session: NarrativeSession,
    node: StoryNode
  ): Promise<string> {
    // Check cache first
    const cacheKey = `${session.storyId}_${node.id}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as string;
    }

    // Get speaker persona
    const speakerId = node.metadata?.speaker as string | undefined;
    let content = node.content;

    if (speakerId && session.personas[speakerId]) {
      // Apply persona personality to content
      const persona = session.personas[speakerId];
      content = await this.applyPersonaVoice(session.id, speakerId, content);
    }

    // Cache the rendered content (expires in 5 minutes)
    this.cache.set(cacheKey, {
      data: content,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    return content;
  }

  /**
   * Apply persona voice and emotion to text
   */
  private async applyPersonaVoice(
    sessionId: string,
    personaId: string,
    text: string
  ): Promise<string> {
    const session = sessionManager.getSession(sessionId);
    if (!session) return text;

    const emotionalTone = session.state.emotionalTone.primary;
    
    const { text: modifiedText, voiceParams } = await personaManager.generateDialogue(
      personaId,
      text,
      emotionalTone,
      session.context.worldState as Record<string, unknown>
    );

    return modifiedText;
  }

  /**
   * Generate contextual response using Game Master AI
   */
  private async generateResponse(
    session: NarrativeSession,
    playerInput: string,
    currentNode: StoryNode
  ): Promise<string> {
    // Get best model for creative writing
    const model = modelManager.getBestModel('story_generation');
    
    if (!model) {
      return this.getFallbackResponse(playerInput, currentNode);
    }

    // Build context for the model
    const context = this.buildModelContext(session, currentNode, playerInput);

    try {
      // In production, call actual model API
      // For now, return contextual response based on state
      return this.generateContextualResponse(session, playerInput, currentNode);
    } catch (error) {
      console.error('Model generation failed:', error);
      modelManager.reportFailure(model.id);
      return this.getFallbackResponse(playerInput, currentNode);
    }
  }

  /**
   * Build context for model
   */
  private buildModelContext(
    session: NarrativeSession,
    node: StoryNode,
    playerInput: string
  ): string {
    const story = this.stories.get(session.storyId);
    
    return `
Story: ${story?.title || 'Untitled'}
Genre: ${story?.genre.join(', ') || 'General'}
Current Scene: ${node.id}
Emotional Tone: ${session.state.emotionalTone.primary} (${session.state.emotionalTone.intensity * 100}%)
Tension Level: ${session.state.tensionLevel}%

Player Input: ${playerInput}

World State:
- Location: ${session.context.worldState.location}
- Time: ${session.context.worldState.timeOfDay}
- Active Characters: ${session.context.worldState.activeCharacters.join(', ')}

Recent Events: ${session.context.worldState.recentEvents.slice(-3).join(' → ')}

Variables: ${JSON.stringify(session.state.variables)}
`;
  }

  /**
   * Generate contextual response based on story state
   */
  private generateContextualResponse(
    session: NarrativeSession,
    playerInput: string,
    node: StoryNode
  ): string {
    const emotion = session.state.emotionalTone.primary;
    const tension = session.state.tensionLevel;

    // Generate response based on emotional context - UNCENSORED
    if (emotion === 'romantic' || emotion === 'loving' || emotion === 'desirous' || emotion === 'intimate') {
      return `Your words warm my heart... ${this.generateRomanticResponse(playerInput, emotion)}`;
    }
    
    if (emotion === 'sensual' || emotion === 'passionate') {
      return `I feel so drawn to you... ${this.generateSensualResponse(playerInput)}`;
    }
    
    if (emotion === 'tense' || tension > 70) {
      return `The air is thick with tension. ${this.generateTenseResponse(playerInput)}`;
    }
    
    if (emotion === 'mysterious' || emotion === 'cryptic') {
      return `Ah, you seek answers... ${this.generateMysteriousResponse(playerInput)}`;
    }

    if (emotion === 'fierce' || emotion === 'ruthless') {
      return `${this.generateFierceResponse(playerInput)}`;
    }

    if (emotion === 'seductive' || emotion === 'dangerous') {
      return `${this.generateSeductiveResponse(playerInput, emotion)}`;
    }

    if (emotion === 'terrifying' || emotion === 'menacing') {
      return `${this.generateHorrorResponse(playerInput, emotion)}`;
    }

    // Default response - UNCENSORED
    return this.generateDefaultResponse(playerInput, node);
  }

  private generateRomanticResponse(input: string, emotion: string): string {
    const responses = [
      "I feel the same way... more than words can express.",
      "You've captured my heart completely.",
      "Every moment with you is everything to me.",
      "My heart beats faster when I'm near you.",
      "I want to be closer to you...",
      "Being with you feels like coming home.",
      "You're all I think about.",
      "I crave your touch..."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateSensualResponse(input: string): string {
    const responses = [
      "I can't stop thinking about you...",
      "Your presence consumes me.",
      "I want to lose myself in you.",
      "The way you look at me makes my heart race.",
      "There's something between us that can't be denied.",
      "I've never felt this way before..."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateTenseResponse(input: string): string {
    const responses = [
      "We need to be careful...",
      "I sense danger nearby.",
      "Stay alert. Something's not right.",
      "This could change everything..."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateMysteriousResponse(input: string): string {
    const responses = [
      "The answer lies deeper than you know...",
      "Not everything is as it seems... there's more to this story.",
      "I've seen this before, long ago...",
      "The truth has many layers, and you're only seeing one.",
      "What you seek may not be what you find.",
      "Some secrets are better left buried... but not all."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateFierceResponse(input: string): string {
    const responses = [
      "I've faced worse and survived. This is nothing.",
      "You think you can stop me? You don't know who you're dealing with.",
      "I'll tear through anything that stands in my way.",
      "Fear is for the weak. I don't know the meaning of the word.",
      "This ends now. No more games.",
      "I'm coming for you, and there's nowhere to hide."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateSeductiveResponse(input: string, emotion: string): string {
    const responses = [
      "You intrigue me... I think I'll keep you around.",
      "Careful, darling. Not everything that glitters is gold.",
      "I could help you... but it will cost you.",
      "You're in my world now. Play by my rules.",
      "I find you... fascinating. Don't disappoint me.",
      "Trust is a luxury neither of us can afford."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateHorrorResponse(input: string, emotion: string): string {
    const responses = [
      "You cannot escape... you are mine now.",
      "I've been waiting so long for fresh meat.",
      "The darkness welcomes you... as it welcomes all.",
      "Your fear... it tastes so sweet.",
      "There is no light here. Only me.",
      "You should not have come here... now you belong to the void."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateDefaultResponse(input: string, node: StoryNode): string {
    if (node.type === 'dialogue') {
      return node.content;
    }
    
    const responses = [
      "I understand. What would you like to do next?",
      "Interesting... tell me more. I want to hear everything.",
      "Your actions have consequences. Choose wisely... or don't.",
      "The story continues... what path will you take?",
      "I'm listening. Tell me your darkest desires...",
      "The night is young, and anything is possible.",
      "What happens next is entirely up to you.",
      "The forbidden path calls to you, doesn't it?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getFallbackResponse(input: string, node: StoryNode): string {
    return node.content || "The story continues. What will you do?";
  }

  /**
   * Deliver content to channel
   */
  async deliverContent(
    sessionId: string,
    content: string,
    choices?: StoryChoice[],
    voiceProfileId?: string,
    emotion?: string
  ): Promise<void> {
    const session = sessionManager.getSession(sessionId);
    if (!session) return;

    const message: ChannelMessage = {
      type: session.channel === 'voice' ? 'voice' : 'text',
      content,
      sessionId,
      personaId: voiceProfileId,
      emotion,
      metadata: {
        choices: choices?.map(c => ({ id: c.id, text: c.text })),
        timestamp: Date.now()
      }
    };

    await omnichannelRouter.routeMessage(message);
  }

  /**
   * Save game state
   */
  async saveGame(sessionId: string, description: string): Promise<string | null> {
    const savePoint = sessionManager.createSavePoint(sessionId, description);
    
    if (savePoint) {
      // Persist to storage (R2, D1, etc.)
      const sessionData = sessionManager.exportSession(sessionId);
      console.log(`Game saved: ${savePoint.id} - ${description}`);
      return savePoint.id;
    }
    
    return null;
  }

  /**
   * Load game from save point
   */
  async loadGame(sessionId: string, savePointId: string): Promise<boolean> {
    const session = sessionManager.loadSavePoint(sessionId, savePointId);
    return session !== null;
  }

  /**
   * End session
   */
  async endSession(sessionId: string): Promise<void> {
    const session = sessionManager.getSession(sessionId);
    if (session) {
      await omnichannelRouter.endSession(sessionId);
      sessionManager.deleteSession(sessionId);
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Trigger game master action
   */
  async triggerEvent(
    sessionId: string,
    eventType: string,
    parameters?: Record<string, unknown>
  ): Promise<void> {
    const session = sessionManager.getSession(sessionId);
    if (!session) return;

    switch (eventType) {
      case 'increase_tension':
        sessionManager.updateState(sessionId, {
          tensionLevel: Math.min(100, session.state.tensionLevel + 20)
        });
        break;
      
      case 'decrease_tension':
        sessionManager.updateState(sessionId, {
          tensionLevel: Math.max(0, session.state.tensionLevel - 20)
        });
        break;
      
      case 'set_emotion':
        if (parameters?.emotion) {
          sessionManager.setEmotionalTone(sessionId, {
            primary: parameters.emotion as string,
            intensity: (parameters.intensity as number) || 0.5,
            transitions: []
          });
        }
        break;
      
      case 'add_variable':
        if (parameters?.key && parameters?.value !== undefined) {
          sessionManager.setVariable(sessionId, parameters.key as string, parameters.value);
        }
        break;
      
      case 'unlock_achievement':
        if (parameters?.achievement) {
          // Would update achievements
          console.log(`Achievement unlocked: ${parameters.achievement}`);
        }
        break;
    }
  }

  /**
   * Get session statistics
   */
  getStats(): {
    activeSessions: number;
    registeredStories: number;
    cacheSize: number;
  } {
    return {
      activeSessions: this.activeSessions.size,
      registeredStories: this.stories.size,
      cacheSize: this.cache.size
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const narrativeEngine = new NarrativeEngine();

// Example story registration
export function registerExampleStory(): Story {
  const story: Story = {
    id: 'mystery_manor',
    title: 'The Mystery of Blackwood Manor',
    description: 'An interactive mystery adventure where you uncover dark secrets.',
    genre: ['mystery', 'gothic', 'adventure'],
    startingNode: 'entrance',
    nodes: {
      entrance: {
        id: 'entrance',
        type: 'scene',
        content: 'You stand before Blackwood Manor. The Gothic spires pierce a stormy sky. A chill runs down your spine as you approach the massive oak doors.',
        emotionalTone: 'mysterious',
        choices: [
          { id: 'enter', text: 'Enter through the front door', targetNode: 'foyer' },
          { id: 'explore', text: 'Explore the gardens first', targetNode: 'gardens' }
        ]
      },
      foyer: {
        id: 'foyer',
        type: 'scene',
        content: 'The grand foyer is dimly lit. Dust motes dance in the pale light. A figure emerges from the shadows...',
        emotionalTone: 'tense',
        choices: [
          { id: 'speak', text: 'Speak to the mysterious figure', targetNode: 'introduction' },
          { id: 'search', text: 'Search the room', targetNode: 'foyer_search' }
        ]
      },
      gardens: {
        id: 'gardens',
        type: 'scene',
        content: 'The overgrown gardens hold secrets buried beneath withered roses. Something glimmers near the old well.',
        emotionalTone: 'mysterious',
        choices: [
          { id: 'well', text: 'Investigate the well', targetNode: 'well_discovery' },
          { id: 'manor', text: 'Head to the manor', targetNode: 'entrance' }
        ]
      }
    },
    personas: {
      butler: {
        name: 'Jeeves',
        role: 'npc',
        backstory: 'Loyal servant of Blackwood family for 40 years.',
        uncensored: false
      }
    },
    metadata: {
      estimatedDuration: 60,
      maturityLevel: 'teen',
      branchingFactor: 3,
      saveSlots: 5
    }
  };

  narrativeEngine.registerStory(story);
  return story;
}
