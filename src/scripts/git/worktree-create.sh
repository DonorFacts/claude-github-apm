#!/bin/bash

# Git Worktree Creation Script
# Comprehensive worktree creation with automatic issue detection and handover
# Usage: ./worktree-create.sh <branch-name> [agent-role] [purpose]
# Run from main project directory

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions (output to stderr to avoid polluting return values)
log_info() { echo -e "${BLUE}ℹ️  $1${NC}" >&2; }
log_success() { echo -e "${GREEN}✅ $1${NC}" >&2; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}" >&2; }
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }


# Function to detect issue number from branch name
detect_issue_from_branch() {
    local branch_name="$1"
    # Handle both feature/8-name and feature-8-name formats
    echo "$branch_name" | grep -o -E '(feature[/-][0-9]+)' | grep -o '[0-9]*' || echo ""
}

# Function to assess current situation
assess_situation() {
    log_info "Assessing current Git situation..."
    
    CURRENT_BRANCH=$(git branch --show-current)
    UNCOMMITTED_COUNT=$(git status --porcelain | wc -l)
    
    echo "Current branch: $CURRENT_BRANCH"
    echo "Uncommitted changes: $UNCOMMITTED_COUNT files"
    
    if [ $UNCOMMITTED_COUNT -gt 0 ]; then
        log_warning "You have uncommitted changes:"
        git status --short
        echo ""
        log_error "CRITICAL: Please commit or stash changes before creating worktree"
        log_error "Use 'git add . && git commit -m \"wip: save work\"' if these are your changes"
        log_error "Use 'git stash' if you need to preserve them temporarily"
        exit 1
    fi
}

# Function to detect or prompt for issue number
get_issue_number() {
    local target_branch="$1"
    
    # First try to extract from target branch name
    local detected_issue=$(detect_issue_from_branch "$target_branch")
    
    if [ -n "$detected_issue" ]; then
        log_success "Found existing issue #$detected_issue in branch name"
        echo "$detected_issue"
        return 0
    fi
    
    # Check if user provided issue as argument
    if [[ "$2" =~ ^[0-9]+$ ]]; then
        log_success "Using provided issue number #$2"
        echo "$2"
        return 0
    fi
    
    # No issue found - create one automatically
    log_info "No existing issue found - creating GitHub issue"
    
    # Check if gh CLI is available
    if ! command -v gh >/dev/null 2>&1; then
        log_error "GitHub CLI (gh) not found. Please install: brew install gh"
        log_error "Or provide issue number manually: $0 $target_branch [issue-number]"
        exit 1
    fi
    
    # Create GitHub issue automatically
    local issue_title="$2"  # Use the purpose as title
    if [ -z "$issue_title" ]; then
        issue_title="Feature development for $target_branch"
    fi
    
    log_info "Creating GitHub issue: $issue_title"
    if gh issue create --title "$issue_title" --body "Automated issue creation for worktree: $target_branch" --assignee "@me" >/dev/null 2>&1; then
        local new_issue_number=$(gh issue list --assignee "@me" --state open --limit 1 --json number --jq '.[0].number')
    else
        local new_issue_number=""
    fi
    
    if [ $? -eq 0 ] && [ -n "$new_issue_number" ]; then
        log_success "Created GitHub issue #$new_issue_number"
        echo "$new_issue_number"
        return 0
    else
        log_error "Failed to create GitHub issue"
        log_error "Please create manually: gh issue create --title '$issue_title' --assignee '@me'"
        exit 1
    fi
}

# Function to create branch and worktree
create_worktree() {
    local branch_name="$1"
    local issue_number="$2"
    
    log_info "Creating worktree for branch: $branch_name"
    
    # Check if branch already exists
    if git show-ref --verify --quiet refs/heads/"$branch_name"; then
        log_info "Branch $branch_name already exists, using existing branch"
    else
        log_info "Creating new branch: $branch_name"
        git checkout -b "$branch_name"
        git checkout main  # Switch back to main
    fi
    
    # Create worktree
    local worktree_path="../worktrees/$(basename "$branch_name")"
    log_info "Setting up worktree at: $worktree_path"
    
    if [ -d "$worktree_path" ]; then
        log_info "Worktree directory already exists - updating configuration"
    else
        if git worktree add "$worktree_path" "$branch_name"; then
            log_success "Worktree created successfully"
        else
            log_error "Failed to create git worktree"
            log_error "Command failed: git worktree add $worktree_path $branch_name"
            exit 1
        fi
    fi
    
    echo "$worktree_path"
}

# Function to create handover file
create_handover() {
    local branch_name="$1"
    local issue_number="$2"
    local agent_role="$3"
    local purpose="$4"
    local worktree_path="$5"
    
    log_info "Creating handover file..."
    
    local date_prefix=$(date +%Y_%m_%d)
    local handover_filename="${date_prefix}-$(basename "$branch_name").md"
    local handover_dir="$worktree_path/apm/worktree-handovers/not-started"
    
    # Create directory in worktree
    mkdir -p "$handover_dir"
    
    local handover_file="$handover_dir/$handover_filename"
    
    # Create handover content
    cat > "$handover_file" << EOF
# Worktree Handover: $(basename "$branch_name")

## Agent Initialization

**Role**: $agent_role  
**Initialize with**: \`src/prompts/agents/$agent_role/init.md\`

## Task Context

**GitHub Issue**: #$issue_number  
**Purpose**: $purpose  
**Scope**: <detailed description of what needs to be done>

## Memory Transfer from Previous Session

### Work Already Completed
- Created worktree for issue #$issue_number
- No code written yet (fresh start)

### Current State
- Fresh worktree ready for development
- All dependencies should be installed
- Branch: $branch_name

### Key Context
<Important information the new agent needs to know>

## Immediate Next Steps

1. Read this handover file completely
2. Initialize as $agent_role agent
3. Review the GitHub issue #$issue_number for context
4. <First specific task based on issue requirements>
5. <Continue with implementation...>

## Resources and References

- GitHub Issue: #$issue_number
- Key files to review: <paths>
- Documentation to consult: <paths>

## Special Instructions

<Any unique requirements or warnings>
EOF

    log_success "Handover file created: $handover_file"
    echo "$handover_file"
}

# Function to setup containerized Claude
setup_containerized_claude() {
    local worktree_path="$1"
    
    log_info "Setting up containerized Claude execution..."
    
    # Check if Docker is available
    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker not found. Claude will run directly on host (less secure)."
        log_warning "To enable container security, install Docker Desktop."
        return 0
    fi
    
    # Create local bin directory in worktree
    local bin_dir="$worktree_path/.local/bin"
    mkdir -p "$bin_dir"
    
    # Create wrapper script that calls our Docker wrapper
    local claude_wrapper="$bin_dir/claude"
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local docker_wrapper="$script_dir/../../docker/claude-container/claude-wrapper.sh"
    
    # Verify Docker wrapper exists
    if [ ! -f "$docker_wrapper" ]; then
        log_error "Docker wrapper not found at: $docker_wrapper"
        log_error "Docker containerization setup failed"
        return 1
    fi
    
    cat > "$claude_wrapper" << EOF
#!/bin/bash
# Auto-generated Claude wrapper for containerized execution
# This script transparently runs Claude in a secure Docker container

# Use absolute path to Docker wrapper (determined at creation time)
DOCKER_WRAPPER="$docker_wrapper"

if [ -f "\$DOCKER_WRAPPER" ]; then
    exec "\$DOCKER_WRAPPER" "\$@"
else
    # Fallback to system claude if wrapper not found
    exec claude "\$@"
fi
EOF
    
    chmod +x "$claude_wrapper"
    
    # Create .envrc file to add .local/bin to PATH for this worktree
    cat > "$worktree_path/.envrc" << 'EOF'
# APM Worktree Environment
# Automatically adds .local/bin to PATH for containerized claude
export PATH="$PWD/.local/bin:$PATH"
EOF
    
    log_success "Containerized Claude configured"
    log_info "When you run 'claude' in this worktree, it will use secure container execution"
}

# Function to open VS Code
open_vscode() {
    local worktree_path="$1"
    
    log_info "Opening VS Code in worktree..."
    
    if command -v code >/dev/null 2>&1; then
        code "$worktree_path"
        log_success "VS Code opened in worktree directory"
    else
        log_warning "VS Code 'code' command not found. Please open manually:"
        log_warning "cd $worktree_path && code ."
    fi
}

# Function to display completion message
show_completion() {
    local branch_name="$1"
    local issue_number="$2"
    local worktree_path="$3"
    
    {
        echo ""
        log_success "Worktree created and VS Code opened!"
        log_success "GitHub issue #$issue_number is being tracked"
        
        echo ""
        echo "Please switch to the new VS Code window and verify:"
        echo ""
        echo "1. Run 'pwd' - you should be in the worktree directory"
        echo "   (e.g., $worktree_path)"
        echo ""
        echo "2. Run 'git branch --show-current' - you should see your feature branch"
        echo "   (should be: $branch_name)"
        echo ""
        echo "3. Run 'claude' in the terminal (automatically containerized for security)"
        echo ""
        echo "4. Read the handover file in apm/worktree-handovers/not-started/"
        echo ""
        echo "5. If everything looks correct, continue your work."
        echo ""
        echo "🐳 Security: Claude runs in isolated Docker container"
        echo "💡 Experience: Same terminal UX, enhanced security"
        echo ""
        echo "🎯 HANDOFF COMPLETE"
        echo ""
        echo "┌─────────────────────────────────────────────┐"
        echo "│  🚫 THIS WINDOW: Framework & project work   │"
        echo "│  ✅ WORKTREE WINDOW: Feature development    │"
        echo "└─────────────────────────────────────────────┘"
    } >&2
}

# Main execution
main() {
    # Default values
    local branch_name=""
    local agent_role="developer"
    local purpose="Feature development"
    
    # Parse arguments
    if [ $# -eq 0 ]; then
        log_error "Usage: $0 <branch-name> [agent-role] [purpose]"
        log_error "Example: $0 feature-123-auth developer 'Implement authentication'"
        exit 1
    fi
    
    branch_name="$1"
    agent_role="${2:-developer}"
    purpose="${3:-Feature development}"
    
    # Execute workflow
    assess_situation
    
    local issue_number=$(get_issue_number "$branch_name" "$purpose")
    local worktree_path=$(create_worktree "$branch_name" "$issue_number")
    
    if ! setup_containerized_claude "$worktree_path"; then
        log_error "Docker setup failed - continuing with host execution"
    fi
    
    local handover_file=$(create_handover "$branch_name" "$issue_number" "$agent_role" "$purpose" "$worktree_path")
    
    open_vscode "$worktree_path"
    show_completion "$branch_name" "$issue_number" "$worktree_path"
}

# Run main function with all arguments
main "$@"