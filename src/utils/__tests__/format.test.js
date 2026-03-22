import { formatNumber } from '../format.js'

describe('formatNumber', () => {
  test('returns full number for values under 1000', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(999)).toBe('999')
  })

  test('formats 1000 as 1.00K', () => {
    expect(formatNumber(1000)).toBe('1.00K')
  })

  test('formats values at each threshold', () => {
    expect(formatNumber(1010)).toBe('1.01K')
    expect(formatNumber(1100)).toBe('1.10K')
    expect(formatNumber(10000)).toBe('10.0K')
    expect(formatNumber(100000)).toBe('100K')
    expect(formatNumber(1000000)).toBe('1.00M')
    expect(formatNumber(1000000000)).toBe('1.00B')
    expect(formatNumber(1000000000000)).toBe('1.00T')
    expect(formatNumber(1000000000000000)).toBe('1.00Qa')
    expect(formatNumber(1000000000000000000)).toBe('1.00Qi')
  })

  test('rounds values correctly', () => {
    expect(formatNumber(1995)).toBe('2.00K')
    expect(formatNumber(1994)).toBe('1.99K')
    expect(formatNumber(1995000)).toBe('2.00M')
  })

  test('rounds boundary values to next suffix', () => {
    expect(formatNumber(999500)).toBe('1.00M')
    expect(formatNumber(999499)).toBe('999.5K')
    expect(formatNumber(999499n)).toBe('999.5K')
    expect(formatNumber(999500n)).toBe('1.00M')
    expect(formatNumber(999950000)).toBe('1.00B')
    expect(formatNumber(999499999)).toBe('999.5M')
  })

  test('handles negative values with compact formatting', () => {
    expect(formatNumber(-500)).toBe('-500')
    expect(formatNumber(-1500)).toBe('-1.50K')
    expect(formatNumber(-1995000)).toBe('-2.00M')
    expect(formatNumber(-1000000000000000n)).toBe('-1.00Qa')
  })

  test('handles BigInt input', () => {
    expect(formatNumber(1000n)).toBe('1.00K')
  })

  test('handles BigInt rounding consistently with Number path', () => {
    expect(formatNumber(1995n)).toBe('2.00K')
    expect(formatNumber(1994n)).toBe('1.99K')
    expect(formatNumber(1995000n)).toBe('2.00M')
  })

  test('handles BigInt above Number.MAX_SAFE_INTEGER without precision loss', () => {
    const hugeNumber = 9007199254740993n
    expect(formatNumber(hugeNumber)).toBe('9.01Qa')
  })

  test('handles very large BigInt values', () => {
    expect(formatNumber(1000000000000000000n)).toBe('1.00Qi')
    expect(formatNumber(1234567890000000000n)).toBe('1.23Qi')
    expect(formatNumber(100000000000000000n)).toBe('100Qa')
  })

  test('handles string input', () => {
    expect(formatNumber('1000')).toBe('1.00K')
  })

  test('handles large integer string without precision loss', () => {
    expect(formatNumber('9007199254740993')).toBe('9.01Qa')
    expect(formatNumber('1234567890000000000')).toBe('1.23Qi')
  })

  test('handles negative string input', () => {
    expect(formatNumber('-1500')).toBe('-1.50K')
    expect(formatNumber('-1995')).toBe('-2.00K')
  })

  test('handles edge cases', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
    expect(formatNumber('')).toBe('0')
    expect(formatNumber('   ')).toBe('0')
    expect(formatNumber('abc')).toBe('0')
  })

  test('handles non-finite number input', () => {
    expect(formatNumber(Infinity)).toBe('0')
    expect(formatNumber(-Infinity)).toBe('0')
    expect(formatNumber(NaN)).toBe('0')
  })

  test('preserves huge BigInt digits without Number precision loss', () => {
    expect(formatNumber(123456789012345678901500000000000000000n)).toBe('123456789012345678901.5Qi')
  })
})
