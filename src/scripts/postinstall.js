#!/usr/bin/env node

// This script runs after the package is installed in a consuming project
// Currently a placeholder - will be implemented when framework is ready for distribution
function postinstall() {
  console.log('🔧 Claude GitHub APM installed successfully!');
  console.log('📚 Run "npm run build:prompts" to generate enhanced prompts');
}

// Run postinstall if this script is run directly
if (require.main === module) {
  postinstall();
}