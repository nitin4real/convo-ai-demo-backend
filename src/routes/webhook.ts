import { NextFunction, Router } from 'express';
import { webhookService } from '../services/webhookService';
import { authenticateToken } from '../middleware/auth';

const router = Router();

export const allowedSIPUsers = [
    3253,
    8331,
    9104
];

export const checkAllowedSIPUser = (req: any, res: any, next: NextFunction) => {
    try {
        const userId = Number(req?.user?.id) || 0;
        if (allowedSIPUsers.includes(userId)) {
            next();
        } else {
            return res.status(403).json({ message: 'Unauthorized, Contact Admin for access', userMessages: ['Unauthorized, Contact Admin for access'] });
        }
    } catch (error) {
        console.error('Error checking allowed user:', error);
        return res.status(403).json({ message: 'Unauthorized', userMessages: ['Unauthorized'] });
    }
};

// Webhook endpoint for Agora PSTN/SIP events
router.post('/agora', (req, res) => {
    try {
        const eventData = req.body;

        // Log the incoming webhook event
        console.log('Received Agora webhook event:', JSON.stringify(eventData, null, 2));

        // Process the webhook event
        webhookService.processEvent(eventData);

        // Always return 200 OK as per Agora documentation
        res.status(200).json({
            success: true,
            message: 'Webhook event processed successfully'
        });
    } catch (error) {
        console.error('Error processing webhook event:', error);

        // Still return 200 OK to prevent retries
        res.status(200).json({
            success: false,
            message: 'Error processing webhook event'
        });
    }
});

router.post('/agora-lc', (req, res) => {
    try {
        const eventData = req.body;
        // console.log('Received Agora LC webhook event:', JSON.stringify(eventData, null, 2));
        
        // Process the Agora LC event
        webhookService.processAgoraLCEvent(eventData);
        
        // Always return 200 OK as per webhook best practices
        res.status(200).json({
            success: true,
            message: 'Agora LC webhook event processed successfully'
        });
    } catch (error) {
        console.error('Error processing Agora LC webhook event:', error);
        
        // Still return 200 OK to prevent retries
        res.status(200).json({
            success: false,
            message: 'Error processing Agora LC webhook event'
        });
    }
});

router.get('/exotel', (req, res) => {
    try {
        // print params
        const aQuery = req.query;
        console.log('aQuery:', JSON.stringify(aQuery, null, 2));
        if(aQuery.Direction == 'incoming') {
            const event = {
                appid: "",
                "from": aQuery.CallFrom,
                "to": aQuery.CallTo,
                "direction": "inbound",
                "event": "ringing",
                "timestamp": Date.now()
            }
            webhookService.processEvent(event as any);
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing exotel webhook event');
    }
});


router.get('/buffer-logs', authenticateToken, checkAllowedSIPUser, (req, res) => {
    const bufferLogs = webhookService.getBufferEvents();
    const agoraLCEvents = webhookService.getAgoraLCEvents();
    
    res.status(200).json({
        bufferLogs: bufferLogs,
        agoraLCEvents: agoraLCEvents,
        status: 'healthy',
        message: 'Buffer logs retrieved successfully'
    });
});

// router.delete('/buffer-logs', (req, res) => {
//     webhookService.flushBufferEvents();
//     res.status(200).json({
//         status: 'healthy',
//         message: 'Buffer logs flushed successfully'
//     });
// });

// Health check endpoint for webhook
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        message: 'Webhook endpoint is running'
    });
});

export default router;
