import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface ProgressRingProps {
  progress: number
  color: string
  radius?: number
}

const SEGMENTS = 36
const SEGMENT_SIZE = 0.13

export function ProgressRing({ progress, color, radius = 1.7 }: ProgressRingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const clamped = Math.max(0, Math.min(100, progress))

  const segments = useMemo(() => {
    const arr: Array<{ angle: number; active: boolean }> = []
    const activeCount = Math.round((clamped / 100) * SEGMENTS)
    for (let i = 0; i < SEGMENTS; i++) {
      const angle = (i / SEGMENTS) * Math.PI * 2
      arr.push({ angle, active: i < activeCount })
    }
    return arr
  }, [clamped])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.rotation.y = t * 0.15
    groupRef.current.position.y = Math.sin(t * 0.5) * 0.08
    if (innerRef.current) {
      innerRef.current.rotation.z = t * 0.3
    }
  })

  return (
    <group position={[3.4, 0.4, -0.5]} rotation={[0.4, 0.2, 0]}>
      <group ref={groupRef}>
        {/* Backplate ring */}
        <mesh>
          <torusGeometry args={[radius, 0.05, 12, 64]} />
          <meshPhysicalMaterial color="#1e2536" metalness={0.7} roughness={0.3} transparent opacity={0.7} />
        </mesh>
        {/* Active segments */}
        {segments.map((s, i) => {
          const x = Math.cos(s.angle) * radius
          const z = Math.sin(s.angle) * radius
          return (
            <mesh
              key={i}
              position={[x, 0, z]}
              rotation={[0, -s.angle, 0]}
              scale={[s.active ? 1 : 0.18, 1, 1]}
            >
              <boxGeometry args={[SEGMENT_SIZE, SEGMENT_SIZE * 1.4, SEGMENT_SIZE]} />
              <meshPhysicalMaterial
                color={s.active ? color : '#2a3142'}
                metalness={0.6}
                roughness={0.2}
                emissive={s.active ? new THREE.Color(color).multiplyScalar(0.6) : '#000000'}
                emissiveIntensity={s.active ? 0.8 : 0}
              />
            </mesh>
          )
        })}
        {/* Floating inner core */}
        <mesh ref={innerRef} position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.28, 20, 20]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.3}
            roughness={0.15}
            emissive={new THREE.Color(color).multiplyScalar(0.5)}
          />
        </mesh>
      </group>
    </group>
  )
}