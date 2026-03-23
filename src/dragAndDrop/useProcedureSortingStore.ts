import { create } from 'zustand'
import { type ElementId } from '@michaelyinopen/scheduler-common'

export type ProcedureSortingState = {
  jobIsWrappingMap: { [key in ElementId]: boolean }
  procedureDropPreviewIndicator: {
    procedureId: ElementId
    position: 'left' | 'right'
  } | undefined
}

export const useProcedureSortingStore = create<ProcedureSortingState>(() => ({
  jobIsWrappingMap: {},
  procedureDropPreviewIndicator: undefined,
}))
