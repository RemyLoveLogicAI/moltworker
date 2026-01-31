/**
 * Omnichannel Adapter for Platform-Agnostic Experience
 * LoveLogicAI MCP Ecosystem - Cross-Channel Narrative Delivery
 */

import type { 
  ChannelType, 
  ChannelConfig, 
  ChannelRoutingRule,
  OmnichannelConfig,
  NarrativeSession 
} from './types';

// Channel adapter interfaces
export interface ChannelAdapter {
  type: ChannelType;
  send(message: ChannelMessage): Promise<ChannelResponse>;
  receive(sessionId: string): Promise<ChannelInput>;
  startSession(session: NarrativeSession): Promise<void>;
  endSession(sessionId: string): Promise<void>;
  getCapabilities(): string[];
}

export interface ChannelMessage {
  type: 'text' | 'voice' | 'visual' | 'hybrid';
  content: string | VoiceData | VisualData;
  sessionId: string;
  personaId?: string;
  emotion?: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelResponse {
  success: boolean;
  messageId?: string;
  channel: ChannelType;
  deliveryTime: number;
  error?: string;
}

export interface ChannelInput {
  type: 'text' | 'voice' | 'choice';
  content: string;
  sessionId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface VoiceData {
  audioUrl: string;
  duration: number;
  format: string;
}

export interface VisualData {
  imageUrl: string;
  altText: string;
  animation?: boolean;
}

// Channel adapter implementations
export class TextChannelAdapter implements ChannelAdapter {
  type: ChannelType = 'text';

  async send(message: ChannelMessage): Promise<ChannelResponse> {
    const startTime = Date.now();
    
    try {
      // In production, integrate with actual text channel (web, SMS, etc.)
      console.log(`[Text] Sending to session ${message.sessionId}:`, message.content);
      
      return {
        success: true,
        messageId: `text_${Date.now()}`,
        channel: 'text',
        deliveryTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        channel: 'text',
        deliveryTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async receive(sessionId: string): Promise<ChannelInput> {
    // In production, poll/receive from actual channel
    return {
      type: 'text',
      content: '',
      sessionId,
      timestamp: Date.now()
    };
  }

  async startSession(session: NarrativeSession): Promise<void> {
    console.log(`[Text] Starting session ${session.id} for player ${session.playerId}`);
  }

  async endSession(sessionId: string): Promise<void> {
    console.log(`[Text] Ending session ${sessionId}`);
  }

  getCapabilities(): string[] {
    return ['text', 'choices', 'inline_media', 'buttons'];
  }
}

export class VoiceChannelAdapter implements ChannelAdapter {
  type: ChannelType = 'voice';

  async send(message: ChannelMessage): Promise<ChannelResponse> {
    const startTime = Date.now();
    
    try {
      if (message.type === 'voice' && typeof message.content !== 'string') {
        const voiceData = message.content as VoiceData;
        console.log(`[Voice] Sending audio to session ${message.sessionId}:`, voiceData.audioUrl);
      } else {
        // TTS synthesis would happen here
        console.log(`[Voice] TTS for session ${message.sessionId}:`, message.content);
      }
      
      return {
        success: true,
        messageId: `voice_${Date.now()}`,
        channel: 'voice',
        deliveryTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        channel: 'voice',
        deliveryTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async receive(sessionId: string): Promise<ChannelInput> {
    // In production, receive from voice channel (STT)
    return {
      type: 'voice',
      content: '',
      sessionId,
      timestamp: Date.now()
    };
  }

  async startSession(session: NarrativeSession): Promise<void> {
    console.log(`[Voice] Starting voice session ${session.id}`);
  }

  async endSession(sessionId: string): Promise<void> {
    console.log(`[Voice] Ending voice session ${sessionId}`);
  }

  getCapabilities(): string[] {
    return ['tts', 'stt', 'voice_emotion', 'voice_speed'];
  }
}

export class VisualChannelAdapter implements ChannelAdapter {
  type: ChannelType = 'visual';

  async send(message: ChannelMessage): Promise<ChannelResponse> {
    const startTime = Date.now();
    
    try {
      if (message.type === 'visual' && typeof message.content !== 'string') {
        const visualData = message.content as VisualData;
        console.log(`[Visual] Sending image to session ${message.sessionId}:`, visualData.imageUrl);
      } else if (message.type === 'text') {
        console.log(`[Visual] Sending text to session ${message.sessionId}:`, message.content);
      }
      
      return {
        success: true,
        messageId: `visual_${Date.now()}`,
        channel: 'visual',
        deliveryTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        channel: 'visual',
        deliveryTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async receive(sessionId: string): Promise<ChannelInput> {
    return {
      type: 'text',
      content: '',
      sessionId,
      timestamp: Date.now()
    };
  }

  async startSession(session: NarrativeSession): Promise<void> {
    console.log(`[Visual] Starting visual session ${session.id}`);
  }

  async endSession(sessionId: string): Promise<void> {
    console.log(`[Visual] Ending visual session ${sessionId}`);
  }

  getCapabilities(): string[] {
    return ['images', 'animations', 'scene_render', 'character_portraits'];
  }
}

export class HybridChannelAdapter implements ChannelAdapter {
  type: ChannelType = 'hybrid';
  private textAdapter = new TextChannelAdapter();
  private voiceAdapter = new VoiceChannelAdapter();
  private visualAdapter = new VisualChannelAdapter();

  async send(message: ChannelMessage): Promise<ChannelResponse> {
    const startTime = Date.now();
    
    try {
      // Send to all channels in parallel
      const results = await Promise.all([
        this.textAdapter.send(message),
        this.voiceAdapter.send(message),
        this.visualAdapter.send(message)
      ]);

      const allSuccessful = results.every(r => r.success);
      
      return {
        success: allSuccessful,
        messageId: `hybrid_${Date.now()}`,
        channel: 'hybrid',
        deliveryTime: Date.now() - startTime,
        error: allSuccessful ? undefined : 'Some channels failed'
      };
    } catch (error) {
      return {
        success: false,
        channel: 'hybrid',
        deliveryTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async receive(sessionId: string): Promise<ChannelInput> {
    // Check all channels for input
    const [text, voice] = await Promise.all([
      this.textAdapter.receive(sessionId),
      this.voiceAdapter.receive(sessionId)
    ]);

    // Return first non-empty input
    return text.content ? text : voice;
  }

  async startSession(session: NarrativeSession): Promise<void> {
    await Promise.all([
      this.textAdapter.startSession(session),
      this.voiceAdapter.startSession(session),
      this.visualAdapter.startSession(session)
    ]);
  }

  async endSession(sessionId: string): Promise<void> {
    await Promise.all([
      this.textAdapter.endSession(sessionId),
      this.voiceAdapter.endSession(sessionId),
      this.visualAdapter.endSession(sessionId)
    ]);
  }

  getCapabilities(): string[] {
    return [
      ...this.textAdapter.getCapabilities(),
      ...this.voiceAdapter.getCapabilities(),
      ...this.visualAdapter.getCapabilities()
    ];
  }
}

/**
 * Omnichannel Router - Routes messages to appropriate channels
 */
export class OmnichannelRouter {
  private config: OmnichannelConfig;
  private adapters: Map<ChannelType, ChannelAdapter>;
  private activeSessions: Map<string, ChannelType>;

  constructor(config?: Partial<OmnichannelConfig>) {
    this.config = {
      channels: [
        { type: 'text', enabled: true, adapter: 'text', settings: {}, capabilities: [] },
        { type: 'voice', enabled: true, adapter: 'voice', settings: {}, capabilities: [] },
        { type: 'visual', enabled: true, adapter: 'visual', settings: {}, capabilities: [] },
        { type: 'hybrid', enabled: true, adapter: 'hybrid', settings: {}, capabilities: [] }
      ],
      defaultChannel: 'text',
      channelRouting: [],
      fallbackChain: ['text', 'voice'],
      ...config
    };

    this.adapters = new Map();
    this.activeSessions = new Map();
    this.initializeAdapters();
  }

  /**
   * Initialize channel adapters
   */
  private initializeAdapters(): void {
    this.adapters.set('text', new TextChannelAdapter());
    this.adapters.set('voice', new VoiceChannelAdapter());
    this.adapters.set('visual', new VisualChannelAdapter());
    this.adapters.set('hybrid', new HybridChannelAdapter());
  }

  /**
   * Get adapter for channel type
   */
  getAdapter(channel: ChannelType): ChannelAdapter | undefined {
    return this.adapters.get(channel);
  }

  /**
   * Route message to appropriate channel
   */
  async routeMessage(
    message: ChannelMessage,
    preferredChannel?: ChannelType
  ): Promise<ChannelResponse> {
    const channel = preferredChannel || this.getSessionChannel(message.sessionId) || this.config.defaultChannel;
    const adapter = this.adapters.get(channel);

    if (!adapter) {
      return {
        success: false,
        channel: channel,
        deliveryTime: 0,
        error: 'No adapter available for channel'
      };
    }

    return adapter.send(message);
  }

  /**
   * Get channel for session
   */
  private getSessionChannel(sessionId: string): ChannelType | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Set channel for session
   */
  setSessionChannel(sessionId: string, channel: ChannelType): void {
    this.activeSessions.set(sessionId, channel);
  }

  /**
   * Start session on channel
   */
  async startSession(session: NarrativeSession): Promise<void> {
    const channel = session.channel;
    const adapter = this.adapters.get(channel);

    if (adapter) {
      await adapter.startSession(session);
      this.activeSessions.set(session.id, channel);
    }
  }

  /**
   * End session on channel
   */
  async endSession(sessionId: string): Promise<void> {
    const channel = this.activeSessions.get(sessionId);
    if (channel) {
      const adapter = this.adapters.get(channel);
      if (adapter) {
        await adapter.endSession(sessionId);
      }
      this.activeSessions.delete(sessionId);
    }
  }

  /**
   * Switch channel for session
   */
  async switchChannel(sessionId: string, newChannel: ChannelType): Promise<void> {
    await this.endSession(sessionId);
    this.activeSessions.set(sessionId, newChannel);
    
    const adapter = this.adapters.get(newChannel);
    if (adapter) {
      // Would need actual session object here
      console.log(`[Omnichannel] Switched session ${sessionId} to ${newChannel}`);
    }
  }

  /**
   * Get all capabilities
   */
  getAllCapabilities(): Record<ChannelType, string[]> {
    const capabilities: Record<ChannelType, string[]> = {
      text: [],
      voice: [],
      visual: [],
      hybrid: []
    };

    for (const [type, adapter] of this.adapters) {
      capabilities[type] = adapter.getCapabilities();
    }

    return capabilities;
  }

  /**
   * Get channel status
   */
  getChannelStatus(): Record<ChannelType, boolean> {
    const status: Record<ChannelType, boolean> = {
      text: true,
      voice: true,
      visual: true,
      hybrid: true
    };

    return status;
  }
}

// Export singleton instance
export const omnichannelRouter = new OmnichannelRouter();
