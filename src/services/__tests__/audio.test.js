'use strict';

import { describe, it, expect, vi } from 'vitest';
import { AudioService } from '../audio';

// Mock browser AudioContext
global.window = {
  AudioContext: vi.fn().mockImplementation(function() {
    return {
      createOscillator: vi.fn().mockReturnValue({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn()
      }),
      createGain: vi.fn().mockReturnValue({
        gain: { setValueAtTime: vi.fn(), setTargetAtTime: vi.fn() },
        connect: vi.fn()
      }),
      destination: {},
      currentTime: 0
    };
  })
};

describe('AudioService', () => {
  it('does not initialize AudioContext until first interaction', () => {
    const audio = new AudioService();
    expect(audio.isInitialized).toBe(false);
    audio.init();
    expect(audio.isInitialized).toBe(true);
  });
});
