/**
 * Test Utilities - Async Utilities & Assertions
 *
 * Async helpers for waiting, timing, and test assertions.
 */

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Wait for next tick
 */
export function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => process.nextTick(resolve))
}

/**
 * Flush all promises
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

/**
 * Wait for specified milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Wait for condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition')
    }
    await wait(interval)
  }
}

// ============================================================================
// TEST ASSERTIONS
// ============================================================================

/**
 * Assert that element is visible
 */
export function assertVisible(element: any) {
  expect(element).toBeTruthy()
  expect(element.props).toBeDefined()
}

/**
 * Assert that element has text
 */
export function assertHasText(element: any, text: string) {
  assertVisible(element)
  expect(element.props.children).toContain(text)
}

/**
 * Assert that element is disabled
 */
export function assertDisabled(element: any) {
  assertVisible(element)
  expect(element.props.disabled).toBe(true)
}

/**
 * Assert that element is enabled
 */
export function assertEnabled(element: any) {
  assertVisible(element)
  expect(element.props.disabled).toBeFalsy()
}

/**
 * Assert that mock was called with partial match
 */
export function assertCalledWithMatch(mock: jest.Mock, expectedPartial: any) {
  expect(mock).toHaveBeenCalled()

  const calls = mock.mock.calls
  const matchingCall = calls.find((call) =>
    call.some((arg) => {
      const argStr = JSON.stringify(arg)
      const expectedStr = JSON.stringify(expectedPartial)
      return argStr.includes(expectedStr)
    })
  )

  expect(matchingCall).toBeDefined()
}
