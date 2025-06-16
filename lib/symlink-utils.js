const fs = require('fs');
const path = require('path');

/**
 * Creates a symlink from .claude/commands/apm to the APM prompts directory
 * @param {string} targetProjectRoot - The root directory of the consuming project
 * @param {string} packageRoot - The root directory of this package
 * @returns {boolean} - Whether the symlink was successfully created
 */
function createApmSymlink(targetProjectRoot, packageRoot) {
  try {
    // Source directory (src/prompts in this package)
    const sourceDir = path.join(packageRoot, 'src', 'prompts');
    
    // Target directory in consuming repo
    const commandsDir = path.join(targetProjectRoot, '.claude', 'commands');
    const symlinkPath = path.join(commandsDir, 'apm');
    
    // Check if source directory exists
    if (!fs.existsSync(sourceDir)) {
      console.error('❌ Source prompts directory not found:', sourceDir);
      return false;
    }
    
    // Create commands directory if it doesn't exist
    if (!fs.existsSync(commandsDir)) {
      fs.mkdirSync(commandsDir, { recursive: true });
    }
    
    // Remove existing symlink if it exists
    if (fs.existsSync(symlinkPath)) {
      try {
        fs.unlinkSync(symlinkPath);
      } catch (e) {
        // Ignore errors when removing
      }
    }
    
    // Create the symlink
    fs.symlinkSync(sourceDir, symlinkPath, 'dir');
    console.log('✓ Created symlink: .claude/commands/apm -> APM prompts');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to create APM symlink:', error.message);
    return false;
  }
}

/**
 * Gets the root directory of the consuming project
 * Used by postinstall to find where npm/pnpm install was run
 */
function getConsumingProjectRoot() {
  // INIT_CWD is set by npm/pnpm to the directory where install was run
  if (process.env.INIT_CWD) {
    return process.env.INIT_CWD;
  }
  
  // Fallback to current working directory
  return process.cwd();
}

module.exports = {
  createApmSymlink,
  getConsumingProjectRoot
};