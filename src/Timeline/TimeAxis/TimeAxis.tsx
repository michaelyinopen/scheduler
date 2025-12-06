import { useCallback } from 'react'
import { useResizeDetector } from 'react-resize-detector'
import { throttleDelayMs } from '../../constants'
import { setTimeAxisWidthPx } from '../../store'
import { Scale } from './Scale'
import { TimeLabels } from './TimeLabels'
import classes from '../Timeline.module.css'

export const TimeAxis = () => {
  const onResizeCallback = useCallback(
    ({ width }: { width: number | null }) => {
      setTimeAxisWidthPx(width)
    },
    []
  )

  const { ref } = useResizeDetector({
    handleHeight: false,
    refreshMode: 'throttle',
    refreshRate: throttleDelayMs,
    disableRerender: true,
    onResize: onResizeCallback,
  });
  return (
    <div ref={ref} className={classes.timeAxis}>
      <Scale />
      <TimeLabels />
    </div>
  )
}
