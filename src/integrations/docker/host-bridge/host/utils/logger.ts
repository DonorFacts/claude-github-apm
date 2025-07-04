/**
 * Logger Utility
 * Handles logging to console and file
 */

import * as fs from 'fs';

export class Logger {
  constructor(private readonly logFile: string) {}
  
  log(level: string, message: string): void {
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    
    // Write to console
    process.stdout.write(logLine);
    
    // Append to log file
    try {
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
}