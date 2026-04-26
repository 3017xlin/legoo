"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { Pause, HelpCircle } from "lucide-react"
import { TutorialOverlay } from "./tutorial-overlay"
import { AudioPlayer } from "../audio-player"
import { Scene } from "../scene"
import { ColorSelector } from "../color-selector"
import { ActionToolbar } from "../action-toolbar"
import { SaveModal } from "../save-modal"
import { LoadModal } from "../load-modal"
import { ClearConfirmationModal } from "./clear-confirmation-modal"
import { TabBar, type BuildTab } from "../tab-bar"
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts"
import { useColorTheme } from "./use-color-theme"
import { useTouchHandling } from "./use-touch-handling"
import { useLocalStorage } from "./use-local-storage"
import {
  clearLocalStorage,
  saveTabsToLocalStorage,
  loadTabsFromLocalStorage,
  clearTabsLocalStorage,
} from "@/lib/utils/local-storage"
import type { SavedCreation } from "@/lib/types"
import {
  type Brick,
  type BrickShape,
  handleAddBrick,
  handleAddBricks,
  handleDeleteBrick,
  handleUpdateBrick,
  handleUndo,
  handleRedo,
  handleClearSet,
  handlePlayToggle,
} from "./events"
import { IntegrationCheckDialog } from "../integration-check-dialog"
import { isKvConfigured } from "@/lib/utils/check-kv-integration"

type PartTab = {
  id: string
  name: string
  bricks: Brick[]
  floorOffset: number
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export default function V0Blocks() {
  const { currentTheme, currentColors, selectedColor, setSelectedColor, handleSelectColor, handleThemeChange } =
    useColorTheme()

  // Multi-tab state — each tab is a self-contained part with its own bricks + floor offset.
  const [tabs, setTabs] = useState<PartTab[]>([
    { id: "default", name: "Part 1", bricks: [], floorOffset: 0 },
  ])
  const [activeTabId, setActiveTabId] = useState("default")
  const tabsHydrated = useRef(false)

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]
  const bricks = activeTab.bricks
  const floorOffset = activeTab.floorOffset

  const setBricksForActiveTab = useCallback(
    (updater: Brick[] | ((prev: Brick[]) => Brick[])) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, bricks: typeof updater === "function" ? (updater as any)(t.bricks) : updater }
            : t,
        ),
      )
    },
    [activeTabId],
  )

  const setFloorOffsetForActiveTab = useCallback(
    (updater: number | ((prev: number) => number)) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId
            ? { ...t, floorOffset: typeof updater === "function" ? (updater as any)(t.floorOffset) : updater }
            : t,
        ),
      )
    },
    [activeTabId],
  )

  // Per-tab history for undo/redo
  const [historyByTab, setHistoryByTab] = useState<Record<string, Brick[][]>>({ default: [[]] })
  const [historyIndexByTab, setHistoryIndexByTab] = useState<Record<string, number>>({ default: 0 })

  const history = historyByTab[activeTabId] ?? [[]]
  const historyIndex = historyIndexByTab[activeTabId] ?? 0

  const setHistory = useCallback(
    (updater: Brick[][] | ((prev: Brick[][]) => Brick[][])) => {
      setHistoryByTab((prev) => ({
        ...prev,
        [activeTabId]: typeof updater === "function" ? (updater as any)(prev[activeTabId] ?? [[]]) : updater,
      }))
    },
    [activeTabId],
  )

  const setHistoryIndex = useCallback(
    (updater: number | ((prev: number) => number)) => {
      setHistoryIndexByTab((prev) => ({
        ...prev,
        [activeTabId]: typeof updater === "function" ? (updater as any)(prev[activeTabId] ?? 0) : updater,
      }))
    },
    [activeTabId],
  )

  const [width, setWidth] = useState(2)
  const [depth, setDepth] = useState(2)
  const [shape, setShape] = useState<BrickShape>("rect")
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [interactionMode, setInteractionMode] = useState<"build" | "move" | "erase">("build")
  const orbitControlsRef = useRef()

  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [currentCreationId, setCurrentCreationId] = useState<string | undefined>()
  const [currentCreationName, setCurrentCreationName] = useState<string | undefined>()

  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false)
  const [integrationDialogType, setIntegrationDialogType] = useState<"save" | "load">("save")
  const [isKvAvailable, setIsKvAvailable] = useState(true)

  const [showTutorial, setShowTutorial] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const seen = window.localStorage.getItem("legoo-tutorial-seen")
    if (!seen) setShowTutorial(true)
  }, [])
  const handleCloseTutorial = useCallback(() => {
    setShowTutorial(false)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("legoo-tutorial-seen", "1")
    }
  }, [])

  useEffect(() => {
    const checkKvAvailability = async () => {
      try {
        const available = await isKvConfigured()
        setIsKvAvailable(available)
      } catch (error) {
        console.error("Error checking KV availability:", error)
        setIsKvAvailable(false)
      }
    }
    checkKvAvailability()
  }, [])

  useTouchHandling()

  // Hydrate tabs from localStorage on mount
  useEffect(() => {
    if (tabsHydrated.current) return
    tabsHydrated.current = true
    const saved = loadTabsFromLocalStorage()
    if (saved && saved.tabs.length > 0) {
      setTabs(saved.tabs.map((t) => ({ ...t, floorOffset: t.floorOffset ?? 0 })))
      setActiveTabId(saved.activeTabId || saved.tabs[0].id)
      const newHistory: Record<string, Brick[][]> = {}
      const newIndex: Record<string, number> = {}
      saved.tabs.forEach((t) => {
        newHistory[t.id] = [[...t.bricks]]
        newIndex[t.id] = 0
      })
      setHistoryByTab(newHistory)
      setHistoryIndexByTab(newIndex)
    }
  }, [])

  // Persist tabs whenever they change
  useEffect(() => {
    if (!tabsHydrated.current) return
    saveTabsToLocalStorage({
      tabs: tabs.map((t) => ({ id: t.id, name: t.name, bricks: t.bricks, floorOffset: t.floorOffset })),
      activeTabId,
    })
  }, [tabs, activeTabId])

  // Legacy localStorage hook (single-part) — only relevant for the default tab when no tabs were stored.
  useLocalStorage({
    bricks,
    width,
    depth,
    selectedColor,
    currentTheme,
    currentCreationId,
    currentCreationName,
    setBricks: (b: Brick[]) => setBricksForActiveTab(b),
    setWidth,
    setDepth,
    setSelectedColor,
    handleThemeChange,
    setCurrentCreationId,
    setCurrentCreationName,
    setHistory: (h: Brick[][]) => setHistory(h),
    setHistoryIndex: (i: number) => setHistoryIndex(i),
  })

  const onAddBrick = useCallback(
    (brick: Brick) => {
      handleAddBrick(brick, bricks, setBricksForActiveTab as any, history, historyIndex, setHistory as any, setHistoryIndex as any)
    },
    [bricks, history, historyIndex, setBricksForActiveTab, setHistory, setHistoryIndex],
  )

  const onDeleteBrick = useCallback(
    (index: number) => {
      handleDeleteBrick(index, bricks, setBricksForActiveTab as any, history, historyIndex, setHistory as any, setHistoryIndex as any)
    },
    [bricks, history, historyIndex, setBricksForActiveTab, setHistory, setHistoryIndex],
  )

  const onUpdateBrick = useCallback(
    (index: number, newPosition: [number, number, number]) => {
      handleUpdateBrick(
        index,
        newPosition,
        bricks,
        setBricksForActiveTab as any,
        history,
        historyIndex,
        setHistory as any,
        setHistoryIndex as any,
      )
    },
    [bricks, history, historyIndex, setBricksForActiveTab, setHistory, setHistoryIndex],
  )

  const onUndo = useCallback(() => {
    handleUndo(historyIndex, setHistoryIndex as any, history, setBricksForActiveTab as any)
  }, [history, historyIndex, setBricksForActiveTab, setHistoryIndex])

  const onRedo = useCallback(() => {
    handleRedo(historyIndex, setHistoryIndex as any, history, setBricksForActiveTab as any)
  }, [history, historyIndex, setBricksForActiveTab, setHistoryIndex])

  const onClearSet = useCallback(() => {
    handleClearSet(setBricksForActiveTab as any, setHistory as any, setHistoryIndex as any)
    setCurrentCreationId(undefined)
    setCurrentCreationName(undefined)
    clearLocalStorage()
    setShowClearModal(false)
  }, [setBricksForActiveTab, setHistory, setHistoryIndex])

  const handleClearWithConfirmation = useCallback(() => {
    if (bricks.length > 0) {
      setShowClearModal(true)
    }
  }, [bricks.length])

  const onPlayToggle = useCallback(() => {
    handlePlayToggle(isPlaying, setIsPlaying)
  }, [isPlaying])

  const handleModeChange = useCallback((mode: "build" | "move" | "erase") => {
    setInteractionMode(mode)
  }, [])

  const handleSave = useCallback(() => {
    if (!isKvAvailable) {
      setIntegrationDialogType("save")
      setShowIntegrationDialog(true)
    } else {
      setShowSaveModal(true)
    }
  }, [isKvAvailable])

  const handleLoad = useCallback(() => {
    if (!isKvAvailable) {
      setIntegrationDialogType("load")
      setShowIntegrationDialog(true)
    } else {
      setShowLoadModal(true)
    }
  }, [isKvAvailable])

  const handleLoadCreation = useCallback(
    (creation: SavedCreation) => {
      setBricksForActiveTab(creation.bricks)
      setHistory([[...creation.bricks]] as any)
      setHistoryIndex(0)
      setCurrentCreationId(creation.id)
      setCurrentCreationName(creation.name)
      setShowLoadModal(false)
    },
    [setBricksForActiveTab, setHistory, setHistoryIndex],
  )

  // Rotate the pending brick by 90° around an axis.
  const handleRotate = useCallback((axis: "x" | "y" | "z") => {
    setRotation((prev) => {
      const next: [number, number, number] = [...prev]
      const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2
      next[idx] = (next[idx] + Math.PI / 2) % (Math.PI * 2)
      return next
    })
  }, [])

  // Multi-tab handlers
  const handleAddTab = useCallback(() => {
    const id = generateId()
    setTabs((prev) => [...prev, { id, name: `Part ${prev.length + 1}`, bricks: [], floorOffset: 0 }])
    setHistoryByTab((prev) => ({ ...prev, [id]: [[]] }))
    setHistoryIndexByTab((prev) => ({ ...prev, [id]: 0 }))
    setActiveTabId(id)
  }, [])

  const handleCloseTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev
        const filtered = prev.filter((t) => t.id !== id)
        if (id === activeTabId) {
          setActiveTabId(filtered[0].id)
        }
        return filtered
      })
      setHistoryByTab((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setHistoryIndexByTab((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    },
    [activeTabId],
  )

  const handleRenameTab = useCallback((id: string, name: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)))
  }, [])

  // Import: append all bricks from another tab into the current tab.
  // Bricks are offset upward so they land above the current build to avoid overlap.
  const handleImportFromTab = useCallback(
    (sourceId: string) => {
      const source = tabs.find((t) => t.id === sourceId)
      if (!source || source.bricks.length === 0) return

      const currentMaxY =
        bricks.length === 0
          ? -1
          : Math.max(...bricks.map((b) => b.position[1]))
      const sourceMinY = Math.min(...source.bricks.map((b) => b.position[1]))
      const dy = currentMaxY + 2 - sourceMinY

      const imported: Brick[] = source.bricks.map((b) => ({
        ...b,
        position: [b.position[0], b.position[1] + dy, b.position[2]],
      }))

      handleAddBricks(
        imported,
        bricks,
        setBricksForActiveTab as any,
        history,
        historyIndex,
        setHistory as any,
        setHistoryIndex as any,
      )
    },
    [tabs, bricks, history, historyIndex, setBricksForActiveTab, setHistory, setHistoryIndex],
  )

  useKeyboardShortcuts({
    isPlaying,
    width,
    depth,
    currentColors,
    setWidth,
    setDepth,
    setSelectedColor,
    setInteractionMode,
    onUndo,
    onRedo,
    onPlayToggle,
    handleClearWithConfirmation,
    handleSave,
    handleLoad,
    currentTheme,
    handleThemeChange,
    onRotate: handleRotate,
    floorOffset,
    setFloorOffset: setFloorOffsetForActiveTab,
  })

  return (
    <div
      className="fixed inset-0 w-full h-full bg-purple-950 font-sans overflow-hidden"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas shadows camera={{ position: [0, 15, 15], fov: 50 }}>
        <Scene
          bricks={bricks}
          selectedColor={selectedColor}
          width={width}
          depth={depth}
          shape={shape}
          rotation={rotation}
          floorOffset={floorOffset}
          onAddBrick={onAddBrick}
          onDeleteBrick={onDeleteBrick}
          onUndo={onUndo}
          onRedo={onRedo}
          isPlaying={isPlaying}
          interactionMode={interactionMode}
        />
        <OrbitControls
          ref={orbitControlsRef}
          target={[0, 0, 0]}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={400}
          autoRotate={isPlaying}
          autoRotateSpeed={1}
          enableZoom={!isPlaying}
          enablePan={!isPlaying && interactionMode === "move"}
          enableRotate={!isPlaying}
          mouseButtons={
            interactionMode === "move"
              ? {
                  LEFT: THREE.MOUSE.ROTATE,
                  MIDDLE: THREE.MOUSE.DOLLY,
                  RIGHT: THREE.MOUSE.PAN,
                }
              : {
                  // In Build / Erase: left-click is for placing/erasing,
                  // so route camera rotate to the right mouse button.
                  LEFT: undefined as unknown as THREE.MOUSE,
                  MIDDLE: THREE.MOUSE.DOLLY,
                  RIGHT: THREE.MOUSE.ROTATE,
                }
          }
          touches={
            interactionMode === "move"
              ? { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
              : { ONE: undefined as unknown as THREE.TOUCH, TWO: THREE.TOUCH.DOLLY_PAN }
          }
        />
      </Canvas>
      {!isPlaying && (
        <>
          <ActionToolbar
            onModeChange={handleModeChange}
            currentMode={interactionMode}
            shape={shape}
            onShapeChange={setShape}
            rotation={rotation}
            onRotate={handleRotate}
          />
          <TabBar
            tabs={tabs.map((t) => ({ id: t.id, name: t.name } as BuildTab))}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onAddTab={handleAddTab}
            onCloseTab={handleCloseTab}
            onRenameTab={handleRenameTab}
            onImportFromTab={handleImportFromTab}
          />
          <ColorSelector
            colors={currentColors}
            selectedColor={selectedColor}
            onSelectColor={handleSelectColor}
            onUndo={onUndo}
            onRedo={onRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
            width={width}
            depth={depth}
            onWidthChange={setWidth}
            onDepthChange={setDepth}
            onClearSet={handleClearWithConfirmation}
            onPlayToggle={onPlayToggle}
            isPlaying={isPlaying}
            onSave={handleSave}
            onLoad={handleLoad}
            currentCreationId={currentCreationId}
            currentCreationName={currentCreationName}
            currentTheme={currentTheme}
            onThemeChange={handleThemeChange}
            bricksCount={bricks.length}
            floorOffset={floorOffset}
            onFloorOffsetChange={setFloorOffsetForActiveTab}
          />
          <AudioPlayer />
        </>
      )}
      {isPlaying && (
        <button
          onClick={onPlayToggle}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white hover:text-gray-300 transition-colors"
          aria-label="Stop"
        >
          <Pause className="w-8 h-8 stroke-[1.5]" />
        </button>
      )}

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        bricks={bricks}
        currentId={currentCreationId}
        currentName={currentCreationName}
      />

      <LoadModal isOpen={showLoadModal} onClose={() => setShowLoadModal(false)} onLoad={handleLoadCreation} />

      <ClearConfirmationModal isOpen={showClearModal} onClose={() => setShowClearModal(false)} onClear={onClearSet} />
      <IntegrationCheckDialog
        isOpen={showIntegrationDialog}
        onClose={() => setShowIntegrationDialog(false)}
        actionType={integrationDialogType}
      />

      {!isPlaying && (
        <button
          onClick={() => setShowTutorial(true)}
          className="fixed top-4 right-4 z-30 w-12 h-12 rounded-full bg-white/90 hover:bg-white text-purple-700 shadow-lg flex items-center justify-center transition-colors"
          aria-label="打开教程"
          title="打开教程"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      )}

      <TutorialOverlay
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
        currentMode={interactionMode}
      />
    </div>
  )
}
