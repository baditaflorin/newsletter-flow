import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { makeId } from '../lib/ids'

interface ToastMessage {
  id: string
  text: string
}

interface ToastContextValue {
  notify: (text: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const dismiss = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id))
  }, [])

  const notify = useCallback(
    (text: string) => {
      const id = makeId('toast')
      setMessages((current) => [...current.slice(-2), { id, text }])
      window.setTimeout(() => dismiss(id), 3200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-2">
        {messages.map((message) => (
          <div
            className="flex items-start gap-3 border border-emerald-200 bg-white p-3 text-sm text-stone-900 shadow-lg"
            key={message.id}
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <p className="min-w-0 flex-1">{message.text}</p>
            <button
              aria-label="Dismiss notification"
              className="grid h-7 w-7 place-items-center border border-stone-200 text-stone-600 hover:bg-stone-50"
              type="button"
              onClick={() => dismiss(message.id)}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
