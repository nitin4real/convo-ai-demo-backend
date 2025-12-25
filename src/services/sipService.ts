import axios from "axios";
import { tokenService } from "./tokenService";
import { agents } from "../data/agents";
import { agentPromptService } from "./agentPromptService";

const sip_auth = process.env.SIP_AUTH
const sip_url = process.env.SIP_URL || ""
const agora_pstn_endpoint = process.env.AGORA_PSTN_URL || ""
const sip_from_number = process.env.SIP_FROM_NUMBER || ""
const start_agent_lambda_url = process.env.START_AGENT_LAMBDA_URL || ""
const sip_manager_url = process.env.SIP_MANAGER_URL || ""
const sip_manager_project_id = process.env.AGORA_APP_ID || ""
const sip_manager_auth = process.env.SIP_MANAGER_AUTH || ""
const sip_vendor_id = process.env.SIP_VENDOR_ID || ""


export const startSIPCall_withAgent = async (channelName: string, uid: string, language: string = 'en-US', phoneNumber: string, agent_id: string): Promise<any> => {
    try {
        await startAgentUsingLambda(channelName, uid, language, agent_id);
        return await outboundSipCallWithAgent(channelName, uid, phoneNumber);
    } catch (error) {
        console.error('Error starting call', error?.message);
        throw error
    }
}

export const startSIPWithLC = async (channelName: string, uid: string, language: string = 'en-US', phoneNumber: string, agent_id: string): Promise<any> => {
    try {
        console.log('startSIPWithLC initialized', 'channelName', channelName, 'uid', uid, 'language', language, 'phoneNumber', phoneNumber, 'agent_id', agent_id);
        
        // Generate tokens for agent and SIP RTC UIDs
        const agentRtcUid = 111; // Agent RTC UID
        const sipRtcUid = 222; // SIP RTC UID
        const agentTokenData = tokenService.generateToken(channelName, agentRtcUid);
        const sipTokenData = tokenService.generateToken(channelName, sipRtcUid);
        
        // Construct the API URL
        const apiUrl = `${sip_manager_url}/${sip_manager_project_id}/call`;
        
        // Prepare request body
        const requestBody = {
            name: channelName,
            properties: {
                channel: channelName,
                token: agentTokenData.token,
                agent_rtc_uid: agentRtcUid.toString(),
                remote_rtc_uids: [`${sipRtcUid}`],
                llm: getAgentLLM(agent_id, language),
                asr: getAgentASR(agent_id),
                tts: getAgentTTS(agent_id),
            },
            sip: {
                to_number: phoneNumber,
                from_number: sip_from_number,
                rtc_uid: sipRtcUid.toString(),
                rtc_token: sipTokenData.token,
                enable_recording: false,
                timeout: 60,
                allowed_tools: ["*"]
            }
        };
        // console.log('requestBody', requestBody);
        
        // Make the API call
        const response = await axios.post(apiUrl, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${sip_manager_auth}`,
                'x-vendor-id': sip_vendor_id
            }
        });
        
        console.log('SIP Manager API response:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Error starting call', error?.message);
        throw error
    }
}

const startAgentUsingLambda = async (channelName: string, uid: string, language: string = 'en-US', agent_id: string ): Promise<string> => {
    console.log('startAgentUsingLambda initialized', 'channelName', channelName, 'uid', uid, 'language', language, 'service_provider', agent_id);
    const lambdaUrl = start_agent_lambda_url;
    const params = {
        pin: language === 'en-US' ? "123" : "321",
        channel_name: channelName,
        remote_uid: uid,
        agent_uid: "67371",
        enable_string_uid: "false",
        tts_provider: ""
    };

    if (agent_id === 'sip_customer_support_agent_outbound_multilingual') {
        params.tts_provider = 'cartesia'
        params.pin = language === 'en-US' ? '678' : '876'
    }

    try {
        const response = await axios.get(lambdaUrl, { params });
        console.log('Lambda response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error calling Lambda:', error);
        throw error;
    }
}

export const outboundSipCallWithAgent = async (channelName: string, uid: string, to_number: string): Promise<string> => {
    const tokenData = tokenService.generateToken(channelName, Number(uid));
    console.log('outboundSipCallWithAgent initialized', 'channelName', channelName, 'uid', uid, 'to_number', to_number);
    const response = await axios.post(agora_pstn_endpoint, {
        action: "outbound",
        appid: process.env.AGORA_APP_ID,
        region: "AREA_CODE_AS",
        uid: uid,
        channel: channelName,
        from: sip_from_number,
        to: to_number,
        regional_gateways: "true",
        prompt: "false",
        sip: sip_url,
        token: tokenData.token,
        webhook_url: "https://convo.agoraaidemo.in:3009/api/webhook/agora"
    }, {
        headers: {
            'Authorization': 'Basic ' + sip_auth,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
}



export const getAgentLLM = (agent_id: string, language: string = 'en-US') => {
    const agent = agents.find(a => a.id === agent_id);
    if (!agent) {
        throw new Error(`Agent with ID ${agent_id} not found`);
    }

    const systemPrompt = agentPromptService.generateSystemPrompt(agent_id, language);
    const greetingMessage = agentPromptService.generateIntroduction(agent_id, language);

    return {
        url: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions",
        api_key: process.env.GROQ_API_KEY || "",
        system_messages: [
            {
                role: "system",
                content: systemPrompt
            }
        ],
        max_history: 30,
        greeting_message: greetingMessage,
        failure_message: "Please hold on a second.",
        params: {
            model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
        }
    };
}

export const getAgentASR = (agent_id: string) => {
    return {
        vendor: "soniox",
        params: {
            api_key: process.env.SONIOX_API_KEY || "",
            language_hints: [
                "en",
                "hi",
                "ar",
                "ta"
            ]
        }
    };
}

export const getAgentTTS = (agent_id: string) => {
    const agent = agents.find(a => a.id === agent_id);
    if (!agent) {
        throw new Error(`Agent with ID ${agent_id} not found`);
    }

    const voiceId = agent.voiceId || "f786b574-daa5-4673-aa0c-cbe3e8534c02";

    return {
        vendor: "cartesia",
        params: {
            api_key: process.env.CARTESIA_API_KEY || "",
            model_id: "sonic-3",
            voice: {
                mode: "id",
                id: voiceId
            },
            output_format: {
                container: "raw",
                sample_rate: 16000
            },
            language: "en"
        }
    };
}