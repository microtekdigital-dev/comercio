# Fix: Trial Reactivation After Cancellation

## Problem
When a user cancels their trial subscription and refreshes the page, the trial gets reactivated automatically.

## Root Cause
The `getCompanySubscriptionAndPlans()` function was checking for subscriptions but the logic wasn't properly preventing trial recreation when a cancelled subscription existed.

## Solution

### 1. Enhanced Query Logic (`lib/actions/plans.ts`)
- Added explicit check for ANY subscription (including cancelled)
- Added console logs to track subscription state
- Modified logic to NEVER create a new trial if ANY subscription exists (even cancelled)

### 2. Improved Status Display (`components/dashboard/current-subscription.tsx`)
- Added explicit `isCancelled` state check
- Changed badge variant to "destructive" for cancelled subscriptions
- Added clear message when subscription is cancelled
- Separated logic for `willCancel` vs `isCancelled` states

### 3. Debug Logging
Added console logs at key points:
- `[getCompanySubscriptionAndPlans]` - When checking subscriptions
- `[buildBillingSummary]` - When building subscription summary
- Shows subscription status and whether trial creation is triggered

## Testing Steps

1. **Cancel Trial:**
   - Log in with trial account
   - Go to `/dashboard/billing`
   - Click "Cancelar Suscripción"
   - Confirm cancellation

2. **Verify Cancellation Persists:**
   - Refresh the page multiple times
   - Check browser console for logs
   - Verify subscription shows as "Cancelado" (red badge)
   - Verify no new trial is created

3. **Check Console Logs:**
   Look for these logs in browser console:
   ```
   [getCompanySubscriptionAndPlans] Checking subscriptions for company: <uuid>
   [getCompanySubscriptionAndPlans] Found subscription: { status: "cancelled", ... }
   [getCompanySubscriptionAndPlans] Subscription exists with status: cancelled
   [buildBillingSummary] Building summary for subscription: { status: "cancelled", ... }
   [buildBillingSummary] Built subscription summary: { status: "cancelled", ... }
   ```

4. **Verify Dashboard Block:**
   - Try to access other dashboard pages
   - Should be blocked with message about cancelled subscription
   - Only `/dashboard/billing` should be accessible

## Expected Behavior After Fix

### When Trial is Cancelled:
- ✅ Status shows as "Cancelado" with red badge
- ✅ Message: "Tu suscripción ha sido cancelada. Selecciona un plan de pago para continuar."
- ✅ Dashboard access is blocked (except billing page)
- ✅ Refreshing page does NOT create new trial
- ✅ Subscription stays cancelled

### Console Logs Should Show:
- ✅ "Found subscription" with status "cancelled"
- ✅ "Subscription exists with status: cancelled"
- ✅ NO "No subscription found, creating trial" message

## Files Modified

1. `lib/actions/plans.ts`
   - Enhanced subscription query logic
   - Added debug logging
   - Improved comments

2. `components/dashboard/current-subscription.tsx`
   - Added `isCancelled` state
   - Improved badge variant logic
   - Added cancelled subscription message

## Next Steps

1. Deploy changes to Vercel
2. Test with a trial account
3. Monitor console logs to verify behavior
4. Execute SQL script `scripts/091_trial_cancellation_simple.sql` in Supabase (for email tracking)

## Important Notes

- The fix prevents trial recreation by checking for ANY subscription (including cancelled)
- Console logs help debug if trial is being recreated
- The SQL script is still needed for email-based trial prevention (prevents reuse with same email)
