type AgoraAgentProperties = {
  advanced_features?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  [key: string]: unknown;
};

/** Force an agent start onto the Agora RTM data channel while preserving other settings. */
export function withRtmDelivery<T extends AgoraAgentProperties>(properties: T): T & {
  advanced_features: Record<string, unknown> & { enable_rtm: true };
  parameters: Record<string, unknown> & { data_channel: 'rtm' };
} {
  return {
    ...properties,
    advanced_features: {
      ...properties.advanced_features,
      enable_rtm: true,
    },
    parameters: {
      ...properties.parameters,
      data_channel: 'rtm',
    },
  };
}

/** Configure an agent to publish messages over the Agora RTC data stream. */
export function withRtcDelivery<T extends AgoraAgentProperties>(properties: T): T & {
  advanced_features: Record<string, unknown> & { enable_rtm: false };
  parameters: Record<string, unknown> & { data_channel: 'datastream' };
} {
  return {
    ...properties,
    advanced_features: {
      ...properties.advanced_features,
      enable_rtm: false,
    },
    parameters: {
      ...properties.parameters,
      data_channel: 'datastream',
    },
  };
}
