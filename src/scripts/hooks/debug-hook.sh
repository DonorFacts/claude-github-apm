#\!/bin/bash
echo "Hook triggered at $(date)" >> tmp/hook-debug.log
input_json=$(cat)
echo "Input: $input_json" >> tmp/hook-debug.log
exit 0
