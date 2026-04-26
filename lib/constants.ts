export const GRID_SIZE = 20
export const INTERACTION_PLANE_SIZE = 10000
export const BRICK_HEIGHT = 1.2
export const LAYER_GAP = 0.005
export const GROUND_HEIGHT = BRICK_HEIGHT / 4
export const STUD_HEIGHT = 0.2
export const STUD_RADIUS = 0.3
export const STUD_SEGMENTS = 16
export const MIN_FLOOR_OFFSET = 0
export const MAX_FLOOR_OFFSET = 20

// Solid plastic look — no external texture dependencies.
export const BRICK_MATERIAL = {
  roughness: 0.55,
  metalness: 0.05,
}

export const GROUND_MATERIAL = {
  color: "#f5f5f7",
  roughness: 0.85,
  metalness: 0.0,
}
