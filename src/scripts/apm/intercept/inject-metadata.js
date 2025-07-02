#!/usr/bin/env node
// Intercept and inject metadata into Claude messages

const originalFetch = global.fetch;

// Override fetch to inject metadata
global.fetch = async function(url, options) {
  // Only intercept Anthropic API calls
  if (url.includes('anthropic.com') && options?.body) {
    const body = JSON.parse(options.body);
    
    // If this is a message to Claude
    if (body.messages && body.messages.length > 0) {
      const lastMessage = body.messages[body.messages.length - 1];
      
      if (lastMessage.role === 'user') {
        // Inject metadata
        const metadata = await generateMetadata();
        lastMessage.content = `${metadata}\n\n${lastMessage.content}`;
        
        // Update the request
        options.body = JSON.stringify(body);
      }
    }
  }
  
  return originalFetch(url, options);
};

async function generateMetadata() {
  const { execSync } = require('child_process');
  
  // Collect metadata
  const metadata = {
    timestamp: new Date().toISOString(),
    git: {
      branch: execSync('git branch --show-current').toString().trim(),
      uncommitted: execSync('git status --porcelain | wc -l').toString().trim(),
      lastCommit: execSync('git log -1 --format="%ar"').toString().trim()
    },
    conversation: {
      // This would need integration with session tracking
      turns: process.env.CONVERSATION_TURNS || 'unknown',
      tokensUsed: process.env.TOKENS_USED || 'unknown'
    }
  };
  
  return `[System Context: ${JSON.stringify(metadata, null, 2)}]`;
}