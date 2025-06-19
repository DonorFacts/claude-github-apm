#!/bin/bash
# Clean sensitive data from session logs
# Usage: ./clean-logs.sh < input.jsonl > cleaned.jsonl

# Patterns to redact
API_KEY_PATTERN='(api[_-]?key|API[_-]?KEY)["\s:=]+[A-Za-z0-9_\-]+'
TOKEN_PATTERN='(token|TOKEN|auth|AUTH)["\s:=]+[A-Za-z0-9_\-]+'
PASSWORD_PATTERN='(password|PASSWORD|pwd|PWD)["\s:=]+[^"\s]+'
SECRET_PATTERN='(secret|SECRET)["\s:=]+[^"\s]+'
PRIVATE_KEY_PATTERN='-----BEGIN[^-]+PRIVATE KEY-----[^-]+-----END[^-]+PRIVATE KEY-----'

# Process each JSON line
while IFS= read -r line; do
    # Skip empty lines
    [ -z "$line" ] && continue
    
    # Clean the content
    echo "$line" | jq -c '
        # Function to clean text content
        def clean_text:
            gsub("'$API_KEY_PATTERN'"; "\(.[0:match("=|:").offset+1])REDACTED") |
            gsub("'$TOKEN_PATTERN'"; "\(.[0:match("=|:").offset+1])REDACTED") |
            gsub("'$PASSWORD_PATTERN'"; "\(.[0:match("=|:").offset+1])REDACTED") |
            gsub("'$SECRET_PATTERN'"; "\(.[0:match("=|:").offset+1])REDACTED") |
            gsub("'$PRIVATE_KEY_PATTERN'"; "-----BEGIN PRIVATE KEY-----\nREDACTED\n-----END PRIVATE KEY-----");
        
        # Apply cleaning to message content
        if .message.content then
            if (.message.content | type) == "string" then
                .message.content |= clean_text
            elif (.message.content | type) == "array" then
                .message.content |= map(
                    if .type == "text" and .text then
                        .text |= clean_text
                    elif .type == "tool_use" and .input then
                        .input |= tostring | clean_text | fromjson? // .
                    else
                        .
                    end
                )
            else
                .
            end
        else
            .
        end |
        
        # Clean tool results
        if .toolUseResult then
            .toolUseResult |= (
                if type == "string" then
                    clean_text
                elif .content then
                    .content |= clean_text
                else
                    .
                end
            )
        else
            .
        end
    ' 2>/dev/null || echo "$line"  # Fall back to original if jq fails
done