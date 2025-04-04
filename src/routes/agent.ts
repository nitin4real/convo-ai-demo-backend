import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { agentService } from '../services/agentService';
import { tokenService } from '../services/tokenService';
import { UserService } from '../services/userService';

const router = Router();


// Start an agent in a channel
router.post('/start/:agentId', authenticateToken, async (req, res) => {
  try {
    const { channelName } = req.body;
    const userId = req.user?.id || "0";

    // Create a new unique uid for the agent with request user id by adding 2 digits to the end
    const agentUid = Number(req.user?.id) * 100 + 1; // the agent id is {req.user?.id}01
    const tokenData = tokenService.generateToken(channelName, agentUid);

    // Start the agent with the generated token
    const agent = await agentService.startAgent({
      channelName,
      agentUid: agentUid.toString(),
      token: tokenData.token,
      userId: Number(userId)
    });

    if(agent.status === 'NO_MINUTES_REMAINING'){
      return res.status(440).json({ errorCode: 'NO_MINUTES_REMAINING', error: 'User has no remaining minutes' });
    }

    res.json({
      ...agent,
      ...tokenData
    });
  } catch (error) {
    console.error('Error starting agent:', error);
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
    res.status(440).json({ error: 'Could not send heartbeat' });
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