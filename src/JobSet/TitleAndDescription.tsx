import { memo } from 'react'
import { useShallow } from 'zustand/shallow'
import { useAppStore } from '../store'
import classes from './JobSet.module.css'
import { Spinner } from '../components/Spinner'
import { exampleDescriptions, exampleTitles } from '../constants'

const TitleAndDescription = memo(() => {
  const [hasLoadedReplicationState, replicationStateId, title, description] = useAppStore(useShallow((state) => {
    const hasLoadedReplicationState = state.hasLoadedReplicationState
    const replicationStateId = state.replicationStateId
    const title = state.replicationState?.crdt.title?.value
    const description = replicationStateId !== undefined && exampleDescriptions[replicationStateId] !== undefined
      ? exampleDescriptions[replicationStateId]
      : state.replicationState?.crdt.description?.value

    return [hasLoadedReplicationState, replicationStateId, title, description]
  }))

  if (!hasLoadedReplicationState) {
    const fallbackTitle = replicationStateId !== undefined && exampleTitles[replicationStateId] !== undefined
      ? exampleTitles[replicationStateId]
      : title

    return (
      <div>
        <h1 className={classes.title}>{fallbackTitle}</h1>
        <div className={classes.descriptionLoader}>
          <Spinner width='2rem' height='2rem' />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className={classes.title}>{title}</h1>
      <p className={classes.description}>
        {description}
      </p>
    </div>
  )
})

TitleAndDescription.displayName = 'TitleAndDescription'
export { TitleAndDescription }
