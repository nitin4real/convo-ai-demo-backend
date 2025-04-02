import axios from 'axios';

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
  }
}

type TTSParams = MicrosoftTTSParams | ElevenLabsTTSParams;


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

  constructor() {
    this.appId = process.env.AGORA_APP_ID || '';
    this.customerId = process.env.AGORA_CUSTOMER_ID || '';
    this.customerSecret = process.env.AGORA_CUSTOMER_SECRET || '';
    this.baseUrl = `https://api.agora.io/api/conversational-ai-agent/v2/projects/${this.appId}`;
  }

  private getAuthHeader(): string {
    const plainCredential = `${this.customerId}:${this.customerSecret}`;
    const encodedCredential = Buffer.from(plainCredential).toString('base64');
    return `Basic ${encodedCredential}`;
  }

  private getTTSConfig(ttsVendor: "microsoft" | "elevenlabs" = "elevenlabs"): TTSParams {
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
            voice_id: "21m00Tcm4TlvDq8ikWAM"
          }
        };
  }

  async startAgent(channelName: string, agentUid: string, token: string, ttsVendor: "microsoft" | "elevenlabs" = "elevenlabs"): Promise<AgentResponse> {
    try {
      const ttsConfig: AgentProperties["tts"] = this.getTTSConfig(ttsVendor);

      const properties: AgentProperties = {
        channel: channelName,
        token: token,
        agent_rtc_uid: agentUid,
        remote_rtc_uids: ["*"], // use req user id as remote uid
        enable_string_uid: false,
        idle_timeout: 120,
        llm: {
          url: process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions",
          api_key: process.env.OPENAI_API_KEY || "",
          system_messages: [
            {
              role: "system",
              content: "You are a helpful chatbot."
            }
          ],
          greeting_message: "Hello, how can I help you?",
          failure_message: "Sorry, I don't know how to answer this question.",
          max_history: 10,
          params: {
            model: "gpt-4o-mini"
          }
        },
        asr: {
          language: "en-US"
        },
        tts: ttsConfig
      };

      const response = await axios.post(
        `${this.baseUrl}/join`,
        {
          name: `agent_${Date.now()}`,
          properties
        },
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error starting agent:', error);
      throw error;
    }
  }

  async stopAgent(agentId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/agents/${agentId}/leave`,
        {},
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Error stopping agent:', error);
      throw error;
    }
  }

  async getAgentStatus(agentId: string): Promise<AgentResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/agents/${agentId}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting agent status:', error);
      throw error;
    }
  }

  async listAgents(params?: {
    channel?: string;
    from_time?: number;
    to_time?: number;
    status?: string;
    limit?: number;
    cursor?: string;
  }): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/agents`,
        {
          params,
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error listing agents:', error);
      throw error;
    }
  }
}

export const agentService = new AgentService(); 