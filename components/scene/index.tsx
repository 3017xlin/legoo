"use client"

import type React from "react"
import { SoftShadows } from "@react-three/drei"
import type { SceneProps } from "./types"
import { LargePlane } from "../large-plane"
import { Platform } from "../platform"
import { BuildMode } from "./build-mode"
import { EraseMode } from "./erase-mode"
import { LightingSetup } from "./lighting-setup"
import { useSceneInteraction } from "./use-scene-interaction"
import { Block } from "../block"
import { INTERACTION_PLANE_SIZE, GROUND_HEIGHT, BRICK_HEIGHT } from "@/lib/constants"

export const Scene: React.FC<SceneProps> = ({
  bricks,
  selectedColor,
  width,
  depth,
  shape,
  rotation,
  floorOffset,
  onAddBrick,
  onDeleteBrick,
  isPlaying,
  interactionMode = "build",
}) => {
  const {
    currentBrickPosition,
    isValid,
    showNewBrick,
    hoveredBrickIndex,
    handleClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleBrickClick,
    planeRef,
  } = useSceneInteraction({
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
  })

  // Y-position for the interaction plane (matches the floor for the current floorOffset).
  const planeY = -floorOffset * BRICK_HEIGHT
  const highlightFloorY = planeY + GROUND_HEIGHT / 2 + 0.01

  return (
    <>
      <SoftShadows size={25} samples={16} focus={0.5} />
      <LargePlane />
      <Platform floorOffset={floorOffset} />

      {bricks.map((brick, index) => (
        <Block
          key={index}
          color={brick.color}
          position={brick.position}
          width={brick.width}
          height={brick.height}
          shape={brick.shape}
          rotation={brick.rotation}
          isPlacing={hoveredBrickIndex === index && interactionMode === "erase"}
          onClick={() => handleBrickClick(index)}
        />
      ))}

      {interactionMode === "build" && !isPlaying && (
        <BuildMode
          showNewBrick={showNewBrick}
          isValid={isValid}
          currentBrickPosition={currentBrickPosition}
          selectedColor={selectedColor}
          width={width}
          depth={depth}
          shape={shape}
          rotation={rotation}
          floorY={highlightFloorY}
        />
      )}

      {interactionMode === "erase" && !isPlaying && <EraseMode />}

      {/* Large invisible interaction plane — supports infinite board placement. */}
      <mesh
        ref={planeRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, planeY, 0]}
        onClick={handleClick}
        onPointerDown={handleTouchStart}
        onPointerMove={handleTouchMove}
        onPointerUp={handleTouchEnd}
        onPointerLeave={handleTouchEnd}
      >
        <planeGeometry args={[INTERACTION_PLANE_SIZE, INTERACTION_PLANE_SIZE]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <LightingSetup />
      <color attach="background" args={["#cfd8e8"]} />
      <fog attach="fog" args={["#cfd8e8", 60, 300]} />
    </>
  )
}
