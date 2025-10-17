import axios from "axios";
import { tokenService } from "./tokenService";

const sip_auth = process.env.SIP_AUTH
const sip_url = process.env.SIP_URL || ""
const agora_pstn_endpoint = process.env.AGORA_PSTN_URL || ""
const sip_from_number = process.env.SIP_FROM_NUMBER || ""
const sip_to_number = process.env.SIP_TO_NUMBER || ""
const start_agent_lambda_url = process.env.START_AGENT_LAMBDA_URL || ""


export const startSIPCall_withAgent = async (channelName: string, uid: string, language: string = 'en-US'): Promise<void> => {
    try {
        await startAgentUsingLambda(channelName, uid, language);
        await outboundSipCallWithAgent(channelName, uid);
    } catch (error) {
        console.error('Error starting call', error?.message);
        throw error
    }
}

const startAgentUsingLambda = async (channelName: string, uid: string, language: string = 'en-US'): Promise<string> => {
    console.log('startAgentUsingLambda initialized', 'channelName', channelName, 'uid', uid, 'language', language);
    const lambdaUrl = start_agent_lambda_url;
    const params = {
        pin: language === 'en-US' ? "123" : "321",
        channel_name: channelName,
        remote_uid: uid,
        agent_uid: "67371",
        enable_string_uid: "false"
    };

    try {
        const response = await axios.get(lambdaUrl, { params });
        console.log('Lambda response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error calling Lambda:', error);
        throw error;
    }
}

export const outboundSipCallWithAgent = async (channelName: string, uid: string, to_number: string = sip_to_number): Promise<string> => {
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
        token: tokenData.token
    }, {
        headers: {
            'Authorization': 'Basic ' + sip_auth,
            'Content-Type': 'application/json'
        }
    });
    return response.data;
}
