# Breakdown Project Plan

As a Scrum Master, break down large Implementation Plans into manageable, well-organized files while maintaining the exact same structure as the original.

## Process Overview

This command focuses solely on structural organization - splitting a large monolithic plan into multiple files for better manageability. The critique and quality review aspects are handled separately by the `critique-project-plan` command.

## Breakdown Process

### 1. Locate and Assess the Plan

First, check if the Implementation Plan exists:

```bash
# Default location
if [ -f ".apm/Implementation_Plan.md" ]; then
    echo "Found Implementation Plan at .apm/Implementation_Plan.md"
    wc -l .apm/Implementation_Plan.md
else
    echo "Please provide the location of the Implementation Plan"
fi
```

### 2. Size Assessment

**Single File Threshold**: ~150 lines

- **Small Plans (<150 lines)**: Keep as single file, no action needed
- **Medium Plans (150-500 lines)**: Split by major sections
- **Large Plans (>500 lines)**: Split by phases or epics

### 3. Create Directory Structure

```bash
# Create the breakdown directory
mkdir -p .apm/Implementation_Plan

# Preserve original as Full version
cp .apm/Implementation_Plan.md .apm/Implementation_Plan_Full.md
```

### 4. Create Overview Document

Create `00_Plan_Overview.md` with high-level structure:

```markdown
# Implementation Plan Overview

## Project Summary
[High-level project description and goals]

## Plan Structure

This implementation plan is organized into the following sections:

1. **Phase 1: Foundation** → `01_Phase_1_Foundation.md`
2. **Phase 2: Core Features** → `02_Phase_2_Core_Features.md`
3. **Phase 3: Integration** → `03_Phase_3_Integration.md`
4. **Phase 4: Polish** → `04_Phase_4_Polish.md`

## Timeline Overview
[High-level timeline without task details]

## Key Milestones
[Major milestones only, no sub-tasks]

## Dependencies Overview
[High-level dependency relationships between phases]

## Note on GitHub-Native Memory System
[Include from original]

## Note on Handover Protocol
[Include from original]
```

### 5. Split Into Phase Files

For each major section/phase, create a separate file:

#### Naming Convention
- Use format: `0X_Phase_Name.md`
- Use Upper_Snake_Case for multi-word names
- Maintain sequential numbering

#### File Structure Template

```markdown
# Phase X: [Phase Name]

## Phase Overview
[Brief description of this phase's goals]

## Timeline
[Specific timeline for this phase]

## Epics

### Epic X.1: [Epic Name]
**GitHub Issue Type**: Epic
**Estimated Duration**: X days
**Assigned Team**: [Team designation]

#### Objectives
[Full epic objectives from original]

#### Tasks
[All tasks under this epic, maintaining original structure]

### Epic X.2: [Epic Name]
[Continue pattern...]

## Dependencies
[Dependencies specific to this phase]

## Success Criteria
[Phase-specific success metrics]
```

### 6. Maintain Exact Structure

**Critical**: When splitting files, maintain:
- All original content (no omissions except in overview)
- Exact hierarchical structure
- All issue type annotations
- All team assignments
- All technical details
- Original formatting and markdown structure

### 7. Cross-Reference System

Add navigation helpers to each file:

```markdown
---
Navigation: [Previous: 01_Phase_1.md] | [Overview: 00_Plan_Overview.md] | [Next: 03_Phase_3.md]
---
```

### 8. Validation Checklist

After splitting, verify:

- [ ] All content from original is preserved
- [ ] File sizes are manageable (~50-200 lines each)
- [ ] Overview accurately reflects structure
- [ ] Cross-references are correct
- [ ] Original plan backed up as `Implementation_Plan_Full.md`
- [ ] Directory structure is clean and logical

### 9. Example Breakdown

For a typical project:

```
.apm/
├── Implementation_Plan.md (original - kept for reference)
├── Implementation_Plan_Full.md (backup copy)
└── Implementation_Plan/
    ├── 00_Plan_Overview.md
    ├── 01_Phase_1_Foundation.md
    ├── 02_Phase_2_Core_Implementation.md
    ├── 03_Phase_3_Integration.md
    ├── 04_Phase_4_Testing_And_Polish.md
    └── 05_Appendix_Technical_Decisions.md
```

### 10. Completion Report

After breakdown, provide summary:

```markdown
# Implementation Plan Breakdown Complete

## Summary
- Original Plan: X lines
- Split into: Y files
- Average file size: Z lines

## Files Created
1. `00_Plan_Overview.md` - High-level overview
2. `01_Phase_1_Foundation.md` - Foundation phase details
3. [List all created files...]

## Next Steps
- Review individual phase files for clarity
- Run `critique-project-plan` for quality assessment
- Update team on new structure
```

## Usage Notes

- This command focuses ONLY on structural organization
- No content modification or quality judgments
- Preserves all original information
- For quality review, use `critique-project-plan` command
- For small projects (<150 lines), this step can be skipped

Remember: The goal is better organization and navigation, not content modification. Every detail from the original plan must be preserved in the breakdown.