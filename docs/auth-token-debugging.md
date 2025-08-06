# Auth Token Debugging Guide

## Testing the Auth Token Fixes

To verify that the auth token expiration fixes are working properly, monitor these log messages:

### 1. Auth Token Age Tracking
Look for these logs during transactions:
```
Auth token age: XXXXXms
```

### 2. Reduced Validation Calls
You should see fewer of these logs:
```
Auth token validation successful
Auth token validation failed
```

### 3. Improved Transaction Flow
During Jupiter swaps, you should see:
```
Auth token age is acceptable, proceeding with transaction
```
Instead of:
```
Auth token is old, refreshing connection...
```

### 4. Better Error Handling
If auth token does expire, you should see this flow:
```
Auth token error detected, marking wallet for reconnection...
Wallet auth error detected, attempting to reconnect...
```

## Key Changes Made

1. **Removed Premature Token Validation**: The `validateAuthToken()` method no longer calls `transact()` which was consuming auth token usage
2. **Increased Token Lifetime**: Auth tokens now last 10 minutes instead of 5 minutes before refresh
3. **Less Aggressive Validation**: `ensureWalletReady()` no longer validates tokens, just checks age
4. **Smarter Transaction Handling**: Only reconnects if token is very old (12 minutes vs 10 minute threshold)
5. **Reduced Health Check Frequency**: Connection checks now happen every 2 minutes instead of 1 minute

## Expected Behavior

- Auth tokens should last much longer during Jupiter swaps
- Fewer reconnection prompts during normal usage
- Better success rate for complex transactions
- More stable wallet connection overall

## If Issues Persist

If you still see auth token errors, try these additional steps:

1. **Increase the threshold further** in `network-config.ts`:
   ```typescript
   AUTH_TOKEN_REFRESH_THRESHOLD: 900000, // 15 minutes
   ```

2. **Reduce health check frequency**:
   ```typescript
   CONNECTION_CHECK_INTERVAL: 300000, // 5 minutes
   ```

3. **Check for any remaining validation calls** that might be consuming token usage
