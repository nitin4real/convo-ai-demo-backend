import crypto from 'crypto';

interface WebhookEvent {
  event: string;
  callid: string;
  timestamp: number;
  eventId: string;
  eventTimestamp: number;
  uid?: string;
  channel?: string;
  to?: string;
  from?: string;
  direction: 'inbound' | 'outbound';
  appid: string;
  pin?: string;
  hangup_cause?: string;
  duration?: string;
  billsec?: string;
  sip_disposition?: string;
  sdk_options?: string;
}

interface AgoraLCEventPayload {
  agent_id: string;
  channel: string;
  state: string;
  report_ms: number;
  labels?: {
    campaign_id?: string;
    customer_group?: string;
    [key: string]: any;
  };
}

interface AgoraLCEvent {
  agent_id: string;
  channel: string;
  state: string;
  report_ms: number;
  labels?: {
    campaign_id?: string;
    customer_group?: string;
    [key: string]: any;
  };
  eventType: number;
  storedAt: number;
}

class WebhookService {
  private bufferEvents: WebhookEvent[] = [];
  // Buffer for Agora LC events, keyed by agent_id
  private agoraLCBuffer: Map<string, AgoraLCEvent> = new Map();
  // TTL for Agora LC events: 7 seconds
  private readonly AGORA_LC_TTL_MS = 7000;
  
  /**
   * Process incoming webhook events from Agora PSTN/SIP Gateway
   */

  flushBufferEvents(): void {
    this.bufferEvents = [];
  }

  getBufferEvents(): WebhookEvent[] {
    // Filter out events older than 10 seconds
    const now = Date.now();
    const tenSecondsAgo = now - 10000; // 10 seconds in milliseconds
    
    this.bufferEvents = this.bufferEvents.filter(event => event.eventTimestamp > tenSecondsAgo);
    
    return this.bufferEvents;
  }

  private generateUniqueId(): string {
    return crypto.randomUUID();
  }

  processEvent(eventData: WebhookEvent): void {
    try {
      console.log(`Processing ${eventData.event} event for call ${eventData.callid}`);
      
      // Generate unique ID and add event timestamp
      const eventWithId = {
        ...eventData,
        eventId: this.generateUniqueId(),
        eventTimestamp: Date.now()
      };
      
      this.bufferEvents = [eventWithId];
      switch (eventData.event) {
        case 'call_initiated':
          this.handleCallInitiated(eventData);
          break;
          
        case 'call_ringing':
          this.handleCallRinging(eventData);
          break;
          
        case 'call_answered':
          this.handleCallAnswered(eventData);
          break;
          
        case 'agora_bridge_start':
          this.handleAgoraBridgeStart(eventData);
          break;
          
        case 'agora_bridge_end':
          this.handleAgoraBridgeEnd(eventData);
          break;
          
        case 'call_hangup':
          this.handleCallHangup(eventData);
          break;
          
        default:
          console.log(`Unknown event type: ${eventData.event}`);
      }
    } catch (error) {
      console.error('Error processing webhook event:', error);
    }
  }

  /**
   * Handle call_initiated event
   * Sent when the API receives the call request
   */
  private handleCallInitiated(eventData: WebhookEvent): void {
    console.log(`Call initiated - UID: ${eventData.uid}, Channel: ${eventData.channel}, Direction: ${eventData.direction}`);
    
    // Add your business logic here
    // For example: update database, send notifications, etc.
    
    if (eventData.direction === 'inbound' && eventData.pin) {
      console.log(`Inbound call with PIN: ${eventData.pin}`);
      // Handle PIN validation logic if needed
    }
  }

  /**
   * Handle call_ringing event
   * Sent 1 second after call_initiated if call hasn't completed yet
   */
  private handleCallRinging(eventData: WebhookEvent): void {
    console.log(`Call ringing - UID: ${eventData.uid}, Channel: ${eventData.channel}`);
    
    // Add your business logic here
    // For example: update call status in database
  }

  /**
   * Handle call_answered event
   * Sent when the PSTN call is answered
   */
  private handleCallAnswered(eventData: WebhookEvent): void {
    console.log(`Call answered - CallID: ${eventData.callid}, UID: ${eventData.uid}, Channel: ${eventData.channel}`);
    
    // Add your business logic here
    // For example: update call status, start billing, etc.
  }

  /**
   * Handle agora_bridge_start event
   * Sent when audio bridge to Agora RTC is established
   */
  private handleAgoraBridgeStart(eventData: WebhookEvent): void {
    console.log(`Agora bridge started - CallID: ${eventData.callid}, UID: ${eventData.uid}, Channel: ${eventData.channel}`);
    
    if (eventData.sdk_options) {
      console.log(`SDK options: ${eventData.sdk_options}`);
    }
    
    // Add your business logic here
    // For example: start recording, update call status, etc.
  }

  /**
   * Handle agora_bridge_end event
   * Sent when Agora RTC session ends normally
   */
  private handleAgoraBridgeEnd(eventData: WebhookEvent): void {
    console.log(`Agora bridge ended - CallID: ${eventData.callid}, UID: ${eventData.uid}, Channel: ${eventData.channel}`);
    
    // Add your business logic here
    // For example: stop recording, update call status, etc.
  }

  /**
   * Handle call_hangup event
   * GUARANTEED to fire when call ends for any reason
   */
  private handleCallHangup(eventData: WebhookEvent): void {
    console.log(`Call hangup - CallID: ${eventData.callid}, UID: ${eventData.uid}, Channel: ${eventData.channel}`);
    console.log(`Hangup cause: ${eventData.hangup_cause}, Duration: ${eventData.duration}s, Billable: ${eventData.billsec}s`);
    console.log(`SIP disposition: ${eventData.sip_disposition}`);
    
    // Add your business logic here
    // For example: 
    // - Update call records in database
    // - Process billing information
    // - Send call summary notifications
    // - Clean up resources
  }

  /**
   * Process Agora LC webhook events
   * Only processes eventType 201 (inbound) and 202 (outbound)
   */
  processAgoraLCEvent(eventData: {
    sid: string;
    noticeId: string;
    productId: number;
    eventType: number;
    notifyMs: number;
    payload: AgoraLCEventPayload;
  }): void {
    try {
      // Only process eventType 201 (inbound) or 202 (outbound)
      if (eventData.eventType !== 201 && eventData.eventType !== 202) {
        console.log(`Skipping Agora LC event with eventType ${eventData.eventType} (only processing 201/202)`);
        return;
      }

      const payload = eventData.payload;
      
      if (!payload || !payload.agent_id) {
        console.error('Invalid Agora LC event payload: missing agent_id');
        return;
      }

      // Store event in buffer, isolated by agent_id
      // Each agent_id will only keep the latest event
      const agoraLCEvent: AgoraLCEvent = {
        agent_id: payload.agent_id,
        channel: payload.channel || '',
        state: payload.state || '',
        report_ms: payload.report_ms || Date.now(),
        labels: payload.labels,
        eventType: eventData.eventType,
        storedAt: Date.now()
      };

      this.agoraLCBuffer.set(payload.agent_id, agoraLCEvent);
      console.log(`Stored Agora LC event for agent_id: ${payload.agent_id}, state: ${payload.state}, eventType: ${eventData.eventType}`);
    } catch (error) {
      console.error('Error processing Agora LC webhook event:', error);
    }
  }

  /**
   * Get latest Agora LC event
   * Automatically cleans up events older than 7 seconds
   * Returns only the most recent event across all agent_ids
   */
  getAgoraLCEvents(): AgoraLCEvent[] {
    const now = Date.now();
    const sevenSecondsAgo = now - this.AGORA_LC_TTL_MS;

    // Clean up expired events
    for (const [agentId, event] of this.agoraLCBuffer.entries()) {
      if (event.storedAt < sevenSecondsAgo) {
        this.agoraLCBuffer.delete(agentId);
        console.log(`Removed expired Agora LC event for agent_id: ${agentId}`);
      }
    }

    // Find the latest event (highest storedAt timestamp)
    let latestEvent: AgoraLCEvent | null = null;
    for (const [, event] of this.agoraLCBuffer.entries()) {
      if (!latestEvent || event.storedAt > latestEvent.storedAt) {
        latestEvent = {
          agent_id: event.agent_id,
          channel: event.channel,
          state: event.state,
          report_ms: event.report_ms,
          labels: event.labels,
          eventType: event.eventType,
          storedAt: event.storedAt
        };
      }
    }

    // Return array with only the latest event, or empty array if none
    return latestEvent ? [latestEvent] : [];
  }
}

export const webhookService = new WebhookService();
