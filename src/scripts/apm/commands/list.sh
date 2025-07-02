#!/bin/bash
# APM List Command - Show active/crashed sessions

set -e
source "$(dirname "$0")/../lib/common.sh"

show_crashed=false
show_active=true

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --crashed)
            show_crashed=true
            show_active=false
            shift
            ;;
        --active)
            show_crashed=false
            show_active=true
            shift
            ;;
        --all)
            show_crashed=true
            show_active=true
            shift
            ;;
        -h|--help)
            echo "Usage: apm list [--crashed|--active|--all]"
            echo ""
            echo "Options:"
            echo "  --crashed    Show only crashed sessions"
            echo "  --active     Show only active sessions (default)"
            echo "  --all        Show both active and crashed sessions"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

ensure_session_registry
registry_file="$(get_session_registry)"

# Read sessions from registry using YAML helper
yaml_helper="$(dirname "$0")/../lib/yaml-helper.ts"
sessions=$(tsx "$yaml_helper" list-sessions "$registry_file" 2>/dev/null || echo "")

if [[ -z "$sessions" ]]; then
    log_info "No sessions found"
    exit 0
fi

echo "Session Status Report - $(date)"
echo "======================================"

# Use temporary files for counters (subshell issue)
echo "0" > /tmp/apm_active_count
echo "0" > /tmp/apm_crashed_count

# Process each session
echo "$sessions" | while IFS='|' read -r id status last_heartbeat role specialization worktree; do
    # Determine current status
    current_status="$status"
    if [[ "$status" == "active" ]]; then
        if is_session_stale "$last_heartbeat"; then
            current_status="crashed"
        fi
    fi
    
    # Show based on filters
    should_show=false
    if [[ "$show_active" == "true" && "$current_status" == "active" ]]; then
        should_show=true
        echo $(($(cat /tmp/apm_active_count) + 1)) > /tmp/apm_active_count
    elif [[ "$show_crashed" == "true" && "$current_status" == "crashed" ]]; then
        should_show=true
        echo $(($(cat /tmp/apm_crashed_count) + 1)) > /tmp/apm_crashed_count
    fi
    
    if [[ "$should_show" == "true" ]]; then
        # Status emoji
        if [[ "$current_status" == "active" ]]; then
            status_icon="${GREEN}✓${NC}"
        else
            status_icon="${RED}✗${NC}"
        fi
        
        # Calculate time since last activity
        if [[ "$last_heartbeat" != "null" ]]; then
            time_diff="$(python3 -c "
import datetime
now = datetime.datetime.now(datetime.timezone.utc)
heartbeat = datetime.datetime.fromisoformat('$last_heartbeat'.replace('Z', '+00:00'))
diff = now - heartbeat
if diff.days > 0:
    print(f'{diff.days}d ago')
elif diff.seconds > 3600:
    print(f'{diff.seconds//3600}h ago')
elif diff.seconds > 60:
    print(f'{diff.seconds//60}m ago')
else:
    print('just now')
" 2>/dev/null || echo "unknown")"
        else
            time_diff="unknown"
        fi
        
        echo -e "$status_icon $id"
        echo "   Role: $role${specialization:+ ($specialization)}"
        echo "   Worktree: $worktree"
        echo "   Last seen: $time_diff"
        echo ""
    fi
done

# Summary
active_count=$(cat /tmp/apm_active_count 2>/dev/null || echo "0")
crashed_count=$(cat /tmp/apm_crashed_count 2>/dev/null || echo "0")

if [[ "$show_active" == "true" && "$show_crashed" == "true" ]]; then
    echo "Summary: $active_count active, $crashed_count crashed"
elif [[ "$show_active" == "true" ]]; then
    echo "Active sessions: $active_count"
elif [[ "$show_crashed" == "true" ]]; then
    echo "Crashed sessions: $crashed_count"
fi

# Cleanup
rm -f /tmp/apm_active_count /tmp/apm_crashed_count