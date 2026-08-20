import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const FF = require('ffmpeg-static')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function sampleFrame(video, at) {
  const raw = execFileSync(FF, [
    '-ss', String(at),
    '-i', join(root, video),
    '-frames:v', '1',
    '-vf', 'scale=48:48',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgb24',
    '-y', 'pipe:1',
  ], { maxBuffer: 10 * 1024 * 1024 })
  return raw
}

function avgColor(buf) {
  let r = 0, g = 0, b = 0, n = buf.length / 3
  for (let i = 0; i < buf.length; i += 3) { r += buf[i]; g += buf[i + 1]; b += buf[i + 2] }
  r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n)
  return { r, g, b, hex: '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('') }
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h /= 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function getDuration(video) {
  try {
    execFileSync(FF, ['-i', join(root, video)], { stdio: ['ignore', 'ignore', 'pipe'] })
  } catch (e) {
    const s = e.stderr ? e.stderr.toString() : ''
    const m = s.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
    if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3]
  }
  return 10
}

function analyze(video) {
  const dur = getDuration(video)
  const times = [Math.min(0.5, dur / 3), dur / 2, Math.max(dur - 0.5, dur * 0.8)]

  const avgs = times.map((t) => avgColor(sampleFrame(video, t)))
  const overall = avgColor(Buffer.concat(avgs.map((a) => {
    const b = Buffer.alloc(3)
    b[0] = a.r; b[1] = a.g; b[2] = a.b
    return b
  })))

  // saturation boost estimate: overall avg saturation
  const hsl = rgbToHsl(overall.r, overall.g, overall.b)
  return {
    video,
    duration: dur,
    frames: avgs,
    average: { ...overall, hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s), l: Math.round(hsl.l) } },
  }
}

const out = [analyze('signupfinal.mp4'), analyze('homepage-1.mp4')]
console.log(JSON.stringify(out, null, 2))