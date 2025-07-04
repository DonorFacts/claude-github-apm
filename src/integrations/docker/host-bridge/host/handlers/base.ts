/**
 * Base Handler Interface
 * Common interface for all service handlers
 */

import type { BridgeRequest, BridgeResponse } from '../../shared/types';

export interface ServiceHandler {
  /**
   * Handle a request for this service
   */
  handle(request: BridgeRequest): Promise<void>;
  
  /**
   * Get the service name this handler manages
   */
  getServiceName(): string;
}

export abstract class BaseHandler implements ServiceHandler {
  constructor(
    protected readonly responsesDir: string,
    protected readonly log: (level: string, message: string) => void
  ) {}
  
  abstract handle(request: BridgeRequest): Promise<void>;
  abstract getServiceName(): string;
  
  protected writeResponse(service: string, response: BridgeResponse): void {
    const fs = require('fs');
    const path = require('path');
    const responseFile = path.join(this.responsesDir, `${service}.response`);
    fs.appendFileSync(responseFile, JSON.stringify(response) + '\n');
  }
  
  protected createResponse(
    requestId: string,
    status: 'success' | 'error' | 'timeout' | 'skipped',
    message: string,
    data?: Record<string, any>
  ): BridgeResponse {
    return {
      id: requestId,
      status,
      message,
      timestamp: new Date().toISOString(),
      ...(data && { data })
    };
  }
}