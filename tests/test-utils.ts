// tiny/tests/test-utils.ts
// Helper functions for test setup and teardown

export function beforeEach(setupFn: () => void) {
  setupFn();
}

export function afterEach(teardownFn: () => void) {
  teardownFn();
}
