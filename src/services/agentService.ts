import axios from 'axios';
import { UserService } from './userService';
import { agentPromptService } from '../services/agentPromptService';
import { agents } from '../data/agents';
import jwt from 'jsonwebtoken';
interface MicrosoftTTSParams {
  vendor: "microsoft";
  params: {
    key: string;
    region: string;
    voice_name: string;
  }
}

interface ElevenLabsTTSParams {
  vendor: "elevenlabs";
  params: {
    key: string;
    model_id: string;
    voice_id: string;
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
    speed?: number;
    adjust_volume?: number;
  }
}

type TTSParams = MicrosoftTTSParams | ElevenLabsTTSParams;

interface StartAgentConfig {
  channelName: string;
  agentRTCUid: string;
  token: string;
  userId: number;
  ttsVendor?: "microsoft" | "elevenlabs";
  languageCode?: string;
  agentId: string;
}

interface AgentProperties {
  channel: string;
  token: string;
  agent_rtc_uid: string;
  remote_rtc_uids: string[];
  enable_string_uid: boolean;
  idle_timeout: number;
  llm: {
    url: string;
    api_key: string;
    system_messages: Array<{
      role: string;
      content: string;
    }>;
    greeting_message: string;
    failure_message: string;
    max_history: number;
    params: {
      model: string;
      appId?: string;
      userId?: string;
    };
  };
  asr: {
    language: string;
  };
  tts: TTSParams;
}

interface AgentResponse {
  agent_id: string;
  create_ts: number;
  status: string;
}

class AgentService {
  private readonly baseUrl: string;
  private readonly appId: string;
  private readonly customerId: string;
  private readonly customerSecret: string;
  private readonly heartbeatMap: Map<string, { lastHeartbeat: number, secondsRemaining: number, userId: number }>;
  private readonly HEARTBEAT_TIMEOUT = 20000; // 10 seconds
  heartbeatInterval: NodeJS.Timeout;

  constructor() {
    this.appId = process.env.AGORA_APP_ID || '';
    this.customerId = process.env.AGORA_CUSTOMER_ID || '';
    this.customerSecret = process.env.AGORA_CUSTOMER_SECRET || '';
    this.baseUrl = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${this.appId}`;
    this.heartbeatMap = new Map();

    // Start heartbeat check interval
    this.heartbeatInterval = setInterval(() => this.checkHeartbeats(), 5000); // Check every 5 seconds
  }

  private getAuthHeader(): string {
    const plainCredential = `${this.customerId}:${this.customerSecret}`;
    const encodedCredential = Buffer.from(plainCredential).toString('base64');
    return `Basic ${encodedCredential}`;
  }

  private getHeaders() {
    return {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json'
      }
    }
  }

  private getTTSConfig(ttsVendor: "microsoft" | "elevenlabs" = "elevenlabs", voiceId?: string): TTSParams {
    return ttsVendor === "microsoft"
      ? {
        vendor: "microsoft",
        params: {
          key: process.env.AZURE_TTS_KEY || "",
          region: process.env.AZURE_TTS_REGION || "eastus",
          voice_name: "en-US-AndrewMultilingualNeural"
        }
      }
      : {
        vendor: "elevenlabs",
        params: {
          key: process.env.ELEVENLABS_API_KEY || "",
          model_id: "eleven_flash_v2_5",
          voice_id: voiceId || "21m00Tcm4TlvDq8ikWAM",
          stability: 1,
          similarity_boost: 0.75,
          // use_speaker_boost: true,
          // FIX: Fix this later with configs
          adjust_volume: voiceId === 'tJ2B69tloiOhZn8Gk9Lp' ? 3000 : 1000
        }
      };
  }

  private getAgentProperties(config: StartAgentConfig): AgentProperties {
     
    let { channelName, agentRTCUid: agentUid, token, ttsVendor = "elevenlabs", languageCode: language = "en-US" } = config;
    const agentDetails = agents.find(agent => agent.id === config.agentId);
    if (!agentDetails) {
      throw new Error(`Agent ${config.agentId} not found`);
    }

    const voiceId = agentDetails?.voiceId;
    let systemPrompt = agentPromptService.generateSystemPrompt(config.agentId, language);
    let introduction = agentPromptService.generateIntroduction(config.agentId, language);
    let llmEndPoint = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
    let llmApiKey = process.env.OPENAI_API_KEY || "";
    
    if(agentDetails.isCustomLLM){
    llmEndPoint = process.env.CUSTOM_LLM_ENDPOINT || "";
      llmApiKey = jwt.sign({
        appId: this.appId,
        userId: config.userId.toString()
      }, process.env.JWT_SECRET || "");
    }

    const ttsConfig: AgentProperties["tts"] = this.getTTSConfig(ttsVendor, voiceId);
 
    return {
      channel: channelName,
      token: token,
      agent_rtc_uid: agentUid,
      remote_rtc_uids: ["*"], // use req user id as remote uid
      enable_string_uid: false,
      idle_timeout: 120,
      llm: {
        url: llmEndPoint,
        api_key: llmApiKey,
        system_messages: [
          {
            role: "system",
            content: systemPrompt || "You are a helpful casual conversational AI."
          }
        ],
        greeting_message: introduction || "Hello, how can I help you?",
        failure_message: "Sorry, I don't know how to answer this question.",
        max_history: 10,
        params: {
          model: "gpt-4o-mini"
        }
      },
      asr: {
        language
      },
      tts: ttsConfig
    };
  }

  async startAgent(config: StartAgentConfig): Promise<AgentResponse> {
    try {
      const user = await UserService.getUserById(config.userId);

      if (user?.remainingMinutes && user.remainingMinutes <= 0) {
        UserService.updateUser(Number(config.userId), { convoAgentId: "" });
        return {
          status: "NO_MINUTES_REMAINING",
          agent_id: "",
          create_ts: 0
        }
      }

      if (user?.convoAgentId) {
        try {
          const status = await this.getAgentStatus(user.convoAgentId);
          if (status.status === 'active') {
            this.stopHeartbeat(user.convoAgentId);
          }
        } catch (error) {
          console.error('Error getting agent status', error?.message);
        }
      }

      const properties = this.getAgentProperties(config);
      const response = await axios.post(
        `${this.baseUrl}/join`,
        {
          name: `agent_${Date.now()}`,
          properties
        },
        this.getHeaders()
      );

      UserService.updateUser(Number(config.userId), { convoAgentId: response.data.agent_id });
      const secondsRemaining = user?.remainingMinutes || 0;
      if (secondsRemaining > 0) {
        this.startHeartbeat(response.data.agent_id, secondsRemaining, config.userId);
      }
      return response.data;
    } catch (error) {
      console.error('Error starting agent:', error?.message);
      throw new Error('Error starting agent: ' + error?.message);
    }
  }

  private async startHeartbeat(convoAgentId: string, secondsRemaining: number, userId: number): Promise<void> {
    // Initialize heartbeat timestamp
    this.heartbeatMap.set(convoAgentId, {
      lastHeartbeat: Date.now(),
      secondsRemaining,
      userId
    });
  }

  stopHeartbeat(convoAgentId: string): void {

    const heartbeat = this.heartbeatMap.get(convoAgentId);
    if (!heartbeat) {
      throw new Error(`Agent ${convoAgentId} not found`);
    }

    const { userId, secondsRemaining } = heartbeat;
    try {
      UserService.updateUser(userId, { convoAgentId: "", remainingMinutes: Math.floor(secondsRemaining) });
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
    }

    this.heartbeatMap.delete(convoAgentId);

    try {
      this.stopAgent(convoAgentId);
    } catch (error) {
      console.error(`Error stopping agent ${convoAgentId}:`, error);
    }
  }

  async updateHeartbeat(convoAgentId: string, userId: number): Promise<{ status: string, secondsRemaining: number }> {
    const heartbeat = this.heartbeatMap.get(convoAgentId);
    if (!heartbeat) {
      throw new Error(`Agent ${convoAgentId} not found`);
    }
    if (heartbeat.userId !== userId) {
      throw new Error(`Agent - User mismatch`);
    }
    const newTime = Date.now();
    const heartbeatDifference = newTime - heartbeat.lastHeartbeat;
    const newSecondsRemaining = heartbeat.secondsRemaining - (heartbeatDifference / 1000);

    this.heartbeatMap.set(convoAgentId, {
      lastHeartbeat: newTime,
      secondsRemaining: newSecondsRemaining,
      userId
    });

    if (newSecondsRemaining <= 0) {
      this.stopHeartbeat(convoAgentId);
      throw new Error(`Agent ${convoAgentId} timed out`);
    }
    return {
      status: "OK",
      secondsRemaining: newSecondsRemaining
    }
  }

  private async checkHeartbeats(): Promise<void> {

    for (const [convoAgentId, heartbeat] of this.heartbeatMap.entries()) {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - heartbeat.lastHeartbeat;

      if (timeSinceLastHeartbeat > this.HEARTBEAT_TIMEOUT) {
        console.log(`Agent ${convoAgentId} heartbeat timeout. Stopping agent...`);
        this.stopHeartbeat(convoAgentId);
      }
    }
  }

  async stopAgent(convoAgentId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/agents/${convoAgentId}/leave`,
        {},
        this.getHeaders()
      );
      // Remove from heartbeat map when stopping
      this.heartbeatMap.delete(convoAgentId);
    } catch (error) {
      console.error('Error stopping agent:', error);
      throw error;
    }
  }

  async getAgentStatus(agentId: string): Promise<AgentResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/agents/${agentId}`,
        this.getHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error getting agent status:', error?.message);
      throw new Error('Error getting agent status: ' + error?.message);
    }
  }

  // async listAgents(): Promise<any> {
  //   try {
  //     const response = await axios.get(
  //       `${this.baseUrl}/agents`,
  //       this.getHeaders()
  //     );
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error listing agents:', error);
  //     throw error;
  //   }
  // }
}

export const agentService = new AgentService(); 