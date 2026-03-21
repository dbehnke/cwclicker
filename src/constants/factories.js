'use strict';

/**
 * @typedef {Object} Factory
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {number} baseCost - Initial cost in QSOs
 * @property {number} qsosPerSecond - Passive generation rate
 * @property {number} tier - License tier (1-7)
 * @property {string} description - Satirical description
 */

/**
 * Tier 1-2 (Technician) - 6 factories, 10% scaling
 * @type {Factory[]}
 */
const TECHNICIAN_FACTORIES = [
  {
    id: 'qrq-protocol',
    name: 'QRQ Protocol',
    baseCost: 15,
    qsosPerSecond: 0.1,
    tier: 1,
    description: "QRQ? QRQ? Yes, please! Each unit autoclicks the keyer every 10 seconds."
  },
  {
    id: 'elmer',
    name: 'Elmer',
    baseCost: 10,
    qsosPerSecond: 0.1,
    tier: 1,
    description: "Old timers who help you get on the air. 'Just listen for a bit, son.'"
  },
  {
    id: 'straight-key',
    name: 'Straight Key',
    baseCost: 50,
    qsosPerSecond: 0.3,
    tier: 1,
    description: "Purists who insist 'real hams use straight keys.' Click... click... click..."
  },
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
 * Tier 3-5 (General) - 9 factories, 7% scaling
 * @type {Factory[]}
 */
const GENERAL_FACTORIES = [
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
  },
  {
    id: 'beam-antenna',
    name: 'Beam Antenna',
    baseCost: 25000,
    qsosPerSecond: 30.0,
    tier: 3,
    description: "Point it that way and talk to the other side of the world. Ignore the wife's complaints."
  },
  {
    id: 'tower-installation',
    name: 'Tower Installation',
    baseCost: 50000,
    qsosPerSecond: 60.0,
    tier: 4,
    description: "Because the best antenna is the one that's 200 feet in the air. Good luck with permits!"
  },
  {
    id: 'contest-station',
    name: 'Contest Station',
    baseCost: 100000,
    qsosPerSecond: 120.0,
    tier: 4,
    description: "Five radios, six computers, and a complete inability to have normal conversations."
  },
  {
    id: 'dx-cluster',
    name: 'DX Cluster',
    baseCost: 250000,
    qsosPerSecond: 250.0,
    tier: 4,
    description: "Real-time spots of rare stations you'll never actually hear yourself."
  },
  {
    id: 'hamfest',
    name: 'Hamfest',
    baseCost: 500000,
    qsosPerSecond: 500.0,
    tier: 5,
    description: "Where hams gather to buy each other's junk. 'I'll give you $5 for that HT that doesn't work.'"
  },
  {
    id: 'qsl-card-printer',
    name: 'QSL Card Printer',
    baseCost: 1000000,
    qsosPerSecond: 1000.0,
    tier: 5,
    description: "Printing cards for contacts you'll never confirm. Bureau backlog: 3 years and counting."
  },
  {
    id: 'remote-station',
    name: 'Remote Station',
    baseCost: 2500000,
    qsosPerSecond: 2500.0,
    tier: 5,
    description: "Operating a station in the Caribbean from your basement. Totally counts as portable operation."
  }
];

/**
 * Tier 6-7 (Extra) - 6 factories, 5% scaling
 * @type {Factory[]}
 */
const EXTRA_FACTORIES = [
  {
    id: 'ft8-bot',
    name: 'FT8 Bot',
    baseCost: 5000000,
    qsosPerSecond: 5000.0,
    tier: 6,
    description: "'Is it even ham radio if a computer does it?' But it works when propagation is dead!"
  },
  {
    id: 'cluster-spotting-network',
    name: 'Cluster Spotting Network',
    baseCost: 10000000,
    qsosPerSecond: 10000.0,
    tier: 6,
    description: "A global network of hams who never actually listen to the bands, just wait for spots."
  },
  {
    id: 'eme-moonbounce',
    name: 'EME Moonbounce',
    baseCost: 25000000,
    qsosPerSecond: 25000.0,
    tier: 6,
    description: "Bounce signals off the moon. Requires 1500W and a 40-foot dish. Good for one QSO per hour."
  },
  {
    id: 'satellite-constellation',
    name: 'Satellite Constellation',
    baseCost: 50000000,
    qsosPerSecond: 50000.0,
    tier: 7,
    description: "Launch your own satellites because the ISS repeater is always busy."
  },
  {
    id: 'ionospheric-modification',
    name: 'Ionospheric Modification',
    baseCost: 100000000,
    qsosPerSecond: 100000.0,
    tier: 7,
    description: "HAARP called. They want their conspiracy theories back. 73 from Alaska!"
  },
  {
    id: 'alternate-dimension-dxcc',
    name: 'Alternate Dimension DXCC',
    baseCost: 500000000,
    qsosPerSecond: 500000.0,
    tier: 7,
    description: "Work all entities, including those that don't exist in this reality. CQ parallel universe!"
  }
];

/**
 * All factory definitions
 * @type {Factory[]}
 */
export const FACTORIES = [
  ...TECHNICIAN_FACTORIES,
  ...GENERAL_FACTORIES,
  ...EXTRA_FACTORIES
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
