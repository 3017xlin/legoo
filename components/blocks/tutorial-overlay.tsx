"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Hammer, Move, Eraser, RotateCw, MousePointerClick, X } from "lucide-react"

interface TutorialOverlayProps {
  isOpen: boolean
  onClose: () => void
  currentMode: "build" | "move" | "erase"
}

type Step = {
  title: string
  body: React.ReactNode
}

const STEPS: Step[] = [
  {
    title: "欢迎来玩积木！🎉",
    body: (
      <div className="space-y-3 text-base">
        <p>这里是一个 3D 积木乐园。你可以拼一个房子、一辆小车、一只小狗，想拼什么都行。</p>
        <p>下一步，我会教你三个最重要的按钮。点 "下一步" 继续。</p>
      </div>
    ),
  },
  {
    title: "三个模式 — 看屏幕左上角",
    body: (
      <div className="space-y-3 text-base">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <Hammer className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">搭积木</div>
            <div className="text-sm text-gray-600">用左键点屏幕，就放下一块积木</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shrink-0">
            <Move className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">转视角</div>
            <div className="text-sm text-gray-600">用左键拖动屏幕，绕着作品转圈看</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
            <Eraser className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold">橡皮擦</div>
            <div className="text-sm text-gray-600">点哪一块积木，那块就消失</div>
          </div>
        </div>
        <p className="text-sm text-purple-700 bg-purple-50 rounded-md p-2">
          💡 当前模式按钮会变大并发亮，名字也会显示在旁边。
        </p>
      </div>
    ),
  },
  {
    title: "鼠标操作 🖱️",
    body: (
      <div className="space-y-3 text-base">
        <div className="flex items-start gap-3">
          <MousePointerClick className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">左键单击</span>：放下积木 / 擦掉积木
          </div>
        </div>
        <div className="flex items-start gap-3">
          <RotateCw className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">右键拖动</span>：转动视角，看作品的不同角度（任何模式都能用！）
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 leading-none">🖲️</span>
          <div>
            <span className="font-semibold">滚轮</span>：放大 / 缩小
          </div>
        </div>
        <p className="text-sm text-purple-700 bg-purple-50 rounded-md p-2">
          手机/平板：单指点屏幕放积木，双指捏合缩放，切到 "转视角" 模式后单指拖动转视角。
        </p>
      </div>
    ),
  },
  {
    title: "底部工具条 🎨",
    body: (
      <div className="space-y-3 text-base">
        <p>从左到右：</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><b>↩ ↪</b> 撤销 / 重做</li>
          <li><b>八个圆点</b> 选颜色，🌈 是自定义颜色</li>
          <li><b>2 ⇄ 2</b> 调积木的宽和深（1～20）</li>
          <li><b>↑ -0 ↓</b> 调"楼层"，可以让新积木浮空</li>
          <li><b>📂 💾</b> 加载 / 保存作品</li>
          <li><b>▶</b> 自动转圈展示作品</li>
          <li><b>🗑</b> 全部清空</li>
        </ul>
        <p className="text-sm text-purple-700 bg-purple-50 rounded-md p-2">
          上面的标签栏可以建多个 "Part"，每个是一个独立的零件，互不影响。
        </p>
      </div>
    ),
  },
  {
    title: "试一下吧！✨",
    body: (
      <div className="space-y-3 text-base">
        <p>1. 看一下左上角，确认现在是 <b className="text-emerald-700">搭积木</b> 模式（绿色）。</p>
        <p>2. 在屏幕中间点一下，第一块积木就出现了。</p>
        <p>3. 多点几下，把积木堆起来！</p>
        <p>4. 点击右上角 <b>?</b> 按钮可以再看这个教程。</p>
      </div>
    ),
  },
]

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (isOpen) setStep(0)
  }, [isOpen])

  if (!isOpen) return null

  const isLast = step === STEPS.length - 1
  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
          aria-label="关闭教程"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{current.title}</h2>
          <div className="text-gray-700">{current.body}</div>
        </div>

        <div className="px-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? "w-6 bg-purple-600" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                上一步
              </button>
            )}
            {!isLast ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-700 text-white"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                开始搭！
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
