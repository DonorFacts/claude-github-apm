const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

describe("postinstall script", () => {
  const testConsumingRoot = path.join(
    __dirname,
    "..",
    ".tmp",
    "test-consuming-project"
  );
  const claudeCommandsDir = path.join(
    testConsumingRoot,
    ".claude",
    "commands",
    "apm"
  );
  const srcPromptsDir = path.join(__dirname, "..", "src", "prompts");

  beforeEach(() => {
    // Clean up any existing test directories
    if (fs.existsSync(testConsumingRoot)) {
      fs.rmSync(testConsumingRoot, { recursive: true });
    }
    fs.mkdirSync(testConsumingRoot, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(testConsumingRoot)) {
      fs.rmSync(testConsumingRoot, { recursive: true });
    }
  });

  test("should create command files for all markdown files in src/prompts", () => {
    // Set up environment to simulate installation in consuming project
    process.env.INIT_CWD = testConsumingRoot;

    // Run the postinstall script
    execSync("node scripts/postinstall.js", {
      cwd: path.dirname(__dirname),
      env: { ...process.env, INIT_CWD: testConsumingRoot },
    });

    // Check that the .claude/commands/apm directory was created
    expect(fs.existsSync(claudeCommandsDir)).toBe(true);

    // Get all markdown files from src/prompts
    const expectedFiles = getAllMarkdownFiles(srcPromptsDir);

    // Check that each expected file exists
    expectedFiles.forEach((relativePath) => {
      const filePath = path.join(claudeCommandsDir, relativePath);
      expect(fs.existsSync(filePath)).toBe(true);

      // Read the created file
      const content = fs.readFileSync(filePath, "utf-8");

      // Read the original file to get the H1 heading
      const originalPath = path.join(srcPromptsDir, relativePath);
      const originalContent = fs.readFileSync(originalPath, "utf-8");
      const h1Match = originalContent.match(/^# (.+)$/m);

      if (h1Match) {
        const expectedHeading = h1Match[0];
        const expectedContent = `${expectedHeading}

Read \`./node_modules/claude-github-apm/src/prompts/${relativePath}\` and follow the instructions in that file.`;

        expect(content).toBe(expectedContent);
      }
    });
  });


  test("should handle files without H1 headings gracefully", () => {
    // Create a test markdown file without H1
    const testMdPath = path.join(srcPromptsDir, "test-no-h1.md");
    fs.writeFileSync(testMdPath, "## This has no H1\nSome content");

    try {
      // Run the postinstall script
      execSync("node scripts/postinstall.js", {
        cwd: path.dirname(__dirname),
        env: { ...process.env, INIT_CWD: testConsumingRoot },
      });

      // The file should not be created
      const targetPath = path.join(claudeCommandsDir, "test-no-h1.md");
      expect(fs.existsSync(targetPath)).toBe(false);
    } finally {
      // Clean up test file
      if (fs.existsSync(testMdPath)) {
        fs.unlinkSync(testMdPath);
      }
    }
  });
});

// Helper function to recursively get all markdown files
function getAllMarkdownFiles(dir, basePath = dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      getAllMarkdownFiles(fullPath, basePath, files);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const relativePath = path.relative(basePath, fullPath);
      files.push(relativePath);
    }
  }

  return files;
}
