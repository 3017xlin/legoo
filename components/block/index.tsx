"use client"

import type React from "react"
import { useRef, useMemo } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Instances, Instance, useTexture } from "@react-three/drei"
import { BRICK_HEIGHT, LAYER_GAP, STUD_HEIGHT, STUD_RADIUS, STUD_SEGMENTS, TEXTURES } from "@/lib/constants"
import type { BlockProps } from "./types"

function buildSlopeGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  // Slope/wedge: top face slants from low (front) to high (back).
  const w = width / 2
  const h = height / 2
  const d = depth / 2

  // 6 vertices for a wedge prism
  const v = [
    // bottom (4)
    [-w, -h, -d], // 0 back-left-bottom
    [w, -h, -d], //  1 back-right-bottom
    [w, -h, d], //   2 front-right-bottom
    [-w, -h, d], //  3 front-left-bottom
    // top edge (only along back) (2)
    [-w, h, -d], //  4 back-left-top
    [w, h, -d], //   5 back-right-top
  ]

  const positions: number[] = []
  const pushTri = (a: number[], b: number[], c: number[]) => {
    positions.push(...a, ...b, ...c)
  }

  // bottom (y = -h)
  pushTri(v[0], v[2], v[1])
  pushTri(v[0], v[3], v[2])
  // back (z = -d)
  pushTri(v[0], v[1], v[5])
  pushTri(v[0], v[5], v[4])
  // slanted top: from back-top edge down to front-bottom edge
  pushTri(v[4], v[5], v[2])
  pushTri(v[4], v[2], v[3])
  // left side (x = -w) — triangle
  pushTri(v[0], v[4], v[3])
  // right side (x = w) — triangle
  pushTri(v[1], v[2], v[5])

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

export const Block: React.FC<BlockProps> = ({
  color,
  position,
  width,
  height,
  shape = "rect",
  rotation = [0, 0, 0],
  isPlacing = false,
  opacity = 1,
  onClick,
}) => {
  const depth = height
  const blockGeometry = useMemo(() => {
    if (shape === "slope") return buildSlopeGeometry(width, BRICK_HEIGHT - LAYER_GAP, depth)
    return new THREE.BoxGeometry(width, BRICK_HEIGHT - LAYER_GAP, depth)
  }, [width, depth, shape])

  const studGeometry = useMemo(
    () => new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, STUD_SEGMENTS),
    [],
  )

  const studPositions = useMemo(() => {
    if (shape === "flatTop") return []
    const positions: [number, number, number][] = []
    if (shape === "slope") {
      // Slope: only one row of studs along the top-back edge
      for (let x = -width / 2 + 0.5; x < width / 2; x++) {
        positions.push([x, BRICK_HEIGHT / 2 - LAYER_GAP / 2 + STUD_HEIGHT / 2, -depth / 2 + 0.5])
      }
      return positions
    }
    for (let x = -width / 2 + 0.5; x < width / 2; x++) {
      for (let z = -depth / 2 + 0.5; z < depth / 2; z++) {
        positions.push([x, BRICK_HEIGHT / 2 - LAYER_GAP / 2 + STUD_HEIGHT / 2, z])
      }
    }
    return positions
  }, [width, depth, shape])

  // Bracket: a side flange with horizontal studs (facing -Z direction)
  const bracketStudPositions = useMemo(() => {
    if (shape !== "bracket") return []
    const positions: [number, number, number][] = []
    for (let x = -width / 2 + 0.5; x < width / 2; x++) {
      positions.push([x, 0, -depth / 2 - STUD_HEIGHT / 2])
    }
    return positions
  }, [width, depth, shape])

  const textures = useTexture(TEXTURES)

  const brickRef = useRef<THREE.Mesh>(null)
  const studRef = useRef<THREE.InstancedMesh>(null)
  const sideStudRef = useRef<THREE.InstancedMesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  const isEraseHighlight = isPlacing && onClick !== undefined

  useFrame((state) => {
    if (isPlacing && brickRef.current) {
      const glowColor = isEraseHighlight ? new THREE.Color(1, 0, 0) : new THREE.Color(1, 1, 0)
      const glowIntensity = Math.sin(state.clock.elapsedTime * 4) * 0.1 + 0.9

      const mat = brickRef.current.material as THREE.MeshStandardMaterial
      mat.emissive.copy(glowColor)
      mat.emissiveIntensity = glowIntensity
      if (studRef.current) {
        const sm = studRef.current.material as THREE.MeshStandardMaterial
        sm.emissive.copy(glowColor)
        sm.emissiveIntensity = glowIntensity
      }
      if (sideStudRef.current) {
        const sm = sideStudRef.current.material as THREE.MeshStandardMaterial
        sm.emissive.copy(glowColor)
        sm.emissiveIntensity = glowIntensity
      }
    }
  })

  const instanceLimit = useMemo(() => Math.max(width * depth, 100), [width, depth])

  const darkenedColor = useMemo(() => {
    if (isEraseHighlight) return "#ff0000"
    if (isPlacing) return "#ffff00"

    const hex = color.replace("#", "")
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    const darkenFactor = 0.9
    const newR = Math.floor(r * darkenFactor)
    const newG = Math.floor(g * darkenFactor)
    const newB = Math.floor(b * darkenFactor)

    return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`
  }, [color, isPlacing, isEraseHighlight])

  const handleClick = (e: THREE.ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (onClick) onClick()
  }

  const isMobile = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768
    }
    return false
  }, [])

  const isEraseMode = isEraseHighlight && isMobile

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={handleClick}
      onPointerDown={(e) => {
        if (isEraseMode && onClick) {
          e.stopPropagation()
          onClick()
        }
      }}
    >
      <mesh ref={brickRef} geometry={blockGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={darkenedColor}
          roughnessMap={textures.roughness}
          normalMap={textures.normal}
          map={textures.color}
          roughness={0.7}
          metalness={0.1}
          emissive={isPlacing ? (isEraseHighlight ? "#ff0000" : "#ffff00") : "#000000"}
          emissiveIntensity={isPlacing ? 1 : 0}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {studPositions.length > 0 && (
        <Instances ref={studRef} geometry={studGeometry} limit={instanceLimit}>
          <meshStandardMaterial
            color={darkenedColor}
            roughnessMap={textures.roughness}
            normalMap={textures.normal}
            map={textures.color}
            roughness={0.7}
            metalness={0.1}
            emissive={isPlacing ? (isEraseHighlight ? "#ff0000" : "#ffff00") : "#000000"}
            emissiveIntensity={isPlacing ? 1 : 0}
            transparent={opacity < 1}
            opacity={opacity}
          />
          {studPositions.map((pos, index) => (
            <Instance key={index} position={pos} castShadow receiveShadow />
          ))}
        </Instances>
      )}

      {bracketStudPositions.length > 0 && (
        <Instances ref={sideStudRef} geometry={studGeometry} limit={Math.max(width, 8)}>
          <meshStandardMaterial
            color={darkenedColor}
            roughnessMap={textures.roughness}
            normalMap={textures.normal}
            map={textures.color}
            roughness={0.7}
            metalness={0.1}
            emissive={isPlacing ? (isEraseHighlight ? "#ff0000" : "#ffff00") : "#000000"}
            emissiveIntensity={isPlacing ? 1 : 0}
            transparent={opacity < 1}
            opacity={opacity}
          />
          {bracketStudPositions.map((pos, index) => (
            <Instance key={index} position={pos} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow />
          ))}
        </Instances>
      )}
    </group>
  )
}
