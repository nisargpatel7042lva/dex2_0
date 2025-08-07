# Token-2022 Liquidity Service Testing Guide

## 🚀 How to Test Your Token-2022 Liquidity Integration

Now that you've started the app with `yarn start`, follow these steps to test if the Token-2022 liquidity service is working properly:

### 1. 📱 Basic App Testing

**First, check if the app runs without crashes:**

1. Open your app in the simulator/device
2. Navigate through the main screens (Portfolio, Trading, Settings)
3. Check the console for any initialization errors
4. Look for these success messages in the console:
   ```
   ✅ Token2022LiquidityService created
   ✅ All services initialized successfully!
   ```

### 2. 🔧 Console Testing (Quick Method)

**In your browser console (if using web) or React Native debugger:**

```javascript
// Test the manual testing function
import { testToken2022LiquidityService } from './src/tests/manual-test';

// Run the comprehensive test
testToken2022LiquidityService().then(() => {
  console.log('All tests completed!');
});
```

### 3. 🧪 In-App Testing (Recommended)

**Use the dedicated test component I created for you:**

1. Navigate to the test page: `/token2022-test`
2. Tap "Run All Tests" button
3. Watch the test results appear in real-time
4. Each test will show:
   - ✅ Success (green)
   - ❌ Error (red) 
   - ⏳ Pending (orange)

**Expected Test Results:**
- ✅ Services Initialization
- ✅ Wallet Connection (if wallet is connected)
- ✅ Calculate Optimal Liquidity
- ✅ Get User Liquidity Positions (returns empty array)
- ✅ Get Pool Info (returns null for mock data)
- ❌ Transaction Building (expected to fail with mock data)

### 4. 🔍 What to Check For

#### ✅ Success Indicators:
1. **No compilation errors** when starting the app
2. **Services initialized** message in console
3. **Token2022LiquidityService** appears in app context
4. **Test component** loads without crashing
5. **Basic calculations** work (liquidity calculation)

#### ⚠️ Expected Failures:
1. **Transaction building** will fail (using mock data)
2. **Network calls** may timeout (using placeholder endpoints)
3. **Pool info** returns null (no real pool data)

#### ❌ Actual Issues to Fix:
1. **App crashes** on startup
2. **TypeScript compilation** errors
3. **Service not initialized** errors
4. **Import/export** errors

### 5. 📊 Manual Testing Steps

**Step by Step Manual Testing:**

1. **Check App Context:**
   ```javascript
   // In your app component, log the context
   const { token2022LiquidityService, servicesInitialized } = useApp();
   console.log('Service available:', !!token2022LiquidityService);
   console.log('Services initialized:', servicesInitialized);
   ```

2. **Test Liquidity Calculation:**
   ```javascript
   const { calculateOptimalLiquidity } = useApp();
   const result = calculateOptimalLiquidity('1000', '2000', -1000, 1000, 0);
   console.log('Liquidity calculation result:', result);
   ```

3. **Test Service Methods:**
   ```javascript
   const { token2022LiquidityService } = useApp();
   if (token2022LiquidityService) {
     // Test calculation method
     const liquidity = token2022LiquidityService.calculateLiquidity('1000', '2000', -1000, 1000, 0);
     console.log('Direct service calculation:', liquidity);
   }
   ```

### 6. 🐛 Common Issues & Fixes

#### Issue: "Service not initialized"
**Fix:** Check that the service is being created in AppContext initialization

#### Issue: TypeScript errors
**Fix:** Run `npm run type-check` to see specific type issues

#### Issue: Import errors
**Fix:** Check file paths in import statements

#### Issue: Transaction building fails
**Expected:** This will fail with mock data, that's normal

### 7. 📈 Next Steps After Basic Testing

**Once basic tests pass:**

1. **Connect Real Wallet**
   - Test with actual wallet connection
   - Check wallet balance retrieval
   - Verify wallet service integration

2. **Use Real Pool Data**
   - Replace mock pool addresses with real Raydium V3 pools
   - Test with actual Token-2022 tokens
   - Verify instruction data format

3. **Test Transaction Simulation**
   - Use Solana transaction simulation
   - Verify instruction accounts are correct
   - Check instruction data serialization

4. **Integration Testing**
   - Test from the trading UI
   - Verify user flow works end-to-end
   - Test error handling

### 8. 🎯 Success Criteria

**Your integration is working if:**
- ✅ App starts without crashes
- ✅ Services initialize successfully  
- ✅ Token2022LiquidityService is available in context
- ✅ Basic calculations work
- ✅ Method calls don't throw errors
- ✅ Test component runs without issues

**Ready for production when:**
- ✅ All above + real wallet integration
- ✅ Real pool data integration
- ✅ Transaction simulation passes
- ✅ UI integration complete

---

## 🔧 Quick Debug Commands

```bash
# Check for compilation errors
npm run type-check

# Build the app
npm run build

# View logs
npx react-native log-ios    # iOS
npx react-native log-android # Android

# Clear cache if needed
npx react-native start --reset-cache
```

## 📞 What to Report

**If tests fail, please share:**
1. Console error messages
2. Which specific tests failed
3. App startup logs
4. TypeScript compilation errors

This will help me quickly identify and fix any remaining issues!
