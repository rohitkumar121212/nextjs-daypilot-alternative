import React, { memo } from 'react'
import DateCell from './DateCell'
import BookingBlock from './BookingBlock'
import SelectionOverlay from './SelectionOverlay'

/**
 * ResourceRow - Memoized component for better performance
 */
const ResourceRow = memo(({
  resource,
  dates,
  bookings = [],
  selection,
  dragState,
  onCellMouseDown,
  onCellMouseEnter,
  onBookingClick,
  onBookingDragStart,
  cellWidth = 100
}) => {
  // Filter bookings for this resource
  const resourceBookings = bookings.filter(b => b.resourceId === resource.id)
  
  // Check if this row has an active selection
  const hasSelection = selection && selection.resourceId === resource.id
  
  return (
    <div className="relative" style={{ height: 60 }}>
      {/* Date cells */}
      <div className="flex relative">
        {dates.map((date) => {
          const isDropTarget = dragState?.dropTarget?.date === date && 
                              dragState?.dropTarget?.resourceId === resource.id
          
          return (
            <DateCell
              key={`${resource.id}-${date}`}
              date={date}
              resourceId={resource.id}
              cellWidth={cellWidth}
              isSelected={hasSelection && isDateInSelection(date, selection)}
              isDropTarget={isDropTarget}
              onMouseDown={onCellMouseDown}
              onMouseEnter={onCellMouseEnter}
            />
          )
        })}
      </div>
      
      {/* Booking blocks */}
      {resourceBookings.map(booking => {
        const isDragging = dragState?.draggedBooking?.id === booking.id
        
        return (
          <BookingBlock
            key={booking.id}
            booking={booking}
            dates={dates}
            cellWidth={cellWidth}
            isDragging={isDragging}
            dragOffset={isDragging ? dragState.dragOffset : { x: 0, y: 0 }}
            onBookingClick={onBookingClick}
            onBookingDragStart={onBookingDragStart}
          />
        )
      })}
      
      {/* Selection overlay */}
      {hasSelection && (
        <SelectionOverlay
          selection={selection}
          dates={dates}
          cellWidth={cellWidth}
        />
      )}
    </div>
  )
})

/**
 * Check if a date is within the current selection range
 */
const isDateInSelection = (date, selection) => {
  if (!selection || !selection.startDate || !selection.endDate) return false
  
  const dates = [selection.startDate, selection.endDate].sort()
  return date >= dates[0] && date <= dates[1]
}

export default ResourceRow

