/**
 * Original sound effects synthesized live with the Web Audio API — no audio files,
 * nothing copyrighted. Nothing plays until the player has tapped something
 * (browser autoplay rules), and everything is silent when Sound is off.
 */
export type Sfx = 'tap' | 'clue' | 'pin' | 'submit' | 'great' | 'good' | 'meh' | 'achievement' | 'record' | 'stamp' | 'boop' | 'whoosh'

let ctx: AudioContext | null = null
let enabled = true
export function setSoundEnabled(on: boolean) { enabled = on }

function ac(): AudioContext | null {
  if (!enabled) return null
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!C) return null
      ctx = new C()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, slideTo?: number) {
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + start
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t0)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(a.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.02)
}

function noise(start: number, dur: number, vol = 0.05, from = 800, to = 3000) {
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + start
  const buf = a.createBuffer(1, Math.max(1, Math.floor(a.sampleRate * dur)), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.setValueAtTime(from, t0)
  f.frequency.exponentialRampToValueAtTime(to, t0 + dur)
  const g = a.createGain()
  g.gain.setValueAtTime(vol, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(f).connect(g).connect(a.destination)
  src.start(t0)
}

export function play(s: Sfx) {
  switch (s) {
    case 'tap': return tone(660, 0, 0.06, 'triangle', 0.06)
    case 'clue': tone(880, 0, 0.12, 'sine', 0.08); return tone(1320, 0.07, 0.18, 'sine', 0.07)
    case 'pin': tone(520, 0, 0.09, 'triangle', 0.1, 900); return noise(0, 0.05, 0.03, 2000, 4000)
    case 'submit': return noise(0, 0.28, 0.06, 300, 2500)
    case 'whoosh': return noise(0, 0.22, 0.04, 2500, 400)
    case 'great': return [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.22, 'triangle', 0.09))
    case 'good': return [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.2, 'triangle', 0.08))
    case 'meh': tone(392, 0, 0.18, 'triangle', 0.08); return tone(330, 0.12, 0.3, 'triangle', 0.07)
    case 'achievement': return [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.06, 0.3, 'square', 0.035))
    case 'record': return [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.07, 0.35, 'triangle', 0.08))
    case 'stamp': tone(140, 0, 0.12, 'sine', 0.2, 60); return noise(0, 0.07, 0.08, 400, 200)
    case 'boop': return tone(700 + Math.random() * 400, 0, 0.12, 'sine', 0.1, 1400 + Math.random() * 300)
  }
}
