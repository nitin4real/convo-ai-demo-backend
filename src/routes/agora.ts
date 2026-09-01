import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { tokenService } from '../services/tokenService';

const router = Router();

router.get('/rtm-token', authenticateToken, (req, res) => {
  try {
    const uid = Number(req.user?.id) || 0;
    res.json({
      uid,
      rtmToken: tokenService.generateRtmToken(uid),
    });
  } catch (error) {
    console.error('Error generating Agora RTM token:', error);
    res.status(500).json({ error: 'Failed to generate Agora RTM token' });
  }
});


router.get('/channel/:agentId', authenticateToken, (req, res) => {
  try {
    const { agentId } = req.params;
    const uid = Number(req.user?.id) || 0;

    const channelName = tokenService.generateChannelName(agentId, uid);
    const tokenData = tokenService.generateToken(channelName, uid);
    res.json(tokenData); return;
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ error: 'Failed to generate Agora token' });
  }
});

export default router;
