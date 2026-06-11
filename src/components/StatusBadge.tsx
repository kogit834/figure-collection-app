interface StatusBadgeProps {
  label: string
  color: 'blue' | 'amber' | 'green' | 'gray' | 'pink'
}

const COLOR_CLASSES: Record<StatusBadgeProps['color'], string> = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  green:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  gray: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300',
}

export function StatusBadge({ label, color }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${COLOR_CLASSES[color]}`}
    >
      {label}
    </span>
  )
}
