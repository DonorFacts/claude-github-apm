#!/bin/bash

# Git Worktree Removal Script
# Safely removes completed worktrees with comprehensive cleanup
# Usage: ./worktree-remove.sh [branch-name]
# Run from main project directory

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

# Step 1: Identify target worktree
identify_worktree() {
    log_info "Current worktrees:"
    git worktree list
    
    local worktree_count=$(git worktree list | grep -v "$(pwd)" | wc -l)
    
    if [ $worktree_count -eq 1 ]; then
        # Auto-select single worktree
        WORKTREE_PATH=$(git worktree list | grep -v "$(pwd)" | awk '{print $1}')
        BRANCH_NAME=$(git worktree list | grep -v "$(pwd)" | awk '{print $2}' | sed 's/\[//' | sed 's/\]//')
        log_info "Auto-selected worktree: $BRANCH_NAME at $WORKTREE_PATH"
    elif [ $worktree_count -gt 1 ]; then
        if [ -n "$1" ]; then
            BRANCH_NAME="$1"
            WORKTREE_PATH="../worktrees/$BRANCH_NAME"
        else
            log_error "Multiple worktrees found. Please specify branch name:"
            git worktree list | grep -v "$(pwd)" | nl
            exit 1
        fi
    else
        log_info "No worktrees found to remove."
        exit 0
    fi
    
    # Extract issue number from branch name (format: feature-123-description)
    ISSUE_NUMBER=$(echo "$BRANCH_NAME" | grep -o 'feature-[0-9]*' | grep -o '[0-9]*' || true)
    if [ -n "$ISSUE_NUMBER" ]; then
        log_info "Detected GitHub issue: #$ISSUE_NUMBER"
    fi
}

# Step 2: Safety verification
verify_safety() {
    log_info "Running safety checks..."
    
    # Check 1: Uncommitted changes in worktree
    log_info "Checking for uncommitted changes..."
    if [ -d "$WORKTREE_PATH" ]; then
        local current_dir=$(pwd)
        cd "$WORKTREE_PATH" 2>/dev/null || {
            log_warning "Cannot access worktree directory. It may already be removed."
            cd "$current_dir"
            return 0
        }
        
        local uncommitted=$(git status --porcelain | wc -l)
        if [ $uncommitted -gt 0 ]; then
            log_error "STOP: Uncommitted changes found in worktree:"
            git status --short
            echo ""
            echo "Please commit or stash changes before removing worktree."
            echo "Or use 'git status' to review and 'git add . && git commit -m \"final work\"'"
            cd "$current_dir"
            exit 1
        fi
        log_success "No uncommitted changes"
        cd "$current_dir"
    fi
    
    # Check 2: Unmerged commits
    log_info "Checking for unmerged commits..."
    local unmerged_commits=$(git log main..$BRANCH_NAME --oneline | wc -l)
    if [ $unmerged_commits -gt 0 ]; then
        log_error "STOP: Branch has unmerged commits:"
        git log main..$BRANCH_NAME --oneline
        echo ""
        echo "These commits are not in main. Please:"
        echo "1. Ensure PR is merged, or"
        echo "2. Merge the branch manually: git checkout main && git merge $BRANCH_NAME"
        exit 1
    fi
    log_success "All commits are merged into main"
    
    # Check 3: GitHub PR status
    log_info "Checking GitHub PR status..."
    if command -v gh >/dev/null 2>&1 && [ -n "$ISSUE_NUMBER" ]; then
        local pr_status=$(gh pr list --head "$BRANCH_NAME" --state all --json state --jq '.[0].state' 2>/dev/null || echo "")
        case "$pr_status" in
            "MERGED")
                log_success "PR is merged"
                ;;
            "CLOSED")
                log_warning "PR is closed (not merged)"
                ;;
            "OPEN")
                log_error "STOP: PR is still open"
                echo "Please merge or close the PR before removing worktree"
                local pr_url=$(gh pr list --head "$BRANCH_NAME" --json url --jq '.[0].url' 2>/dev/null || echo "")
                [ -n "$pr_url" ] && echo "PR URL: $pr_url"
                exit 1
                ;;
            *)
                log_warning "No PR found for this branch"
                ;;
        esac
    else
        log_info "GitHub CLI not available or no issue number - skipping PR check"
    fi
    
    log_success "All safety checks passed"
}

# Step 3: Cleanup actions
perform_cleanup() {
    log_info "Starting cleanup process..."
    
    # Remove git worktree
    log_info "Removing git worktree..."
    if [ -d "$WORKTREE_PATH" ]; then
        git worktree remove "$WORKTREE_PATH" --force
        log_success "Worktree removed: $WORKTREE_PATH"
    else
        log_info "Worktree directory already removed"
    fi
    
    # Clean up worktree references
    git worktree prune
    log_success "Worktree references cleaned"
    
    # Remove handover files
    log_info "Cleaning up handover files..."
    if [ -d "apm/worktree-handovers" ]; then
        find apm/worktree-handovers -name "*$BRANCH_NAME.md" -delete 2>/dev/null
        find apm/worktree-handovers -type d -empty -delete 2>/dev/null
        log_success "Handover files cleaned"
    fi
    
    # Handle GitHub issue (automatic closure)
    if command -v gh >/dev/null 2>&1 && [ -n "$ISSUE_NUMBER" ]; then
        local issue_state=$(gh issue view "$ISSUE_NUMBER" --json state --jq '.state' 2>/dev/null || echo "")
        if [ "$issue_state" = "OPEN" ]; then
            log_info "Closing GitHub issue #$ISSUE_NUMBER (work completed)"
            gh issue close "$ISSUE_NUMBER" --comment "Work completed and worktree cleaned up automatically"
            log_success "GitHub issue #$ISSUE_NUMBER closed"
        else
            log_info "GitHub issue #$ISSUE_NUMBER is already closed"
        fi
    fi
    
    # Delete the feature branch (interactive)
    echo ""
    log_info "Should I delete the feature branch '$BRANCH_NAME'?"
    echo "Since it's merged, the branch is no longer needed."
    echo "1. Delete branch (recommended)"
    echo "2. Keep branch"
    read -p "Please enter 1 or 2: " -r choice
    case $choice in
        1)
            git branch -d "$BRANCH_NAME" 2>/dev/null && log_success "Branch $BRANCH_NAME deleted" || log_warning "Branch deletion failed (may not exist locally)"
            ;;
        2)
            log_info "Branch $BRANCH_NAME kept"
            ;;
        *)
            log_warning "Invalid choice, keeping branch"
            ;;
    esac
}

# Step 4: User guidance
provide_guidance() {
    echo ""
    echo "🎯 WORKTREE CLEANUP COMPLETE"
    echo ""
    echo "What was cleaned up:"
    log_success "Worktree removed: $WORKTREE_PATH"
    log_success "Handover files cleaned"
    log_success "Git references pruned"
    [ -n "$ISSUE_NUMBER" ] && log_success "GitHub issue #$ISSUE_NUMBER handled"
    echo ""
    echo "┌─────────────────────────────────────────────┐"
    echo "│  📝 VS Code Window Management:              │"
    echo "│  • Close VS Code window for: $BRANCH_NAME"
    echo "│  • Keep this main window open               │"
    echo "└─────────────────────────────────────────────┘"
    echo ""
    
    # Show remaining worktrees if any
    local remaining_worktrees=$(git worktree list | grep -v "$(pwd)" | wc -l)
    if [ $remaining_worktrees -gt 0 ]; then
        log_info "Remaining worktrees:"
        git worktree list | grep -v "$(pwd)"
        echo ""
        echo "Ready to work on existing worktrees or create new ones."
    else
        echo "🏁 No remaining worktrees. Ready for new work!"
        echo "Use git worktree creation workflow to start new features."
    fi
    
    echo ""
    echo "🚀 Ready for next task!"
}

# Main execution
main() {
    # Verify we're in the right directory (should have .git)
    if [ ! -d ".git" ]; then
        log_error "This script must be run from the main project directory (where .git exists)"
        exit 1
    fi
    
    identify_worktree "$1"
    verify_safety
    perform_cleanup
    provide_guidance
}

# Run main function with all arguments
main "$@"