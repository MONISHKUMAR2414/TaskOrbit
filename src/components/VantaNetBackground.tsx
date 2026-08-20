import { useEffect, useRef, useState } from 'react'
import { loadVantaScript } from '@/lib/vantaScript'

const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js'
const VANTA_URL = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js'

interface VantaNetBackgroundProps {
  videoSrc: string
  poster?: string
}

export default function VantaNetBackground({ videoSrc, poster }: VantaNetBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vantaRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const effectRef = useRef<{ destroy: () => void } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let cancelled = false

    const init = async () => {
      try {
        await loadVantaScript(THREE_URL)
        await loadVantaScript(VANTA_URL)
        if (cancelled || !window.VANTA || !vantaRef.current) return

        effectRef.current = window.VANTA.NET({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x2dd4bf,
          backgroundColor: 0x0b0d12,
          pointsColor: 0x34d399,
          maxDistance: 22,
          spacing: 16,
          showDots: true,
        })
        setReady(true)
      } catch {
        // video remains as the background
      }
    }

    init()

    return () => {
      cancelled = true
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onVisibility = () => {
      if (document.hidden) video.pause()
      else video.play().catch(() => undefined)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return (
    <div ref={containerRef} className="video-bg" aria-hidden="true">
      <video
        ref={videoRef}
        className="video-bg-media"
        src={videoSrc}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <div ref={vantaRef} className={`video-bg-vanta${ready ? '' : ' is-pending'}`} />
      <div className="video-bg-overlay" />
    </div>
  )
}