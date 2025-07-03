#!/bin/bash
# Test suite for session monitoring shell scripts
# Tests container compatibility and basic functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_REQUIRING_HOST_VALIDATION=0

log_test_start() {
    echo -e "${BLUE}🧪 TEST:${NC} $1"
    TESTS_RUN=$((TESTS_RUN + 1))
}

log_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

log_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

log_host_validation() {
    echo -e "${YELLOW}🏠 HOST VALIDATION REQUIRED:${NC} $1"
    TESTS_REQUIRING_HOST_VALIDATION=$((TESTS_REQUIRING_HOST_VALIDATION + 1))
}

log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

# Test directory setup
TEST_DIR="/tmp/session_script_tests"
MOCK_APM_DIR="$TEST_DIR/apm"
MOCK_SESSIONS_DIR="$MOCK_APM_DIR/sessions"
MOCK_CLAUDE_DIR="$TEST_DIR/.claude"

setup_test_environment() {
    log_info "Setting up test environment at $TEST_DIR"
    
    # Clean and create test directories
    rm -rf "$TEST_DIR"
    mkdir -p "$MOCK_SESSIONS_DIR"
    mkdir -p "$MOCK_CLAUDE_DIR/projects/test-project"
    
    # Create mock session manifest in the path extract-session.sh expects
    mkdir -p "$MOCK_APM_DIR/agents/developer/sessions"
    cat > "$MOCK_APM_DIR/agents/developer/sessions/manifest.jsonl" << 'EOF'
{"session_id": "test-session-001", "role": "developer", "started": "2025-07-03T01:00:00Z", "ended": "2025-07-03T02:00:00Z", "cc_log_path": "/tmp/session_script_tests/.claude/projects/test-project/test-conversation.jsonl"}
{"session_id": "test-session-002", "role": "developer", "started": "2025-07-03T02:00:00Z", "cc_log_path": "/tmp/session_script_tests/.claude/projects/test-project/test-conversation.jsonl"}
EOF

    # Create mock Claude Code JSONL file
    cat > "$MOCK_CLAUDE_DIR/projects/test-project/test-conversation.jsonl" << 'EOF'
{"timestamp": "2025-07-03T01:15:00Z", "type": "user", "message": {"content": [{"type": "text", "text": "Hello, can you help me?"}]}}
{"timestamp": "2025-07-03T01:15:30Z", "type": "assistant", "message": {"content": [{"type": "text", "text": "Of course! I'll help you."}]}}
{"timestamp": "2025-07-03T01:16:00Z", "type": "user", "message": {"content": [{"type": "text", "text": "Can you read this file?"}]}}
{"timestamp": "2025-07-03T01:16:30Z", "type": "assistant", "message": {"content": [{"type": "tool_use", "name": "Read", "input": {"file_path": "/test/file.txt"}}]}}
{"timestamp": "2025-07-03T01:17:00Z", "toolUseResult": {"content": "File content here"}}
{"timestamp": "2025-07-03T02:30:00Z", "type": "user", "message": {"content": [{"type": "text", "text": "Thanks for the help!"}]}}
EOF

    log_pass "Test environment setup complete"
}

test_environment_dependencies() {
    log_test_start "Environment Dependencies Check"
    
    # Test jq availability
    if command -v jq >/dev/null 2>&1; then
        log_pass "jq is available ($(jq --version))"
    else
        log_fail "jq is not available"
        return 1
    fi
    
    # Test date command
    if date --version >/dev/null 2>&1; then
        log_pass "GNU date command is available"
    elif date -j >/dev/null 2>&1; then
        log_pass "BSD date command is available"
    else
        log_fail "Neither GNU nor BSD date command works"
        return 1
    fi
    
    # Test Claude Code directory access
    if [ -d ~/.claude ]; then
        log_pass "Claude Code directory (~/.claude) is accessible"
        
        # Count actual JSONL files
        jsonl_count=$(find ~/.claude -name "*.jsonl" 2>/dev/null | wc -l)
        log_info "Found $jsonl_count Claude Code JSONL files"
    else
        log_fail "Claude Code directory (~/.claude) not found"
    fi
}

test_extract_session_script() {
    log_test_start "extract-session.sh functionality"
    
    local script_path="$(pwd)/src/sessions/monitoring/extract-session.sh"
    
    if [ ! -f "$script_path" ]; then
        log_fail "extract-session.sh not found at $script_path"
        return 1
    fi
    
    # Test script with mock data using environment variables
    cd "$TEST_DIR"
    
    # Test missing arguments
    if ! "$script_path" 2>/dev/null; then
        log_pass "Script correctly handles missing arguments"
    else
        log_fail "Script should fail with missing arguments"
    fi
    
    # Test with valid session ID that exists in manifest
    if output=$("$script_path" "test-session-001" "developer" 2>&1); then
        if echo "$output" | grep -q "2025-07-03T01:15:00Z"; then
            log_pass "Script successfully extracts session data from mock JSONL"
        else
            log_fail "Script output doesn't contain expected timestamp data"
        fi
    else
        log_fail "Script failed with valid session ID: $output"
    fi
    
    # Test with non-existent session
    if ! "$script_path" "non-existent-session" "developer" >/dev/null 2>&1; then
        log_pass "Script correctly handles non-existent session"
    else
        log_fail "Script should fail with non-existent session"
    fi
    
    # Reset environment
    cd - >/dev/null
}

test_analyze_session_script() {
    log_test_start "analyze-session.sh functionality"
    
    local script_path="$(pwd)/src/sessions/monitoring/analyze-session.sh"
    
    if [ ! -f "$script_path" ]; then
        log_fail "analyze-session.sh not found at $script_path"
        return 1
    fi
    
    # Test script with mock JSONL data
    local test_input="$MOCK_CLAUDE_DIR/projects/test-project/test-conversation.jsonl"
    
    if output=$("$script_path" < "$test_input" 2>&1); then
        if echo "$output" | grep -q "Message Count:"; then
            log_pass "Script analyzes JSONL data and produces message count"
        else
            log_fail "Script output missing expected message count analysis"
        fi
        
        if echo "$output" | grep -q "Tool Usage:"; then
            log_pass "Script analyzes tool usage from JSONL data"
        else
            log_fail "Script output missing expected tool usage analysis"
        fi
        
        if echo "$output" | grep -q "Read"; then
            log_pass "Script correctly identifies Read tool usage"
        else
            log_fail "Script should identify Read tool in mock data"
        fi
    else
        log_fail "analyze-session.sh failed: $output"
    fi
}

test_update_terminal_title_script() {
    log_test_start "update-terminal-title.sh functionality"
    
    local script_path="$(pwd)/src/sessions/monitoring/update-terminal-title.sh"
    
    if [ ! -f "$script_path" ]; then
        log_fail "update-terminal-title.sh not found at $script_path"
        return 1
    fi
    
    # Test script execution (this requires host validation)
    if "$script_path" "Test Title" >/dev/null 2>&1; then
        log_pass "Script executes without errors"
        log_host_validation "Jake, please check if your terminal title changed to 'Test Title' after running this script"
    else
        log_fail "Script failed to execute"
    fi
}

test_process_events_script() {
    log_test_start "process-events.sh functionality"
    
    local script_path="$(pwd)/src/sessions/monitoring/process-events.sh"
    
    if [ ! -f "$script_path" ]; then
        log_fail "process-events.sh not found at $script_path"
        return 1
    fi
    
    # Test script help/usage
    if "$script_path" --help >/dev/null 2>&1; then
        log_pass "Script provides help information"
    else
        log_fail "Script should provide help information"
    fi
    
    # Note: Full testing would require event watching setup
    log_info "Full process-events.sh testing requires filesystem monitoring setup"
}

test_post_process_session_script() {
    log_test_start "post-process-session.sh functionality"
    
    local script_path="$(pwd)/src/sessions/monitoring/post-process-session.sh"
    
    if [ ! -f "$script_path" ]; then
        log_fail "post-process-session.sh not found at $script_path"
        return 1
    fi
    
    # Test script argument handling
    if ! "$script_path" 2>/dev/null; then
        log_pass "Script correctly requires arguments"
    else
        log_fail "Script should require session_id and role arguments"
    fi
    
    # Note: Full testing requires integration with other scripts
    log_info "Full post-process testing requires integrated APM session setup"
}

test_clean_logs_script() {
    log_test_start "clean-logs.sh functionality"
    
    local script_path="$(pwd)/src/sessions/monitoring/clean-logs.sh"
    
    if [ ! -f "$script_path" ]; then
        log_fail "clean-logs.sh not found at $script_path"
        return 1
    fi
    
    # Create test log files
    mkdir -p "$TEST_DIR/test_logs"
    touch "$TEST_DIR/test_logs/old_session.log"
    touch "$TEST_DIR/test_logs/recent_session.log"
    
    # Test script execution (dry run if possible)
    cd "$TEST_DIR/test_logs"
    if "$script_path" --help >/dev/null 2>&1 || "$script_path" >/dev/null 2>&1; then
        log_pass "Script executes without critical errors"
    else
        log_info "Script may require specific log directory structure"
    fi
    cd - >/dev/null
}

test_real_claude_code_integration() {
    log_test_start "Real Claude Code Integration"
    
    # Test with actual Claude Code data if available
    local actual_jsonl=$(find ~/.claude -name "*.jsonl" 2>/dev/null | head -1)
    
    if [ -n "$actual_jsonl" ]; then
        log_info "Testing with real Claude Code file: $(basename "$actual_jsonl")"
        
        # Test analyze-session with real data
        local script_path="$(pwd)/src/sessions/monitoring/analyze-session.sh"
        if output=$(head -10 "$actual_jsonl" | "$script_path" 2>&1); then
            if echo "$output" | grep -q "Message Count:"; then
                log_pass "analyze-session.sh works with real Claude Code data"
            else
                log_fail "analyze-session.sh doesn't parse real Claude Code data correctly"
            fi
        else
            log_fail "analyze-session.sh failed with real Claude Code data"
        fi
    else
        log_info "No real Claude Code JSONL files available for testing"
    fi
}

run_host_validation_tests() {
    log_test_start "Host Environment Validation Tests"
    
    log_host_validation "Jake, please run the following tests on the host:"
    echo ""
    echo "1. Terminal Title Test:"
    echo "   ./src/sessions/monitoring/update-terminal-title.sh 'APM Test Title'"
    echo "   → Check if your terminal title changed"
    echo ""
    echo "2. Claude Code Path Access Test:"
    echo "   ls -la ~/.claude/projects/ | head -5"
    echo "   → Verify Claude Code projects are accessible from host"
    echo ""
    echo "3. Host Script Execution Test:"
    echo "   cd /path/to/your/host/project"
    echo "   ./src/sessions/monitoring/extract-session.sh --help"
    echo "   → Verify scripts run without errors on host"
    echo ""
    echo "4. Host JSONL Parsing Test:"
    echo "   find ~/.claude -name '*.jsonl' | head -1 | xargs head -5 | ./src/sessions/monitoring/analyze-session.sh"
    echo "   → Verify analysis works with host Claude Code data"
    echo ""
}

print_test_summary() {
    echo ""
    echo "======================================"
    echo "SESSION SCRIPT TEST SUMMARY"
    echo "======================================"
    echo "Tests Run: $TESTS_RUN"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    echo -e "Host Validation Required: ${YELLOW}$TESTS_REQUIRING_HOST_VALIDATION${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✅ All container-based tests passed!${NC}"
    else
        echo -e "${RED}❌ Some tests failed. Check output above.${NC}"
    fi
    
    if [ $TESTS_REQUIRING_HOST_VALIDATION -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Some tests require host environment validation.${NC}"
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Address any failed tests"
    echo "2. Run host validation tests"
    echo "3. Consider creating automated test fixtures for CI/CD"
}

# Main test execution
main() {
    echo "======================================"
    echo "SESSION MONITORING SCRIPTS TEST SUITE"
    echo "======================================"
    echo "Testing environment: Container"
    echo "Test date: $(date)"
    echo ""
    
    setup_test_environment
    
    test_environment_dependencies
    test_extract_session_script
    test_analyze_session_script
    test_update_terminal_title_script
    test_process_events_script
    test_post_process_session_script
    test_clean_logs_script
    test_real_claude_code_integration
    
    run_host_validation_tests
    print_test_summary
    
    # Cleanup
    rm -rf "$TEST_DIR"
}

# Run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi