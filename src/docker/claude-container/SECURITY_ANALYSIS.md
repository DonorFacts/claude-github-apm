# Claude Container Security Analysis

## Executive Summary

The enhanced wrapper script (`claude-wrapper-enhanced.sh`) prioritizes functionality over security to enable clipboard support. While this provides a good user experience, it does introduce several security risks. I've created a security-hardened alternative (`claude-wrapper-secure.sh`) that mitigates these risks with some functionality trade-offs.

## Risk Assessment

### Critical Risks in Enhanced Wrapper

#### 1. Docker Socket Access (CRITICAL)
```bash
-v /var/run/docker.sock:/var/run/docker.sock:rw
```
- **Impact**: Container can control host Docker daemon
- **Risk**: Equivalent to root access - can create privileged containers, access all images/volumes
- **Exploitation**: Malicious code could escape container, access host filesystem

#### 2. Host Network Mode (HIGH)
```bash
--network host
```
- **Impact**: Container shares host's network namespace
- **Risk**: Can bind to any port, access local services, sniff traffic
- **Exploitation**: Access to localhost services, potential lateral movement

#### 3. Disabled Seccomp (HIGH)
```bash
--security-opt seccomp:unconfined
```
- **Impact**: Disables syscall filtering
- **Risk**: Container can make dangerous system calls
- **Exploitation**: Kernel exploits, privilege escalation

### Medium Risks

#### 4. X11 Access (MEDIUM)
```bash
xhost +localhost  # macOS
xhost +local:docker  # Linux
```
- **Impact**: Opens X11 to local connections
- **Risk**: Keylogging, screenshots, input injection
- **Mitigation**: Temporary access, removed on exit in secure version

#### 5. Parent Directory Mount (MEDIUM)
```bash
-v ${parent_dir}:${parent_dir}:rw
```
- **Impact**: Exposes directories above current
- **Risk**: Access to sensitive files outside project
- **Mitigation**: Removed in secure version

#### 6. GitHub Token Exposure (MEDIUM)
```bash
-e GITHUB_TOKEN=$GITHUB_TOKEN
```
- **Impact**: Passes authentication token to container
- **Risk**: Token theft, unauthorized repository access
- **Mitigation**: Opt-in only in secure version

## Security Improvements in Hardened Version

### 1. No Docker Socket
- Removes Docker-in-Docker capability
- Eliminates root-equivalent access risk

### 2. Network Isolation
```bash
--network bridge  # Instead of host
```
- Container gets its own network namespace
- Cannot access host localhost services

### 3. Seccomp Enabled
- Default seccomp profile active
- Dangerous syscalls blocked

### 4. Read-Only Root Filesystem
```bash
--read-only
--tmpfs /tmp:rw,size=1g,mode=1777
```
- Prevents persistent modifications
- Temporary storage only where needed

### 5. Capability Restrictions
```bash
--cap-drop ALL
--cap-add CHOWN DAC_OVERRIDE SETGID SETUID
```
- Drops all Linux capabilities
- Adds only minimum required

### 6. Resource Limits
```bash
--memory 4g
--cpus 2.0
--pids-limit 200
```
- Prevents resource exhaustion
- Limits process spawning

### 7. Session-Specific X11 Auth
- Generates unique xauth cookie per session
- Automatic cleanup on exit
- More restrictive xhost rules

## Functionality Trade-offs

| Feature | Enhanced | Secure | Impact |
|---------|----------|---------|---------|
| Clipboard paste | ✅ Full | ⚠️ Limited | No Docker-based clipboard bridge |
| Docker commands | ✅ Yes | ❌ No | Cannot run Docker inside container |
| Network access | ✅ Full | ⚠️ Limited | Cannot access host services |
| File access | ✅ Parent dirs | ❌ Current only | Better isolation |
| Performance | ✅ Full | ⚠️ Limited | Resource constraints |

## Recommendations

### For Development (Low Risk Environment)
Use `claude-wrapper-enhanced.sh` if:
- Working on trusted code
- Need full Docker functionality
- Clipboard support is critical
- On personal/development machine

### For Production/Sensitive Work
Use `claude-wrapper-secure.sh` if:
- Working with untrusted code
- Handling sensitive data
- Security is priority over convenience
- On shared/production systems

### Best Practices

1. **Regular Updates**: Rebuild container image regularly
2. **Audit Mounts**: Review what directories are exposed
3. **Token Management**: Use short-lived tokens when possible
4. **X11 Timeout**: Close XQuartz when not needed
5. **Network Monitoring**: Watch for unusual network activity

## Quick Security Check

Run this to verify security settings:
```bash
# Check current wrapper
docker inspect claude-* | jq '.[0].HostConfig.SecurityOpt'
docker inspect claude-* | jq '.[0].HostConfig.NetworkMode'
docker inspect claude-* | jq '.[0].HostConfig.Binds'
```

## Conclusion

The enhanced wrapper provides excellent functionality but with security trade-offs. The secure wrapper significantly reduces attack surface while maintaining core functionality. Choose based on your security requirements and trust level.

For most development work on trusted projects, the enhanced wrapper is acceptable. For any work involving sensitive data or untrusted code, use the secure wrapper.