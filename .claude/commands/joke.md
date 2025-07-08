# Package Dependencies Joke Generator

## Objective

Generate a humorous joke and save it to a timestamped file.

## Instructions

1. **Pick Inspiration**: Choose 1-2 interesting TS-related packages to inspire your joke (e.g., TypeScript, React, Jest, etc.)

2. **Generate Joke**: Create an original, programming-related joke that plays on:

   - The dependency name
   - What the dependency does
   - Common developer experiences with it
   - Programming puns/wordplay

3. **Create Title**: Generate a short, descriptive title for the joke (3-5 words max)

4. **Save to File**: Save the joke to `./tmp/jokes/YYMMDD_HHMMSS-joke-title.md` where:
   - `YYMMDD` = Current date (e.g., 250107 for Jan 7, 2025)
   - `HHMMSS` = Current time (e.g., 143022 for 2:30:22 PM)
   - `joke-title` = Kebab-case version of your joke title

## File Format

The saved joke file should contain:

```markdown
# [Joke Title]

**Inspired by**: [Package name(s)]
**Style**: Programming humor
**Created**: [Current timestamp]

## The Joke

[Your joke content here]

## Notes

[Brief explanation of the dependency reference or wordplay]
```

## Example

If inspired by TypeScript:

File: `./tmp/jokes/250107_143022-typescript-typing.md`

Content:

```markdown
# TypeScript Typing Joke

**Inspired by**: TypeScript
**Style**: Programming humor  
**Created**: 2025-01-07 14:30:22

## The Joke

Why did the JavaScript developer break up with TypeScript?

Because they were tired of being told what type of person they were!

## Notes

Plays on TypeScript's type system and relationship dynamics.
```

## Requirements

- Joke must be appropriate and family-friendly
- File must be saved in the exact format specified
- Title should be descriptive but concise
- Always include creation timestamp
