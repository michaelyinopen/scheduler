import { useCallback } from 'react'
import { useShallow } from 'zustand/shallow'
import { Button } from '@base-ui/react'
import { type ElementId, type JobValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { insertProcedureAtTheEnd, prodcedureIdsSelector, useAppStore } from '../../store'
import { PlusIcon } from '../../components/PlusIcon'
import { JobProcedure } from './JobProcedure'
import baseClasses from '../../components/base.module.css'
import classes from '../JobSet.module.css'

export type JobProceduresProps = {
  jobId: ElementId
}

export const JobProcedures = ({ jobId }: JobProceduresProps) => {
  const [procedureIds, isExpandMode] = useAppStore(useShallow(state => {
    const job = state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined
    const procedureIds = prodcedureIdsSelector(jobId, job?.value.procedures)

    const isExpandMode = state.isExpandMode

    return [procedureIds, isExpandMode]
  }))

  const insertProcedure = useCallback(() => {
    insertProcedureAtTheEnd(jobId)
  }, [jobId])

  return (
    <ol className={'list--unstyled' + ' ' + classes.procedures}>
      {procedureIds?.map((id) => {
        return (
          <li key={id}>
            <JobProcedure jobId={jobId} procedureId={id} />
          </li>
        )
      })}
      {isExpandMode && (
        <li key='insert-procedure' className={classes.insertProcedureItem}>
          <Button
            onClick={insertProcedure}
            className={baseClasses.iconButton + ' ' + baseClasses.iconButtonSmall + ' ' + 'pointer'}
            aria-label='Insert procedure'
            title='Insert procedure'
          >
            <PlusIcon />
          </Button>
        </li>
      )}
    </ol>
  )
}
