import { IssueTypeConfigManager } from '../IssueTypeConfigManager';
import { IssueTypes } from '../../bulk-issue-creator/types';
import * as fs from 'fs';
import * as path from 'path';

describe('IssueTypeConfigManager', () => {
  let tempDir: string;
  let configPath: string;
  let configManager: IssueTypeConfigManager;

  beforeEach(() => {
    tempDir = path.join(__dirname, 'temp', Date.now().toString());
    fs.mkdirSync(tempDir, { recursive: true });
    configPath = path.join(tempDir, 'issue-types.json');
    configManager = new IssueTypeConfigManager(configPath);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('saveConfig', () => {
    it('should save issue types configuration to file', async () => {
      // Arrange
      const issueTypes: IssueTypes = {
        phase: 'IT_kwDODIcSxM4BoTQQ',
        project: 'IT_kwDODIcSxM4BoTQm',
        epic: 'IT_kwDODIcSxM4BoSKl',
        feature: 'IT_kwDODIcSxM4Bl1xX',
        story: 'IT_kwDODIcSxM4Bofqc',
        task: 'IT_kwDODIcSxM4Bl1xV',
        bug: 'IT_kwDODIcSxM4Bl1xW'
      };

      // Act
      await configManager.saveConfig(issueTypes);

      // Assert
      expect(fs.existsSync(configPath)).toBe(true);
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(savedConfig).toEqual(issueTypes);
    });

    it('should create directory if it does not exist', async () => {
      // Arrange
      const deepConfigPath = path.join(tempDir, 'nested', 'deep', 'issue-types.json');
      const deepConfigManager = new IssueTypeConfigManager(deepConfigPath);
      const issueTypes: IssueTypes = { task: 'IT_123' };

      // Act
      await deepConfigManager.saveConfig(issueTypes);

      // Assert
      expect(fs.existsSync(deepConfigPath)).toBe(true);
      const savedConfig = JSON.parse(fs.readFileSync(deepConfigPath, 'utf-8'));
      expect(savedConfig).toEqual(issueTypes);
    });
  });

  describe('loadConfig', () => {
    it('should load issue types configuration from file', async () => {
      // Arrange
      const issueTypes: IssueTypes = {
        phase: 'IT_kwDODIcSxM4BoTQQ',
        epic: 'IT_kwDODIcSxM4BoSKl',
        task: 'IT_kwDODIcSxM4Bl1xV'
      };
      fs.writeFileSync(configPath, JSON.stringify(issueTypes, null, 2));

      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result).toEqual(issueTypes);
    });

    it('should return empty object if config file does not exist', async () => {
      // Act
      const result = await configManager.loadConfig();

      // Assert
      expect(result).toEqual({});
    });

    it('should throw error if config file is malformed', async () => {
      // Arrange
      fs.writeFileSync(configPath, 'invalid json');

      // Act & Assert
      await expect(configManager.loadConfig())
        .rejects.toThrow('Failed to load issue types configuration');
    });
  });

  describe('configExists', () => {
    it('should return true if config file exists', () => {
      // Arrange
      fs.writeFileSync(configPath, '{}');

      // Act
      const result = configManager.configExists();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if config file does not exist', () => {
      // Act
      const result = configManager.configExists();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getConfigPath', () => {
    it('should return the configured path', () => {
      // Act
      const result = configManager.getConfigPath();

      // Assert
      expect(result).toBe(configPath);
    });
  });
});