/**
 * Web Audio API stadium ambience.
 * All sounds synthesised — no audio files loaded.
 */

class StadiumAudio {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.ambienceNode = null
    this.enabled = false
    this._started = false
  }

  _ensureContext() {
    if (this.ctx) return true
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.4
      this.masterGain.connect(this.ctx.destination)
      return true
    } catch {
      return false
    }
  }

  start() {
    if (!this._ensureContext()) return
    if (this._started) return
    this._started = true
    this.enabled = true
    this._startAmbience()
  }

  stop() {
    this.enabled = false
    if (this.ambienceNode) {
      try { this.ambienceNode.stop() } catch {}
      this.ambienceNode = null
    }
    this._started = false
  }

  toggle() {
    if (this.enabled) {
      this.stop()
    } else {
      this.start()
    }
    return this.enabled
  }

  _startAmbience() {
    if (!this.ctx || !this.enabled) return

    // Stadium crowd: filtered white noise with slow amplitude modulation
    const bufferSize = this.ctx.sampleRate * 4
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1)
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    // Band-pass to make it sound like crowd chatter
    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 800
    bp.Q.value = 0.8

    // Low-pass to soften
    const lp = this.ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 2000

    // Slow amplitude tremolo (crowd waves)
    const tremoloGain = this.ctx.createGain()
    tremoloGain.gain.value = 0.3

    const tremoloLfo = this.ctx.createOscillator()
    tremoloLfo.frequency.value = 0.12 // very slow
    tremoloLfo.type = 'sine'
    const tremoloDepth = this.ctx.createGain()
    tremoloDepth.gain.value = 0.15
    tremoloLfo.connect(tremoloDepth)
    tremoloDepth.connect(tremoloGain.gain)
    tremoloLfo.start()

    source.connect(bp)
    bp.connect(lp)
    lp.connect(tremoloGain)
    tremoloGain.connect(this.masterGain)
    source.start()
    this.ambienceNode = source
  }

  goalRoar() {
    if (!this.enabled || !this.ctx) return

    const now = this.ctx.currentTime

    // Crowd roar: burst of noise swelling then fading
    const bufferSize = this.ctx.sampleRate * 3
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const src = this.ctx.createBufferSource()
    src.buffer = buffer

    const bp = this.ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1200
    bp.Q.value = 0.5

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.8, now + 0.2)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 3.0)

    src.connect(bp)
    bp.connect(gain)
    gain.connect(this.masterGain)
    src.start(now)
    src.stop(now + 3.5)

    // Short whistle-like tone
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.3)
    const wGain = this.ctx.createGain()
    wGain.gain.setValueAtTime(0.15, now)
    wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    osc.connect(wGain)
    wGain.connect(this.masterGain)
    osc.start(now)
    osc.stop(now + 0.5)
  }

  whistle() {
    if (!this.enabled || !this.ctx) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1200, now)
    osc.frequency.setValueAtTime(900, now + 0.15)
    osc.frequency.setValueAtTime(1100, now + 0.3)
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.setValueAtTime(0.2, now + 0.4)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(now)
    osc.stop(now + 0.7)
  }

  tickClick() {
    if (!this.enabled || !this.ctx) return
    const now = this.ctx.currentTime
    const buf = this.ctx.createBuffer(1, 512, this.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < 512; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / 512)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const gain = this.ctx.createGain()
    gain.gain.value = 0.06
    src.connect(gain)
    gain.connect(this.masterGain)
    src.start(now)
  }
}

export const stadiumAudio = new StadiumAudio()
