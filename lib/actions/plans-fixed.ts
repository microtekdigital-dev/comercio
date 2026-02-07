// TEMPORARY FILE - Contains fixed version of getCompanySubscriptionAndPlans
// This file should replace the logic in plans.ts

export async function getCompanySubscriptionAndPlansFixed() {
  // AUTO-TRIAL CREATION IS DISABLED
  // Trials are ONLY created by database trigger
  // This prevents recreation after cancellation
  
  console.log("Using FIXED version - auto-trial DISABLED");
  
  // Return existing subscription or null
  // Never create new trials automatically
}
