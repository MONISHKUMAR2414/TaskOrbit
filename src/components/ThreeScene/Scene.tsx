import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { TaskCube, type CubeData } from './TaskCube'
import { ProgressRing } from './ProgressRing'
import { Particles } from './Particles'
import { useMediaQuery, useReducedMotion } from '@/hooks/useUi'
import type { Task } from '@/types'
import { PRIORITY_META } from '@/lib/utils'

interface ThreeSceneProps {
  tasks: Task[]
  completionPercent: number
  onTaskSelect: (task: Task) => void
}

const PRIORITY_SIZE: Record<string, number> = {
  low: 0.55,
  medium: 0.7,
  high: 0.85,
  critical: 1.0,
}

function SceneContent({ tasks, completionPercent, onTaskSelect, reducedMotion }: ThreeSceneProps & { reducedMotion: boolean }) {
  const cubes = useMemo<CubeData[]>(() => {
    const visible = tasks.filter((t) => t.status !== 'cancelled').slice(0, 60)
    const total = visible.length
    const center = [0, 0, 0]
    return visible.map((task, i) => {
      const priorityWeight = PRIORITY_META[task.priority].weight / 4
      const completed = task.status === 'completed'
      const catColor = task.category?.color ?? '#8b5cf6'

      let position: [number, number, number]
      if (total === 1) {
        position = [0, 0.2, 0]
      } else {
        const phi = Math.acos(-1 + ((2 * i) / Math.max(total - 1, 1)))
        const theta = Math.sqrt(Math.max(total, 1) * Math.PI) * phi
        const radius = 3.2
        position = [
          center[0] + radius * Math.cos(theta) * Math.sin(phi),
          center[1] + (Math.sin(phi * 3) * 1.2) - 1,
          center[2] + radius * Math.sin(theta) * Math.sin(phi) * 0.6,
        ]
      }

      return {
        task,
        position,
        color: completed ? '#10b981' : catColor,
        priorityWeight,
        completed,
        scale: PRIORITY_SIZE[task.priority] * (0.8 + (i % 3) * 0.1),
      }
    })
  }, [tasks])

  const ringColor = completionPercent >= 70 ? '#10b981' : completionPercent >= 40 ? '#06b6d4' : '#f59e0b'

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <directionalLight position={[-5, -3, -5]} intensity={0.35} color="#8b5cf6" />
      <pointLight position={[0, 3, 2]} intensity={8} color="#a78bfa" distance={12} />

      <Suspense fallback={null}>
        <Particles count={1200} reducedMotion={reducedMotion} />
        <ProgressRing progress={completionPercent} color={ringColor} />
        {cubes.map((c) => (
          <TaskCube key={c.task.id} data={c} onSelect={onTaskSelect} reducedMotion={reducedMotion} />
        ))}
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 1.8}
      />
    </>
  )
}

export function ThreeScene(props: ThreeSceneProps) {
  const reducedMotion = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 640px)')

  return (
    <div className="relative h-full w-full overflow-hidden" aria-label="3D productivity visualization">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.2, 7.5], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <SceneContent {...props} reducedMotion={reducedMotion} />
      </Canvas>
      {isMobile && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/30 px-3 py-1 text-[10px] text-white/60 backdrop-blur-sm">
          Drag to explore
        </div>
      )}
    </div>
  )
}