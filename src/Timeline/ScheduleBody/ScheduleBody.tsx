import { memo, useLayoutEffect, useRef } from 'react'
import { usePointerPan } from '../../utils/usePointerPan'
import { useWheelZoomPan } from '../../utils/useWheelZoomPan'
import { machineIdsSelector, timeToWidthMultiplierSelector, useAppStore } from '../../store'
import { useDragAndDropStore, setScheduleBodyClientLeftPx } from '../../dragAndDrop'
import { MachineLane } from './MachineLane'
import scheduleBodyClasses from './ScheduleBody.module.css'
import classes from '../Timeline.module.css'

type ScheduleBodySliderProps = {
  timeToWidthMultiplier: number
  children: React.ReactNode
}

const ScheduleBodySlider = ({ children, timeToWidthMultiplier }: ScheduleBodySliderProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const viewStartTimeMs = useAppStore(state => state.viewStartTimeMs)
  const maxTimeMs = useAppStore(state => state.maxTimeMs)

  const onPointerDown = usePointerPan(ref)
  useWheelZoomPan(ref)

  const width = maxTimeMs * timeToWidthMultiplier

  return (
    <div
      ref={ref}
      className={scheduleBodyClasses.scheduleBodySlider}
      style={{ '--translate-x': `${viewStartTimeMs * timeToWidthMultiplier * -1}px`, width } as React.CSSProperties}
      onPointerDown={onPointerDown}
    >
      {children}
    </div>
  )
}

const ScheduleBody = memo(() => {
  const ref = useRef<HTMLDivElement>(null)
  const timeToWidthMultiplier = useAppStore(timeToWidthMultiplierSelector)

  const machineIds = useAppStore((state) => {
    const hasLoadedReplicationState = state.hasLoadedReplicationState
    const machineIds = hasLoadedReplicationState && state.replicationState !== undefined
      ? machineIdsSelector(state.replicationState.crdt.machines)
      : undefined

    return machineIds
  })

  const isDraggingTaskOrProcedure = useDragAndDropStore((state) => {
    return state.taskDragItem !== undefined || state.procedureDragItem !== undefined
  })

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || !isDraggingTaskOrProcedure) {
      return
    }
    const elementRect = element.getBoundingClientRect()
    const left = elementRect.left
    setScheduleBodyClientLeftPx(left)
  }, [isDraggingTaskOrProcedure])

  if (timeToWidthMultiplier === null) {
    return null
  }
  return (
    <div ref={ref} className={classes.scheduleBody}>
      <ScheduleBodySlider timeToWidthMultiplier={timeToWidthMultiplier}>
        <ol className={'list--unstyled' + ' ' + classes.groups}>
          {machineIds?.map(id => {
            return (
              <li key={id} className={classes.group}>
                <MachineLane id={id} />
              </li>
            )
          })}
        </ol>
      </ScheduleBodySlider>
    </div>
  )
})

ScheduleBody.displayName = 'ScheduleBody'
export { ScheduleBody }
