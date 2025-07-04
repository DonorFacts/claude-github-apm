#!/bin/bash
# Complete PR creation workflow with GitHub issue integration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

CURRENT_BRANCH=$(git branch --show-current)
ISSUE_NUMBER=$(echo "$CURRENT_BRANCH" | grep -o 'feature-[0-9]*' | grep -o '[0-9]*' || echo "")

# Step 1: Ensure GitHub issue exists
ensure_github_issue() {
    if [ -z "$ISSUE_NUMBER" ]; then
        log_warning "No issue number found in branch name: $CURRENT_BRANCH"
        log_info "Creating GitHub issue first..."
        
        # Use the first commit to create meaningful issue title
        ISSUE_TITLE=$(git log --format="%s" main..HEAD | head -1 | cut -d: -f2- | sed 's/^ *//')
        ISSUE_BODY=$(./src/worktrees/git-ops/generate-issue-body.sh)
        
        # Create issue and capture number
        if command -v gh >/dev/null 2>&1; then
            ISSUE_URL=$(gh issue create \
                --title "$ISSUE_TITLE" \
                --body "$ISSUE_BODY" \
                --label "enhancement" \
                --assignee "@me")
            
            # Extract issue number from URL
            ISSUE_NUMBER=$(echo "$ISSUE_URL" | grep -o '[0-9]*$')
            log_success "Created GitHub issue #$ISSUE_NUMBER"
        else
            log_error "GitHub CLI (gh) not found. Please install it or create issue manually."
            exit 1
        fi
    else
        log_success "Using existing issue #$ISSUE_NUMBER from branch name"
    fi
}

# Step 2: Check for existing PRs
check_existing_prs() {
    log_info "Checking for existing PRs..."
    
    # Check for existing open PR
    local existing_pr_list=$(gh pr list --head "$CURRENT_BRANCH" --state open 2>/dev/null || echo "")
    
    if [[ -n "$existing_pr_list" ]]; then
        local pr_num=$(echo "$existing_pr_list" | head -1 | awk '{print $1}')
        if [[ -n "$pr_num" ]]; then
            local pr_url=$(gh pr view "$pr_num" --json url -q '.url' 2>/dev/null || echo "")
            log_success "Open PR already exists: #$pr_num - $pr_url"
            log_info "Updating existing PR body..."
            gh pr edit "$pr_num" --body "$(./src/scripts/git/generate-pr-body.sh "$ISSUE_NUMBER")"
            log_success "PR updated successfully!"
            exit 0
        fi
    fi
    
    # Check for closed PR that might need reopening
    local closed_pr_list=$(gh pr list --head "$CURRENT_BRANCH" --state closed 2>/dev/null || echo "")
    
    if [[ -n "$closed_pr_list" ]]; then
        local pr_num=$(echo "$closed_pr_list" | head -1 | awk '{print $1}')
        if [[ -n "$pr_num" ]]; then
            # Check if PR was merged (if merged, don't reopen)
            local pr_merged=$(gh pr view "$pr_num" --json mergedAt -q '.mergedAt' 2>/dev/null || echo "null")
            if [[ "$pr_merged" == "null" ]]; then
                log_info "Reopening closed PR #$pr_num"
                gh pr reopen "$pr_num"
                gh pr edit "$pr_num" --body "$(./src/scripts/git/generate-pr-body.sh "$ISSUE_NUMBER")"
                log_success "PR reopened and updated!"
                exit 0
            fi
        fi
    fi
}

# Step 3: Create new PR
create_new_pr() {
    log_info "Creating new PR..."
    
    # Generate title from first commit if not provided
    local title="$1"
    if [ -z "$title" ]; then
        title=$(git log --format="%s" main..HEAD | head -1)
    fi
    
    # Push branch if needed
    if ! git ls-remote --exit-code --heads origin "$CURRENT_BRANCH" >/dev/null 2>&1; then
        log_info "Pushing branch to origin..."
        git push -u origin "$CURRENT_BRANCH"
    fi
    
    # Create PR with generated body
    local pr_url=$(gh pr create \
        --title "$title" \
        --body "$(./src/scripts/git/generate-pr-body.sh "$ISSUE_NUMBER")" \
        --assignee "@me")
    
    log_success "PR created successfully: $pr_url"
}

# Main execution
main() {
    log_info "Starting PR creation workflow for branch: $CURRENT_BRANCH"
    
    ensure_github_issue
    check_existing_prs
    create_new_pr "$1"
    
    log_success "PR workflow completed!"
}

# Run main function with title argument if provided
main "$@"