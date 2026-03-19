'use strict';

/**
 * Service to manage Web Audio API and play morse code tones.
 */
export class AudioService {
  /**
   * Initializes the audio service properties without starting the AudioContext.
   */
  constructor() {
    this.context = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isInitialized = false;
    this.frequency = 600;
  }

  /**
   * Initializes the AudioContext upon user interaction.
   */
  init() {
    if (this.isInitialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.isInitialized = true;
  }

  /**
   * Plays a constant morse code tone.
   */
  playTone() {
    if (!this.isInitialized) this.init();
    
    this.oscillator = this.context.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(this.frequency, this.context.currentTime);
    
    this.oscillator.connect(this.gainNode);
    this.oscillator.start();
    
    // Quick fade in to prevent clicks
    this.gainNode.gain.setTargetAtTime(0.1, this.context.currentTime, 0.01);
  }

  /**
   * Stops the morse code tone.
   */
  stopTone() {
    if (!this.oscillator) return;
    
    // Quick fade out
    this.gainNode.gain.setTargetAtTime(0, this.context.currentTime, 0.01);
    
    const osc = this.oscillator;
    this.oscillator = null;
    
    setTimeout(() => {
      osc.stop();
      osc.disconnect();
    }, 50);
  }
}

export const audioService = new AudioService();
