'use strict';

/**
 * @typedef {Object} Factory
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {number} baseCost - Initial cost in QSOs
 * @property {number} qsosPerSecond - Passive generation rate
 * @property {number} tier - License tier (1-9)
 * @property {string} description - Satirical description
 */

/**
 * Tier 1 - "Getting On The Air" (Technician start)
 * Theme: Basic equipment to get started
 */
const TIER_1_FACTORIES = [
  {
    id: 'elmer',
    name: 'Elmer',
    baseCost: 10,
    qsosPerSecond: 0.1,
    tier: 1,
    description: "Old timers who help you get on the air. 'Just listen for a bit, son.'"
  },
  {
    id: 'qrq-protocol',
    name: 'QRQ Protocol',
    baseCost: 15,
    qsosPerSecond: 0.1,
    tier: 1,
    description: "QRQ? QRQ? Yes, please! Each unit autoclicks the keyer every 10 seconds."
  },
  {
    id: 'straight-key',
    name: 'Straight Key',
    baseCost: 50,
    qsosPerSecond: 0.3,
    tier: 1,
    description: "Purists who insist 'real hams use straight keys.' Click... click... click..."
  }
];

/**
 * Tier 2 - "Learning CW" (Technician mid)
 * Theme: Improving code skills and better equipment
 */
const TIER_2_FACTORIES = [
  {
    id: 'paddle-key',
    name: 'Paddle Key',
    baseCost: 500,
    qsosPerSecond: 1.0,
    tier: 2,
    description: "iambic what now? Just squeeze both paddles for SOS and hope for the best."
  },
  {
    id: 'code-practice-oscillator',
    name: 'Code Practice Oscillator',
    baseCost: 1000,
    qsosPerSecond: 2.0,
    tier: 2,
    description: "Your neighbors love hearing 'CQ CQ CQ' at 2 AM. It's not annoying at all."
  },
  {
    id: 'dipole-antenna',
    name: 'Dipole Antenna',
    baseCost: 2000,
    qsosPerSecond: 4.0,
    tier: 2,
    description: "Just throw some wire in a tree. HOA? What HOA? I don't see any HOA."
  }
];

/**
 * Tier 3 - "First Contacts" (Technician advanced)
 * Theme: Making actual contacts, better antennas
 */
const TIER_3_FACTORIES = [
  {
    id: 'bug-catcher',
    name: 'Bug Catcher',
    baseCost: 3500,
    qsosPerSecond: 6.0,
    tier: 3,
    description: "Homemade transmitter that barely works. 'It puts out 5 watts on a good day, but hey, it's mine!'"
  },
  {
    id: 'vertical-antenna',
    name: 'Vertical Antenna',
    baseCost: 5000,
    qsosPerSecond: 8.0,
    tier: 3,
    description: "Radiates equally poorly in all directions. But hey, no rotator needed!"
  },
  {
    id: 'linear-amplifier',
    name: 'Linear Amplifier',
    baseCost: 10000,
    qsosPerSecond: 15.0,
    tier: 3,
    description: "When your signal just isn't strong enough to interfere with your neighbor's TV."
  }
];

/**
 * Tier 4 - "Upgrading Your Station" (General start)
 * Theme: Directional antennas and better gear
 */
const TIER_4_FACTORIES = [
  {
    id: 'beam-antenna',
    name: 'Beam Antenna',
    baseCost: 25000,
    qsosPerSecond: 30.0,
    tier: 4,
    description: "Point it that way and talk to the other side of the world. Ignore the wife's complaints."
  },
  {
    id: 'ragchew-net',
    name: 'Ragchew Net',
    baseCost: 35000,
    qsosPerSecond: 45.0,
    tier: 4,
    description: "Daily check-ins with the same 5 people talking about their medical procedures. 73 and see you tomorrow!"
  },
  {
    id: 'tower-installation',
    name: 'Tower Installation',
    baseCost: 50000,
    qsosPerSecond: 60.0,
    tier: 4,
    description: "Because the best antenna is the one that's 200 feet in the air. Good luck with permits!"
  }
];

/**
 * Tier 5 - "HF Operations" (General mid)
 * Theme: Contesting, DX, serious operating
 */
const TIER_5_FACTORIES = [
  {
    id: 'contest-station',
    name: 'Contest Station',
    baseCost: 100000,
    qsosPerSecond: 120.0,
    tier: 5,
    description: "Five radios, six computers, and a complete inability to have normal conversations."
  },
  {
    id: 'paper-logbook',
    name: 'Paper Logbook',
    baseCost: 175000,
    qsosPerSecond: 180.0,
    tier: 5,
    description: "Because nothing says 'authentic ham' like hand-writing QSOs and then typing them into QRZ later."
  },
  {
    id: 'dx-cluster',
    name: 'DX Cluster',
    baseCost: 250000,
    qsosPerSecond: 250.0,
    tier: 5,
    description: "Real-time spots of rare stations you'll never actually hear yourself."
  }
];

/**
 * Tier 6 - "DX & Contesting" (General advanced)
 * Theme: Serious DXing, hamfests, QSLs
 */
const TIER_6_FACTORIES = [
  {
    id: 'hamfest',
    name: 'Hamfest',
    baseCost: 500000,
    qsosPerSecond: 500.0,
    tier: 6,
    description: "Where hams gather to buy each other's junk. 'I'll give you $5 for that HT that doesn't work.'"
  },
  {
    id: 'qsl-card-printer',
    name: 'QSL Card Printer',
    baseCost: 1000000,
    qsosPerSecond: 1000.0,
    tier: 6,
    description: "Printing cards for contacts you'll never confirm. Bureau backlog: 3 years and counting."
  },
  {
    id: 'remote-station',
    name: 'Remote Station',
    baseCost: 2500000,
    qsosPerSecond: 2500.0,
    tier: 6,
    description: "Operating a station in the Caribbean from your basement. Totally counts as portable operation."
  }
];

/**
 * Tier 7 - "Advanced Modes" (Extra start)
 * Theme: Digital modes, automation
 */
const TIER_7_FACTORIES = [
  {
    id: 'ft8-bot',
    name: 'FT8 Bot',
    baseCost: 5000000,
    qsosPerSecond: 5000.0,
    tier: 7,
    description: "'Is it even ham radio if a computer does it?' But it works when propagation is dead!"
  },
  {
    id: 'digital-interface',
    name: 'Digital Interface',
    baseCost: 7500000,
    qsosPerSecond: 7500.0,
    tier: 7,
    description: "Sound card modes: where you make contacts without actually talking to anyone. Perfect for introverts!"
  },
  {
    id: 'cluster-spotting-network',
    name: 'Cluster Spotting Network',
    baseCost: 10000000,
    qsosPerSecond: 10000.0,
    tier: 7,
    description: "A global network of hams who never actually listen to the bands, just wait for spots."
  }
];

/**
 * Tier 8 - "Satellite & Space" (Extra mid)
 * Theme: EME, satellites, moonbounce
 */
const TIER_8_FACTORIES = [
  {
    id: 'eme-moonbounce',
    name: 'EME Moonbounce',
    baseCost: 25000000,
    qsosPerSecond: 25000.0,
    tier: 8,
    description: "Bounce signals off the moon. Requires 1500W and a 40-foot dish. Good for one QSO per hour."
  },
  {
    id: 'lunar-repeater',
    name: 'Lunar Repeater',
    baseCost: 37500000,
    qsosPerSecond: 37500.0,
    tier: 8,
    description: "Like EME but with 90% less frustration and only 50% less dignity. The moon is just a big passive repeater, right?"
  },
  {
    id: 'satellite-constellation',
    name: 'Satellite Constellation',
    baseCost: 50000000,
    qsosPerSecond: 50000.0,
    tier: 8,
    description: "Launch your own satellites because the ISS repeater is always busy."
  }
];

/**
 * Tier 9 - "Experimental" (Extra endgame)
 * Theme: Sci-fi, impossible technology
 */
const TIER_9_FACTORIES = [
  {
    id: 'ionospheric-modification',
    name: 'Ionospheric Modification',
    baseCost: 100000000,
    qsosPerSecond: 100000.0,
    tier: 9,
    description: "HAARP called. They want their conspiracy theories back. 73 from Alaska!"
  },
  {
    id: 'time-travel-dx',
    name: 'Time Travel DX',
    baseCost: 250000000,
    qsosPerSecond: 250000.0,
    tier: 9,
    description: "Work stations from the past and future. Warning: Don't mention the 11-year solar cycle to hams from the Maunder Minimum."
  },
  {
    id: 'alternate-dimension-dxcc',
    name: 'Alternate Dimension DXCC',
    baseCost: 500000000,
    qsosPerSecond: 500000.0,
    tier: 9,
    description: "Work all entities, including those that don't exist in this reality. CQ parallel universe!"
  }
];

/**
 * All factory definitions
 * @type {Factory[]}
 */
export const FACTORIES = [
  ...TIER_1_FACTORIES,
  ...TIER_2_FACTORIES,
  ...TIER_3_FACTORIES,
  ...TIER_4_FACTORIES,
  ...TIER_5_FACTORIES,
  ...TIER_6_FACTORIES,
  ...TIER_7_FACTORIES,
  ...TIER_8_FACTORIES,
  ...TIER_9_FACTORIES
];

/**
 * Tier scaling constants
 * @type {Object}
 */
export const TIER_SCALING = {
  TECHNICIAN: 0.10,
  GENERAL: 0.07,
  EXTRA: 0.05
};

/**
 * License level to tier range mapping for 9-tier system
 * Technician: Tiers 1-3 (9 factories)
 * General: Tiers 1-6 (18 factories)
 * Extra: Tiers 1-9 (27 factories)
 * @type {Object}
 */
export const LICENSE_TIER_RANGES = {
  1: { min: 1, max: 3 },    // Technician
  2: { min: 1, max: 6 },    // General
  3: { min: 1, max: 9 }     // Extra
};

/**
 * Gets the maximum tier visible for a given license level
 * @param {number} licenseLevel - Current license level (1-3)
 * @returns {number} Maximum tier visible
 */
export function getMaxTierForLicense(licenseLevel) {
  return LICENSE_TIER_RANGES[licenseLevel]?.max || 3;
}
