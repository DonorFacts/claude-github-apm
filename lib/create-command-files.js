const fs = require('fs');
const path = require('path');

/**
 * Creates command files for all markdown files in src/prompts
 * @param {string} consumingProjectRoot - The root directory of the consuming project
 * @param {string} packageRoot - The root directory of this package
 */
function createCommandFiles(consumingProjectRoot, packageRoot) {
  const srcPromptsDir = path.join(packageRoot, 'src', 'prompts');
  const targetCommandsDir = path.join(consumingProjectRoot, '.claude', 'commands', 'apm');
  
  
  // Create the target directory structure
  fs.mkdirSync(targetCommandsDir, { recursive: true });
  
  // Recursively traverse all .md files in src/prompts
  traverseAndCreateCommands(srcPromptsDir, srcPromptsDir, targetCommandsDir);
  
  console.log('✅ Command files created successfully');
}

/**
 * Recursively traverse directories and create command files for markdown files
 * @param {string} currentDir - Current directory being traversed
 * @param {string} srcPromptsRoot - Root of src/prompts directory
 * @param {string} targetCommandsRoot - Root of target commands directory
 */
function traverseAndCreateCommands(currentDir, srcPromptsRoot, targetCommandsRoot) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively traverse subdirectories
      traverseAndCreateCommands(fullPath, srcPromptsRoot, targetCommandsRoot);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Process markdown files
      createCommandFile(fullPath, srcPromptsRoot, targetCommandsRoot);
    }
  }
}

/**
 * Create a command file for a single markdown file
 * @param {string} mdFilePath - Path to the markdown file
 * @param {string} srcPromptsRoot - Root of src/prompts directory
 * @param {string} targetCommandsRoot - Root of target commands directory
 */
function createCommandFile(mdFilePath, srcPromptsRoot, targetCommandsRoot) {
  // Get the relative path from src/prompts
  const relativePath = path.relative(srcPromptsRoot, mdFilePath);
  
  // Read the markdown file to extract the H1 heading
  const content = fs.readFileSync(mdFilePath, 'utf-8');
  const lines = content.split('\n');
  const h1Line = lines.find(line => line.startsWith('# '));
  
  if (!h1Line) {
    console.warn(`Warning: No H1 heading found in ${relativePath}`);
    return;
  }
  
  // Create the target file path
  const targetFilePath = path.join(targetCommandsRoot, relativePath);
  const targetDir = path.dirname(targetFilePath);
  
  // Ensure the target directory exists
  fs.mkdirSync(targetDir, { recursive: true });
  
  // Create the command file content
  const commandContent = `${h1Line}

Read \`./node_modules/claude-github-apm/src/prompts/${relativePath}\` and follow the instructions in that file.`;
  
  // Write the command file
  fs.writeFileSync(targetFilePath, commandContent);
  console.log(`  Created: ${path.join('.claude', 'commands', 'apm', relativePath)}`);
}


/**
 * Gets the root directory of the consuming project
 * Used by postinstall to find where npm/pnpm install was run
 */
function getConsumingProjectRoot() {
  // When running via npm/pnpm postinstall, INIT_CWD is set to the consuming project's root
  if (process.env.INIT_CWD) {
    return process.env.INIT_CWD;
  }
  
  // Fallback: assume we're in node_modules/@jakedetels/claude-github-apm
  return path.resolve(__dirname, '../../../../..');
}

module.exports = {
  createCommandFiles,
  getConsumingProjectRoot
};