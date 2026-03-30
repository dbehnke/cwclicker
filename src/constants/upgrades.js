'use strict'

import { FACTORIES } from './factories'

/**
 * @typedef {Object} Upgrade
 * @property {string} id - Unique identifier
 * @property {string} factoryId - Which factory this upgrade is for
 * @property {string} name - Display name
 * @property {number} threshold - Number of factories required to unlock
 * @property {bigint} baseCost - Base cost in QSOs
 * @property {number} multiplier - Output multiplier for this upgrade tier
 * @property {string} description - Satirical description
 */

// Cookie Clicker-style upgrade thresholds: 5, 10, 25, 50, 100, 150, 200, 250, 300...
const UPGRADE_THRESHOLDS = [5, 10, 25, 50, 100, 150, 200, 250, 300]

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
 * Each upgrade doubles its own tier multiplier (2x, 4x, 8x...) and costs
 * baseCost × 50 × 2^(tier index).
 * @param {string} factoryId - Factory ID
 * @param {string} _factoryName - Factory name (unused; kept for readability)
 * @param {number} factoryBaseCost - Factory base cost
 * @param {string[]} upgradeNames - Array of upgrade names
 * @param {string[]} upgradeDescriptions - Array of upgrade descriptions
 * @returns {Upgrade[]} Array of upgrades
 */
function generateUpgrades(
  factoryId,
  _factoryName,
  factoryBaseCost,
  upgradeNames,
  upgradeDescriptions
) {
  const actualFactoryBaseCost = FACTORIES.find(factory => factory.id === factoryId)?.baseCost
  const effectiveBaseCost = actualFactoryBaseCost ?? factoryBaseCost

  return UPGRADE_THRESHOLDS.slice(0, upgradeNames.length).map((threshold, index) => {
    // Cost formula: baseCost × 50 × 2^(index) using bigint math to preserve precision.
    const cost = BigInt(effectiveBaseCost) * 50n * 2n ** BigInt(index)

    // Upgrade icon logic:
    // Tiers 0-2 (5, 10, 25): bronze-upgrade.png
    // Tiers 3-5 (50, 100, 150): silver-upgrade.png
    // Tiers 6-8 (200, 250, 300): gold-upgrade.png
    let icon = 'bronze-upgrade.png'
    if (index >= 3 && index <= 5) icon = 'silver-upgrade.png'
    if (index >= 6) icon = 'gold-upgrade.png'

    return {
      id: `${factoryId}-upgrade-${index}`,
      factoryId: factoryId,
      name: upgradeNames[index],
      threshold: threshold,
      baseCost: cost,
      multiplier: 2 ** (index + 1),
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
  ]
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
  ]
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
  ]
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
  ]
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
  ]
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
  ]
)

const BUG_CATCHER_UPGRADES = generateUpgrades(
  'bug-catcher',
  'Bug Catcher',
  3500,
  [
    'Solder Splat',
    'Frayed Coil',
    'Mystery Capacitor',
    'Tin-Can Enclosure',
    'Smoke Test',
    'Garage Calibration',
    'Band-Sledge Hammer',
    'Pirate Warranty',
    'Five-Watt Legend',
  ],
  [
    'A blob of solder and a prayer.',
    'Still hanging on by one suspicious strand.',
    'Nobody knows what it does, but it sure is vintage.',
    'Built from scrap and bad decisions.',
    'It passed once, so you called it finished.',
    'Calibrated with a screwdriver and confidence.',
    'Large enough to scare the neighbors.',
    'The seller promised it was only lightly cursed.',
    'Five watts of pure folklore.',
  ]
)

const VERTICAL_ANTENNA_UPGRADES = generateUpgrades(
  'vertical-antenna',
  'Vertical Antenna',
  5000,
  [
    'Longer Mast',
    'Ground Radials',
    'Weatherproof Paint',
    'Radial Spaghetti',
    'Better Loading Coil',
    'Salt Air Coating',
    'Invisible To HOA',
    'Monopole Prestige',
    'Skyward Apology',
  ],
  [
    'A little taller and slightly less apologetic.',
    'Now it actually has something to stand on.',
    'Keeps working through the next regret-filled storm.',
    'A mess of wires that somehow helps.',
    'Tunes better, sounds the same.',
    'Corrosion fears are now only half the hobby.',
    'Looks invisible from the driveway. Probably.',
    'A vertical so fancy it demands a chairmanship.',
    'Pointed at the sky and still somehow embarrassing.',
  ]
)

const LINEAR_AMPLIFIER_UPGRADES = generateUpgrades(
  'linear-amplifier',
  'Linear Amplifier',
  10000,
  [
    'Driver Tube',
    'Bigger Fan',
    'Heat Sink',
    'Plate Voltage',
    'Dummy Load',
    'Arc Suppressor',
    'Kilowatt Dreams',
    'Mains Upgrade',
    'Smoke Reserve',
  ],
  [
    'Just enough drive to cause trouble.',
    'Now the fan sounds like a small airport.',
    'Finally enough aluminum to matter.',
    'The volts are up; so is your liability.',
    'A safe place to test bad ideas.',
    'Keeps the sparks mostly inside the box.',
    'More power than common sense requires.',
    'The breaker box has filed a complaint.',
    'Backup smoke for when the main smoke runs out.',
  ]
)

const BEAM_ANTENNA_UPGRADES = generateUpgrades(
  'beam-antenna',
  'Beam Antenna',
  25000,
  [
    'Director Element',
    'Boom Extension',
    'Rotor Grease',
    'Narrower Beam',
    'Full-Sized Reflector',
    'Stacked Elements',
    'Turntable Upgrade',
    'DX Snob Mode',
    'Forward Gain Glory',
  ],
  [
    'More direction, less dignity.',
    'Because the original boom was too modest.',
    'Keeps the rotor sounding like it regrets everything.',
    'Now even your beam has trust issues.',
    'Reflects signals and compliments equally poorly.',
    'Stacked high enough to irritate aviation.',
    'Turns the whole mess instead of just the antenna.',
    'You only answer the farthest stations now.',
    'All gain, no humility.',
  ]
)

const RAGCHEW_NET_UPGRADES = generateUpgrades(
  'ragchew-net',
  'Ragchew Net',
  35000,
  [
    'Check-In List',
    'Coffee Break',
    'Medical Update',
    'Weather Recap',
    'Longer Roundtable',
    'Name-Rotator',
    'Traffic Cop',
    'Final Filler',
    '73 Curtain Call',
  ],
  [
    'Same names, same order, same frequency.',
    'The net now runs on caffeine and habit.',
    'Still not a doctor, but now more detailed.',
    'If it is not raining, someone will mention it anyway.',
    'Because three minutes of talk was never enough.',
    'Makes sure everyone says their call sign twice.',
    'Keeps the pileup of stories vaguely organized.',
    'One more anecdote before we clear up.',
    'The net ends exactly where it began.',
  ]
)

const TOWER_INSTALLATION_UPGRADES = generateUpgrades(
  'tower-installation',
  'Tower Installation',
  50000,
  [
    'Permit Stack',
    'Guy Wire Set',
    'Concrete Footing',
    'Lightning Rod',
    'Crane Rental',
    'Safety Harness',
    'Sectioned Mast',
    'Roof Repair Kit',
    'Skyward Regret',
  ],
  [
    'The paperwork weighs more than the tower.',
    'Keeps the whole thing from wandering off.',
    'Poured once, cursed forever.',
    'For when the weather gets personal.',
    'The most expensive way to lift bad ideas.',
    'Useful if you enjoy surviving the hobby.',
    'More sections, more excuses to climb.',
    'For after the antenna goes through the shingles.',
    'The view is great. The fear is better.',
  ]
)

const CONTEST_STATION_UPGRADES = generateUpgrades(
  'contest-station',
  'Contest Station',
  100000,
  [
    'Second Radio',
    'Score Tracker',
    'Key-Down Timer',
    'Band Map',
    'Voice Keyer',
    'Log Sync',
    'Multiplier Board',
    'Caffeine Bank',
    'Podium Pressure',
  ],
  [
    'Because one radio is for amateurs.',
    'Keeps score while you lose your voice.',
    'Tracks how long you have been yelling.',
    'A map for people who hate sleeping.',
    'Now your voice sounds almost organized.',
    'Every contact, logged twice for safety.',
    'For the points you will still miss.',
    'Liquid operating budget, highly volatile.',
    'The medals are imaginary; the stress is not.',
  ]
)

const PAPER_LOGBOOK_UPGRADES = generateUpgrades(
  'paper-logbook',
  'Paper Logbook',
  175000,
  [
    'Sharp Pencil',
    'Index Tabs',
    'Coffee Ring',
    'Backup Clipboard',
    'Reading Glasses',
    'Ledger Binder',
    'Cross-Reference',
    'Archival Box',
    'Carbon Copy Glory',
  ],
  [
    'The future is hand cramps.',
    'Finds old contacts almost as fast as the dust does.',
    'Authentic stains from authentic operating.',
    'Because one clipboard is never enough paper.',
    'Now you can read your own handwriting again.',
    'A binder heavy enough to qualify as gear.',
    'Double-checks every QSO and your life choices.',
    'Preserved for the next owner to decipher.',
    'More copies, same illegible notes.',
  ]
)

const DX_CLUSTER_UPGRADES = generateUpgrades(
  'dx-cluster',
  'DX Cluster',
  250000,
  [
    'Spot Filter',
    'Packet TNC',
    'Rare Country Alert',
    'Message Scroll',
    'Band Activity Map',
    'DX Alarm',
    'Cluster Mirror',
    'Self-Radiospot',
    'Refresh Addiction',
  ],
  [
    'Filters out everything except wishful thinking.',
    'A little packet goes a long way.',
    'Pinged the moment a rare prefix appears and disappears.',
    'Now the spam arrives in a more elegant format.',
    'Shows where the action is, not where you are.',
    'Wakes you up for signals you still will not hear.',
    'Because one cluster server was never enough.',
    'When you need to spot yourself for applause.',
    'The bands are dead, but the page keeps loading.',
  ]
)

const HAMFEST_UPGRADES = generateUpgrades(
  'hamfest',
  'Hamfest',
  500000,
  [
    'Tailgate Table',
    'Bargain Bin',
    'Cash Only',
    'Door Prize',
    'Club Banner',
    'Hot Dog Stand',
    'Flea Market Glow',
    'Used Rotor',
    'Buyer Remorse',
  ],
  [
    'Now your junk has a proper display.',
    'One person’s trash, another person’s project.',
    'The universal language of questionable deals.',
    'You entered for the prize and stayed for the noise.',
    'Signals to everyone that you brought cookies.',
    'The actual reason everyone showed up.',
    'Everything is dusty, overpriced, and irresistible.',
    'It only squeals a little when you turn it.',
    'A required symptom of every successful hamfest.',
  ]
)

const QSL_CARD_PRINTER_UPGRADES = generateUpgrades(
  'qsl-card-printer',
  'QSL Card Printer',
  1000000,
  [
    'Card Stock',
    'Ink Flood',
    'Bureau Stamp',
    'Gloss Finish',
    'Envelope Jam',
    'Return Label',
    'Mail Sack',
    'Overnight Fantasy',
    'Confirmation Fever',
  ],
  [
    'Thicker paper for thicker lies.',
    'The printer is now mildly radioactive with color.',
    'Stamped and sorted into the void.',
    'Shiny enough to distract from the delay.',
    'The tray is full and still nobody mailed them.',
    'Because writing the address twice helps morale.',
    'Big enough to hold every contact from last year.',
    'Still faster than the bureau, in your dreams.',
    'You almost believe the return cards are coming.',
  ]
)

const REMOTE_STATION_UPGRADES = generateUpgrades(
  'remote-station',
  'Remote Station',
  2500000,
  [
    'VPN Tunnel',
    'Webcam Feed',
    'Power Relay',
    'Rain Sensor',
    'Antenna Switch',
    'Remote Reboot',
    'Mouse Jiggler',
    'Latency Monitor',
    'Basement Beachfront',
  ],
  [
    'Now the shack is securely two time zones away.',
    'Lets you watch the storm ruin your setup in real time.',
    'Because somebody has to flip the mains.',
    'Shuts things down before the weather does.',
    'Selects antennas with all the confidence of a gambler.',
    'The universal cure for frozen remote rigs.',
    'Keeps the station awake while you are not.',
    'Measures delay in units of regret.',
    'Paradise, if paradise had a fiber line.',
  ]
)

const FT8_BOT_UPGRADES = generateUpgrades(
  'ft8-bot',
  'FT8 Bot',
  5000000,
  [
    'Auto Macro',
    'Grid Hunter',
    'Decoder Stack',
    'Sleep Mode',
    'Band Hopper',
    'Message Queue',
    'Pounce Script',
    'Botnet of One',
    'Human Optional',
  ],
  [
    'The bot now types your excuses for you.',
    'Tracks grids so you do not have to feel guilty.',
    'More layers, same robot charm.',
    'Works while you pretend to be involved.',
    'Never gets tired of waiting for openings.',
    'Contacts arrive faster than your patience.',
    'Hits the rare ones with machine precision.',
    'Just one bot, but with very strong opinions.',
    'At this point, you are mostly a power supply.',
  ]
)

const DIGITAL_INTERFACE_UPGRADES = generateUpgrades(
  'digital-interface',
  'Digital Interface',
  7500000,
  [
    'Sound Card Driver',
    'USB Hiss Filter',
    'PTT Delay',
    'Codec Patch',
    'CAT Cable',
    'Galvanic Isolation',
    'Virtual Port',
    'Sample Rate Pride',
    'Menu Deep Dive',
  ],
  [
    'The laptop now only complains a little.',
    'Cuts the noise floor and your remaining hope.',
    'A pause long enough to second-guess yourself.',
    'Fixes everything except the operator.',
    'One more cable to blame when it breaks.',
    'Keeps the smoke on its own side of the wall.',
    'For when a real serial port feels too human.',
    'Higher numbers, same terrible audio.',
    'If you have to ask which menu, you are already lost.',
  ]
)

const CLUSTER_SPOTTING_NETWORK_UPGRADES = generateUpgrades(
  'cluster-spotting-network',
  'Cluster Spotting Network',
  10000000,
  [
    'Login Farm',
    'Spot Relay',
    'Crowd Source',
    'Auto Refresh',
    'Packet Swarm',
    'Callsign Scraper',
    'Mirror Node',
    'Duplicate Alert',
    'Endless Tabs',
  ],
  [
    'So many logins, so little listening.',
    'Faster spotting by doing less operating.',
    'Everyone else is doing the work for you.',
    'Because manual refreshing is for hobbyists.',
    'A cloud of packets with very strong opinions.',
    'Harvests callsigns from pure optimism.',
    'Copies the noise so you can share it faster.',
    'Warns you when the same spot appears everywhere.',
    'The browser now qualifies as part of the station.',
  ]
)

const EME_MOONBOUNCE_UPGRADES = generateUpgrades(
  'eme-moonbounce',
  'EME Moonbounce',
  25000000,
  [
    'Dish Polish',
    'Preamplifier',
    'Lunar Timing',
    'Earth Rotation Chart',
    'Moon Tracker',
    'Weak Signal Decoder',
    'Polarization Twist',
    'Power Bill Shock',
    'Crater Echo',
  ],
  [
    'Shiny enough to blind astronauts.',
    'Turns whispers into barely useful whispers.',
    'The moon now gets your schedule by fax.',
    'Because the planet will not wait for your QSO.',
    'Keeps tabs on the nearest expensive reflector.',
    'Decodes what everyone else gave up on.',
    'Swaps polarization and adds unnecessary drama.',
    'Every watt comes with a monthly apology.',
    'Your signal comes back with lunar attitude.',
  ]
)

const LUNAR_REPEATER_UPGRADES = generateUpgrades(
  'lunar-repeater',
  'Lunar Repeater',
  37500000,
  [
    'Moon Dust Shield',
    'Delay Buffer',
    'Echo Canceller',
    'Crater Permit',
    'Line-of-Sight Prayer',
    'Orbital Hop',
    'Reflective Paint',
    'Skyward Relay',
    'Stellar Patience',
  ],
  [
    'Keeps the moon from filing a complaint.',
    'Adds enough delay to feel scientific.',
    'Removes the echo, mostly by worsening it.',
    'Because even the moon has zoning rules now.',
    'The cheapest kind of propagation plan.',
    'A tiny hop for signals, a huge hop for ego.',
    'Shiny enough for the whole solar system.',
    'Repeats everything, eventually.',
    'Needed for the 14-month round trip.',
  ]
)

const SATELLITE_CONSTELLATION_UPGRADES = generateUpgrades(
  'satellite-constellation',
  'Satellite Constellation',
  50000000,
  [
    'Launch Window',
    'Ground Station',
    'Solar Panel',
    'Orbit Update',
    'Beacon Stream',
    'Tracking Array',
    'Space Junk Waiver',
    'Downlink Pileup',
    'Zero-G Ego',
  ],
  [
    'A narrow window for a very expensive toss.',
    'Now you can operate from the planet correctly.',
    'Keeps the fleet powered and the accountants mad.',
    'Because low Earth orbit is a moving target.',
    'Signals flashing everywhere like a cosmic billboard.',
    'Tracks everything except common sense.',
    'Essential paperwork for orbital optimism.',
    'More satellites, more overlapping excuses.',
    'Weightless pride, heavy invoices.',
  ]
)

const IONOSPHERIC_MODIFICATION_UPGRADES = generateUpgrades(
  'ionospheric-modification',
  'Ionospheric Modification',
  100000000,
  [
    'Sky Heater',
    'Aurora Tuner',
    'Particle Budget',
    'HF Weather Report',
    'Plasma Knob',
    'Electric Fence',
    'Upper Atmosphere Permit',
    'Solar Storm Coupon',
    'Science-ish Mode',
  ],
  [
    'Makes the sky slightly less cooperative.',
    'Tunes the aurora like a stubborn receiver.',
    'Every experiment needs a bigger budget.',
    'Forecast: interference with a chance of glory.',
    'Adjusts the plasma until the paperwork glows.',
    'Keeps the electrons from wandering off.',
    'The atmosphere asked for IDs, somehow.',
    'Discounted chaos from the Sun.',
    'Close enough to science for ham radio.',
  ]
)

const TIME_TRAVEL_DX_UPGRADES = generateUpgrades(
  'time-travel-dx',
  'Time Travel DX',
  250000000,
  [
    'Yesterday Spot',
    'Future Propagation',
    'Paradox Budget',
    'Chrono Logbook',
    'Solar Cycle Replay',
    'Temporal Filter',
    'Causality Buffer',
    'Retro Call Sign',
    'Next Week Contest',
  ],
  [
    'The pileup already happened, and it was ugly.',
    'Because tomorrow always has better openings.',
    'For when a broken timeline is still on budget.',
    'Keeps records from before you made them.',
    'The sun is now on a loop, like your excuses.',
    'Cuts out signals from the wrong century.',
    'Protects the timeline from your operating style.',
    'Vintage call signs with future discipline.',
    'You already know you will lose it.',
  ]
)

const ALTERNATE_DIMENSION_DXCC_UPGRADES = generateUpgrades(
  'alternate-dimension-dxcc',
  'Alternate Dimension DXCC',
  500000000,
  [
    'Portal Tuner',
    'Quantum Logbook',
    'Schrodinger QSO',
    'Dimensional Slip',
    'Cosmic Bureau',
    'Phase Alignment',
    'Multiverse Spot',
    'Reality Check',
    'Infinite Ego',
  ],
  [
    'Dialed in for the universe next door.',
    'Confirmed only when observed by the referee.',
    'Worked, not worked, and somehow both.',
    'The station now lives between realities.',
    'Bureaucracy survives across dimensions.',
    'Keeps your signals from falling through cracks in existence.',
    'Spotted by hams you have never met and never will.',
    'Asks whether any of this is really real.',
    'Finally, a trophy large enough for every universe.',
  ]
)

// Combine all upgrades
export const UPGRADES = [
  ...ELMER_UPGRADES,
  ...QRQ_UPGRADES,
  ...STRAIGHT_KEY_UPGRADES,
  ...PADDLE_KEY_UPGRADES,
  ...CPO_UPGRADES,
  ...DIPOLE_UPGRADES,
  ...BUG_CATCHER_UPGRADES,
  ...VERTICAL_ANTENNA_UPGRADES,
  ...LINEAR_AMPLIFIER_UPGRADES,
  ...BEAM_ANTENNA_UPGRADES,
  ...RAGCHEW_NET_UPGRADES,
  ...TOWER_INSTALLATION_UPGRADES,
  ...CONTEST_STATION_UPGRADES,
  ...PAPER_LOGBOOK_UPGRADES,
  ...DX_CLUSTER_UPGRADES,
  ...HAMFEST_UPGRADES,
  ...QSL_CARD_PRINTER_UPGRADES,
  ...REMOTE_STATION_UPGRADES,
  ...FT8_BOT_UPGRADES,
  ...DIGITAL_INTERFACE_UPGRADES,
  ...CLUSTER_SPOTTING_NETWORK_UPGRADES,
  ...EME_MOONBOUNCE_UPGRADES,
  ...LUNAR_REPEATER_UPGRADES,
  ...SATELLITE_CONSTELLATION_UPGRADES,
  ...IONOSPHERIC_MODIFICATION_UPGRADES,
  ...TIME_TRAVEL_DX_UPGRADES,
  ...ALTERNATE_DIMENSION_DXCC_UPGRADES,
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
