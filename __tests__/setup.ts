/**
 * Test Setup File
 * 
 * This file runs before all tests and sets up the testing environment.
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

// Configure fast-check for property-based testing
import * as fc from 'fast-check';

// Global configuration for fast-check
fc.configureGlobal({
  numRuns: 100, // Minimum 100 iterations per property test
  verbose: true,
  seed: Date.now(), // Use current timestamp as seed for reproducibility
});

beforeAll(() => {
  // Setup code that runs once before all tests
  console.log('🧪 Starting test suite...');
});

afterEach(() => {
  // Cleanup after each test
  // Reset mocks, clear timers, etc.
});

afterAll(() => {
  // Cleanup code that runs once after all tests
  console.log('✅ Test suite completed');
});
