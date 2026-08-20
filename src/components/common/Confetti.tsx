import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface ConfettiProps {
  active: boolean
  onDone: () => void
}

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a78bfa']

interface Piece {
  id: number
  x: number
  delay: number
  rotation: number
  color: string
  size: number
  duration: number
}

export function Confetti({ active, onDone }: ConfettiProps) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 360,
        delay: Math.random() * 0.15,
        rotation: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        size: 5 + Math.random() * 6,
        duration: 0.9 + Math.random() * 0.6,
      })),
    [active] // eslint-disable-line react-hooks/exhaustive-deps
  )

  if (!active) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.x, y: -80, rotate: p.rotation, scale: 0.4 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          onAnimationComplete={() => {
            if (p.id === pieces[pieces.length - 1].id) onDone()
          }}
          className="absolute left-1/2 top-1/2 rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  )
}