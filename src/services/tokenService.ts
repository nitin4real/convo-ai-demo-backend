import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from 'agora-token';
import { buildRtcAndRtmToken } from './agoraCombinedTokenBuilder';

const TOKEN_EXPIRATION_IN_SECONDS = 24 * 3600;

export class TokenService {
  private readonly appId: string;
  private readonly appCertificate: string;

  constructor() {
    this.appId = process.env.AGORA_APP_ID || '';
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE || '';
  }

  generateChannelName(agentId: string, uid: number): string {
    const timestamp = Date.now().toString(36); // Convert to base36 for shorter representation
    return `${agentId}_${uid}_${timestamp}`;
  }

  generateToken(channelName: string, uid: number): { token: string; channelName: string; uid: number; appId: string; rtmToken: string } {
    try {
      // Generate the token
      const token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        RtcRole.PUBLISHER,
        TOKEN_EXPIRATION_IN_SECONDS,
        TOKEN_EXPIRATION_IN_SECONDS
      );

      const rtmToken = this.generateRtmToken(uid);

      return {
        token,
        channelName,
        uid,
        appId: this.appId,
        rtmToken
      };
    } catch (error) {
      console.error('Error generating Agora token:', error);
      throw error;
    }
  }

  generateRtmToken(uid: number): string {
    return RtmTokenBuilder.buildToken(
      this.appId,
      this.appCertificate,
      uid.toString(),
      TOKEN_EXPIRATION_IN_SECONDS
    );
  }

  generateTokenWithRtm(channelName: string, uid: number): string {
    return buildRtcAndRtmToken(
      this.appId,
      this.appCertificate,
      channelName,
      uid.toString(),
      TOKEN_EXPIRATION_IN_SECONDS,
      TOKEN_EXPIRATION_IN_SECONDS
    );
  }
}

export const tokenService = new TokenService();
