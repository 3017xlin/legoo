"use client"

import type React from "react"
import { useMemo } from "react"
import * as THREE from "three"
import { Instances, Instance } from "@react-three/drei"
import { GRID_SIZE, GROUND_HEIGHT, STUD_HEIGHT, STUD_RADIUS, BRICK_HEIGHT } from "@/lib/constants"

interface PlatformProps {
  floorOffset?: number
}

export const Platform: React.FC<PlatformProps> = ({ floorOffset = 0 }) => {
  const studGeometry = useMemo(() => new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 12), [])
  const studPositions = useMemo(() => {
    const positions: [number, number, number][] = []
    for (let x = -GRID_SIZE / 2 + 0.5; x < GRID_SIZE / 2; x++) {
      for (let z = -GRID_SIZE / 2 + 0.5; z < GRID_SIZE / 2; z++) {
        positions.push([x, GROUND_HEIGHT / 2 + STUD_HEIGHT / 2, z])
      }
    }
    return positions
  }, [])

  // Lower the platform by floorOffset bricks so users can insert pieces underneath floating ones.
  const groupY = -floorOffset * BRICK_HEIGHT

  return (
    <group position={[0, groupY, 0]}>
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[GRID_SIZE, GROUND_HEIGHT, GRID_SIZE]} />
        <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0.1} />
      </mesh>
      <Instances geometry={studGeometry} limit={GRID_SIZE * GRID_SIZE}>
        <meshStandardMaterial color="#ffffff" roughness={0.8} metalness={0.1} />
        {studPositions.map((pos, index) => (
          <Instance key={index} position={pos} castShadow receiveShadow />
        ))}
      </Instances>
    </group>
  )
}
