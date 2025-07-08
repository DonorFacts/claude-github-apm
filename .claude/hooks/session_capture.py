#!/usr/bin/env python3

import json
import sys
from pathlib import Path

def capture_session_data():
    """
    Capture session ID and transcript path from hook input.
    Based on proven working example from claude-code-hooks-mastery.
    """
    try:
        # Read JSON input from stdin - this is the proven working method
        input_data = json.load(sys.stdin)
        
        session_id = input_data.get('session_id')
        transcript_path = input_data.get('transcript_path')
        tool_name = input_data.get('tool_name', '')
        
        if not session_id or not transcript_path:
            # Missing essential data, but don't block
            sys.exit(0)
        
        # Create conversations directory structure
        conversations_dir = Path('.claude/conversations')
        session_dir = conversations_dir / session_id
        session_file = session_dir / 'conversation.json'
        
        # Create directory
        session_dir.mkdir(parents=True, exist_ok=True)
        
        # Check if already captured
        if session_file.exists():
            print(f"✓ Session already captured: {session_id}", file=sys.stderr)
            sys.exit(0)
        
        # Create session data
        session_data = {
            'sessionId': session_id,
            'transcriptPath': transcript_path,
            'capturedAt': input_data.get('timestamp', ''),
            'firstToolUse': tool_name
        }
        
        # Save to file
        with open(session_file, 'w') as f:
            json.dump(session_data, f, indent=2)
        
        print(f"✓ Session data captured: {session_id}", file=sys.stderr)
        
        # Log the hook input for debugging
        log_dir = Path('tmp/hook-debug')
        log_dir.mkdir(parents=True, exist_ok=True)
        
        with open(log_dir / 'session-capture-log.json', 'w') as f:
            json.dump(input_data, f, indent=2)
        
        sys.exit(0)
        
    except json.JSONDecodeError:
        # Gracefully handle JSON decode errors
        sys.exit(0)
    except Exception as e:
        # Handle any other errors gracefully
        print(f"Session capture error: {e}", file=sys.stderr)
        sys.exit(0)

if __name__ == '__main__':
    capture_session_data()