const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi']
const DIVISORS = [
  1, 1000, 1000000, 1000000000, 1000000000000, 1000000000000000, 1000000000000000000,
]

/**
 * Formats a number with compact notation (K, M, B, T, Qa, Qi)
 * @param {number|string|bigint} value - The number to format
 * @returns {string} Formatted string (e.g., "1.23K", "999")
 */
export function formatNumber(value) {
  if (value === null || value === undefined) {
    return '0'
  }

  const num = typeof value === 'string' ? parseFloat(value) : Number(value)

  if (isNaN(num)) {
    return '0'
  }

  if (num < 1000) {
    return num.toString()
  }

  for (let i = DIVISORS.length - 1; i >= 0; i--) {
    if (num >= DIVISORS[i]) {
      const scaled = num / DIVISORS[i]
      if (scaled >= 100) {
        return Math.round(scaled) + SUFFIXES[i]
      } else if (scaled >= 10) {
        return scaled.toFixed(1) + SUFFIXES[i]
      } else {
        return scaled.toFixed(2) + SUFFIXES[i]
      }
    }
  }

  return num.toString()
}
