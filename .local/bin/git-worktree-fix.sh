#!/bin/bash

# Fix git worktree paths for host/container compatibility

case "${1:-host}" in
    host)
        if [ -f ".git.host" ]; then
            cp .git.host .git
            echo "✅ Restored host git worktree path"
        else
            echo "gitdir: ../../main/.git/worktrees/feature-draft-git-worktree-docs" > .git
            echo "✅ Set host git worktree path"
        fi
        ;;
    container)
        echo "gitdir: /workspace-main/.git/worktrees/${APM_WORKTREE_NAME:-feature-draft-git-worktree-docs}" > .git
        echo "✅ Set container git worktree path"
        ;;
    *)
        echo "Usage: $0 [host|container]"
        exit 1
        ;;
esac

git status | head -1