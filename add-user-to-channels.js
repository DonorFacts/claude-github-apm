const { WebClient } = require('@slack/web-api');
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

async function addUserToChannels() {
  try {
    // Get your user ID
    const usersResult = await slack.users.list();
    const you = usersResult.members.find(u => u.real_name && u.real_name.includes('Jake')) || 
                usersResult.members.find(u => u.profile?.display_name?.includes('Jake')) ||
                usersResult.members.find(u => u.profile?.real_name?.includes('Jake'));
    
    if (!you) {
      console.log('❌ Could not find your user account');
      console.log('Available users:', usersResult.members.filter(u => !u.is_bot).map(u => u.real_name || u.name).slice(0, 5));
      return;
    }
    
    console.log('✅ Found user:', you.real_name || you.name, '(' + you.id + ')');
    
    // All APM channels
    const channels = [
      'apm-coordination',
      'apm-implementation', 
      'apm-github-sync',
      'apm-alerts',
      'proj-claude-github-apm-dashboard',
      'proj-claude-github-apm-frontend',
      'proj-claude-github-apm-backend',
      'proj-claude-github-apm-testing',
      'proj-claude-github-apm-devops'
    ];
    
    console.log('Adding you to', channels.length, 'APM channels...');
    
    for (const channel of channels) {
      try {
        await slack.conversations.invite({
          channel: channel,
          users: you.id
        });
        console.log('✅ Added to #' + channel);
      } catch (e) {
        console.log('⚠️ #' + channel + ':', e.data?.error);
      }
    }
    
  } catch (e) {
    console.log('❌ Error:', e.data?.error || e.message);
  }
}

addUserToChannels();