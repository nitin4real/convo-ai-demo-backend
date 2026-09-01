interface AgoraService {
  add_privilege(privilege: number, expire: number): void;
}

interface AgoraAccessToken {
  add_service(service: AgoraService): void;
  build(): string;
}

interface AgoraAccessTokenModule {
  AccessToken2: new (
    appId: string,
    appCertificate: string,
    issueTimestamp: number,
    expirationInSeconds: number
  ) => AgoraAccessToken;
  ServiceRtc: {
    new (channelName: string, uid: string): AgoraService;
    kPrivilegeJoinChannel: number;
    kPrivilegePublishAudioStream: number;
    kPrivilegePublishVideoStream: number;
    kPrivilegePublishDataStream: number;
  };
  ServiceRtm: {
    new (uid: string): AgoraService;
    kPrivilegeLogin: number;
  };
}

// agora-token exposes the AccessToken2 services from this documented builder module.
const { AccessToken2, ServiceRtc, ServiceRtm } = require(
  'agora-token/src/AccessToken2'
) as AgoraAccessTokenModule;

/** Build the combined token required when a ConvoAI agent publishes through RTM. */
export function buildRtcAndRtmToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: string,
  tokenExpirationInSeconds: number,
  privilegeExpirationInSeconds: number
): string {
  const token = new AccessToken2(
    appId,
    appCertificate,
    0,
    tokenExpirationInSeconds
  );

  const rtcService = new ServiceRtc(channelName, uid);
  rtcService.add_privilege(ServiceRtc.kPrivilegeJoinChannel, privilegeExpirationInSeconds);
  rtcService.add_privilege(ServiceRtc.kPrivilegePublishAudioStream, privilegeExpirationInSeconds);
  rtcService.add_privilege(ServiceRtc.kPrivilegePublishVideoStream, privilegeExpirationInSeconds);
  rtcService.add_privilege(ServiceRtc.kPrivilegePublishDataStream, privilegeExpirationInSeconds);
  token.add_service(rtcService);

  const rtmService = new ServiceRtm(uid);
  rtmService.add_privilege(ServiceRtm.kPrivilegeLogin, privilegeExpirationInSeconds);
  token.add_service(rtmService);

  return token.build();
}
