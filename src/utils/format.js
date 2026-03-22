const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi']

const BIGINT_DIVISORS = [
  1n,
  1000n,
  1000000n,
  1000000000n,
  1000000000000n,
  1000000000000000n,
  1000000000000000000n,
]

/**
 * Formats a number with compact notation (K, M, B, T, Qa, Qi)
 * Uses bigint math for bigint and integer-string inputs to avoid precision loss.
 * @param {number|string|bigint} value - The number to format
 * @returns {string} Formatted string (e.g., "1.23K", "999")
 */
export function formatNumber(value) {
  if (value === null || value === undefined) {
    return '0'
  }

  if (typeof value === 'bigint') {
    return formatBigInt(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') {
      return '0'
    }

    if (/^-?\d+$/.test(trimmed)) {
      return formatBigInt(BigInt(trimmed))
    }

    const parsed = parseFloat(trimmed)
    if (!Number.isFinite(parsed)) {
      return '0'
    }
    return formatNumberInternal(parsed)
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return '0'
    }
    return formatNumberInternal(value)
  }

  return String(value)
}

/**
 * Formats a number using Number math (for regular numbers)
 */
function formatNumberInternal(num) {
  const isNegative = num < 0
  const absNum = Math.abs(num)

  if (absNum < 1000) {
    return num.toString()
  }

  for (let i = BIGINT_DIVISORS.length - 1; i >= 1; i--) {
    const divisor = Number(BIGINT_DIVISORS[i])
    if (absNum >= divisor) {
      const scaled = absNum / divisor
      const rounded = Math.round(scaled)

      if (rounded >= 1000 && i < SUFFIXES.length - 1) {
        return formatNumberInternal(rounded * divisor)
      }

      let formatted
      if (scaled >= 100) {
        if (scaled === Math.round(scaled)) {
          formatted = Math.round(scaled) + SUFFIXES[i]
        } else {
          formatted = scaled.toFixed(1) + SUFFIXES[i]
        }
      } else if (scaled >= 10) {
        formatted = scaled.toFixed(1) + SUFFIXES[i]
      } else {
        formatted = scaled.toFixed(2) + SUFFIXES[i]
      }
      return isNegative ? '-' + formatted : formatted
    }
  }

  return num.toString()
}

/**
 * Formats a bigint using pure bigint math to avoid precision loss
 */
function formatBigInt(value) {
  const isNegative = value < 0n
  const absValue = isNegative ? -value : value

  if (absValue < 1000n) {
    return value.toString()
  }

  for (let i = BIGINT_DIVISORS.length - 1; i >= 1; i--) {
    if (absValue >= BIGINT_DIVISORS[i]) {
      const divisor = BIGINT_DIVISORS[i]
      const quotient = absValue / divisor
      const remainder = absValue % divisor

      const roundedInteger = (absValue + divisor / 2n) / divisor
      if (roundedInteger >= 1000n && i < SUFFIXES.length - 1) {
        return formatBigInt(1000n * divisor)
      }

      let formatted
      if (quotient >= 100n) {
        if (remainder === 0n) {
          formatted = quotient.toString() + SUFFIXES[i]
        } else {
          const roundedTenths = (absValue * 10n + divisor / 2n) / divisor
          if (roundedTenths >= 10000n && i < SUFFIXES.length - 1) {
            return formatBigInt(1000n * divisor)
          }

          const intPart = roundedTenths / 10n
          const fracPart = roundedTenths % 10n
          formatted = `${intPart}.${fracPart}${SUFFIXES[i]}`
        }
      } else if (quotient >= 10n) {
        const roundedTenths = (absValue * 10n + divisor / 2n) / divisor
        if (roundedTenths >= 10000n && i < SUFFIXES.length - 1) {
          return formatBigInt(1000n * divisor)
        }

        const intPart = roundedTenths / 10n
        const fracPart = roundedTenths % 10n
        formatted = `${intPart}.${fracPart}${SUFFIXES[i]}`
      } else {
        const roundedHundredths = (absValue * 100n + divisor / 2n) / divisor
        if (roundedHundredths >= 100000n && i < SUFFIXES.length - 1) {
          return formatBigInt(1000n * divisor)
        }

        const intPart = roundedHundredths / 100n
        const fracPart = (roundedHundredths % 100n).toString().padStart(2, '0')
        formatted = `${intPart}.${fracPart}${SUFFIXES[i]}`
      }

      return isNegative ? '-' + formatted : formatted
    }
  }

  return value.toString()
}
