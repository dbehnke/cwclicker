'use strict';

import { describe, it, expect } from 'vitest';
import { FACTORIES, TIER_SCALING } from '../factories';

describe('FACTORIES', () => {
  it('exports an array of 27 factories', () => {
    expect(Array.isArray(FACTORIES)).toBe(true);
    expect(FACTORIES).toHaveLength(27);
  });

  describe('factory structure', () => {
    it('each factory has required properties', () => {
      FACTORIES.forEach((factory) => {
        expect(factory).toHaveProperty('id');
        expect(typeof factory.id).toBe('string');
        expect(factory.id.length).toBeGreaterThan(0);

        expect(factory).toHaveProperty('name');
        expect(typeof factory.name).toBe('string');
        expect(factory.name.length).toBeGreaterThan(0);

        expect(factory).toHaveProperty('baseCost');
        expect(typeof factory.baseCost).toBe('number');
        expect(factory.baseCost).toBeGreaterThan(0);

        expect(factory).toHaveProperty('qsosPerSecond');
        expect(typeof factory.qsosPerSecond).toBe('number');
        expect(factory.qsosPerSecond).toBeGreaterThan(0);

        expect(factory).toHaveProperty('tier');
        expect(typeof factory.tier).toBe('number');
        expect(factory.tier).toBeGreaterThanOrEqual(1);
        expect(factory.tier).toBeLessThanOrEqual(9);

        expect(factory).toHaveProperty('description');
        expect(typeof factory.description).toBe('string');
        expect(factory.description.length).toBeGreaterThan(0);
      });
    });

    it('each factory has a unique id', () => {
      const ids = FACTORIES.map(f => f.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(FACTORIES.length);
    });

    it('each factory has a unique name', () => {
      const names = FACTORIES.map(f => f.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(FACTORIES.length);
    });
  });

  describe('Technician tier (1-3)', () => {
    const techFactories = FACTORIES.filter(f => f.tier >= 1 && f.tier <= 3);

    it('has 9 factories', () => {
      expect(techFactories).toHaveLength(9);
    });

    it('has correct data for QRQ Protocol', () => {
      const qrq = FACTORIES.find(f => f.id === 'qrq-protocol');
      expect(qrq).toBeDefined();
      expect(qrq.name).toBe('QRQ Protocol');
      expect(qrq.baseCost).toBe(25);
      expect(qrq.qsosPerSecond).toBe(0.1);
      expect(qrq.tier).toBe(1);
    });

    it('has correct data for Elmer', () => {
      const elmer = FACTORIES.find(f => f.id === 'elmer');
      expect(elmer).toBeDefined();
      expect(elmer.name).toBe('Elmer');
      expect(elmer.baseCost).toBe(15);
      expect(elmer.qsosPerSecond).toBe(0.1);
      expect(elmer.tier).toBe(1);
    });

    it('has correct data for Straight Key', () => {
      const straightKey = FACTORIES.find(f => f.id === 'straight-key');
      expect(straightKey).toBeDefined();
      expect(straightKey.name).toBe('Straight Key');
      expect(straightKey.baseCost).toBe(75);
      expect(straightKey.qsosPerSecond).toBe(0.3);
      expect(straightKey.tier).toBe(1);
    });

    it('has correct data for Straight Key', () => {
      const straightKey = FACTORIES.find(f => f.id === 'straight-key');
      expect(straightKey).toBeDefined();
      expect(straightKey.name).toBe('Straight Key');
      expect(straightKey.baseCost).toBe(75);
      expect(straightKey.qsosPerSecond).toBe(0.3);
      expect(straightKey.tier).toBe(1);
    });

    it('has correct data for Paddle Key', () => {
      const paddle = FACTORIES.find(f => f.id === 'paddle-key');
      expect(paddle).toBeDefined();
      expect(paddle.name).toBe('Paddle Key');
      expect(paddle.baseCost).toBe(1000);
      expect(paddle.qsosPerSecond).toBe(1.0);
      expect(paddle.tier).toBe(2);
    });

    it('has correct data for Code Practice Oscillator', () => {
      const cpo = FACTORIES.find(f => f.id === 'code-practice-oscillator');
      expect(cpo).toBeDefined();
      expect(cpo.name).toBe('Code Practice Oscillator');
      expect(cpo.baseCost).toBe(2000);
      expect(cpo.qsosPerSecond).toBe(2.0);
      expect(cpo.tier).toBe(2);
    });

    it('has correct data for Dipole Antenna', () => {
      const dipole = FACTORIES.find(f => f.id === 'dipole-antenna');
      expect(dipole).toBeDefined();
      expect(dipole.name).toBe('Dipole Antenna');
      expect(dipole.baseCost).toBe(4000);
      expect(dipole.qsosPerSecond).toBe(4.0);
      expect(dipole.tier).toBe(2);
    });
  });

  describe('General tier (4-6)', () => {
    const generalFactories = FACTORIES.filter(f => f.tier >= 4 && f.tier <= 6);

    it('has 9 factories', () => {
      expect(generalFactories).toHaveLength(9);
    });

    it('has correct data for Bug Catcher', () => {
      const bugCatcher = FACTORIES.find(f => f.id === 'bug-catcher');
      expect(bugCatcher).toBeDefined();
      expect(bugCatcher.name).toBe('Bug Catcher');
      expect(bugCatcher.baseCost).toBe(7000);
      expect(bugCatcher.qsosPerSecond).toBe(6.0);
      expect(bugCatcher.tier).toBe(3);
    });

    it('has correct data for Vertical Antenna', () => {
      const vertical = FACTORIES.find(f => f.id === 'vertical-antenna');
      expect(vertical).toBeDefined();
      expect(vertical.name).toBe('Vertical Antenna');
      expect(vertical.baseCost).toBe(10000);
      expect(vertical.qsosPerSecond).toBe(8.0);
      expect(vertical.tier).toBe(3);
    });

    it('has correct data for Linear Amplifier', () => {
      const amp = FACTORIES.find(f => f.id === 'linear-amplifier');
      expect(amp).toBeDefined();
      expect(amp.name).toBe('Linear Amplifier');
      expect(amp.baseCost).toBe(20000);
      expect(amp.qsosPerSecond).toBe(15.0);
      expect(amp.tier).toBe(3);
    });

    it('has correct data for Beam Antenna', () => {
      const beam = FACTORIES.find(f => f.id === 'beam-antenna');
      expect(beam).toBeDefined();
      expect(beam.name).toBe('Beam Antenna');
      expect(beam.baseCost).toBe(75000);
      expect(beam.qsosPerSecond).toBe(30.0);
      expect(beam.tier).toBe(4);
    });

    it('has correct data for Ragchew Net', () => {
      const ragchew = FACTORIES.find(f => f.id === 'ragchew-net');
      expect(ragchew).toBeDefined();
      expect(ragchew.name).toBe('Ragchew Net');
      expect(ragchew.baseCost).toBe(100000);
      expect(ragchew.qsosPerSecond).toBe(45.0);
      expect(ragchew.tier).toBe(4);
    });

    it('has correct data for Tower Installation', () => {
      const tower = FACTORIES.find(f => f.id === 'tower-installation');
      expect(tower).toBeDefined();
      expect(tower.name).toBe('Tower Installation');
      expect(tower.baseCost).toBe(150000);
      expect(tower.qsosPerSecond).toBe(60.0);
      expect(tower.tier).toBe(4);
    });

    it('has correct data for Contest Station', () => {
      const contest = FACTORIES.find(f => f.id === 'contest-station');
      expect(contest).toBeDefined();
      expect(contest.name).toBe('Contest Station');
      expect(contest.baseCost).toBe(400000);
      expect(contest.qsosPerSecond).toBe(120.0);
      expect(contest.tier).toBe(5);
    });

    it('has correct data for Paper Logbook', () => {
      const paperLogbook = FACTORIES.find(f => f.id === 'paper-logbook');
      expect(paperLogbook).toBeDefined();
      expect(paperLogbook.name).toBe('Paper Logbook');
      expect(paperLogbook.baseCost).toBe(700000);
      expect(paperLogbook.qsosPerSecond).toBe(180.0);
      expect(paperLogbook.tier).toBe(5);
    });

    it('has correct data for DX Cluster', () => {
      const cluster = FACTORIES.find(f => f.id === 'dx-cluster');
      expect(cluster).toBeDefined();
      expect(cluster.name).toBe('DX Cluster');
      expect(cluster.baseCost).toBe(1000000);
      expect(cluster.qsosPerSecond).toBe(250.0);
      expect(cluster.tier).toBe(5);
    });

    it('has correct data for Hamfest', () => {
      const hamfest = FACTORIES.find(f => f.id === 'hamfest');
      expect(hamfest).toBeDefined();
      expect(hamfest.name).toBe('Hamfest');
      expect(hamfest.baseCost).toBe(3000000);
      expect(hamfest.qsosPerSecond).toBe(500.0);
      expect(hamfest.tier).toBe(6);
    });

    it('has correct data for QSL Card Printer', () => {
      const printer = FACTORIES.find(f => f.id === 'qsl-card-printer');
      expect(printer).toBeDefined();
      expect(printer.name).toBe('QSL Card Printer');
      expect(printer.baseCost).toBe(6000000);
      expect(printer.qsosPerSecond).toBe(1000.0);
      expect(printer.tier).toBe(6);
    });

    it('has correct data for Remote Station', () => {
      const remote = FACTORIES.find(f => f.id === 'remote-station');
      expect(remote).toBeDefined();
      expect(remote.name).toBe('Remote Station');
      expect(remote.baseCost).toBe(15000000);
      expect(remote.qsosPerSecond).toBe(2500.0);
      expect(remote.tier).toBe(6);
    });
  });

  describe('Extra tier (7-9)', () => {
    const extraFactories = FACTORIES.filter(f => f.tier >= 7 && f.tier <= 9);

    it('has 9 factories', () => {
      expect(extraFactories).toHaveLength(9);
    });

    it('has correct data for FT8 Bot', () => {
      const ft8 = FACTORIES.find(f => f.id === 'ft8-bot');
      expect(ft8).toBeDefined();
      expect(ft8.name).toBe('FT8 Bot');
      expect(ft8.baseCost).toBe(40000000);
      expect(ft8.qsosPerSecond).toBe(5000.0);
      expect(ft8.tier).toBe(7);
    });

    it('has correct data for Digital Interface', () => {
      const digitalInterface = FACTORIES.find(f => f.id === 'digital-interface');
      expect(digitalInterface).toBeDefined();
      expect(digitalInterface.name).toBe('Digital Interface');
      expect(digitalInterface.baseCost).toBe(60000000);
      expect(digitalInterface.qsosPerSecond).toBe(7500.0);
      expect(digitalInterface.tier).toBe(7);
    });

    it('has correct data for Cluster Spotting Network', () => {
      const cluster = FACTORIES.find(f => f.id === 'cluster-spotting-network');
      expect(cluster).toBeDefined();
      expect(cluster.name).toBe('Cluster Spotting Network');
      expect(cluster.baseCost).toBe(80000000);
      expect(cluster.qsosPerSecond).toBe(10000.0);
      expect(cluster.tier).toBe(7);
    });

    it('has correct data for EME Moonbounce', () => {
      const eme = FACTORIES.find(f => f.id === 'eme-moonbounce');
      expect(eme).toBeDefined();
      expect(eme.name).toBe('EME Moonbounce');
      expect(eme.baseCost).toBe(200000000);
      expect(eme.qsosPerSecond).toBe(25000.0);
      expect(eme.tier).toBe(8);
    });

    it('has correct data for Lunar Repeater', () => {
      const lunar = FACTORIES.find(f => f.id === 'lunar-repeater');
      expect(lunar).toBeDefined();
      expect(lunar.name).toBe('Lunar Repeater');
      expect(lunar.baseCost).toBe(300000000);
      expect(lunar.qsosPerSecond).toBe(37500.0);
      expect(lunar.tier).toBe(8);
    });

    it('has correct data for Satellite Constellation', () => {
      const sat = FACTORIES.find(f => f.id === 'satellite-constellation');
      expect(sat).toBeDefined();
      expect(sat.name).toBe('Satellite Constellation');
      expect(sat.baseCost).toBe(400000000);
      expect(sat.qsosPerSecond).toBe(50000.0);
      expect(sat.tier).toBe(8);
    });

    it('has correct data for Ionospheric Modification', () => {
      const iono = FACTORIES.find(f => f.id === 'ionospheric-modification');
      expect(iono).toBeDefined();
      expect(iono.name).toBe('Ionospheric Modification');
      expect(iono.baseCost).toBe(1000000000);
      expect(iono.qsosPerSecond).toBe(100000.0);
      expect(iono.tier).toBe(9);
    });

    it('has correct data for Time Travel DX', () => {
      const timeTravel = FACTORIES.find(f => f.id === 'time-travel-dx');
      expect(timeTravel).toBeDefined();
      expect(timeTravel.name).toBe('Time Travel DX');
      expect(timeTravel.baseCost).toBe(2500000000);
      expect(timeTravel.qsosPerSecond).toBe(250000.0);
      expect(timeTravel.tier).toBe(9);
    });

    it('has correct data for Alternate Dimension DXCC', () => {
      const alternate = FACTORIES.find(f => f.id === 'alternate-dimension-dxcc');
      expect(alternate).toBeDefined();
      expect(alternate.name).toBe('Alternate Dimension DXCC');
      expect(alternate.baseCost).toBe(5000000000);
      expect(alternate.qsosPerSecond).toBe(500000.0);
      expect(alternate.tier).toBe(9);
    });

    it('keeps early/mid/late rebalance anchors explicit', () => {
      const elmer = FACTORIES.find(f => f.id === 'elmer');
      const beam = FACTORIES.find(f => f.id === 'beam-antenna');
      const alternate = FACTORIES.find(f => f.id === 'alternate-dimension-dxcc');

      expect(elmer.baseCost).toBe(15);
      expect(beam.baseCost).toBe(75000);
      expect(alternate.baseCost).toBe(5000000000);
    });
  });

  describe('descriptions', () => {
    it('QRQ Protocol has a satirical description', () => {
      const qrq = FACTORIES.find(f => f.id === 'qrq-protocol');
      expect(qrq.description).toContain("QRQ");
    });

    it('Elmer has a satirical description', () => {
      const elmer = FACTORIES.find(f => f.id === 'elmer');
      expect(elmer.description).toContain("Just listen for a bit");
    });

    it('Straight Key has a satirical description', () => {
      const straightKey = FACTORIES.find(f => f.id === 'straight-key');
      expect(straightKey.description).toContain("real hams use straight keys");
    });

    it('FT8 Bot has a satirical description', () => {
      const ft8 = FACTORIES.find(f => f.id === 'ft8-bot');
      expect(ft8.description).toContain("computer does it");
    });
  });
});

describe('TIER_SCALING', () => {
  it('exports tier scaling constants', () => {
    expect(TIER_SCALING).toBeDefined();
    expect(TIER_SCALING).toHaveProperty('TECHNICIAN');
    expect(TIER_SCALING).toHaveProperty('GENERAL');
    expect(TIER_SCALING).toHaveProperty('EXTRA');
  });

  it('has correct scaling values', () => {
    expect(TIER_SCALING.TECHNICIAN).toBe(0.10);
    expect(TIER_SCALING.GENERAL).toBe(0.07);
    expect(TIER_SCALING.EXTRA).toBe(0.05);
  });
});
