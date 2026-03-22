'use strict'

/**
 * @typedef {Object} Upgrade
 * @property {string} id - Unique identifier
 * @property {string} factoryId - Which factory this upgrade is for
 * @property {string} name - Display name
 * @property {number} threshold - Number of factories required to unlock
 * @property {number} baseCost - Base cost in QSOs
 * @property {number} multiplier - Output multiplier (usually 2)
 * @property {string} description - Satirical description
 */

// Cookie Clicker-style upgrade thresholds: 1, 5, 25, 50, 100, 150, 200, 250, 300...
const UPGRADE_THRESHOLDS = [1, 5, 25, 50, 100, 150, 200, 250, 300]

/**
 * License unlock costs (for future use - currently handled by tier visibility)
 * Tier visibility is controlled by LICENSE_TIER_RANGES in factories.js
 * @type {Object}
 */
export const LICENSE_COSTS = {
  1: 0n, // Start as Technician
  2: 50_000_000n, // General at 50 million total QSOs earned
  3: 500_000_000n, // Extra at 500 million total QSOs earned
}

/**
 * Generate upgrades for a factory following Cookie Clicker pattern
 * Each upgrade doubles output (2x) and costs baseCost × 10^(threshold tier)
 * @param {string} factoryId - Factory ID
 * @param {string} factoryName - Factory name
 * @param {number} factoryBaseCost - Factory base cost
 * @param {string[]} upgradeNames - Array of upgrade names
 * @param {string[]} upgradeDescriptions - Array of upgrade descriptions
 * @param {string} [icon='⚡'] - Icon emoji for the upgrade
 * @returns {Upgrade[]} Array of upgrades
 */
function generateUpgrades(
  factoryId,
  factoryName,
  factoryBaseCost,
  upgradeNames,
  upgradeDescriptions,
  icon = '⚡'
) {
  return UPGRADE_THRESHOLDS.slice(0, upgradeNames.length).map((threshold, index) => {
    // Cost formula: baseCost × 10^(index + 1) - similar to Cookie Clicker scaling
    const cost = Math.floor(factoryBaseCost * Math.pow(10, index + 1))

    return {
      id: `${factoryId}-upgrade-${index}`,
      factoryId: factoryId,
      name: upgradeNames[index],
      threshold: threshold,
      baseCost: cost,
      multiplier: 2,
      description: upgradeDescriptions[index],
      icon: icon,
    }
  })
}

// Elmer upgrades
const ELMER_UPGRADES = generateUpgrades(
  'elmer',
  'Elmer',
  10,
  [
    'Rusty Soldering Iron',
    'Coffee-Stained Logbook',
    'Tube Radio Collection',
    'Shack Full of Junk',
    'Antenna Farm',
    'QSL Card Archive',
    'Keyer Collection',
    'Hamfest Veteran',
    'Silent Key Memorial',
  ],
  [
    "It's seen better days, but it still works.",
    'Every contact since 1987, meticulously recorded.',
    "They don't make 'em like this anymore. None of them work, but they look great on the shelf.",
    'You can barely move in there, but you might find a 40-year-old resistor you need someday.',
    'He has more antennas than the local broadcast station. None of them are connected.',
    'Walls covered with cards from every continent. Including Antarctica. Especially Antarctica.',
    "Straight keys, paddles, bugs, and something that might be a telegraph. He's forgotten how to use half of them.",
    "Knows every vendor by name. Gets the best deals on stuff that doesn't work.",
    "Gone but not forgotten. His shack lives on, filled with parts that 'might be useful someday.'",
  ],
  '⚡'
)

// QRQ Protocol upgrades
const QRQ_UPGRADES = generateUpgrades(
  'qrq-protocol',
  'QRQ Protocol',
  15,
  [
    'Faster Keyer',
    'Dit Optimizer',
    'Dah Compressor',
    'Timing Perfection',
    'QRQ Championship',
    'Speed Demon Mode',
    'Machine Gun Fist',
    'CW Robot Mode',
    'Quantum Keying',
  ],
  [
    'Each finger moves independently now.',
    'Those dits are getting dangerously fast.',
    'Compressing the space between dahs... somehow.',
    'Your timing is now better than atomic clocks.',
    "You're sending so fast, the FCC is investigating.",
    "At this speed, you're basically a human baud rate generator.",
    'Your fist is a blur. The key is smoking.',
    "You've transcended human limitations. Are you sure you're not AI?",
    'Keying in multiple dimensions simultaneously. The physics department wants to talk to you.',
  ],
  '⚡'
)

// Straight Key upgrades
const STRAIGHT_KEY_UPGRADES = generateUpgrades(
  'straight-key',
  'Straight Key',
  50,
  [
    'Polished Brass',
    'Adjustable Gap',
    'Solid Mount',
    'Precision Bearings',
    'Custom Knob',
    'Gold Contacts',
    'Museum Piece',
    'Heirloom Quality',
    'Antique Original',
  ],
  [
    'Shiny enough to see your reflection while you pound brass.',
    'Micrometer-adjustable. Because every thou matters at 5 WPM.',
    'Bolted to a 50-pound steel plate. Still walks across the desk.',
    'Smoother than butter. Your fist is still terrible though.',
    'Carved from a single piece of rare hardwood. You paid too much.',
    'Solid gold contacts. Completely unnecessary, but impressive.',
    "This belongs in a museum. Instead, it's on your messy desk.",
    'Passed down through three generations. Still works perfectly.',
    'Used by Marconi himself. Probably. The eBay seller seemed trustworthy.',
  ],
  '⚡'
)

// Paddle Key upgrades
const PADDLE_KEY_UPGRADES = generateUpgrades(
  'paddle-key',
  'Paddle Key',
  500,
  [
    'Magnetic Return',
    'Adjustable Spacing',
    'Weighted Base',
    'Teflon Bushings',
    'Spring Upgrade',
    'Titanium Paddles',
    'Custom Engraving',
    'Competition Grade',
    'Prototype Edition',
  ],
  [
    'The magnets are so strong, they pull nearby paperclips off the desk.',
    'Adjustable to within a thousandth of an inch. You still squeeze both paddles at once.',
    "Won't move even during your most aggressive iambic attempts.",
    'Smoothest action this side of a Swiss watch.',
    'Upgraded springs that will definitely outlast your interest in ham radio.',
    'Titanium paddles: lightweight, strong, and completely unnecessary.',
    'Your call sign engraved in gold. Very classy.',
    "Used by contest winners worldwide. Still doesn't fix your timing.",
    'One of only five ever made. You have three of them for some reason.',
  ],
  '⚡'
)

// Code Practice Oscillator upgrades
const CPO_UPGRADES = generateUpgrades(
  'code-practice-oscillator',
  'Code Practice Oscillator',
  1000,
  [
    'Volume Knob',
    'Tone Control',
    'Better Speaker',
    'Digital Display',
    'Recording Output',
    'Multi-Band Support',
    'Studio Quality',
    'Concert Hall Mode',
    'Hearing Damage Edition',
  ],
  [
    'Now you can annoy your neighbors at various volumes.',
    'From shrill to bass-y. All of them annoying at 2 AM.',
    'Your neighbors can now hear you from three houses away. Progress!',
    "Shows your sending speed in WPM. You're slower than you thought.",
    'Record your practice sessions. Listen to how bad you really are.',
    'Works on multiple bands. All of them annoying.',
    'Studio-quality sound for your terrible fist.',
    'Simulates the acoustics of Carnegie Hall. Still sounds like garbage.',
    "Warning: may cause permanent hearing damage. Your neighbors' hearing, not yours.",
  ],
  '⚡'
)

// Dipole Antenna upgrades
const DIPOLE_UPGRADES = generateUpgrades(
  'dipole-antenna',
  'Dipole Antenna',
  2000,
  [
    'Center Insulator',
    'Balun Upgrade',
    'Heavy-Duty Wire',
    'Lightning Arrestor',
    'Remote Tuner',
    'Rotatable Dipole',
    'Multi-Band Traps',
    'Stealth Mode',
    'Orbital Deployment',
  ],
  [
    'Fancy ceramic insulator. The birds love it.',
    'Proper impedance matching. Your SWR is finally reasonable.',
    "Wire thick enough to clothesline a deer. HOA still hasn't noticed.",
    'Protection against lightning. The insurance company is relieved.',
    'Tune from your shack. No more climbing trees in the rain.',
    "Wait, isn't this just a beam antenna? Don't tell the dipole purists.",
    'Works on every band. None of them well, but technically they work.',
    'Invisible to HOAs. Also invisible to most signals.',
    'Deployed from the International Space Station. QSOs from orbit!',
  ],
  '⚡'
)

// Combine all upgrades
export const UPGRADES = [
  ...ELMER_UPGRADES,
  ...QRQ_UPGRADES,
  ...STRAIGHT_KEY_UPGRADES,
  ...PADDLE_KEY_UPGRADES,
  ...CPO_UPGRADES,
  ...DIPOLE_UPGRADES,
]

/**
 * Get all available upgrades for a factory
 * @param {string} factoryId - Factory ID
 * @param {number} ownedCount - Number of factories owned
 * @returns {Upgrade[]} Array of available upgrades
 */
export function getAvailableUpgrades(factoryId, ownedCount) {
  return UPGRADES.filter(u => u.factoryId === factoryId && u.threshold <= ownedCount)
}

/**
 * Get upgrade thresholds for reference
 * @returns {number[]} Array of threshold values
 */
export function getUpgradeThresholds() {
  return [...UPGRADE_THRESHOLDS]
}
