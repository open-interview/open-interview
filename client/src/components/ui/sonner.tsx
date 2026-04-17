import { Toaster as Sonner } from 'sonner'

const isDark = typeof window !== 'undefined'
  ? localStorage.getItem('theme') !== 'light'
  : true

export function Toaster() {
  return (
    <Sonner
      theme={isDark ? 'dark' : 'light'}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast !bg-[var(--surface-2)] !border-[var(--color-border)] !text-[var(--text-primary)]',
          description: '!text-[var(--text-secondary)]',
          actionButton: '!bg-[var(--color-accent-violet)] !text-white',
          cancelButton: '!bg-[var(--surface-3)] !text-[var(--text-secondary)]',
        },
      }}
    />
  )
}
