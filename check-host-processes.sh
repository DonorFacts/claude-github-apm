#!/bin/bash
# Diagnostic script to check host background processes
# Run this from the HOST, not the container

echo "=== Host Process Diagnostic Report ===" > ./host-diagnostic.log
echo "Generated at: $(date)" >> ./host-diagnostic.log
echo "" >> ./host-diagnostic.log

echo "=== Checking for host-bridge daemon ===" >> ./host-diagnostic.log
ps aux | grep -E "(daemon\.ts|host-bridge)" | grep -v grep >> ./host-diagnostic.log 2>&1 || echo "No host-bridge daemon found" >> ./host-diagnostic.log
echo "" >> ./host-diagnostic.log

echo "=== Checking for command watcher ===" >> ./host-diagnostic.log
ps aux | grep -E "(command-watcher|command-processing.*--watch)" | grep -v grep >> ./host-diagnostic.log 2>&1 || echo "No command watcher found" >> ./host-diagnostic.log
echo "" >> ./host-diagnostic.log

echo "=== Checking for pnpm start process ===" >> ./host-diagnostic.log
ps aux | grep "pnpm start" | grep -v grep >> ./host-diagnostic.log 2>&1 || echo "No pnpm start process found" >> ./host-diagnostic.log
echo "" >> ./host-diagnostic.log

echo "=== Checking PID files ===" >> ./host-diagnostic.log
if [ -f "/tmp/apm-watch-processes.pid" ]; then
    echo "Host-bridge PID file exists: $(cat /tmp/apm-watch-processes.pid)" >> ./host-diagnostic.log
else
    echo "Host-bridge PID file NOT found" >> ./host-diagnostic.log
fi

if [ -f "/tmp/apm-command-watcher-main.pid" ]; then
    echo "Command watcher PID file exists: $(cat /tmp/apm-command-watcher-main.pid)" >> ./host-diagnostic.log
else
    echo "Command watcher PID file NOT found" >> ./host-diagnostic.log
fi
echo "" >> ./host-diagnostic.log

echo "=== Checking log files ===" >> ./host-diagnostic.log
if [ -f "/tmp/apm-host-bridge.log" ]; then
    echo "Host-bridge log exists, last 10 lines:" >> ./host-diagnostic.log
    tail -10 /tmp/apm-host-bridge.log >> ./host-diagnostic.log 2>&1
else
    echo "Host-bridge log NOT found" >> ./host-diagnostic.log
fi
echo "" >> ./host-diagnostic.log

if [ -f "/tmp/apm-command-watcher-main.log" ]; then
    echo "Command watcher log exists, last 10 lines:" >> ./host-diagnostic.log
    tail -10 /tmp/apm-command-watcher-main.log >> ./host-diagnostic.log 2>&1
else
    echo "Command watcher log NOT found" >> ./host-diagnostic.log
fi
echo "" >> ./host-diagnostic.log

echo "=== Checking Unix socket ===" >> ./host-diagnostic.log
if [ -e "/tmp/host-bridge.sock" ]; then
    echo "Host-bridge socket EXISTS" >> ./host-diagnostic.log
    ls -la /tmp/host-bridge.sock >> ./host-diagnostic.log 2>&1
else
    echo "Host-bridge socket NOT found" >> ./host-diagnostic.log
fi
echo "" >> ./host-diagnostic.log

echo "=== Checking runtime directory ===" >> ./host-diagnostic.log
if [ -d "$HOME/www/claude-github-apm/runtime" ]; then
    echo "Runtime directory exists:" >> ./host-diagnostic.log
    ls -la "$HOME/www/claude-github-apm/runtime/" >> ./host-diagnostic.log 2>&1
else
    echo "Runtime directory NOT found" >> ./host-diagnostic.log
fi

echo "" >> ./host-diagnostic.log
echo "=== Diagnostic complete ===" >> ./host-diagnostic.log
echo "Diagnostic report saved to: ./host-diagnostic.log"
echo "You can now tell Claude to read this file from the container"