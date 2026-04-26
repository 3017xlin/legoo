"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { BRICK_HEIGHT, LAYER_GAP, GROUND_HEIGHT, INTERACTION_PLANE_SIZE } from "@/lib/constants"
import type { Brick, BrickShape } from "@/components/blocks/events"

interface UseSceneInteractionProps {
  bricks: Brick[]
  width: number
  depth: number
  selectedColor: string
  shape: BrickShape
  rotation: [number, number, number]
  floorOffset: number
  onAddBrick: (brick: Brick) => void
  onDeleteBrick?: (index: number) => void
  isPlaying: boolean
  interactionMode: "build" | "move" | "erase"
}

const groundY = (floorOffset: number) => GROUND_HEIGHT / 2 + BRICK_HEIGHT / 2 - floorOffset * BRICK_HEIGHT

// Account for rotation when computing axis-aligned bounding extents.
function getBrickExtents(brick: Brick): { x: number; y: number; z: number } {
  const rotY = brick.rotation?.[1] ?? 0
  const rotX = brick.rotation?.[0] ?? 0
  const rotZ = brick.rotation?.[2] ?? 0

  // Y rotation by 90° swaps width <-> depth
  const yQuarter = Math.round(rotY / (Math.PI / 2))
  const swapY = Math.abs(yQuarter % 2) === 1
  let dimX = swapY ? brick.height : brick.width
  let dimZ = swapY ? brick.width : brick.height
  let dimY = BRICK_HEIGHT

  // X rotation by 90° swaps Y <-> Z (height with depth)
  const xQuarter = Math.round(rotX / (Math.PI / 2))
  if (Math.abs(xQuarter % 2) === 1) {
    const tmp = dimY
    dimY = dimZ
    dimZ = tmp
  }
  // Z rotation by 90° swaps X <-> Y
  const zQuarter = Math.round(rotZ / (Math.PI / 2))
  if (Math.abs(zQuarter % 2) === 1) {
    const tmp = dimX
    dimX = dimY
    dimY = tmp
  }

  return { x: dimX, y: dimY, z: dimZ }
}

export function useSceneInteraction({
  bricks,
  width,
  depth,
  selectedColor,
  shape,
  rotation,
  floorOffset,
  onAddBrick,
  onDeleteBrick,
  isPlaying,
  interactionMode,
}: UseSceneInteractionProps) {
  const [currentBrickPosition, setCurrentBrickPosition] = useState<[number, number, number]>([
    0,
    groundY(floorOffset),
    0,
  ])
  const [isPlacing, setIsPlacing] = useState(true)
  const [isValid, setIsValid] = useState(true)
  const [showNewBrick, setShowNewBrick] = useState(true)
  const [hoveredBrickIndex, setHoveredBrickIndex] = useState<number | null>(null)
  const [touchedBrickIndex, setTouchedBrickIndex] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Manual offset from arrow keys; reset on placement or large mouse movement
  const [manualOffset, setManualOffset] = useState<[number, number, number]>([0, 0, 0])
  const [yOverride, setYOverride] = useState<number | null>(null)

  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const [touchStartPosition, setTouchStartPosition] = useState<{ x: number; y: number } | null>(null)
  const [hasMoved, setHasMoved] = useState(false)
  const touchMoveThreshold = 10

  const { camera, raycaster, mouse } = useThree()
  const planeRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (isDeleting) {
      setHoveredBrickIndex(null)
      setTouchedBrickIndex(null)
      setIsDeleting(false)
    }
  }, [bricks, isDeleting])

  useEffect(() => {
    setHoveredBrickIndex(null)
    setTouchedBrickIndex(null)

    if (planeRef.current) {
      if (interactionMode === "build") {
        if ((planeRef.current as any)._originalRaycast) {
          planeRef.current.raycast = (planeRef.current as any)._originalRaycast
          ;(planeRef.current as any)._originalRaycast = null
        }
      } else {
        if (!(planeRef.current as any)._originalRaycast) {
          const originalRaycast = planeRef.current.raycast
          ;(planeRef.current as any)._originalRaycast = originalRaycast
          planeRef.current.raycast = () => {}
        }
      }
    }
  }, [interactionMode])

  const snapToGrid = (value: number, size: number) => {
    const isOdd = size % 2 !== 0
    const snappedValue = Math.round(value)
    return isOdd ? snappedValue - 0.5 : snappedValue
  }

  // Volume-based 3D collision: two bricks may not overlap in any axis aligned dimension.
  const isValidPlacement = useCallback(
    (position: [number, number, number], pendingExtents: { x: number; y: number; z: number }) => {
      const [x, y, z] = position

      const left = x - pendingExtents.x / 2
      const right = x + pendingExtents.x / 2
      const top = z - pendingExtents.z / 2
      const bottom = z + pendingExtents.z / 2
      const yLow = y - pendingExtents.y / 2
      const yHigh = y + pendingExtents.y / 2

      return !bricks.some((brick) => {
        const ext = getBrickExtents(brick)
        const bLeft = brick.position[0] - ext.x / 2
        const bRight = brick.position[0] + ext.x / 2
        const bTop = brick.position[2] - ext.z / 2
        const bBottom = brick.position[2] + ext.z / 2
        const bYLow = brick.position[1] - ext.y / 2
        const bYHigh = brick.position[1] + ext.y / 2

        const epsilon = 0.01
        const xOverlap = left < bRight - epsilon && right > bLeft + epsilon
        const zOverlap = top < bBottom - epsilon && bottom > bTop + epsilon
        const yOverlap = yLow < bYHigh - epsilon && yHigh > bYLow + epsilon

        return xOverlap && zOverlap && yOverlap
      })
    },
    [bricks],
  )

  // Stack: find topmost brick under (x,z) footprint, return Y above it.
  const findStackY = useCallback(
    (
      x: number,
      z: number,
      pendingExtents: { x: number; y: number; z: number },
    ) => {
      const halfX = pendingExtents.x / 2
      const halfZ = pendingExtents.z / 2
      const halfY = pendingExtents.y / 2

      const overlapping = bricks.filter((brick) => {
        const ext = getBrickExtents(brick)
        const xOverlap =
          Math.abs(brick.position[0] - x) < (pendingExtents.x + ext.x) / 2 - 0.01
        const zOverlap =
          Math.abs(brick.position[2] - z) < (pendingExtents.z + ext.z) / 2 - 0.01
        return xOverlap && zOverlap
      })

      const floor = groundY(floorOffset)
      if (overlapping.length === 0) return floor

      const topY = Math.max(
        ...overlapping.map((brick) => {
          const ext = getBrickExtents(brick)
          return brick.position[1] + ext.y / 2
        }),
      )
      return topY + halfY + LAYER_GAP
    },
    [bricks, floorOffset],
  )

  const findBrickAtPointer = () => {
    const intersectedBricks: { index: number; distance: number }[] = []
    bricks.forEach((brick, index) => {
      const ext = getBrickExtents(brick)
      const brickBox = new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3(brick.position[0], brick.position[1], brick.position[2]),
        new THREE.Vector3(ext.x, ext.y, ext.z),
      )
      const intersectionPoint = new THREE.Vector3()
      if (raycaster.ray.intersectBox(brickBox, intersectionPoint)) {
        const distance = raycaster.ray.origin.distanceTo(intersectionPoint)
        intersectedBricks.push({ index, distance })
      }
    })

    if (intersectedBricks.length > 0) {
      intersectedBricks.sort((a, b) => a.distance - b.distance)
      return intersectedBricks[0].index
    }
    return null
  }

  useFrame(() => {
    if (isPlaying || isDeleting) return

    raycaster.setFromCamera(mouse, camera)

    if (interactionMode === "build" && isPlacing && planeRef.current) {
      const intersects = raycaster.intersectObject(planeRef.current)

      if (intersects.length > 0) {
        const { x, z } = intersects[0].point

        // Detect substantial mouse movement to clear manual offset
        const dx = mouse.x - lastMousePos.current.x
        const dy = mouse.y - lastMousePos.current.y
        const movedSubstantially = Math.sqrt(dx * dx + dy * dy) > 0.02
        if (movedSubstantially) {
          if (manualOffset[0] !== 0 || manualOffset[1] !== 0 || manualOffset[2] !== 0) {
            setManualOffset([0, 0, 0])
          }
          if (yOverride !== null) setYOverride(null)
          lastMousePos.current = { x: mouse.x, y: mouse.y }
        }

        const pendingExtents = getBrickExtents({
          color: "",
          position: [0, 0, 0],
          width,
          height: depth,
          rotation,
        })

        const snappedX = snapToGrid(x, pendingExtents.x) + manualOffset[0]
        const snappedZ = snapToGrid(z, pendingExtents.z) + manualOffset[2]
        const stackY = yOverride !== null ? yOverride : findStackY(snappedX, snappedZ, pendingExtents)
        const finalY = stackY + manualOffset[1] * BRICK_HEIGHT
        const newPosition: [number, number, number] = [snappedX, finalY, snappedZ]

        setCurrentBrickPosition(newPosition)
        setIsValid(isValidPlacement(newPosition, pendingExtents))
      }
    }

    if (interactionMode === "erase" && !isDeleting && !touchedBrickIndex && !isMobile) {
      setHoveredBrickIndex(null)
      const brickIndex = findBrickAtPointer()
      if (brickIndex !== null) {
        setHoveredBrickIndex(brickIndex)
      }
    }
  })

  const handleClick = (event: THREE.MouseEvent) => {
    event.stopPropagation()
    if (isPlaying) return

    if (interactionMode === "build" && isPlacing && isValid && showNewBrick) {
      onAddBrick({
        color: selectedColor,
        position: currentBrickPosition,
        width,
        height: depth,
        shape,
        rotation,
      })
      setManualOffset([0, 0, 0])
      setYOverride(null)
    }
  }

  const handleTouchStart = (event: THREE.ThreeEvent<PointerEvent>) => {
    if (isPlaying) return

    setTouchStartPosition({ x: event.clientX, y: event.clientY })
    setHasMoved(false)

    if (interactionMode === "erase" && isMobile) {
      raycaster.setFromCamera(mouse, camera)
      const brickIndex = findBrickAtPointer()
      if (brickIndex !== null) {
        setTouchedBrickIndex(brickIndex)
      }
    } else if (interactionMode === "erase" && !isMobile) {
      raycaster.setFromCamera(mouse, camera)
      const brickIndex = findBrickAtPointer()
      if (brickIndex !== null) {
        setTouchedBrickIndex(brickIndex)
      }
    }
  }

  const handleTouchMove = (event: THREE.ThreeEvent<PointerEvent>) => {
    if (isPlaying) return

    if (touchStartPosition) {
      const dx = event.clientX - touchStartPosition.x
      const dy = event.clientY - touchStartPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance > touchMoveThreshold) {
        setHasMoved(true)
      }
    }

    if (interactionMode === "erase" && !isMobile) {
      raycaster.setFromCamera(mouse, camera)
      const brickIndex = findBrickAtPointer()
      if (touchedBrickIndex === null || brickIndex !== touchedBrickIndex) {
        setTouchedBrickIndex(brickIndex)
      }
    }
  }

  const handleTouchEnd = (event: THREE.ThreeEvent<PointerEvent>) => {
    if (isPlaying) return

    if (interactionMode === "build") {
      if (touchStartPosition && !hasMoved && isValid && showNewBrick) {
        onAddBrick({
          color: selectedColor,
          position: currentBrickPosition,
          width,
          height: depth,
          shape,
          rotation,
        })
        setManualOffset([0, 0, 0])
        setYOverride(null)
      }
    } else if (interactionMode === "erase" && touchedBrickIndex !== null) {
      if (!hasMoved && onDeleteBrick) {
        setIsDeleting(true)
        onDeleteBrick(touchedBrickIndex)
      }
    }

    setTouchStartPosition(null)
    setHasMoved(false)
    setTouchedBrickIndex(null)
  }

  const handleBrickClick = (index: number) => {
    if (isPlaying || isDeleting) return

    if (interactionMode === "erase" && onDeleteBrick) {
      setIsDeleting(true)
      setHoveredBrickIndex(null)
      onDeleteBrick(index)
    }
  }

  useEffect(() => {
    if (planeRef.current) {
      if (isPlaying) {
        const originalRaycast = planeRef.current.raycast
        ;(planeRef.current as any)._originalRaycast = originalRaycast
        planeRef.current.raycast = () => {}
      } else if ((planeRef.current as any)._originalRaycast && interactionMode === "build") {
        planeRef.current.raycast = (planeRef.current as any)._originalRaycast
        ;(planeRef.current as any)._originalRaycast = null
      }
    }
  }, [isPlaying, interactionMode])

  // Arrow keys nudge the pending brick relative to the camera's facing.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPlaying) return
      if (interactionMode !== "build") return

      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return

      if (event.key === "h" || event.key === "H") {
        setShowNewBrick((prev) => !prev)
        return
      }

      // Compute camera-relative axes (snap to one of the 4 cardinal directions).
      const camDir = new THREE.Vector3()
      camera.getWorldDirection(camDir)
      camDir.y = 0
      camDir.normalize()
      const right = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0, 1, 0)).normalize()

      const snapVec = (v: THREE.Vector3) => {
        if (Math.abs(v.x) > Math.abs(v.z)) return new THREE.Vector3(Math.sign(v.x), 0, 0)
        return new THREE.Vector3(0, 0, Math.sign(v.z))
      }
      const fwd = snapVec(camDir)
      const rt = snapVec(right)

      let dx = 0
      let dz = 0
      let dy = 0
      let consumed = false

      if (event.key === "ArrowUp") {
        dx -= fwd.x
        dz -= fwd.z
        consumed = true
      } else if (event.key === "ArrowDown") {
        dx += fwd.x
        dz += fwd.z
        consumed = true
      } else if (event.key === "ArrowLeft") {
        dx -= rt.x
        dz -= rt.z
        consumed = true
      } else if (event.key === "ArrowRight") {
        dx += rt.x
        dz += rt.z
        consumed = true
      } else if (event.key === "PageUp" || event.key === "q" || event.key === "Q") {
        dy = 1
        consumed = true
      } else if (event.key === "PageDown" || event.key === "z" || event.key === "Z") {
        // Z key conflict with undo (Cmd/Ctrl+Z); only nudge when no modifier
        if (event.metaKey || event.ctrlKey) return
        dy = -1
        consumed = true
      }

      if (consumed) {
        event.preventDefault()
        setManualOffset((prev) => [prev[0] + dx, prev[1] + dy, prev[2] + dz])
        // Lock Y once user has nudged vertically: capture current stacked Y baseline.
        if (dy !== 0 && yOverride === null) {
          setYOverride(currentBrickPosition[1] - manualOffset[1] * BRICK_HEIGHT)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isPlaying, interactionMode, camera, currentBrickPosition, manualOffset, yOverride])

  return {
    currentBrickPosition,
    isValid,
    showNewBrick,
    hoveredBrickIndex: isMobile ? null : hoveredBrickIndex,
    touchedBrickIndex,
    handleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleBrickClick,
    planeRef,
    interactionPlaneSize: INTERACTION_PLANE_SIZE,
  }
}
