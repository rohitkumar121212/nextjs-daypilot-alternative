import React from 'react'

/**
 * GridBookingCell - Renders booking blocks within MultiGrid cells
 * Uses the same styling logic as BookingBlock but optimized for grid rendering
 */
const GridBookingCell = ({ 
  booking, 
  dates, 
  cellWidth, 
  onBookingClick 
}) => {
  // Subtract 1 day from endDate since checkout date should not be included
  const displayEndDate = new Date(new Date(booking.endDate).getTime() - 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  
  const startIdx = dates.indexOf(booking.startDate)
  const endIdx = dates.indexOf(displayEndDate)
  
  // Only hide if booking doesn't overlap with visible range at all
  // Show booking if: starts in range OR ends in range OR spans entire range
  const bookingStartsBeforeRange = startIdx === -1 && booking.startDate < dates[0]
  const bookingEndsAfterRange = endIdx === -1 && displayEndDate > dates[dates.length - 1]
  const bookingSpansEntireRange = bookingStartsBeforeRange && bookingEndsAfterRange
  const bookingOverlapsRange = startIdx !== -1 || endIdx !== -1 || bookingSpansEntireRange
  
  if (!bookingOverlapsRange) return null
  
  // Calculate visible portion
  const visibleStartIdx = Math.max(0, startIdx === -1 ? 0 : startIdx)
  const visibleEndIdx = Math.min(dates.length - 1, endIdx === -1 ? dates.length - 1 : endIdx)
  
  const duration = visibleEndIdx - visibleStartIdx + 1
  const width = duration * cellWidth

  // Get background color from booking data or use default
  const backgroundColor = booking.backColor || '#40c970'
  const borderColor = booking.backColor || '#40c970'
  
  // Parse bubbleHtml to check for Lead_Source and is_left
  let bubbleData = {}
  try {
    if (booking.bubbleHtml) {
      const jsonStr = booking.bubbleHtml.replace(/'/g, '"')
      bubbleData = JSON.parse(jsonStr)
    }
  } catch (e) {
    // If parsing fails, bubbleData remains empty object
  }
  
  // Determine if we should show Lead_Source icon and its position
  const shouldShowIcon = booking.Lead_Source_icon === "true" && bubbleData.Lead_Source
  const showOnLeft = bubbleData.is_left === "true" || bubbleData.is_left === true

  return (
    <div
      className="absolute top-1 left-1 border rounded text-white text-xs flex items-center justify-start font-medium shadow-md z-10 cursor-pointer hover:shadow-lg"
      style={{ 
        width: `${width - 2}px`,
        height: '50px',
        backgroundColor: backgroundColor,
        borderColor: borderColor
      }}
      title={`${booking.text || booking.name || `Booking ${booking.id}`}: ${booking.startDate} to ${booking.endDate}`}
      onClick={() => onBookingClick(booking)}
    >
      {shouldShowIcon && showOnLeft && (
        <img src={bubbleData.Lead_Source} alt="Lead Source" className="w-4 h-4 mx-1" />
      )}
      <span className="truncate px-2">
        {booking?.text || booking?.name || `Booking ${booking.id}`}
      </span>
      {shouldShowIcon && !showOnLeft && (
        <img src={bubbleData.Lead_Source} alt="Lead Source" className="w-4 h-4 mx-1" />
      )}
    </div>
  )
}

export default GridBookingCell