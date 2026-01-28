import React from 'react'
import { getDateIndex, daysBetween } from '../utils/dateUtils'

/**
 * SelectionOverlay - Visual overlay for selected date range
 * @param {Object} props
 * @param {Object} props.selection - Selection object with resourceId, startDate, endDate
 * @param {Array<string>} props.dates - Array of all dates in the timeline
 * @param {number} props.cellWidth - Width of each date cell
 */
const SelectionOverlay = ({ selection, dates, cellWidth = 100 }) => {
  if (!selection || !selection.startDate || !selection.endDate) return null
  
  const startIndex = getDateIndex(selection.startDate, dates)
  const endIndex = getDateIndex(selection.endDate, dates)
  
  if (startIndex === -1 || endIndex === -1) return null
  
  const minIndex = Math.min(startIndex, endIndex)
  const maxIndex = Math.max(startIndex, endIndex)
  const span = maxIndex - minIndex + 1
  
  const left = minIndex * cellWidth
  const width = span * cellWidth
  
  return (
    <div
      className="absolute top-0 bottom-0 bg-blue-200 border-2 border-blue-500 pointer-events-none z-30 opacity-60 rounded-sm transition-all duration-100"
      style={{
        left: `${left}px`,
        width: `${width}px`,
        height: '60px',
        boxShadow: 'inset 0 0 0 1px rgba(59, 130, 246, 0.3)'
      }}
    />
  )
}

export default SelectionOverlay

