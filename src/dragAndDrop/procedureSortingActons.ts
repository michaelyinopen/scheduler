import { type ElementId } from '@michaelyinopen/scheduler-common'
import { useProcedureSortingStore } from './useProcedureSortingStore'

export function setJobIsWrapping(jobId: ElementId, isWrapping: boolean) {
  const previousValue = useProcedureSortingStore.getState().jobIsWrappingMap[jobId]
  if (previousValue !== undefined && previousValue === isWrapping) {
    return
  }
  useProcedureSortingStore.setState(state => {
    return {
      jobIsWrappingMap: {
        ...state.jobIsWrappingMap,
        [jobId]: isWrapping
      }
    }
  })
}

export function setPocedureDropPreviewIndicator(procedureId: ElementId, position: 'left' | 'right') {
  const previousValue = useProcedureSortingStore.getState().procedureDropPreviewIndicator
  if (previousValue !== undefined && previousValue.procedureId === procedureId && previousValue.position === position) {
    return
  }
  useProcedureSortingStore.setState({
    procedureDropPreviewIndicator: {
      procedureId,
      position,
    }
  })
}

export function clearPocedureDropPreviewIndicator() {
  useProcedureSortingStore.setState({
    procedureDropPreviewIndicator: undefined
  })
}
