import { afterEach, describe, expect, it } from 'vitest';
import { TokenService } from './tokenService';

describe('TokenService RTM tokens', () => {
  const originalAppId = process.env.AGORA_APP_ID;
  const originalCertificate = process.env.AGORA_APP_CERTIFICATE;

  afterEach(() => {
    process.env.AGORA_APP_ID = originalAppId;
    process.env.AGORA_APP_CERTIFICATE = originalCertificate;
  });

  it('builds an agent token containing RTC publisher and RTM login services', () => {
    process.env.AGORA_APP_ID = '970CA35de60c44645bbae8a215061b33';
    process.env.AGORA_APP_CERTIFICATE = '5CFd2fd1755d40ecb72977518be15d3b';
    const service = new TokenService();

    const token = service.generateTokenWithRtm('conversation-channel', 4201);

    const {
      AccessToken2,
      ServiceRtc,
      ServiceRtm,
      kRtcServiceType,
      kRtmServiceType,
    } = require('agora-token/src/AccessToken2');
    const parsedToken = new AccessToken2('', '', 0, 0);
    parsedToken.from_string(token);
    expect(parsedToken.services[kRtcServiceType].__privileges).toMatchObject({
      [ServiceRtc.kPrivilegeJoinChannel]: 86400,
      [ServiceRtc.kPrivilegePublishAudioStream]: 86400,
      [ServiceRtc.kPrivilegePublishVideoStream]: 86400,
      [ServiceRtc.kPrivilegePublishDataStream]: 86400,
    });
    expect(parsedToken.services[kRtmServiceType].__privileges).toMatchObject({
      [ServiceRtm.kPrivilegeLogin]: 86400,
    });
  });

  it('binds the browser RTM token to the same string UID used at login', () => {
    process.env.AGORA_APP_ID = '970CA35de60c44645bbae8a215061b33';
    process.env.AGORA_APP_CERTIFICATE = '5CFd2fd1755d40ecb72977518be15d3b';
    const service = new TokenService();

    const token = service.generateRtmToken(42);

    const { AccessToken2, kRtmServiceType } = require('agora-token/src/AccessToken2');
    const parsedToken = new AccessToken2('', '', 0, 0);
    parsedToken.from_string(token);
    expect(parsedToken.services[kRtmServiceType].__user_id.toString()).toBe('42');
  });
});
