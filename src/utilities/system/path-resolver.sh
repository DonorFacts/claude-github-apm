#!/bin/bash
# Path Resolution Module
# Handles project root detection and working directory calculation

# Find project root and calculate working directory
resolve_paths() {
    # Get current directory relative to project root
    WORK_DIR="/workspace"
    if [ -n "$PWD" ]; then
        # Find project root (prioritize main/worktrees structure)
        PROJECT_ROOT="$PWD"
        FOUND_ROOT=""
        
        # First pass: look for main/worktrees structure with proper validation
        TEMP_ROOT="$PWD"
        while [ "$TEMP_ROOT" != "/" ]; do
            if [ -d "$TEMP_ROOT/main" ] && [ -d "$TEMP_ROOT/worktrees" ] && [ -f "$TEMP_ROOT/main/package.json" ] && [ -d "$TEMP_ROOT/main/apm" ]; then
                FOUND_ROOT="$TEMP_ROOT"
                break
            fi
            TEMP_ROOT="${TEMP_ROOT%/*}"
            [ "$TEMP_ROOT" = "" ] && TEMP_ROOT="/"
        done
        
        # If not found, second pass: look for other valid structures
        if [ -z "$FOUND_ROOT" ]; then
            TEMP_ROOT="$PWD"
            while [ "$TEMP_ROOT" != "/" ]; do
                if [ -f "$TEMP_ROOT/main/package.json" ] && [ -d "$TEMP_ROOT/main/apm" ]; then
                    FOUND_ROOT="$TEMP_ROOT"
                    break
                elif [ -f "$TEMP_ROOT/package.json" ] && [ -d "$TEMP_ROOT/apm" ]; then
                    FOUND_ROOT="$TEMP_ROOT"
                    break
                fi
                TEMP_ROOT="${TEMP_ROOT%/*}"
            [ "$TEMP_ROOT" = "" ] && TEMP_ROOT="/"
            done
        fi
        
        if [ -n "$FOUND_ROOT" ]; then
            PROJECT_ROOT="$FOUND_ROOT"
        fi
        
        if [ "$PROJECT_ROOT" != "/" ]; then
            REL_PATH="${PWD#$PROJECT_ROOT}"
            if [ -n "$REL_PATH" ]; then
                WORK_DIR="/workspace$REL_PATH"
            fi
        fi
    fi
    
    # Export for use by other modules
    export PROJECT_ROOT
    export WORK_DIR
}