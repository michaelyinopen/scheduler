import { closestCenter, pointerWithin, type CollisionDetection } from '@dnd-kit/core';
import { isJobDragItem, isProcedureDragItem, isTaskDragItem, type DragItem } from './dragTypes';
import { isJobDropData, isJobSetDropData, isMachineLaneDropData, isProcedureDropData, type DropData } from './dropTypes';

export const collisionDetectionAlgorithm: CollisionDetection = (args) => {
  const droppableContainers = args.droppableContainers
  const dragItem = args.active.data.current as DragItem | undefined

  if (dragItem === undefined) {
    return []
  }

  if (isProcedureDragItem(dragItem)) {
    const jobId = dragItem.jobId

    const isPointerInJob = pointerWithin({
      ...args,
      droppableContainers: droppableContainers.filter(({ data }) => {
        const dropData = data.current as DropData | undefined
        return dropData !== undefined && isJobDropData(dropData) && dropData.jobId === jobId
      })
    }).length > 0

    const activeRect = args.active.rect.current.translated

    if (isPointerInJob && activeRect !== null) {
      const yCoordinateOfActiveCenter = activeRect.top + activeRect.height * 0.5
      const otherProcedures = closestCenter({ // only include same job and same horizontal
        ...args,
        droppableContainers: droppableContainers.filter(({ data, rect }) => {
          const dropData = data.current as DropData | undefined

          return dropData !== undefined
            && isProcedureDropData(dropData)
            && dropData.jobId === jobId
            && rect.current !== null
            && yCoordinateOfActiveCenter <= rect.current?.bottom
            && yCoordinateOfActiveCenter > rect.current?.top
        }),
      })

      if (otherProcedures.length > 0) {
        return otherProcedures
      }
    }
  }

  if (isJobDragItem(dragItem)) {
    const isPointerInJobSet = pointerWithin({
      ...args,
      droppableContainers: droppableContainers.filter(({ id }) => id === 'jobSet')
    }).length > 0

    if (isPointerInJobSet) {
      const otherJobs = closestCenter({
        ...args,
        droppableContainers: droppableContainers.filter(({ data }) => {
          const dropData = data.current as DropData | undefined

          return dropData !== undefined && isJobDropData(dropData)
        }),
      })

      if (otherJobs.length > 0) {
        return otherJobs
      }
    }
  }

  if (isTaskDragItem(dragItem)) {
    const collisions = pointerWithin({
      ...args,
      droppableContainers: droppableContainers.filter(({ data }) => {
        const dropData = data.current as DropData | undefined

        return dropData !== undefined &&
          (isJobSetDropData(dropData) || isMachineLaneDropData(dropData))
      }),
    })

    if (collisions.length > 0) {
      return collisions
    }
  }

  return pointerWithin(args)
}
