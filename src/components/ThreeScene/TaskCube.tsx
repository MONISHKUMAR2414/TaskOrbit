import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { Task } from '@/types'

export interface CubeData {
  task: Task
  position: [number, number, number]
  color: string
  priorityWeight: number
  completed: boolean
  scale: number
}

interface TaskCubeProps {
  data: CubeData
  onSelect: (task: Task) => void
  reducedMotion: boolean
}

export function TaskCube({ data, onSelect, reducedMotion }: TaskCubeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const baseScale = data.scale * (data.completed ? 0.7 : 1)

  useFrame((state) => {
    if (!meshRef.current) return
    const target = hovered ? baseScale * 1.35 : baseScale
    meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.15)

    if (!reducedMotion) {
      const t = state.clock.getElapsedTime()
      meshRef.current.rotation.x = t * 0.25 + data.position[0]
      meshRef.current.rotation.y = t * 0.35 + data.position[1]
      meshRef.current.position.y = data.position[1] + Math.sin(t * 0.8 + data.position[0]) * 0.12
    }
  })

  const material = useMemo(() => {
    const opacity = data.completed ? 0.35 : 0.95
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(data.color),
      metalness: data.completed ? 0.1 : 0.55,
      roughness: 0.25,
      transparent: true,
      opacity,
      emissive: new THREE.Color(data.color).multiplyScalar(data.completed ? 0.1 : 0.45 * data.priorityWeight),
      clearcoat: 0.6,
    })
  }, [data.color, data.completed, data.priorityWeight])

  return (
    <group position={data.position}>
      <mesh
        ref={meshRef}
        material={material}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(data.task)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
    </group>
  )
}