/**
 * Example usage of the agent similarity detection algorithm
 * 
 * This demonstrates how the agent-ify process would use similarity
 * detection to prevent agent proliferation.
 */

import { 
  AgentProfile, 
  checkAgentSimilarity, 
  extractKeywords 
} from './agent-similarity';

// Example: Existing agents in the system
const existingAgents: AgentProfile[] = [
  {
    id: 'react-specialist',
    name: 'React Performance Specialist',
    specialization: 'React rendering optimization and performance profiling',
    capabilities: [
      { name: 'React Profiler Analysis', category: 'technical', proficiency: 0.9 },
      { name: 'Component Optimization', category: 'technical', proficiency: 0.85 },
      { name: 'Memory Leak Detection', category: 'technical', proficiency: 0.8 },
      { name: 'Bundle Size Optimization', category: 'technical', proficiency: 0.75 }
    ],
    keywords: ['react', 'performance', 'optimization', 'profiling', 'rendering']
  },
  {
    id: 'api-integrator',
    name: 'API Integration Specialist',
    specialization: 'REST API design and third-party service integration',
    capabilities: [
      { name: 'REST API Design', category: 'technical', proficiency: 0.9 },
      { name: 'OAuth Implementation', category: 'technical', proficiency: 0.85 },
      { name: 'Webhook Management', category: 'technical', proficiency: 0.8 },
      { name: 'Rate Limit Handling', category: 'technical', proficiency: 0.8 }
    ],
    keywords: ['api', 'rest', 'integration', 'oauth', 'webhook']
  }
];

// Example 1: Trying to create a very similar agent
console.log('=== Example 1: High Overlap ===');
const newReactAgent: AgentProfile = {
  id: 'proposed-react-expert',
  name: 'React Optimization Expert',
  specialization: 'React application performance and optimization',
  capabilities: [
    { name: 'React Performance Profiling', category: 'technical', proficiency: 0.88 },
    { name: 'Component Rendering Optimization', category: 'technical', proficiency: 0.9 },
    { name: 'Code Splitting', category: 'technical', proficiency: 0.7 }
  ],
  keywords: []
};
newReactAgent.keywords = extractKeywords(newReactAgent);

const result1 = checkAgentSimilarity(newReactAgent, existingAgents);
console.log(`
Proposed: ${newReactAgent.name}
Result: ${result1.recommendation}
Overlap: ${Math.round(result1.overlapScore * 100)}% with ${result1.agent || 'none'}
Reasoning: ${result1.reasoning}
Shared capabilities: ${result1.sharedCapabilities.join(', ')}
Unique capabilities: ${result1.uniqueCapabilities.join(', ')}
`);

// Example 2: Creating a subspecialized agent
console.log('=== Example 2: Subspecialization ===');
const graphqlAgent: AgentProfile = {
  id: 'proposed-graphql-expert',
  name: 'GraphQL API Specialist',
  specialization: 'GraphQL API design and subscription management',
  capabilities: [
    { name: 'GraphQL Schema Design', category: 'technical', proficiency: 0.9 },
    { name: 'Subscription Architecture', category: 'technical', proficiency: 0.85 },
    { name: 'Apollo Server Setup', category: 'technical', proficiency: 0.8 },
    { name: 'Query Optimization', category: 'technical', proficiency: 0.8 }
  ],
  keywords: []
};
graphqlAgent.keywords = extractKeywords(graphqlAgent);

const result2 = checkAgentSimilarity(graphqlAgent, existingAgents);
console.log(`
Proposed: ${graphqlAgent.name}
Result: ${result2.recommendation}
Overlap: ${Math.round(result2.overlapScore * 100)}% with ${result2.agent || 'none'}
Reasoning: ${result2.reasoning}
`);

// Example 3: Creating a truly unique agent
console.log('=== Example 3: Unique Agent ===');
const securityAgent: AgentProfile = {
  id: 'proposed-security-expert',
  name: 'Security Audit Specialist',
  specialization: 'Application security auditing and vulnerability assessment',
  capabilities: [
    { name: 'OWASP Compliance', category: 'domain', proficiency: 0.9 },
    { name: 'Penetration Testing', category: 'technical', proficiency: 0.85 },
    { name: 'Security Code Review', category: 'process', proficiency: 0.9 },
    { name: 'Threat Modeling', category: 'process', proficiency: 0.8 }
  ],
  keywords: []
};
securityAgent.keywords = extractKeywords(securityAgent);

const result3 = checkAgentSimilarity(securityAgent, existingAgents);
console.log(`
Proposed: ${securityAgent.name}
Result: ${result3.recommendation}
Overlap: ${Math.round(result3.overlapScore * 100)}% with ${result3.agent || 'none'}
Reasoning: ${result3.reasoning}
`);

// Example 4: Integration with agent-ify process
console.log('=== Example 4: Agent-ify Integration ===');
function handleAgentifyRequest(proposedProfile: AgentProfile): void {
  const similarityResult = checkAgentSimilarity(proposedProfile, existingAgents);
  
  switch (similarityResult.recommendation) {
    case 'enhance-existing':
      console.log(`
🔍 Similar agent detected: ${similarityResult.agent}

Overlap analysis:
- Shared capabilities: ${similarityResult.sharedCapabilities.length}
- Unique capabilities: ${similarityResult.uniqueCapabilities.length}
- Similarity score: ${Math.round(similarityResult.overlapScore * 100)}%

Options:
1. Enhance ${similarityResult.agent} with new capabilities
2. Create subspecialized agent focused on: ${similarityResult.uniqueCapabilities.join(', ')}
3. Cancel creation

What would you like to do?`);
      break;
      
    case 'create-subspecialty':
      console.log(`
🎯 Subspecialization opportunity detected!

Related to: ${similarityResult.agent}
Unique focus: ${similarityResult.uniqueCapabilities.join(', ')}

This agent would complement ${similarityResult.agent} with specialized expertise.
Proceed with creation? (yes/no)`);
      break;
      
    case 'create-new':
      console.log(`
✅ Unique agent profile confirmed!

No significant overlap with existing agents.
Ready to create: ${proposedProfile.name}

Proceed? (yes/no)`);
      break;
  }
}

// Test the integration
handleAgentifyRequest(newReactAgent);
handleAgentifyRequest(graphqlAgent);
handleAgentifyRequest(securityAgent);