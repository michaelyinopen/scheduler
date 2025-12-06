import type { ReactNode } from 'react'
import classes from './TimeAxis.module.css'

export type TimeLabelProps = {
  translateXPx: number
  timeAxisWidthPx: number
  topPx: number
  widthRem: number
  heightRem: number
  content: ReactNode
}

export const TimeLabel = ({
  translateXPx,
  topPx,
  widthRem,
  heightRem,
  content,
}: TimeLabelProps) => {
  return (
    <div
      className={classes.timeLabel}
      style={{
        '--translate-x': `${translateXPx}px`,
        '--top': `${topPx}px`,
        '--tag-width': `${widthRem}rem`,
        '--tag-height': `${heightRem}rem`,
      } as React.CSSProperties}
    >
      <div className={classes.timeLabelDot} />
      <div className={classes.timeLabelConnection} />
      <div className={classes.timeLabelTag}>
        {content}
      </div>
    </div>
  )
}
