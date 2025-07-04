#!/usr/bin/env tsx
/**
 * YAML Helper for APM CLI operations
 * Provides YAML read/write operations for session registry
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';

interface Session {
  id: string;
  status: string;
  role: string;
  specialization: string;
  worktree: string;
  branch: string;
  last_heartbeat: string;
  created: string;
  context_file: string;
}

interface Registry {
  sessions: Session[];
}

function readRegistry(registryPath: string): Registry {
  if (!fs.existsSync(registryPath)) {
    return { sessions: [] };
  }
  
  const content = fs.readFileSync(registryPath, 'utf8');
  return yaml.load(content) as Registry;
}

function writeRegistry(registryPath: string, registry: Registry): void {
  const yamlContent = yaml.dump(registry, { 
    indent: 2,
    lineWidth: -1,
    quotingType: '"'
  });
  fs.writeFileSync(registryPath, yamlContent);
}

// CLI operations
const operation = process.argv[2];
const registryPath = process.argv[3];

switch (operation) {
  case 'list-sessions':
    const registry = readRegistry(registryPath);
    registry.sessions.forEach(session => {
      console.log(`${session.id}|${session.status}|${session.last_heartbeat}|${session.role}|${session.specialization}|${session.worktree}`);
    });
    break;
    
  case 'convert-from-json':
    const jsonPath = process.argv[4];
    if (!fs.existsSync(jsonPath)) {
      console.error('JSON file not found');
      process.exit(1);
    }
    
    const jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    writeRegistry(registryPath, jsonContent);
    console.log(`Converted ${jsonPath} to ${registryPath}`);
    break;
    
  default:
    console.error('Usage: yaml-helper.ts <operation> <registry-path> [json-path]');
    console.error('Operations: list-sessions, convert-from-json');
    process.exit(1);
}