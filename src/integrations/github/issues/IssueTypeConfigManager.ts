import * as fs from 'fs';
import * as path from 'path';
import { IssueTypes } from '../api/types';

export class IssueTypeConfigManager {
  constructor(private configPath: string) {}

  async saveConfig(issueTypes: IssueTypes): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write config file
      const content = JSON.stringify(issueTypes, null, 2);
      fs.writeFileSync(this.configPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save issue types configuration: ${error instanceof Error ? error.message : error}`);
    }
  }

  async loadConfig(): Promise<IssueTypes> {
    try {
      if (!fs.existsSync(this.configPath)) {
        return {};
      }

      const content = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(content) as IssueTypes;
    } catch (error) {
      throw new Error(`Failed to load issue types configuration: ${error instanceof Error ? error.message : error}`);
    }
  }

  configExists(): boolean {
    return fs.existsSync(this.configPath);
  }

  getConfigPath(): string {
    return this.configPath;
  }
}