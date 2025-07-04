#!/bin/bash
# Standard environment loader for APM project
# Supports both .env and .envrc files with proper precedence

# Load environment variables from .env files (dotenv format)
load_env_file() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        echo "🔧 Loading environment from $env_file"
        # Load .env file safely, handling comments and empty lines
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip comments and empty lines
            [[ "$line" =~ ^[[:space:]]*# ]] && continue
            [[ "$line" =~ ^[[:space:]]*$ ]] && continue
            
            # Export the variable
            if [[ "$line" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=[[:space:]]*(.*)[[:space:]]*$ ]]; then
                local var_name="${BASH_REMATCH[1]}"
                local var_value="${BASH_REMATCH[2]}"
                
                # Special handling for PATH - prepend to existing PATH
                if [ "$var_name" = "PATH" ] && [[ "$var_value" =~ ^\$PWD/.local/bin ]]; then
                    export PATH="$PWD/.local/bin:$PATH"
                else
                    export "$var_name"="$var_value"
                fi
            fi
        done < "$env_file"
        return 0
    fi
    return 1
}

# Load environment variables from .envrc files (bash script format)
load_envrc_file() {
    local envrc_file="$1"
    if [ -f "$envrc_file" ]; then
        echo "🔧 Loading environment from $envrc_file"
        # Source the .envrc file safely
        set -a  # automatically export all variables
        source "$envrc_file"
        set +a  # turn off automatic export
        return 0
    fi
    return 1
}

# Main environment loader - searches up directory tree
# Precedence: .env.local > .env > .envrc
load_project_env() {
    local current_dir="$PWD"
    local loaded=false
    
    while [ "$current_dir" != "/" ]; do
        # Try .env.local first (highest precedence)
        if load_env_file "$current_dir/.env.local"; then
            loaded=true
        fi
        
        # Try .env second
        if load_env_file "$current_dir/.env"; then
            loaded=true
        fi
        
        # Try .envrc last (lowest precedence, for backward compatibility)
        if load_envrc_file "$current_dir/.envrc"; then
            loaded=true
        fi
        
        # If we found any env files, stop searching
        if [ "$loaded" = true ]; then
            break
        fi
        
        current_dir="${current_dir%/*}"
        [ "$current_dir" = "" ] && current_dir="/"
    done
    
    return 0
}

# Export the main function for use in other scripts
export -f load_project_env
export -f load_env_file
export -f load_envrc_file