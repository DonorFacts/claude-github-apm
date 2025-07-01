#!/bin/bash
# Extract bug patterns and solutions from git history

output_file="./apm/memory/bugs/recent-patterns.md"
mkdir -p ./apm/memory/bugs

cat > "$output_file" << EOF
# Bug Patterns & Solutions
Generated: $(date)

## Recent Bug Fixes
EOF

# Analyze bug fix commits
git log --grep="fix\|bug" --pretty=format:"%h %s" -20 | while read commit; do
    hash=$(echo "$commit" | cut -d' ' -f1)
    message=$(echo "$commit" | cut -d' ' -f2-)
    
    # Get the diff to understand the fix
    diff_summary=$(git diff-tree --no-commit-id --name-status -r $hash)
    
    cat >> "$output_file" << EOF

### $message
**Commit**: $hash
**Pattern**: 
EOF
    
    # Try to extract the actual fix
    git show $hash --format="" | head -20 >> "$output_file"
    
    echo "---" >> "$output_file"
done

echo "Bug patterns extracted to $output_file"