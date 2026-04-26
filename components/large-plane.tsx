import type React from "react"
import { GROUND_MATERIAL } from "@/lib/constants"

export const LargePlane: React.FC = () => {
  return (
    <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[10000, 10000]} />
      <meshStandardMaterial
        color={GROUND_MATERIAL.color}
        roughness={GROUND_MATERIAL.roughness}
        metalness={GROUND_MATERIAL.metalness}
      />
    </mesh>
  )
}
