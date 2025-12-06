import { type OnlineStatus, onlineStatus } from '../useConnection'
import classes from './StatusBanner.module.css'

export type StatusBannerProps = {
  status: OnlineStatus
}

export const StatusBanner = ({ status }: StatusBannerProps) => {
  if (status === onlineStatus.Online) {
    return undefined
  }
  return (
    <div className={classes.statusBanner}>
      {status}
    </div>
  )
}
