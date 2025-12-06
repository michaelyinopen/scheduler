import { type ReactNode } from 'react'
import { useAppStore } from './store'
import { useShallow } from 'zustand/shallow'
import { ErrorBoundary } from './components/ErrorBoundary'

export type WithErrorBoundaryProps = {
  children: ReactNode
}

export function WithErrorBoundary({ children }: WithErrorBoundaryProps) {
  const [replicationStateId, isViewingSolution] = useAppStore(useShallow(state => {
    return [state.replicationStateId, state.isViewingSolution]
  }))

  const key = (replicationStateId ?? 'empty') + (isViewingSolution ? '-solution' : '')

  return (
    <ErrorBoundary key={key} fallback='Something went wrong'>
      {children}
    </ErrorBoundary>
  )
}
