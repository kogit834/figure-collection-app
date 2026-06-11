import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

/** スマホ向けのボトムシート型モーダル */
export function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-full p-2 text-slate-500 active:bg-slate-100 dark:active:bg-slate-800"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
