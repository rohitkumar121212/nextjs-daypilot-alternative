import React from 'react'
import { getDateIndex, daysBetween } from '../utils/dateUtils'

/**
 * BookingBlock - Renders an existing booking as an absolute-positioned block
 * @param {Object} props
 * @param {Object} props.booking - Booking object with id, resourceId, startDate, endDate
 * @param {Array<string>} props.dates - Array of all dates in the timeline
 * @param {number} props.cellWidth - Width of each date cell
 * @param {Function} props.onBookingClick - Handler for booking click events
 * @param {Function} props.onBookingDragStart - Handler for booking drag start
 * @param {boolean} props.isDragging - Whether this booking is being dragged
 * @param {Object} props.dragOffset - Drag offset {x, y}
 */
const BookingBlock = ({ 
  booking, 
  dates, 
  cellWidth = 100, 
  onBookingClick, 
  onBookingDragStart,
  isDragging = false,
  dragOffset = { x: 0, y: 0 }
}) => {
  const startIndex = getDateIndex(booking.startDate, dates)
  const endIndex = getDateIndex(booking.endDate, dates)
  
  // If booking dates are outside the visible range, don't render
  if (startIndex === -1 && endIndex === -1) return null
  
  // Calculate position and width
  const visibleStartIndex = Math.max(0, startIndex)
  const visibleEndIndex = Math.min(dates.length - 1, endIndex)
  
  const left = visibleStartIndex * cellWidth
  const span = visibleEndIndex - visibleStartIndex + 1
  const width = span * cellWidth
  
  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Start drag after a small delay to distinguish from click
    const startTime = Date.now()
    const startPos = { x: e.clientX, y: e.clientY }
    
    const handleMouseMove = (moveEvent) => {
      const timeDiff = Date.now() - startTime
      const distance = Math.sqrt(
        Math.pow(moveEvent.clientX - startPos.x, 2) + 
        Math.pow(moveEvent.clientY - startPos.y, 2)
      )
      
      // Start drag if moved more than 5px or held for more than 200ms
      if (distance > 5 || timeDiff > 200) {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        onBookingDragStart?.(booking, e)
      }
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      // If no drag started, treat as click
      const timeDiff = Date.now() - startTime
      if (timeDiff < 200) {
        onBookingClick?.(booking)
      }
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  // Get background color from booking data or use default
  const backgroundColor = booking.backColor || '#40c970'
  const borderColor = booking.backColor || '#40c970'
  
  return (
    <div
      className={`absolute top-1 bottom-1 border rounded text-white text-xs flex items-center justify-center font-medium shadow-md z-20 cursor-pointer transition-all ${
        isDragging 
          ? 'opacity-75 shadow-lg transform scale-105' 
          : 'hover:shadow-lg'
      }`}
      style={{
        left: `${left + dragOffset.x}px`,
        top: `${1 + dragOffset.y}px`,
        width: `${width}px`,
        height: '50px',
        backgroundColor: isDragging ? `${backgroundColor}99` : backgroundColor, // Add transparency when dragging
        borderColor: borderColor,
        transform: isDragging ? 'rotate(2deg)' : 'none',
        pointerEvents: isDragging ? 'none' : 'auto'
      }}
      title={`${booking.text || `Booking ${booking.id}`}: ${booking.startDate} to ${booking.endDate}`}
      onMouseDown={handleMouseDown}
    >
      <span className="truncate px-2">{booking?.text || `Booking ${booking.id}`}</span>
    </div>
  )
}

export default BookingBlock

