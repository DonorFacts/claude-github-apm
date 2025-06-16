#!/usr/bin/env node

const path = require('path');
const { createApmSymlink, getConsumingProjectRoot } = require('../lib/symlink-utils');

// This script runs after the package is installed in a consuming project
// Note: It may not run for linked packages (e.g., link:../path or pnpm link)
function postinstall() {
  console.log('🔧 Running claude-github-apm postinstall...');
  
  const packageRoot = path.dirname(__dirname);
  const consumingProjectRoot = getConsumingProjectRoot();
  
  console.log('Package root:', packageRoot);
  console.log('Consuming project root:', consumingProjectRoot);
  
  // Create the APM symlink
  createApmSymlink(consumingProjectRoot, packageRoot);
}

postinstall();