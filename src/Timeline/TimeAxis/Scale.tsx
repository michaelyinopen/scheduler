import { Fragment, useRef } from 'react'
import { memoizeOne } from '../../utils/memoizeOne'
import { usePointerPan } from '../../utils/usePointerPan'
import { useWheelZoomPan } from '../../utils/useWheelZoomPan'
import { timeToWidthMultiplierSelector, useAppStore } from '../../store'
import { getTickMarkTimes, getViewTickMarkLevels, tickMarkType } from './tickMark'
import classes from './TimeAxis.module.css'

export const majorTickMarkHeight = '1rem'
export const minorTickMarkHeight = '0.5rem'

const getViewTickMarkLevelsMemo = memoizeOne(getViewTickMarkLevels)
const getTickMarkTimesMemo = memoizeOne(getTickMarkTimes)

type ScaleSliderProps = {
  timeToWidthMultiplier: number
  children: React.ReactNode
}

const ScaleSlider = ({ children, timeToWidthMultiplier }: ScaleSliderProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const viewStartTimeMs = useAppStore(state => state.viewStartTimeMs)

  const onPointerDown = usePointerPan(ref)
  useWheelZoomPan(ref)

  return (
    <div
      ref={ref}
      className={classes.scaleSlider}
      style={{ '--translate-x': `${viewStartTimeMs * timeToWidthMultiplier * -1}px` } as React.CSSProperties}
      onPointerDown={onPointerDown}
    >
      {children}
    </div>
  )
}

export const Scale = () => {
  const timeToWidthMultiplier = useAppStore(timeToWidthMultiplierSelector)
  const maxTimeMs = useAppStore(state => state.maxTimeMs)
  const width = timeToWidthMultiplier === null
    ? undefined
    : maxTimeMs * timeToWidthMultiplier

  const tickMarkTimes = useAppStore(state => {
    if (state.timeAxisWidthPx === null) {
      return undefined
    }
    const viewDurationMs = state.viewEndTimeMs - state.viewStartTimeMs
    const { majorTickMarkLevel, minorTickMarkLevel } = getViewTickMarkLevelsMemo(viewDurationMs, state.timeAxisWidthPx, state.getRemToPxMultiplier())
    return getTickMarkTimesMemo(state.maxTimeMs, majorTickMarkLevel, minorTickMarkLevel)
  })

  if (timeToWidthMultiplier === null) {
    return null
  }

  return (
    <div className={classes.scale}>
      <ScaleSlider timeToWidthMultiplier={timeToWidthMultiplier}>
        <svg className={classes.scaleSvg} style={{ width }}>
          <line x1="0%" x2="100%" y1="0.5" y2="0.5" strokeWidth={1} shapeRendering="crispEdges" />
          {tickMarkTimes?.map(tickMarkTime => {
            const xPositionPx = tickMarkTime.timeMs * timeToWidthMultiplier
            return (
              <Fragment key={tickMarkTime.key}>
                <line
                  x1={xPositionPx}
                  x2={xPositionPx}
                  y1={0}
                  y2={tickMarkTime.type === tickMarkType.major ? majorTickMarkHeight : minorTickMarkHeight}
                  className={classes.tickMark}
                />
                {tickMarkTime.type === tickMarkType.major &&
                  <text
                    dominantBaseline="hanging"
                    x={xPositionPx}
                    dx="2px"
                    dy="2px"
                    stroke="none"
                  >
                    {tickMarkTime.text}
                  </text>
                }
              </Fragment>
            )
          })
          }
        </svg>
      </ScaleSlider>
    </div >
  )
}
