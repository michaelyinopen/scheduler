import { useCallback, useEffect } from 'react'
import { useMatch, useParams } from 'react-router'
import { isValidJobSetId, isValidSolutionJobSetId } from './constants'
import { setIsViewingSolution, setOnlineStatus, updateReplicationStateId, setWebSocket, useAppStore } from './store'
import { onConnectionOpen, onMessage, useConnection } from './useConnection'
import { StatusBanner } from './components/StatusBanner'

export type WithConnectionProps = {
  children: React.ReactNode
}

export function WithConnection({ children }: WithConnectionProps) {
  const { jobSetId: jobSetIdParam } = useParams()

  const jobSetId = jobSetIdParam ? parseInt(jobSetIdParam) : undefined

  const soultionPathMatch = useMatch(':jobSetId/solution')

  const isViewingSolution = soultionPathMatch !== null

  useEffect(() => {
    updateReplicationStateId(jobSetId)
    // combine the solution here? e.g. navigate from /1/solution to /2/solution
  }, [jobSetId])

  useEffect(() => {
    setIsViewingSolution(isViewingSolution)
  }, [isViewingSolution])

  const getWebSocket = useCallback(() => useAppStore.getState().webSocket, [])
  const status = useConnection({ getWebSocket, setWebSocket, onConnectionOpen, onMessage })

  useEffect(() => {
    setOnlineStatus(status)
  }, [status])

  const exampleNotFound = !isValidJobSetId(jobSetId)
  const solutionNotFound = isViewingSolution && !isValidSolutionJobSetId(jobSetId)

  return (
    <>
      <StatusBanner status={status} />
      {exampleNotFound ? 'Example not found' : null}
      {!exampleNotFound && solutionNotFound ? 'Solution not found' : null}
      {!exampleNotFound && !solutionNotFound ? children : null}
    </>
  )
}
