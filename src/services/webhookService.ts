interface WebhookEvent {
  event: string;
  callid: string;
  timestamp: number;
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

class WebhookService {
  private bufferEvents: WebhookEvent[] = [];
  /**
   * Process incoming webhook events from Agora PSTN/SIP Gateway
   */

  flushBufferEvents(): void {
    this.bufferEvents = [];
  }

  getBufferEvents(): WebhookEvent[] {
    return this.bufferEvents;
  }

  processEvent(eventData: WebhookEvent): void {
    try {
      console.log(`Processing ${eventData.event} event for call ${eventData.callid}`);
      this.bufferEvents = [eventData];
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
}

export const webhookService = new WebhookService();
