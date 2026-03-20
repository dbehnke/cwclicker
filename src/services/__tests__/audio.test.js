'use strict';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioService } from '../audio';

describe('AudioService', () => {
  let mockOscillator;
  let mockGainNode;
  let mockContext;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockOscillator = {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn()
    };
    
    mockGainNode = {
      gain: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
      connect: vi.fn()
    };
    
    mockContext = {
      createOscillator: vi.fn().mockReturnValue(mockOscillator),
      createGain: vi.fn().mockReturnValue(mockGainNode),
      destination: {},
      currentTime: 0
    };
    
    // Use a proper constructor mock that works with 'new'
    global.window = {
      AudioContext: vi.fn(function() {
        return mockContext;
      })
    };
  });

  it('does not initialize AudioContext until first interaction', () => {
    const audio = new AudioService();
    expect(audio.isInitialized).toBe(false);
    audio.init();
    expect(audio.isInitialized).toBe(true);
  });

  describe('playTone', () => {
    it('creates and starts an oscillator', () => {
      const audio = new AudioService();
      audio.playTone();
      
      expect(mockContext.createOscillator).toHaveBeenCalled();
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(600, 0);
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockOscillator.start).toHaveBeenCalled();
    });

    it('performs quick fade in to prevent clicks', () => {
      const audio = new AudioService();
      audio.playTone();
      
      // Default volume is 0.5, multiplied by 0.3 = 0.15
      expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalledWith(0.15, 0, 0.01);
    });

    it('stops existing oscillator before creating new one to prevent orphaned oscillators', () => {
      const audio = new AudioService();
      audio.playTone();
      expect(mockContext.createOscillator).toHaveBeenCalledTimes(1);
      expect(mockOscillator.stop).not.toHaveBeenCalled();
      
      // Call playTone again - should stop old oscillator and create new one
      audio.playTone();
      expect(mockOscillator.stop).toHaveBeenCalled();
      expect(mockContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('initializes audio context if not already initialized', () => {
      const audio = new AudioService();
      expect(audio.isInitialized).toBe(false);
      
      audio.playTone();
      
      expect(audio.isInitialized).toBe(true);
    });
  });

  describe('stopTone', () => {
    it('performs quick fade out', () => {
      const audio = new AudioService();
      audio.playTone();
      
      mockGainNode.gain.setTargetAtTime.mockClear();
      audio.stopTone();
      
      expect(mockGainNode.gain.setTargetAtTime).toHaveBeenCalledWith(0, 0, 0.01);
    });

    it('stops and disconnects oscillator immediately', () => {
      const audio = new AudioService();
      audio.playTone();
      
      audio.stopTone();
      
      // Oscillator should be stopped immediately (synchronous)
      expect(audio.oscillator).toBeNull();
      expect(mockOscillator.stop).toHaveBeenCalled();
      expect(mockOscillator.disconnect).toHaveBeenCalled();
    });

    it('does nothing if no oscillator is playing', () => {
      const audio = new AudioService();
      audio.init();
      
      // Should not throw
      expect(() => audio.stopTone()).not.toThrow();
    });
  });

  describe('browser compatibility', () => {
    it('handles missing AudioContext gracefully', () => {
      global.window = {};
      const audio = new AudioService();
      
      // Should not throw
      expect(() => audio.init()).not.toThrow();
      expect(() => audio.playTone()).not.toThrow();
      expect(() => audio.stopTone()).not.toThrow();
    });

    it('handles AudioContext constructor failure gracefully', () => {
      global.window = {
        AudioContext: vi.fn(function() {
          throw new Error('AudioContext not allowed');
        })
      };
      
      const audio = new AudioService();
      
      // Should not throw
      expect(() => audio.init()).not.toThrow();
      expect(audio.isInitialized).toBe(false);
    });
  });
});
