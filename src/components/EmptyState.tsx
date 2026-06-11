interface EmptyStateProps {
  message: string
  hint?: string
}

export function EmptyState({ message, hint }: EmptyStateProps) {
  return (
    <div className="py-16 text-center text-slate-500 dark:text-slate-400">
      <p className="font-medium">{message}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
    </div>
  )
}
