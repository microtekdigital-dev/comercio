# Auto-Trial Creation Disabled

This file marks that automatic trial creation has been disabled in `lib/actions/plans.ts`.

Trials are now ONLY created by the database trigger when a new user signs up.

This prevents trial recreation after cancellation.

## Changes Made

- Disabled `activateTrialForCompany()` call in `getCompanySubscriptionAndPlans()`
- Function now returns empty subscription state if no subscription exists
- Users must manually select a plan after cancellation

## Date
2026-02-07
