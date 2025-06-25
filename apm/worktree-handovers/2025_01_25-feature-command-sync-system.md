# Worktree Handover: feature-command-sync-system

## Agent Initialization

**Role**: developer  
**Initialize with**: `src/prompts/agents/developer/init.md`

## Task Context

**GitHub Issue**: None (draft feature)  
**Purpose**: Implement command sync system to migrate prompts from src/prompts/ to .claude/commands/  
**Scope**: Create automated system to classify prompts as public/private and sync public commands with proper naming convention

## Memory Transfer from Previous Session

### Work Already Completed
- Created comprehensive naming convention documentation at `docs/command-naming-convention.md`
- Implemented CommandClassifier to distinguish public vs private prompts
- Implemented CommandNameTransformer with domain-based naming convention
- Written comprehensive test suite following TDD practices
- Tests are failing in expected ways (TDD red phase completed)

### Current State
- Command classifier has 2 failing tests that need fixes:
  1. "should classify files only imported by others as private" - agents/init.md not being classified correctly
  2. "should identify deeply nested private includes" - base.md being classified as public when it should be private
- Command name transformer tests are all passing
- File watcher tests are written but implementation is pending

### Key Context
- Following strict TDD methodology
- Public prompts = commands that users can directly invoke
- Private prompts = includes/imports used by other prompts
- The classification logic needs refinement for edge cases where files are imported but also have standalone value
- Using TypeScript with Jest for testing
- Must follow the naming convention defined in docs/command-naming-convention.md

## Immediate Next Steps

1. Read this handover file completely
2. Initialize as Developer agent
3. Fix the 2 failing classifier tests:
   - Debug why agents/init.md isn't in private array
   - Fix base.md being classified as public in deeply nested scenario
4. Implement the FileWatcher class to pass its tests
5. Implement the PromptAnalyzer class for import detection
6. Create the main sync script that ties everything together
7. Add the watch:commands script to package.json
8. Test the complete system end-to-end

## Resources and References

- Key files to review:
  - `docs/command-naming-convention.md` - The complete specification
  - `src/command-sync/command-classifier.ts` - Has 2 failing tests to fix
  - `src/command-sync/command-name-transformer.ts` - Working correctly
  - `tests/command-sync/*.test.ts` - All test files
- Documentation to consult:
  - The naming convention uses domain-category-action-modifier pattern
  - See migration mapping in the docs for expected transformations

## Special Instructions

- Maintain TDD discipline - fix tests before implementing file watcher
- The classifier logic for determining public vs private is nuanced:
  - Files not imported by anyone = public
  - Files imported by others = usually private
  - Exception: Files with substantial content and no imports might be public even if imported
- Consider using chokidar for file watching implementation
- The system should watch `src/prompts/**/*.md` and sync to `.claude/commands/`