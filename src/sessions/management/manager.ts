#!/usr/bin/env tsx
/**
 * APM Session Manager - Core session lifecycle management
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';

export interface Session {
  id: string;
  status: 'active' | 'crashed' | 'completed';
  role: string;
  specialization?: string;
  worktree: string;
  branch: string;
  last_heartbeat: string;
  created: string;
  context_file: string;
  terminal_title?: string;
  environment?: 'container' | 'host';
}

export interface Registry {
  sessions: Session[];
}

export class SessionManager {
  private registryPath: string;

  constructor(sessionsDir: string) {
    this.registryPath = path.join(sessionsDir, 'registry.yaml');
    this.ensureRegistry();
  }

  private ensureRegistry(): void {
    const dir = path.dirname(this.registryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!fs.existsSync(this.registryPath)) {
      const emptyRegistry: Registry = { sessions: [] };
      this.writeRegistry(emptyRegistry);
    }
  }

  private readRegistry(): Registry {
    try {
      const content = fs.readFileSync(this.registryPath, 'utf8');
      return yaml.load(content) as Registry;
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not read registry, creating new one'));
      return { sessions: [] };
    }
  }

  private writeRegistry(registry: Registry): void {
    const yamlContent = yaml.dump(registry, {
      indent: 2,
      lineWidth: -1,
      quotingType: '"'
    });
    fs.writeFileSync(this.registryPath, yamlContent);
  }

  generateSessionId(role: string, specialization?: string): string {
    const spec = specialization ? `-${specialization}` : '';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '-');
    return `${role}${spec}-${timestamp}`;
  }

  registerSession(options: {
    role: string;
    specialization?: string;
    worktree: string;
    branch: string;
    environment?: 'container' | 'host';
  }): string {
    const registry = this.readRegistry();
    const sessionId = this.generateSessionId(options.role, options.specialization);
    const now = new Date().toISOString();

    const session: Session = {
      id: sessionId,
      status: 'active',
      role: options.role,
      specialization: options.specialization,
      worktree: options.worktree,
      branch: options.branch,
      last_heartbeat: now,
      created: now,
      context_file: 'context/latest.md',
      environment: options.environment || 'host'
    };

    registry.sessions.push(session);
    this.writeRegistry(registry);

    console.log(chalk.green('✓'), `Session registered: ${sessionId}`);
    return sessionId;
  }

  updateHeartbeat(sessionId: string): boolean {
    const registry = this.readRegistry();
    const session = registry.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      console.error(chalk.red('✗'), `Session not found: ${sessionId}`);
      return false;
    }

    session.last_heartbeat = new Date().toISOString();
    session.status = 'active';
    this.writeRegistry(registry);

    console.log(chalk.blue('♥'), `Heartbeat updated: ${sessionId}`);
    return true;
  }

  endSession(sessionId: string): boolean {
    const registry = this.readRegistry();
    const session = registry.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      console.error(chalk.red('✗'), `Session not found: ${sessionId}`);
      return false;
    }

    session.status = 'completed';
    session.last_heartbeat = new Date().toISOString();
    this.writeRegistry(registry);

    console.log(chalk.gray('◎'), `Session ended: ${sessionId}`);
    return true;
  }

  listSessions(filter?: 'active' | 'crashed' | 'completed'): Session[] {
    const registry = this.readRegistry();
    const now = new Date();
    const staleThreshold = 15 * 60 * 1000; // 15 minutes - more reasonable for development sessions

    return registry.sessions
      .map(session => {
        // Determine actual status based on heartbeat
        let actualStatus = session.status;
        if (session.status === 'active') {
          const lastHeartbeat = new Date(session.last_heartbeat);
          const timeDiff = now.getTime() - lastHeartbeat.getTime();
          if (timeDiff > staleThreshold) {
            actualStatus = 'crashed';
          }
        }
        return { ...session, status: actualStatus as any };
      })
      .filter(session => {
        if (!filter) return true;
        return session.status === filter;
      });
  }

  getSession(sessionId: string): Session | null {
    const registry = this.readRegistry();
    return registry.sessions.find(s => s.id === sessionId) || null;
  }
}

// CLI interface for direct usage
if (require.main === module) {
  const command = process.argv[2];
  const sessionsDir = process.env.APM_SESSIONS || path.join('..', 'apm', 'sessions');
  const manager = new SessionManager(sessionsDir);

  switch (command) {
    case 'register': {
      const role = process.argv[3];
      const specialization = process.argv[4];
      const worktree = process.argv[5] || path.basename(process.cwd());
      const branch = process.argv[6] || 'main';
      
      if (!role) {
        console.error(chalk.red('Error: Role is required'));
        process.exit(1);
      }

      const sessionId = manager.registerSession({
        role,
        specialization,
        worktree,
        branch,
        environment: process.env.APM_CONTAINERIZED === 'true' ? 'container' : 'host'
      });
      
      console.log(sessionId); // For script consumption
      break;
    }
    
    case 'heartbeat': {
      const sessionId = process.argv[3];
      if (!sessionId) {
        console.error(chalk.red('Error: Session ID is required'));
        process.exit(1);
      }
      
      const success = manager.updateHeartbeat(sessionId);
      process.exit(success ? 0 : 1);
      break;
    }
    
    case 'end': {
      const sessionId = process.argv[3];
      if (!sessionId) {
        console.error(chalk.red('Error: Session ID is required'));
        process.exit(1);
      }
      
      const success = manager.endSession(sessionId);
      process.exit(success ? 0 : 1);
      break;
    }
    
    default:
      console.error('Usage: session-manager.ts <register|heartbeat|end> [args...]');
      process.exit(1);
  }
}