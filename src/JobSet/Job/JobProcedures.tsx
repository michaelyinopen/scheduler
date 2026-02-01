import { useCallback, useMemo, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { Button } from '@base-ui/react'
import { useResizeDetector } from 'react-resize-detector'
import { horizontalListSortingStrategy, rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { type ElementId, type JobValue, type ProcedureValue, type ValueElement } from '@michaelyinopen/scheduler-common'
import { throttleDelayMs } from '../../constants'
import { insertProcedureAtTheEnd, prodcedureIdsSelector, timeToWidthMultiplierSelector, useAppStore } from '../../store'
import { PlusIcon } from '../../components/PlusIcon'
import { JobProcedure } from './JobProcedure'
import baseClasses from '../../components/base.module.css'
import classes from '../JobSet.module.css'

// for floating point number comparisons, deceided to use reference of 0.01px
const tolerance = 0.01

export type JobProceduresProps = {
  jobId: ElementId
}

export const JobProcedures = ({ jobId }: JobProceduresProps) => {
  const [procedureIds, isExpandMode, totalProcessingTimeMs, timeToWidthMultiplier] = useAppStore(useShallow(state => {
    const job = (state.replicationState?.crdt.jobs?.elements[jobId] as ValueElement<JobValue> | undefined)?.value
    const procedureIds = prodcedureIdsSelector(jobId, job?.procedures)

    const isExpandMode = state.isExpandMode

    const totalProcessingTimeMs = procedureIds.reduce(
      (sum, procedureId) => {
        const procedure = (job?.procedures?.elements[procedureId] as ValueElement<ProcedureValue> | undefined)?.value
        const processignTimsMs = procedure?.processingTimeMs?.value ?? 0

        return sum + processignTimsMs
      },
      0
    )

    const timeToWidthMultiplier = timeToWidthMultiplierSelector(state) ?? 0

    return [procedureIds, isExpandMode, totalProcessingTimeMs, timeToWidthMultiplier]
  }))

  const sortableItems = useMemo(
    () => procedureIds?.map(procedureId => `procedure-${procedureId}`) ?? [],
    [procedureIds]
  )

  const insertProcedure = useCallback(() => {
    insertProcedureAtTheEnd(jobId)
  }, [jobId])

  const [containerWidthPx, setContainerwidthPx] = useState(0)

  const { ref } = useResizeDetector({
    handleHeight: false,
    refreshMode: 'throttle',
    refreshRate: throttleDelayMs,
    disableRerender: true,
    onResize: ({ width }: { width: number | null }) => {
      if (width && (containerWidthPx > width + tolerance || containerWidthPx < width - tolerance)) {
        setContainerwidthPx(width)
      }
    },
  })

  const sortStartegy = useMemo(() => {
    const isWrapping = totalProcessingTimeMs * timeToWidthMultiplier > containerWidthPx + tolerance

    return isWrapping ? rectSortingStrategy : horizontalListSortingStrategy
  }, [containerWidthPx, totalProcessingTimeMs, timeToWidthMultiplier])

  return (
    <SortableContext items={sortableItems} disabled={{ droppable: !isExpandMode }} strategy={sortStartegy}>
      <ol ref={ref} className={'list--unstyled' + ' ' + classes.procedures}>
        {procedureIds === undefined || procedureIds.length === 0 && (
          <li key='empty-procedure' className={classes.emptyProcedureItem}>
            No procedures
          </li>
        )}
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
    </SortableContext>
  )
}
