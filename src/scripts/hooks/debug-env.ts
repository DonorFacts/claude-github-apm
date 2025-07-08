#!/usr/bin/env tsx

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
const logDir = 'tmp/validation/hooks';

mkdirSync(logDir, { recursive: true });

const envData = {
  timestamp: new Date().toISOString(),
  allEnvVars: process.env,
  claudeSpecific: Object.entries(process.env).filter(([key]) => 
    key.includes('CLAUDE') || key.includes('Claude')
  ).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
};

writeFileSync(
  join(logDir, `${timestamp}-env-debug.json`),
  JSON.stringify(envData, null, 2)
);

console.log('Environment variables logged');