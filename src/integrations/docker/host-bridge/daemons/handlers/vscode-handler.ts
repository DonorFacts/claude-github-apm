/**
 * VS Code Service Handler
 * Handles VS Code operations like opening files and folders
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import { BaseHandler } from './base-handler';
import type { BridgeRequest } from '../../types';

const execAsync = promisify(exec);

export class VSCodeHandler extends BaseHandler {
  constructor(
    responsesDir: string,
    log: (level: string, message: string) => void,
    private readonly translatePath: (containerPath: string) => string
  ) {
    super(responsesDir, log);
  }
  
  getServiceName(): string {
    return 'vscode';
  }
  
  async handle(request: BridgeRequest): Promise<void> {
    const { action, payload, id: requestId } = request;
    const { path: requestPath } = payload;
    
    this.log('INFO', `VS Code request: ${action} ${requestPath}`);
    
    if (action === 'open') {
      await this.handleOpen(requestId, requestPath);
    } else {
      const errorMsg = `Unknown VS Code action: ${action}`;
      this.log('ERROR', errorMsg);
      this.writeResponse('vscode', this.createResponse(
        requestId,
        'error',
        errorMsg
      ));
    }
  }
  
  private async handleOpen(requestId: string, requestPath: string): Promise<void> {
    const hostPath = this.translatePath(requestPath);
    this.log('INFO', `Translated path: ${requestPath} -> ${hostPath}`);
    
    // Check if path exists
    if (!fs.existsSync(hostPath)) {
      const errorMsg = `Path does not exist: ${hostPath}`;
      this.log('ERROR', errorMsg);
      this.writeResponse('vscode', this.createResponse(
        requestId,
        'error',
        errorMsg
      ));
      return;
    }
    
    // Check if VS Code is available
    try {
      execSync('which code', { stdio: 'pipe' });
    } catch {
      const errorMsg = 'VS Code command not found';
      this.log('ERROR', errorMsg);
      this.writeResponse('vscode', this.createResponse(
        requestId,
        'error',
        errorMsg
      ));
      return;
    }
    
    // Open VS Code
    try {
      await execAsync(`code "${hostPath}"`);
      this.log('INFO', `VS Code opened successfully: ${hostPath}`);
      this.writeResponse('vscode', this.createResponse(
        requestId,
        'success',
        'VS Code opened successfully',
        { path: hostPath }
      ));
    } catch (error) {
      const errorMsg = 'Failed to open VS Code';
      this.log('ERROR', errorMsg);
      this.writeResponse('vscode', this.createResponse(
        requestId,
        'error',
        errorMsg
      ));
    }
  }
}