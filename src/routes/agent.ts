import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { agentService } from '../services/agentService';
import { tokenService } from '../services/tokenService';
import { UserService } from '../services/userService';
import { agents, AgentTypeIds, agentTypes } from '../data/agents';
import { startSIPCall_withAgent } from '../services/sipService';
import { checkAllowedSIPUser, allowedSIPUsers } from './webhook';
const router = Router();


// Get list of available agents
router.get('/agents', authenticateToken, async (req, res) => {
  try {
    // send sip agents only for allowed sip users 
    const userId = Number(req.user?.id) || 0;
    if (!allowedSIPUsers.includes(userId)) {
      // send without sip agents
      const filteredAgents = agents.filter(agent => agent.id !== 'sip_wifi_agent_inbound' && agent.id !== 'sip_wifi_agent_outbound');
      res.json(filteredAgents);
      return;
    }
    res.json(agents);
  } catch (error) {
    console.error('Error getting agents list:', error);
    res.status(500).json({ error: 'Failed to get agents list' });
  }
});

// get agents by type
router.get('/agents/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const agentsByType = agents.filter(agent => agent.type === type);
    if (type === AgentTypeIds.PhoneCallAgent) {
      const userId = Number(req.user?.id) || 0;
      if (!allowedSIPUsers.includes(userId)) {
        // send empty
        res.json([])
      }
    }
    res.json(agentsByType);
  } catch (error) {
    console.error('Error getting agents by type:', error);
    res.status(500).json({ error: 'Failed to get agents by type' });
  }
});

// Get list of available agent types
router.get('/agent-types', authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user?.id) || 0;
    if (!allowedSIPUsers.includes(userId)) {
      // send without phone call agent type
      const filteredAgentTypes = agentTypes.filter(agentType => agentType.id !== AgentTypeIds.PhoneCallAgent);
      res.json(filteredAgentTypes);
      return;
    }
    res.json(agentTypes);
  } catch (error) {
    console.error('Error getting agent types:', error);
    res.status(500).json({ error: 'Failed to get agent types' });
  }
});

router.get('/channel-for-sip', authenticateToken, checkAllowedSIPUser, async (req, res) => {
  try {
    const { channelName } = req.query;
    if (!channelName) {
      return res.status(400).json({ error: 'UID and channel name are required' });
    }
    const uid = Number(req.user?.id) || 0;
    const tokenData = tokenService.generateToken(channelName as any, uid);
    res.status(200).json({
      message: 'SIP call started successfully', tokenData: tokenData
    })
  } catch (error) {
    console.error('Error getting channel for SIP:', error);
    res.status(500).json({ error: 'Failed to get channel for SIP' });
  }
})

router.get('/:agentId', authenticateToken, async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agents.find(agent => agent.id === agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found', userMessages: ['Working on this feature!'] });
    }
    res.json(agent);
  } catch (error) {
    console.error('Error getting agent:', error);
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

// Start an agent in a channel
router.post('/start/:agentId', authenticateToken, async (req, res) => {
  try {
    let { channelName, languageCode = 'en-US', properties } = req.body;

    const { agentId } = req.params;
    const userId = req.user?.id || "0";

    if (languageCode === '') {
      languageCode = 'en-US'
    }

    // Create a new unique uid for the agent with request user id by adding 2 digits to the end
    const agentUid = Number(req.user?.id) * 100 + 1; // the agent id is {req.user?.id}01
    const tokenData = tokenService.generateToken(channelName, agentUid);
    const avatarUid = Number(req.user?.id) * 100 + 2;
    const avatarTokenData = tokenService.generateToken(channelName, avatarUid);


    // Start the agent with the generated token and system prompt
    const agent = await agentService.startAgent({
      agentId,
      channelName,
      agentRTCUid: agentUid.toString(),
      token: tokenData.token,
      userId: Number(userId),
      languageCode: languageCode,
      properties,
      avatarUid,
      avatarToken: avatarTokenData.token
    });

    if (agent.status === 'NO_MINUTES_REMAINING') {
      return res.status(440).json({ errorCode: 'NO_MINUTES_REMAINING', error: 'User has no remaining minutes', userMessages: ['Platform Access Expired'] });
    }

    res.json({
      ...agent,
      ...tokenData
    });
  } catch (error) {
    console.error('Error starting agent:', error);
    if (error.message?.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to start agent' });
  }
});

// Stop an agent
router.post('/stop', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || "0";
    const user = await UserService.getUserById(Number(userId));
    const convoAgentId = user?.convoAgentId || "";
    if (!convoAgentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    agentService.stopHeartbeat(convoAgentId);
    UserService.updateUser(Number(userId), { convoAgentId: "" });
    res.json({ message: 'Agent stopped successfully' });
  } catch (error) {
    console.error('Error stopping agent:', error);
    res.status(500).json({ error: 'Failed to stop agent' });
  }
});

router.post('/start-sip-call', authenticateToken, checkAllowedSIPUser, async (req, res) => {
  try {
    const { agentId, phoneNumber, language = 'en-US' } = req.body;
    if (!agentId || !phoneNumber) {
      return res.status(400).json({ error: 'Agent ID and phone number are required' });
    }
    if (!/^\d{11}$/.test(phoneNumber.toString())) {
      return res.status(400).json({
        error: 'phoneNumber must be exactly 11 digits'
      })
    }
    const uid = Number(req.user?.id) || 0;
    const channelName = tokenService.generateChannelName("sip", uid);
    //  return a token for the user to join the channel
    const tokenData = tokenService.generateToken(channelName, uid);
    const sipCallData = await startSIPCall_withAgent(channelName, uid.toString() + "01", language);
    return res.status(200).json({ message: 'SIP call started successfully', tokenData: tokenData, sipCallData: sipCallData });
  } catch (error) {
    console.error('Error starting SIP call:', error);
    return res.status(500).json({ error: 'Failed to start SIP call' });
  }
});

// Get agent status
router.get('/:agentUid/status', authenticateToken, async (req, res) => {
  try {
    const { agentUid } = req.params;

    if (!agentUid) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    const status = await agentService.getAgentStatus(agentUid);
    res.json(status);
  } catch (error) {
    console.error('Error getting agent status:', error);
    res.status(500).json({ error: 'Failed to get agent status' });
  }
});

router.post('/heartbeat/:convoAgentId', authenticateToken, async (req, res) => {
  try {
    const { convoAgentId } = req.params;
    const userId = req.user?.id || "0";
    const heartbeatStatus = await agentService.updateHeartbeat(convoAgentId, Number(userId));
    res.json({ status: heartbeatStatus.status, secondsRemaining: heartbeatStatus.secondsRemaining });
  } catch (error) {
    console.error('Timeout sending heartbeat');
    res.status(440).json({ error: 'Could not send heartbeat', userMessages: ['Platform Access Expired'] });
  }
});

// List agents
// router.get('/list', authenticateToken, requireAdmin,  async (req, res) => {
//   try {
//     const { channel, from_time, to_time, status, limit, cursor } = req.query;

//     const agents = await agentService.listAgents({
//       channel: channel as string,
//       from_time: from_time ? Number(from_time) : undefined,
//       to_time: to_time ? Number(to_time) : undefined,
//       status: status as string,
//       limit: limit ? Number(limit) : undefined,
//       cursor: cursor as string
//     });

//     res.json(agents);
//   } catch (error) {
//     console.error('Error listing agents:', error);
//     res.status(500).json({ error: 'Failed to list agents' });
//   }
// });

export default router; 