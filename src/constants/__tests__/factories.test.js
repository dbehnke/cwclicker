'use strict';

import { describe, it, expect } from 'vitest';
import { FACTORIES, TIER_SCALING } from '../factories';

describe('FACTORIES', () => {
  it('exports an array of 21 factories', () => {
    expect(Array.isArray(FACTORIES)).toBe(true);
    expect(FACTORIES).toHaveLength(21);
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
        expect(factory.tier).toBeLessThanOrEqual(7);

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

  describe('Technician tier (1-2)', () => {
    const techFactories = FACTORIES.filter(f => f.tier >= 1 && f.tier <= 2);

    it('has 6 factories', () => {
      expect(techFactories).toHaveLength(6);
    });

    it('has correct data for QRQ Protocol', () => {
      const qrq = FACTORIES.find(f => f.id === 'qrq-protocol');
      expect(qrq).toBeDefined();
      expect(qrq.name).toBe('QRQ Protocol');
      expect(qrq.baseCost).toBe(15);
      expect(qrq.qsosPerSecond).toBe(0.1);
      expect(qrq.tier).toBe(1);
    });

    it('has correct data for Elmer', () => {
      const elmer = FACTORIES.find(f => f.id === 'elmer');
      expect(elmer).toBeDefined();
      expect(elmer.name).toBe('Elmer');
      expect(elmer.baseCost).toBe(10);
      expect(elmer.qsosPerSecond).toBe(0.1);
      expect(elmer.tier).toBe(1);
    });

    it('has correct data for Straight Key', () => {
      const straightKey = FACTORIES.find(f => f.id === 'straight-key');
      expect(straightKey).toBeDefined();
      expect(straightKey.name).toBe('Straight Key');
      expect(straightKey.baseCost).toBe(50);
      expect(straightKey.qsosPerSecond).toBe(0.3);
      expect(straightKey.tier).toBe(1);
    });

    it('has correct data for Straight Key', () => {
      const straightKey = FACTORIES.find(f => f.id === 'straight-key');
      expect(straightKey).toBeDefined();
      expect(straightKey.name).toBe('Straight Key');
      expect(straightKey.baseCost).toBe(50);
      expect(straightKey.qsosPerSecond).toBe(0.3);
      expect(straightKey.tier).toBe(1);
    });

    it('has correct data for Paddle Key', () => {
      const paddle = FACTORIES.find(f => f.id === 'paddle-key');
      expect(paddle).toBeDefined();
      expect(paddle.name).toBe('Paddle Key');
      expect(paddle.baseCost).toBe(500);
      expect(paddle.qsosPerSecond).toBe(1.0);
      expect(paddle.tier).toBe(2);
    });

    it('has correct data for Code Practice Oscillator', () => {
      const cpo = FACTORIES.find(f => f.id === 'code-practice-oscillator');
      expect(cpo).toBeDefined();
      expect(cpo.name).toBe('Code Practice Oscillator');
      expect(cpo.baseCost).toBe(1000);
      expect(cpo.qsosPerSecond).toBe(2.0);
      expect(cpo.tier).toBe(2);
    });

    it('has correct data for Dipole Antenna', () => {
      const dipole = FACTORIES.find(f => f.id === 'dipole-antenna');
      expect(dipole).toBeDefined();
      expect(dipole.name).toBe('Dipole Antenna');
      expect(dipole.baseCost).toBe(2000);
      expect(dipole.qsosPerSecond).toBe(4.0);
      expect(dipole.tier).toBe(2);
    });
  });

  describe('General tier (3-5)', () => {
    const generalFactories = FACTORIES.filter(f => f.tier >= 3 && f.tier <= 5);

    it('has 9 factories', () => {
      expect(generalFactories).toHaveLength(9);
    });

    it('has correct data for Vertical Antenna', () => {
      const vertical = FACTORIES.find(f => f.id === 'vertical-antenna');
      expect(vertical).toBeDefined();
      expect(vertical.name).toBe('Vertical Antenna');
      expect(vertical.baseCost).toBe(5000);
      expect(vertical.qsosPerSecond).toBe(8.0);
      expect(vertical.tier).toBe(3);
    });

    it('has correct data for Linear Amplifier', () => {
      const amp = FACTORIES.find(f => f.id === 'linear-amplifier');
      expect(amp).toBeDefined();
      expect(amp.name).toBe('Linear Amplifier');
      expect(amp.baseCost).toBe(10000);
      expect(amp.qsosPerSecond).toBe(15.0);
      expect(amp.tier).toBe(3);
    });

    it('has correct data for Beam Antenna', () => {
      const beam = FACTORIES.find(f => f.id === 'beam-antenna');
      expect(beam).toBeDefined();
      expect(beam.name).toBe('Beam Antenna');
      expect(beam.baseCost).toBe(25000);
      expect(beam.qsosPerSecond).toBe(30.0);
      expect(beam.tier).toBe(3);
    });

    it('has correct data for Tower Installation', () => {
      const tower = FACTORIES.find(f => f.id === 'tower-installation');
      expect(tower).toBeDefined();
      expect(tower.name).toBe('Tower Installation');
      expect(tower.baseCost).toBe(50000);
      expect(tower.qsosPerSecond).toBe(60.0);
      expect(tower.tier).toBe(4);
    });

    it('has correct data for Contest Station', () => {
      const contest = FACTORIES.find(f => f.id === 'contest-station');
      expect(contest).toBeDefined();
      expect(contest.name).toBe('Contest Station');
      expect(contest.baseCost).toBe(100000);
      expect(contest.qsosPerSecond).toBe(120.0);
      expect(contest.tier).toBe(4);
    });

    it('has correct data for DX Cluster', () => {
      const cluster = FACTORIES.find(f => f.id === 'dx-cluster');
      expect(cluster).toBeDefined();
      expect(cluster.name).toBe('DX Cluster');
      expect(cluster.baseCost).toBe(250000);
      expect(cluster.qsosPerSecond).toBe(250.0);
      expect(cluster.tier).toBe(4);
    });

    it('has correct data for Hamfest', () => {
      const hamfest = FACTORIES.find(f => f.id === 'hamfest');
      expect(hamfest).toBeDefined();
      expect(hamfest.name).toBe('Hamfest');
      expect(hamfest.baseCost).toBe(500000);
      expect(hamfest.qsosPerSecond).toBe(500.0);
      expect(hamfest.tier).toBe(5);
    });

    it('has correct data for QSL Card Printer', () => {
      const printer = FACTORIES.find(f => f.id === 'qsl-card-printer');
      expect(printer).toBeDefined();
      expect(printer.name).toBe('QSL Card Printer');
      expect(printer.baseCost).toBe(1000000);
      expect(printer.qsosPerSecond).toBe(1000.0);
      expect(printer.tier).toBe(5);
    });

    it('has correct data for Remote Station', () => {
      const remote = FACTORIES.find(f => f.id === 'remote-station');
      expect(remote).toBeDefined();
      expect(remote.name).toBe('Remote Station');
      expect(remote.baseCost).toBe(2500000);
      expect(remote.qsosPerSecond).toBe(2500.0);
      expect(remote.tier).toBe(5);
    });
  });

  describe('Extra tier (6-7)', () => {
    const extraFactories = FACTORIES.filter(f => f.tier >= 6 && f.tier <= 7);

    it('has 6 factories', () => {
      expect(extraFactories).toHaveLength(6);
    });

    it('has correct data for FT8 Bot', () => {
      const ft8 = FACTORIES.find(f => f.id === 'ft8-bot');
      expect(ft8).toBeDefined();
      expect(ft8.name).toBe('FT8 Bot');
      expect(ft8.baseCost).toBe(5000000);
      expect(ft8.qsosPerSecond).toBe(5000.0);
      expect(ft8.tier).toBe(6);
    });

    it('has correct data for Cluster Spotting Network', () => {
      const cluster = FACTORIES.find(f => f.id === 'cluster-spotting-network');
      expect(cluster).toBeDefined();
      expect(cluster.name).toBe('Cluster Spotting Network');
      expect(cluster.baseCost).toBe(10000000);
      expect(cluster.qsosPerSecond).toBe(10000.0);
      expect(cluster.tier).toBe(6);
    });

    it('has correct data for EME Moonbounce', () => {
      const eme = FACTORIES.find(f => f.id === 'eme-moonbounce');
      expect(eme).toBeDefined();
      expect(eme.name).toBe('EME Moonbounce');
      expect(eme.baseCost).toBe(25000000);
      expect(eme.qsosPerSecond).toBe(25000.0);
      expect(eme.tier).toBe(6);
    });

    it('has correct data for Satellite Constellation', () => {
      const sat = FACTORIES.find(f => f.id === 'satellite-constellation');
      expect(sat).toBeDefined();
      expect(sat.name).toBe('Satellite Constellation');
      expect(sat.baseCost).toBe(50000000);
      expect(sat.qsosPerSecond).toBe(50000.0);
      expect(sat.tier).toBe(7);
    });

    it('has correct data for Ionospheric Modification', () => {
      const iono = FACTORIES.find(f => f.id === 'ionospheric-modification');
      expect(iono).toBeDefined();
      expect(iono.name).toBe('Ionospheric Modification');
      expect(iono.baseCost).toBe(100000000);
      expect(iono.qsosPerSecond).toBe(100000.0);
      expect(iono.tier).toBe(7);
    });

    it('has correct data for Alternate Dimension DXCC', () => {
      const alternate = FACTORIES.find(f => f.id === 'alternate-dimension-dxcc');
      expect(alternate).toBeDefined();
      expect(alternate.name).toBe('Alternate Dimension DXCC');
      expect(alternate.baseCost).toBe(500000000);
      expect(alternate.qsosPerSecond).toBe(500000.0);
      expect(alternate.tier).toBe(7);
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
