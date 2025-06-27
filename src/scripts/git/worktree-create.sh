#!/bin/bash

# Git Worktree Creation Script
# Comprehensive worktree creation with automatic issue detection and handover
# Usage: ./worktree-create.sh [branch-name] [agent-role] [purpose] [--docker]
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

# Function to setup VS Code Dev Container environment
setup_devcontainer_environment() {
    local worktree_path="$1"
    local agent_role="$2"
    
    log_info "Setting up VS Code Dev Container for agent: $agent_role"
    
    # Check if Docker is available
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker not found. Please install Docker Desktop for dev containers"
        exit 1
    fi
    
    # Create .devcontainer directory
    local devcontainer_dir="$worktree_path/.devcontainer"
    mkdir -p "$devcontainer_dir"
    
    # Generate dev container configuration directly
    local config_target="$devcontainer_dir/devcontainer.json"
    
    cat > "$config_target" << EOF
{
  "name": "APM Framework - $agent_role",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  
  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },
  
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-vscode.vscode-typescript-next",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-json",
        "GitHub.copilot"
      ],
      "settings": {
        "typescript.suggest.autoImports": true,
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode"
      }
    }
  },

  "mounts": [
    "source=\${localWorkspaceFolder}/apm,target=/workspace/apm,type=bind,consistency=cached"
  ],

  "containerEnv": {
    "APM_CONTAINERIZED": "true",
    "APM_AGENT_ROLE": "$agent_role",
    "APM_MEMORY_PATH": "/workspace/apm/agents/$agent_role",
    "APM_PROJECT_ROOT": "/workspace"
  },

  "postCreateCommand": "npm install && chmod +x ./apm/setup/container-init.sh && ./apm/setup/container-init.sh",

  "forwardPorts": [3000, 8000],

  "remoteUser": "node",

  "shutdownAction": "stopContainer"
}
EOF
    
    log_success "Dev container configuration created: $config_target"
    log_info "VS Code will prompt to 'Reopen in Container' when you open this worktree"
    log_info "Container provides secure isolated execution while maintaining VS Code terminal UX"
}

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
    
    # No issue found - prompt user to create one
    log_warning "No existing issue found in branch name or arguments"
    echo ""
    echo "Please create a GitHub issue first:"
    echo "gh issue create --title 'Brief description' --body 'Detailed description' --assignee '@me'"
    echo ""
    echo "Then run this script again with: $0 $target_branch [issue-number]"
    exit 1
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
        git worktree add "$worktree_path" "$branch_name"
        log_success "Worktree created successfully"
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
    local use_legacy="$4"
    
    echo ""
    log_success "Worktree created and VS Code opened!"
    log_success "GitHub issue #$issue_number is being tracked"
    
    if [ "$use_legacy" = false ]; then
        echo ""
        log_success "🐳 Dev Container environment configured!"
        echo ""
        echo "DEV CONTAINER SETUP COMPLETE:"
        echo "• Configuration: .devcontainer/devcontainer.json"
        echo "• VS Code will prompt: 'Reopen in Container?'"
        echo "• Click 'Reopen in Container' to start secure development"
        echo "• Same terminal UX with container security"
        echo ""
    fi
    
    echo ""
    echo "Please switch to the new VS Code window and verify:"
    echo ""
    echo "1. VS Code should show 'Reopen in Container?' notification"
    echo "   Click 'Reopen in Container' for secure development"
    echo ""
    echo "2. Run 'pwd' - you should be in the worktree directory"
    echo "   (e.g., $worktree_path)"
    echo ""
    echo "3. Run 'git branch --show-current' - you should see your feature branch"
    echo "   (should be: $branch_name)"
    echo ""
    if [ "$use_legacy" = false ]; then
        echo "4. After reopening in container, run 'claude' in the terminal"
        echo "   (Same terminal UX with container security)"
        echo ""
        echo "5. Read the handover file in apm/worktree-handovers/not-started/"
        echo ""
        echo "6. If everything looks correct, continue your work in the container."
    else
        echo "4. Run 'claude' in the terminal"
        echo ""
        echo "5. Read the handover file in apm/worktree-handovers/not-started/"
        echo ""
        echo "6. If everything looks correct, continue your work there."
    fi
    echo ""
    echo "🎯 HANDOFF COMPLETE"
    echo ""
    if [ "$use_legacy" = false ]; then
        echo "┌─────────────────────────────────────────────┐"
        echo "│  🚫 THIS WINDOW: Framework & project work   │"
        echo "│  🐳 WORKTREE WINDOW: Secure container dev   │"
        echo "└─────────────────────────────────────────────┘"
    else
        echo "┌─────────────────────────────────────────────┐"
        echo "│  🚫 THIS WINDOW: Framework & project work   │"
        echo "│  ✅ WORKTREE WINDOW: Feature development    │"
        echo "└─────────────────────────────────────────────┘"
    fi
}

# Main execution
main() {
    # Default values
    local branch_name=""
    local agent_role="developer"
    local purpose="Feature development"
    local use_legacy=false
    
    # Parse arguments for --no-container flag (legacy mode)
    local args=()
    for arg in "$@"; do
        if [[ "$arg" == "--no-container" ]]; then
            use_legacy=true
        else
            args+=("$arg")
        fi
    done
    
    # Parse remaining arguments
    if [ ${#args[@]} -eq 0 ]; then
        log_error "Usage: $0 <branch-name> [agent-role] [purpose] [--no-container]"
        log_error "Example: $0 feature-123-auth developer 'Implement authentication'"
        log_error "Example without containers: $0 feature-123-auth developer 'Implement authentication' --no-container"
        exit 1
    fi
    
    branch_name="${args[0]}"
    agent_role="${args[1]:-developer}"
    purpose="${args[2]:-Feature development}"
    
    # Execute workflow
    assess_situation
    
    local issue_number=$(get_issue_number "$branch_name" "${args[3]}")
    local worktree_path=$(create_worktree "$branch_name" "$issue_number")
    local handover_file=$(create_handover "$branch_name" "$issue_number" "$agent_role" "$purpose" "$worktree_path")
    
    # Setup dev container environment by default (unless legacy mode)
    if [ "$use_legacy" = false ]; then
        setup_devcontainer_environment "$worktree_path" "$agent_role"
    fi
    
    open_vscode "$worktree_path"
    show_completion "$branch_name" "$issue_number" "$worktree_path" "$use_legacy"
}

# Run main function with all arguments
main "$@"