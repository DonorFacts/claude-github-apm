#!/bin/bash
# Direnv setup for Docker container
# Pre-approve direnv for workspace in a location any user can access

set -e

echo "🔧 Setting up direnv workspace approval..."

# Create direnv config directory and pre-approve workspace
mkdir -p /etc/direnv
echo '/workspace' > /etc/direnv/allowed
chmod -R 755 /etc/direnv

echo "✅ Direnv workspace pre-approval completed"