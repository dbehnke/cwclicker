/**
 * Service to manage Web Audio API and play morse code tones.
 */
export class AudioService {
  /**
   * Initializes the audio service properties without starting the AudioContext.
   */
  constructor() {
    this.context = null
    this.oscillator = null
    this.gainNode = null
    this.isInitialized = false
    this.frequency = 600
    this.volume = 0.5
    this.isMuted = false
  }

  /**
   * Initializes the AudioContext upon user interaction.
   */
  init() {
    if (this.isInitialized) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) {
      console.warn('Web Audio API not supported in this browser')
      return
    }
    try {
      this.context = new AudioContext()
      this.gainNode = this.context.createGain()
      this.gainNode.connect(this.context.destination)
      this.gainNode.gain.setValueAtTime(0, this.context.currentTime)
      this.isInitialized = true
    } catch (e) {
      console.warn('Failed to initialize AudioContext:', e)
    }
  }

  /**
   * Plays a constant morse code tone.
   * Stops any existing oscillator first to prevent orphaned oscillators.
   */
  async playTone() {
    if (!this.isInitialized) this.init()
    if (!this.context) return
    if (this.isMuted) return

    // Mobile browsers suspend AudioContext until user interaction
    // We need to resume it if it's suspended
    if (this.context.state === 'suspended') {
      try {
        await this.context.resume()
      } catch (e) {
        console.warn('Failed to resume AudioContext:', e)
        return
      }
    }

    // Stop any existing oscillator first to prevent race conditions
    // This ensures we don't create orphaned oscillators
    if (this.oscillator) {
      this.stopTone()
    }

    // Ensure we have a clean state before creating new oscillator
    if (this.oscillator) {
      console.warn('AudioService: Could not stop existing oscillator')
      return
    }

    try {
      this.oscillator = this.context.createOscillator()
      this.oscillator.type = 'sine'
      this.oscillator.frequency.setValueAtTime(this.frequency, this.context.currentTime)

      this.oscillator.connect(this.gainNode)
      this.oscillator.start()

      // Quick fade in to prevent clicks
      const targetVolume = this.volume * 0.3 // Max 0.3 to prevent clipping
      this.gainNode.gain.setTargetAtTime(targetVolume, this.context.currentTime, 0.01)
    } catch (e) {
      console.error('Failed to play tone:', e)
      this.oscillator = null
    }
  }

  /**
   * Stops the morse code tone immediately.
   * Ensures oscillator is fully cleaned up to prevent memory leaks.
   */
  stopTone() {
    if (!this.oscillator) return

    const osc = this.oscillator
    this.oscillator = null

    try {
      // Fade out quickly to avoid clicks
      if (this.gainNode && this.context) {
        this.gainNode.gain.setTargetAtTime(0, this.context.currentTime, 0.01)
      }

      // Stop and disconnect immediately to prevent race conditions
      // The fade out happens over 10ms, so stopping now is safe
      osc.stop()
      osc.disconnect()
    } catch (e) {
      // Oscillator might already be stopped, ignore error
      console.debug('AudioService: Error stopping oscillator:', e)
    }
  }

  /**
   * Sets the volume level.
   * @param {number} volume - Volume level from 0.0 to 1.0
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.gainNode && this.context) {
      const targetVolume = this.isMuted ? 0 : this.volume * 0.3
      this.gainNode.gain.setTargetAtTime(targetVolume, this.context.currentTime, 0.01)
    }
  }

  /**
   * Sets the frequency of the tone.
   * @param {number} freq - Frequency in Hz (typically 400-1000)
   */
  setFrequency(freq) {
    this.frequency = Math.max(400, Math.min(1000, freq))
    if (this.oscillator && this.context) {
      this.oscillator.frequency.setTargetAtTime(this.frequency, this.context.currentTime, 0.01)
    }
  }

  /**
   * Toggles mute state.
   * @param {boolean} [muted] - Optional explicit mute state
   * @returns {boolean} Current mute state
   */
  toggleMute(muted) {
    if (typeof muted === 'boolean') {
      this.isMuted = muted
    } else {
      this.isMuted = !this.isMuted
    }

    if (this.gainNode && this.context) {
      const targetVolume = this.isMuted ? 0 : this.volume * 0.3
      this.gainNode.gain.setTargetAtTime(targetVolume, this.context.currentTime, 0.01)
    }

    // Stop oscillator if muted while playing
    if (this.isMuted && this.oscillator) {
      this.stopTone()
    }

    return this.isMuted
  }
}

export const audioService = new AudioService()
