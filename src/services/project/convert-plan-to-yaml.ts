#!/usr/bin/env node
import { MarkdownToYamlConverter } from '../../lib/MarkdownToYamlConverter';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Convert Markdown Implementation Plan to YAML format

Usage: convert-plan-to-yaml <input.md> [output.yaml] [options]

Options:
  -o, --owner <owner>     Repository owner (defaults to git remote)
  -r, --repo <name>       Repository name (defaults to git remote)
  -t, --types <json>      Custom issue type IDs as JSON
  -h, --help              Show this help message

Examples:
  # Convert using git repository info
  convert-plan-to-yaml apm/Implementation_Plan.md
  
  # Specify output file
  convert-plan-to-yaml plan.md plan.yaml
  
  # Override repository info
  convert-plan-to-yaml plan.md -o myorg -r myrepo
  
  # Custom issue types
  convert-plan-to-yaml plan.md -t '{"phase":"CUSTOM_PHASE","epic":"CUSTOM_EPIC"}'
`);
    process.exit(0);
  }
  
  // Parse arguments
  const inputPath = args[0];
  let outputPath: string | undefined;
  let owner: string | undefined;
  let repoName: string | undefined;
  let customTypes: Record<string, string> | undefined;
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-o' || arg === '--owner') {
      owner = args[++i];
    } else if (arg === '-r' || arg === '--repo') {
      repoName = args[++i];
    } else if (arg === '-t' || arg === '--types') {
      try {
        customTypes = JSON.parse(args[++i]);
      } catch (e) {
        console.error('❌ Invalid JSON for custom types');
        process.exit(1);
      }
    } else if (!arg.startsWith('-')) {
      outputPath = arg;
    }
  }
  
  // Validate input file
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }
  
  try {
    console.log('🔄 Converting markdown to YAML...');
    console.log(`📄 Input: ${inputPath}`);
    
    // Create converter
    const converter = new MarkdownToYamlConverter(customTypes);
    
    // Build repository info
    const repository = owner && repoName ? { owner, name: repoName } : undefined;
    
    // Convert file
    await converter.convertFile(inputPath, outputPath, repository);
    
    // Determine actual output path
    const actualOutputPath = outputPath || inputPath.replace(/\.md$/, '.yaml');
    
    console.log(`✅ Conversion complete!`);
    console.log(`📝 Output: ${actualOutputPath}`);
    
    // Show summary
    const yamlContent = fs.readFileSync(actualOutputPath, 'utf-8');
    const yaml = require('js-yaml');
    const plan = yaml.load(yamlContent);
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Project: ${plan.project.name}`);
    console.log(`   - Repository: ${plan.project.repository.owner}/${plan.project.repository.name}`);
    console.log(`   - Total items: ${plan.items.length}`);
    
    // Count by type
    const typeCounts: Record<string, number> = {};
    plan.items.forEach((item: Record<string, any>) => {
      typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    });
    
    console.log(`   - By type:`);
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`     • ${type}: ${count}`);
    });
    
  } catch (error: unknown) {
    console.error(`\n❌ Conversion failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();