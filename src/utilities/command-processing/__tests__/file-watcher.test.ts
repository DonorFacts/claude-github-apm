import { FileWatcher } from '../file-watcher';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('FileWatcher', () => {
  const testDir = '/tmp/file-watcher-test';
  const sourceDir = path.join(testDir, 'src/prompts');
  const targetDir = path.join(testDir, '.claude/commands');
  const shortcutDir = path.join(testDir, '-');
  
  beforeEach(() => {
    // Clean up and create test directories
    if (fs.existsSync(testDir)) {
      execSync(`rm -rf ${testDir}`);
    }
    fs.mkdirSync(sourceDir, { recursive: true });
    fs.mkdirSync(targetDir, { recursive: true });
    fs.mkdirSync(shortcutDir, { recursive: true });
  });
  
  afterEach(() => {
    // Clean up
    if (fs.existsSync(testDir)) {
      execSync(`rm -rf ${testDir}`);
    }
  });
  
  describe('file syncing', () => {
    it('should sync files from source to both target directories on file change', async () => {
      // Create a test file
      const testFile = path.join(sourceDir, 'test.md');
      const initialContent = '# Initial content';
      fs.writeFileSync(testFile, initialContent);
      
      // Create file watcher
      const watcher = new FileWatcher({
        sourcePath: sourceDir,
        targetPath: targetDir,
        shortcutPath: shortcutDir,
        syncOnStart: true
      });
      
      // Start watcher
      await watcher.start();
      
      // Wait for initial sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check initial sync
      const targetFile1 = path.join(targetDir, 'test.md');
      const targetFile2 = path.join(shortcutDir, 'test.md');
      
      expect(fs.existsSync(targetFile1)).toBe(true);
      expect(fs.existsSync(targetFile2)).toBe(true);
      expect(fs.readFileSync(targetFile1, 'utf8')).toBe(initialContent);
      expect(fs.readFileSync(targetFile2, 'utf8')).toBe(initialContent);
      
      // Update the source file
      const updatedContent = '# Updated content\n\nNew line here';
      fs.writeFileSync(testFile, updatedContent);
      
      // Wait for file watcher to process the change
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check that both target files are updated
      expect(fs.readFileSync(targetFile1, 'utf8')).toBe(updatedContent);
      expect(fs.readFileSync(targetFile2, 'utf8')).toBe(updatedContent);
      
      // Stop watcher
      await watcher.stop();
    });
    
    it('should handle multiple file updates correctly', async () => {
      // Create test files
      const file1 = path.join(sourceDir, 'file1.md');
      const file2 = path.join(sourceDir, 'file2.md');
      
      fs.writeFileSync(file1, 'File 1 content');
      fs.writeFileSync(file2, 'File 2 content');
      
      // Create and start watcher
      const watcher = new FileWatcher({
        sourcePath: sourceDir,
        targetPath: targetDir,
        shortcutPath: shortcutDir,
        syncOnStart: true
      });
      
      await watcher.start();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update both files
      fs.writeFileSync(file1, 'File 1 updated');
      fs.writeFileSync(file2, 'File 2 updated');
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check all target files
      expect(fs.readFileSync(path.join(targetDir, 'file1.md'), 'utf8')).toBe('File 1 updated');
      expect(fs.readFileSync(path.join(targetDir, 'file2.md'), 'utf8')).toBe('File 2 updated');
      expect(fs.readFileSync(path.join(shortcutDir, 'file1.md'), 'utf8')).toBe('File 1 updated');
      expect(fs.readFileSync(path.join(shortcutDir, 'file2.md'), 'utf8')).toBe('File 2 updated');
      
      await watcher.stop();
    });
    
    it('should handle nested directories correctly', async () => {
      // Create nested structure
      const nestedDir = path.join(sourceDir, 'agents', 'developer');
      fs.mkdirSync(nestedDir, { recursive: true });
      
      const nestedFile = path.join(nestedDir, 'tdd.md');
      fs.writeFileSync(nestedFile, 'TDD content');
      
      // Create and start watcher
      const watcher = new FileWatcher({
        sourcePath: sourceDir,
        targetPath: targetDir,
        shortcutPath: shortcutDir,
        syncOnStart: true
      });
      
      await watcher.start();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check that the file is transformed and synced with flattened name
      const expectedName = 'agent-developer-tdd.md';
      expect(fs.existsSync(path.join(targetDir, expectedName))).toBe(true);
      expect(fs.existsSync(path.join(shortcutDir, expectedName))).toBe(true);
      
      // Update the nested file
      fs.writeFileSync(nestedFile, 'Updated TDD content');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check updates
      expect(fs.readFileSync(path.join(targetDir, expectedName), 'utf8')).toBe('Updated TDD content');
      expect(fs.readFileSync(path.join(shortcutDir, expectedName), 'utf8')).toBe('Updated TDD content');
      
      await watcher.stop();
    });
    
    it('should remove files from target directories when source is deleted', async () => {
      // Create test file
      const testFile = path.join(sourceDir, 'temp.md');
      fs.writeFileSync(testFile, 'Temporary content');
      
      // Create and start watcher
      const watcher = new FileWatcher({
        sourcePath: sourceDir,
        targetPath: targetDir,
        shortcutPath: shortcutDir,
        syncOnStart: true
      });
      
      await watcher.start();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify files exist
      const targetFile1 = path.join(targetDir, 'temp.md');
      const targetFile2 = path.join(shortcutDir, 'temp.md');
      expect(fs.existsSync(targetFile1)).toBe(true);
      expect(fs.existsSync(targetFile2)).toBe(true);
      
      // Delete source file
      fs.unlinkSync(testFile);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verify files are removed
      expect(fs.existsSync(targetFile1)).toBe(false);
      expect(fs.existsSync(targetFile2)).toBe(false);
      
      await watcher.stop();
    });
  });
});