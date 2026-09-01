import { describe, expect, it } from 'vitest';
import { withRtmDelivery } from './agoraRtmConfig';

describe('withRtmDelivery', () => {
  it('forces both required Agora RTM flags while preserving other settings', () => {
    const result = withRtmDelivery({
      channel: 'conversation-channel',
      advanced_features: {
        enable_rtm: false,
        enable_tools: true,
      },
      parameters: {
        data_channel: 'datastream',
        enable_metrics: true,
      },
    });

    expect(result.advanced_features).toEqual({
      enable_rtm: true,
      enable_tools: true,
    });
    expect(result.parameters).toEqual({
      data_channel: 'rtm',
      enable_metrics: true,
    });
  });
});
