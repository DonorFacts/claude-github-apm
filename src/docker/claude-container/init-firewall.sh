#!/bin/bash
# APM Container Network Security
# Implements Anthropic's recommended firewall for --dangerously-skip-permissions

set -e

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}🔒 $1${NC}" >&2; }
log_success() { echo -e "${GREEN}✅ $1${NC}" >&2; }
log_error() { echo -e "${RED}❌ $1${NC}" >&2; }

# Default domains for APM framework functionality
DEFAULT_DOMAINS="api.anthropic.com,github.com,registry.npmjs.org,githubusercontent.com"
ALLOWED_DOMAINS="${ALLOWED_DOMAINS:-$DEFAULT_DOMAINS}"

log_info "Initializing APM container network security..."

# Check if iptables is available
if ! command -v iptables >/dev/null 2>&1; then
    log_error "iptables not found - network restrictions disabled"
    exit 0
fi

# Check if running as root (required for iptables)
if [ "$EUID" -ne 0 ] && [ -z "$APM_SKIP_FIREWALL" ]; then
    log_error "Root privileges required for network restrictions"
    log_info "Set APM_SKIP_FIREWALL=true to disable"
    exit 0
fi

# Skip firewall setup if explicitly disabled
if [ "$APM_SKIP_FIREWALL" = "true" ]; then
    log_info "Network restrictions disabled by APM_SKIP_FIREWALL"
    exit 0
fi

# Clear existing rules (container-safe)
iptables -F OUTPUT 2>/dev/null || true
iptables -P OUTPUT ACCEPT 2>/dev/null || true

# Block all outbound by default
log_info "Setting default-deny policy for outbound traffic"
iptables -P OUTPUT DROP

# Allow loopback (essential for container operation)
iptables -A OUTPUT -o lo -j ACCEPT
log_info "Allowed loopback traffic"

# Allow established connections
iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
log_info "Allowed established connections"

# Allow internal container networking
iptables -A OUTPUT -d 10.0.0.0/8 -j ACCEPT
iptables -A OUTPUT -d 172.16.0.0/12 -j ACCEPT
iptables -A OUTPUT -d 192.168.0.0/16 -j ACCEPT
log_info "Allowed internal container networks"

# Allow whitelisted domains
if [ -n "$ALLOWED_DOMAINS" ]; then
    log_info "Configuring domain whitelist: $ALLOWED_DOMAINS"
    
    for domain in ${ALLOWED_DOMAINS//,/ }; do
        # Resolve domain to IP addresses
        if ips=$(nslookup "$domain" 2>/dev/null | grep -A 100 "Name:" | grep "Address:" | awk '{print $2}' | grep -v "#"); then
            for ip in $ips; do
                iptables -A OUTPUT -d "$ip" -j ACCEPT
                log_info "Allowed $domain ($ip)"
            done
        else
            log_error "Could not resolve $domain"
        fi
    done
fi

# Allow DNS (required for domain resolution)
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT
log_info "Allowed DNS queries"

# Allow HTTP/HTTPS to whitelisted IPs only
iptables -A OUTPUT -p tcp --dport 80 -j DROP
iptables -A OUTPUT -p tcp --dport 443 -j DROP
log_info "Blocked non-whitelisted HTTP/HTTPS"

log_success "Container network security initialized"
log_info "Allowed domains: $ALLOWED_DOMAINS"

# Start application if provided
if [ $# -gt 0 ]; then
    exec "$@"
fi