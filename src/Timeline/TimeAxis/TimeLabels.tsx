import { useMemo, type ReactNode } from 'react'
import { jobCompletionResultSelector, jobIdsSelector, prodcedureIdsSelector, timeToWidthMultiplierSelector, useAppStore } from '../../store'
import { msToFormattedHourMinute } from '../../utils/time'
import { calculateTopPositionMap, timeLabelPriority, type TimeLabelPriority } from './timeLabelStacking'
import { TimeLabel } from './TimeLabel'
import classes from './TimeAxis.module.css'
import type { ElementId, JobValue, ValueElement } from '@michaelyinopen/scheduler-common'
import { memoizeOne } from '../../utils/memoizeOne'
import type { TaskPositions } from '../../utils/taskStacking'

const yourTimeSelector = memoizeOne(function (taskPositions: TaskPositions) {
  let maxTimeMs = 0

  for (const jobId in taskPositions) {
    const jobTaskPositions = taskPositions[jobId as ElementId]

    for (const procedureId in jobTaskPositions) {
      const taskPositionData = jobTaskPositions[procedureId as ElementId]
      if (taskPositionData.endTimeMs > maxTimeMs) {
        maxTimeMs = taskPositionData.endTimeMs
      }
    }
  }

  return maxTimeMs
})

type CustomLabel = {
  id: string
  priority: TimeLabelPriority
  heightRem: number
  widthRem: number
  timeMs: number
  content: ReactNode
}

export const TimeLabels = () => {
  const timeToWidthMultiplier = useAppStore(timeToWidthMultiplierSelector)
  const timeAxisWidthPx = useAppStore((state) => state.timeAxisWidthPx)
  const viewStartTimeMs = useAppStore((state) => state.viewStartTimeMs)
  const viewEndTimeMs = useAppStore((state) => state.viewEndTimeMs)

  const bestTotalTimeMs = useAppStore(state => state.replicationState?.crdt.bestTotalTimeMs)

  const yourTimeMs: number | undefined = useAppStore(state => {
    const jobIds = jobIdsSelector(state.replicationState?.crdt.jobs)

    const jobSetCompleted = jobIds.every(jId => {
      const job = state.replicationState?.crdt.jobs?.elements[jId] as ValueElement<JobValue> | undefined
      const procedureIds = prodcedureIdsSelector(jId, job?.value.procedures)

      const jobCompletionResult = jobCompletionResultSelector(jId, procedureIds, state.taskPositions)

      return jobCompletionResult.completedCount === procedureIds.length
    })

    if (jobIds.length === 0 || !jobSetCompleted) {
      return undefined
    }

    return yourTimeSelector(state.taskPositions)
  })

  const timeLabels = useMemo(() => {
    if (timeAxisWidthPx === null || timeToWidthMultiplier === null) {
      return null
    }

    const customLabels: CustomLabel[] = []// mutates

    if (bestTotalTimeMs !== undefined && yourTimeMs !== undefined && bestTotalTimeMs === yourTimeMs) {
      customLabels.push({
        id: 'created-optimal',
        priority: timeLabelPriority.customLabel,
        heightRem: 4,
        widthRem: 15,
        timeMs: bestTotalTimeMs,
        content: <div className={classes.optimalTimeLabelContent}>🏆 You created an optimal schedule {msToFormattedHourMinute(bestTotalTimeMs)}</div>
      })
    }

    if (bestTotalTimeMs !== undefined && bestTotalTimeMs !== yourTimeMs) {
      customLabels.push({
        id: 'best-total',
        priority: timeLabelPriority.customLabel,
        heightRem: 2.5,
        widthRem: 10,
        timeMs: bestTotalTimeMs,
        content: <div className={classes.optimalTimeLabelContent}>⭐ Optimal {msToFormattedHourMinute(bestTotalTimeMs)}</div>
      })
    }

    if (yourTimeMs !== undefined && bestTotalTimeMs !== yourTimeMs) {
      customLabels.push({
        id: 'your-time',
        priority: timeLabelPriority.customLabel,
        heightRem: 2.5,
        widthRem: 10,
        timeMs: yourTimeMs,
        content: <div className={classes.optimalTimeLabelContent}>👍 Your time {msToFormattedHourMinute(yourTimeMs)}</div>
      })
    }

    const filteredCustomLabels = customLabels
      .filter(label => label.timeMs >= viewStartTimeMs && label.timeMs <= viewEndTimeMs)
      .map(label => {
        return {
          ...label,
          startPx: (label.timeMs - viewStartTimeMs) * timeToWidthMultiplier,
        }
      })

    return [
      {
        id: 'start-time-label',
        priority: timeLabelPriority.edgeLabel,
        startPx: 0,
        widthRem: 3,
        heightRem: 1.25,
        content: msToFormattedHourMinute(viewStartTimeMs)
      },
      {
        id: 'end-time-label',
        priority: timeLabelPriority.edgeLabel,
        startPx: timeAxisWidthPx,
        widthRem: 3,
        heightRem: 1.25,
        content: msToFormattedHourMinute(viewEndTimeMs)
      },
      ...filteredCustomLabels
    ]
  }, [
    viewStartTimeMs,
    viewEndTimeMs,
    timeAxisWidthPx,
    timeToWidthMultiplier,
    bestTotalTimeMs,
    yourTimeMs
  ])

  const { topPositionMap, totalHeightPx } = useMemo(() => {
    if (timeLabels === null || timeAxisWidthPx === null) {
      return { topPositionMap: {}, totalHeightPx: 0 }
    }
    const remToPxMultiplier = useAppStore.getState().getRemToPxMultiplier()
    return calculateTopPositionMap(remToPxMultiplier, timeAxisWidthPx, timeLabels)
  }, [timeLabels, timeAxisWidthPx])

  return (
    <div
      className={classes.timeLabels}
      style={{ '--height-after-scale': `${totalHeightPx}px`, '--time-axis-width': `${timeAxisWidthPx}px` } as React.CSSProperties}
    >
      {
        timeLabels?.map(timeLabel => {
          return (
            <TimeLabel
              key={timeLabel.id}
              translateXPx={timeLabel.startPx}
              timeAxisWidthPx={timeAxisWidthPx ?? 0}
              topPx={topPositionMap[timeLabel.id]}
              widthRem={timeLabel.widthRem}
              heightRem={timeLabel.heightRem}
              content={timeLabel.content}
            />
          )
        })}
    </div >
  )
}
