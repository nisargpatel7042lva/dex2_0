# RPC Timeout and Auth Token Fixes

## Summary of Changes Made

This document outlines the changes made to resolve the authentication token expiration and RPC timeout issues experienced during Jupiter swaps.

## Key Issues Identified

1. **Auth Token Expiration**: Auth tokens were expiring before complex Jupiter swap transactions could complete
2. **Short RPC Timeouts**: 60-second timeout was insufficient for Jupiter swaps during network congestion
3. **Aggressive Token Refresh**: 1-minute token refresh threshold was too short
4. **Network Timeout Issues**: 15-second network timeouts were causing premature failures

## Changes Made

### 1. Network Configuration (`constants/network-config.ts`)
Created a centralized configuration file with optimized timeout values:
- **RPC Connection Timeout**: Increased from 60s to 120s (2 minutes)
- **Network Timeout**: Increased from 15s to 30s
- **Auth Token Refresh**: Increased from 60s to 300s (5 minutes)
- **Connection Health Checks**: Reduced frequency from 30s to 60s
- **Jupiter API Timeouts**: 30s for quotes, 60s for swaps

### 2. WalletService Improvements (`src/services/WalletService.ts`)
- **Enhanced RPC Configuration**: Added WebSocket endpoints for better performance
- **Improved Retry Logic**: Increased backoff delay between retries (2s base instead of 1s)
- **Better Auth Token Management**: Less aggressive refresh schedule to prevent unnecessary reconnections
- **Timeout Integration**: Uses centralized NetworkConfig values

### 3. Swap Screen Optimizations (`app/swap.tsx`)
- **API Timeout Handling**: Added Promise.race patterns with appropriate timeouts
- **Better Reconnection Logic**: Increased wait time after reconnection (5s instead of 3s)
- **Centralized Configuration**: Uses NetworkConfig for all timeout values
- **Improved Error Handling**: Better detection and handling of auth token expiration

### 4. Key Timeout Increases

| Component | Before | After | Improvement |
|-----------|--------|-------|-------------|
| RPC Confirmation | 60s | 120s | +100% |
| Network Operations | 15s | 30s | +100% |
| Auth Token Refresh | 60s | 300s | +400% |
| Health Check Interval | 30s | 60s | Reduced frequency |
| Wallet Reconnect Wait | 3s | 5s | +67% |

## Expected Results

These changes should significantly reduce the occurrence of:
- `auth_token not valid for signing` errors
- `WALLET_AUTH_EXPIRED` errors
- Network timeout failures during Jupiter swaps
- Premature connection health check failures

## Configuration Benefits

1. **Centralized Management**: All timeouts are now managed in one place
2. **Easy Adjustment**: Can be tuned based on network conditions
3. **Better Stability**: More realistic timeouts for mobile environments
4. **Reduced Auth Churn**: Less frequent token refreshes improve user experience

## Testing Recommendations

1. Test Jupiter swaps during high network congestion periods
2. Monitor auth token lifetime and renewal patterns
3. Verify improved success rates for complex swaps
4. Check that connection health monitoring is less intrusive

## Future Considerations

- Consider implementing adaptive timeouts based on network conditions
- Add metrics collection for timeout events
- Implement exponential backoff for auth token refresh
- Consider adding user-configurable timeout preferences for advanced users
