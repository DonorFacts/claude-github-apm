#!/usr/bin/env tsx

import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "fs";
import { join } from "path";
import chalk from "chalk";

interface ValidationResult {
  criterion: string;
  passed: boolean;
  message: string;
  details?: string;
}

class JokeValidator {
  private results: ValidationResult[] = [];
  private jokesDir = "./tmp/jokes";

  private addResult(
    criterion: string,
    passed: boolean,
    message: string,
    details?: string
  ): void {
    this.results.push({ criterion, passed, message, details });
  }

  private validateJokesDirectory(): void {
    try {
      const stats = statSync(this.jokesDir);
      this.addResult(
        "Jokes Directory",
        stats.isDirectory(),
        stats.isDirectory()
          ? "Jokes directory exists"
          : "Jokes directory is not a directory",
        `Path: ${this.jokesDir}`
      );
    } catch (error) {
      this.addResult(
        "Jokes Directory",
        false,
        "Jokes directory not found",
        `Expected path: ${this.jokesDir}`
      );
    }
  }

  private validateRecentJokeFile(): void {
    try {
      const files = readdirSync(this.jokesDir);
      const jokeFiles = files.filter((file) => file.endsWith(".md"));

      if (jokeFiles.length === 0) {
        this.addResult(
          "Joke File Created",
          false,
          "No joke files found",
          "No .md files in jokes directory"
        );
        return;
      }

      // Check for files created in the last 1 minutes
      const oneMinuteAgo = Date.now() - 1 * 60 * 1000;
      const recentFiles = jokeFiles.filter((file) => {
        const filePath = join(this.jokesDir, file);
        const stats = statSync(filePath);
        return stats.mtimeMs > oneMinuteAgo;
      });

      if (recentFiles.length === 0) {
        this.addResult(
          "Joke File Created",
          false,
          "No recent joke files found",
          `Found ${jokeFiles.length} total joke files, but none created in last 5 minutes`
        );
        return;
      }

      // Success - at least one recent file exists
      const latestFile = recentFiles.sort((a, b) => {
        const aStats = statSync(join(this.jokesDir, a));
        const bStats = statSync(join(this.jokesDir, b));
        return bStats.mtimeMs - aStats.mtimeMs;
      })[0];

      this.addResult(
        "Joke File Created",
        true,
        `Recent joke file created: ${latestFile}`,
        `Created: ${new Date(
          statSync(join(this.jokesDir, latestFile)).mtime
        ).toISOString()}`
      );
    } catch (error) {
      this.addResult(
        "Joke File Created",
        false,
        "Error checking for joke files",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  public async validateAll(): Promise<boolean> {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .split(".")[0];
    const logDir = "tmp/validation/jokes";

    console.log(chalk.blue("🃏 Validating joke creation..."));
    console.log("");

    this.validateJokesDirectory();
    this.validateRecentJokeFile();

    // Display results
    let allPassed = true;

    for (const result of this.results) {
      const icon = result.passed ? "✅" : "❌";
      const color = result.passed ? chalk.green : chalk.red;

      console.log(`${icon} ${color(result.criterion)}: ${result.message}`);

      if (result.details) {
        console.log(chalk.gray(`   ${result.details}`));
      }

      if (!result.passed) {
        allPassed = false;
      }

      console.log("");
    }

    // Summary
    const passedCount = this.results.filter((r) => r.passed).length;
    const totalCount = this.results.length;

    console.log(chalk.bold("📊 Summary:"));
    console.log(`   Passed: ${chalk.green(passedCount)}/${totalCount}`);
    console.log(
      `   Failed: ${chalk.red(totalCount - passedCount)}/${totalCount}`
    );
    console.log("");

    if (allPassed) {
      console.log(chalk.green.bold("🎉 All joke validation criteria passed!"));
    } else {
      console.log(chalk.red.bold("❌ Some joke validation criteria failed."));
      console.log(
        chalk.yellow(
          "💡 Please ensure the joke file was created with proper format."
        )
      );
    }

    // Write validation log
    try {
      mkdirSync(logDir, { recursive: true });
      const logData = {
        timestamp: new Date().toISOString(),
        scriptName: "validate-joke.ts",
        allPassed,
        passedCount,
        totalCount,
        results: this.results,
      };
      writeFileSync(
        join(logDir, `${timestamp}-result.json`),
        JSON.stringify(logData, null, 2)
      );
    } catch (error) {
      console.error("Failed to write validation log:", error);
    }

    return allPassed;
  }
}

// Main execution
async function main(): Promise<void> {
  const validator = new JokeValidator();
  const allPassed = await validator.validateAll();

  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}
