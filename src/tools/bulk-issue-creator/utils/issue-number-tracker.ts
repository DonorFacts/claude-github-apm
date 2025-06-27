import * as fs from 'fs';
import * as path from 'path';

const TRACKER_FILE = path.join(__dirname, '.issue-numbers.json');

interface IssueNumberData {
  lastNumber: number;
  history: Array<{
    number: number;
    timestamp: string;
    title: string;
  }>;
}

export class IssueNumberTracker {
  private data: IssueNumberData;

  constructor() {
    this.data = this.load();
  }

  private load(): IssueNumberData {
    try {
      if (fs.existsSync(TRACKER_FILE)) {
        const content = fs.readFileSync(TRACKER_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.log('Failed to load issue number history:', error);
    }
    return { lastNumber: 0, history: [] };
  }

  private save(): void {
    try {
      fs.writeFileSync(TRACKER_FILE, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.log('Failed to save issue number history:', error);
    }
  }

  recordIssue(number: number, title: string): void {
    console.log(`\n🔍 Issue Number Tracking:`);
    console.log(`   Previous highest: #${this.data.lastNumber}`);
    console.log(`   New issue: #${number}`);
    
    if (this.data.lastNumber > 0) {
      if (number > this.data.lastNumber) {
        console.log(`   ✅ VALID: Issue number increased (${number - this.data.lastNumber} higher)`);
      } else {
        console.log(`   ❌ SUSPICIOUS: Issue number did NOT increase!`);
        console.log(`      This suggests the issue was not actually created on GitHub.`);
      }
    } else {
      console.log(`   ℹ️  First tracked issue`);
    }

    this.data.history.push({
      number,
      timestamp: new Date().toISOString(),
      title
    });
    
    if (number > this.data.lastNumber) {
      this.data.lastNumber = number;
    }
    
    // Keep only last 20 entries
    if (this.data.history.length > 20) {
      this.data.history = this.data.history.slice(-20);
    }
    
    this.save();
  }

  expectIncreasingNumber(number: number): void {
    if (this.data.lastNumber > 0 && number <= this.data.lastNumber) {
      throw new Error(
        `Issue number validation failed! Expected > ${this.data.lastNumber}, but got ${number}. ` +
        `This indicates the issue was not actually created on GitHub.`
      );
    }
  }

  getLastNumber(): number {
    return this.data.lastNumber;
  }

  reset(): void {
    this.data = { lastNumber: 0, history: [] };
    this.save();
  }
}