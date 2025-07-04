#!/usr/bin/env tsx
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import chalk from 'chalk';

interface WatchProcess {
  name: string;
  command: string;
  args: string[];
  color: string;
  process?: ChildProcess;
  pid?: number;
}

class WatchAllManager {
  private processes: WatchProcess[] = [];
  private isShuttingDown = false;
  private projectRoot: string;

  constructor() {
    // Get project root (use process.cwd() to get actual working directory)
    this.projectRoot = process.cwd();
    
    // Define all watch processes based on the original shell script
    this.processes = [];

    // Check if host-bridge daemon exists and add it FIRST (like the shell script)
    const hostBridgePath = path.join(__dirname, 'daemon.ts');
    if (fs.existsSync(hostBridgePath)) {
      this.processes.push({
        name: 'HOST-BRIDGE',
        command: 'tsx',
        args: [hostBridgePath],
        color: 'magenta'
      });
    }

    // Handle graceful shutdown - matching shell script trap behavior
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('exit', () => this.shutdown());
  }

  async start(): Promise<void> {
    console.log(chalk.yellow('[WATCH-ALL] Starting concurrent watch processes...'));

    // Start all processes concurrently (like the shell script does with &)
    const startPromises = this.processes.map(async (watchProcess) => {
      if (watchProcess.name === 'HOST-BRIDGE') {
        console.log(chalk.yellow('[WATCH-ALL] Starting unified host-bridge daemon (VS Code, audio, speech)...'));
      }
      await this.startProcess(watchProcess);
    });

    // Wait for all to start
    await Promise.all(startPromises);

    console.log(chalk.yellow('[WATCH-ALL] All processes started successfully.'));
    console.log(chalk.yellow('[WATCH-ALL] Process PIDs:'));
    
    // Display PIDs exactly like the shell script
    for (const wp of this.processes) {
      if (wp.pid) {
        const colorFn = this.getChalkColor(wp.color);
        const spacing = wp.name === 'HOST-BRIDGE' ? '' : '    '; // Match shell script spacing
        console.log(`  ${colorFn(`[${wp.name}]`)}${spacing} PID: ${wp.pid}`);
      }
    }
    
    console.log(chalk.yellow('[WATCH-ALL] Press Ctrl+C to stop all processes.'));

    // Wait for all background processes (like shell script 'wait')
    await this.waitForAllProcesses();
  }

  private getChalkColor(color: string): (text: string) => string {
    switch (color) {
      case 'red': return chalk.red;
      case 'green': return chalk.green;
      case 'blue': return chalk.blue;
      case 'yellow': return chalk.yellow;
      case 'magenta': return chalk.magenta;
      case 'cyan': return chalk.cyan;
      default: return chalk.white;
    }
  }

  private async startProcess(watchProcess: WatchProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      const colorFn = this.getChalkColor(watchProcess.color);
      
      const proc = spawn(watchProcess.command, watchProcess.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        cwd: this.projectRoot
      });

      watchProcess.process = proc;
      watchProcess.pid = proc.pid;

      // Implement prefix_output function behavior - process line by line
      const prefixOutput = (data: Buffer, isError: boolean = false) => {
        const output = data.toString();
        const lines = output.split('\n');
        
        for (const line of lines) {
          if (line.trim()) { // Only output non-empty lines
            console.log(`${colorFn(`[${watchProcess.name}]`)} ${line}`);
          }
        }
      };

      // Handle stdout with prefixed format (exactly like shell script)
      proc.stdout?.on('data', (data) => prefixOutput(data, false));

      // Handle stderr with prefixed format (exactly like shell script) 
      proc.stderr?.on('data', (data) => prefixOutput(data, true));

      proc.on('error', (error) => {
        console.error(`${colorFn(`[${watchProcess.name}]`)} Process error: ${error.message}`);
        if (!this.isShuttingDown) {
          reject(error);
        }
      });

      proc.on('exit', (code, signal) => {
        if (!this.isShuttingDown) {
          if (code !== 0) {
            console.log(`${colorFn(`[${watchProcess.name}]`)} Exited with code ${code}`);
          } else {
            console.log(`${colorFn(`[${watchProcess.name}]`)} Process ended`);
          }
        }
      });

      // Resolve immediately after spawn (like shell script & behavior)
      if (proc.pid) {
        resolve();
      } else {
        reject(new Error(`Failed to start ${watchProcess.name}`));
      }
    });
  }

  private async waitForAllProcesses(): Promise<void> {
    // Wait for all background processes (like shell script 'wait' command)
    return new Promise((resolve) => {
      const checkProcesses = () => {
        if (this.isShuttingDown) {
          resolve();
          return;
        }
        
        // Check if any processes are still running
        const runningProcesses = this.processes.filter(wp => 
          wp.process && !wp.process.killed && wp.process.exitCode === null
        );
        
        if (runningProcesses.length === 0) {
          resolve();
        } else {
          setTimeout(checkProcesses, 1000);
        }
      };
      checkProcesses();
    });
  }

  private async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isShuttingDown = true;
    console.log(chalk.yellow('\n[WATCH-ALL] Shutting down all processes...'));

    // Kill all child processes (matching shell script: jobs -p | xargs -r kill)
    const killPromises = this.processes
      .filter(wp => wp.process?.pid)
      .map(async (watchProcess) => {
        return new Promise<void>((resolve) => {
          if (!watchProcess.process?.pid) {
            resolve();
            return;
          }

          // Try graceful shutdown first (SIGTERM), then force kill (SIGKILL)
          const timeout = setTimeout(() => {
            if (watchProcess.process?.pid) {
              try {
                process.kill(watchProcess.process.pid, 'SIGKILL');
              } catch (error) {
                // Process may already be dead
              }
            }
            resolve();
          }, 2000);

          watchProcess.process.on('exit', () => {
            clearTimeout(timeout);
            resolve();
          });

          try {
            process.kill(watchProcess.process.pid, 'SIGTERM');
          } catch (error) {
            // Process may already be dead
            clearTimeout(timeout);
            resolve();
          }
        });
      });

    await Promise.all(killPromises);
    console.log(chalk.yellow('[WATCH-ALL] All processes stopped.'));
    process.exit(0);
  }
}

// Main execution
if (require.main === module) {
  const manager = new WatchAllManager();
  manager.start().catch((error) => {
    console.error(chalk.red('Failed to start watch processes:'), error);
    process.exit(1);
  });
}

export { WatchAllManager };