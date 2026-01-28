import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import DateHeader from './DateHeader'
import ResourceRow from './ResourceRow'
import BookingModal from './BookingModal'
import { generateDateRange, getDateIndex } from '../utils/dateUtils'

/**
 * Scheduler - Main scheduler component with unified scroll architecture and hierarchical resources
 * 
 * Architecture:
 * - Single vertical scroll container moves both resource column and timeline together
 * - Single horizontal scroll container syncs header and timeline
 * - Sticky positioning for resource column (left) and date header (top)
 * - Hierarchical resources with expand/collapse: parent groups contain child resources
 * 
 * @param {Object} props
 * @param {Array} props.resources - Array of hierarchical resource objects with children
 * @param {Array} props.bookings - Array of booking objects
 * @param {Function} props.onBookingCreate - Callback when a new booking is created
 * @param {Function} props.onResourcesChange - Callback when resource expanded state changes
 * @param {number} props.daysToShow - Number of days to display (default: 30)
 * @param {number} props.cellWidth - Width of each date cell in pixels (default: 100)
 */
const Scheduler = ({
  resources = [],
  bookings = [],
  onBookingCreate,
  onResourcesChange,
  daysToShow = 30,
  cellWidth = 100
}) => {
  // Generate date range for the timeline
  const dates = useMemo(() => generateDateRange(daysToShow), [daysToShow])
  
  // Selection state
  const [selection, setSelection] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  
  // Track mouse state
  const mouseDownRef = useRef(false)
  const startDateRef = useRef(null)
  const startResourceIdRef = useRef(null)
  
  // Refs for scroll synchronization
  const headerScrollRef = useRef(null)
  const timelineScrollRef = useRef(null)
  const isScrollingRef = useRef(false)
  
  /**
   * Normalize hierarchical resources into flat visibleRows array
   * 
   * When parent is expanded: includes parent + all children
   * When parent is collapsed: includes only parent
   * 
   * This ensures perfect alignment between resource column and timeline rows
   */
  const visibleRows = useMemo(() => {
    return resources.flatMap(parent => {
      // Always include parent row
      const parentRow = {
        ...parent,
        type: 'parent',
        isParent: true
      }
      
      // If collapsed, return only parent
      if (!parent.expanded) {
        return [parentRow]
      }
      
      // If expanded, return parent + all children
      const childRows = (parent.children || []).map(child => ({
        ...child,
        parentId: parent.id,
        parentName: parent.name,
        type: 'child',
        isParent: false
      }))
      
      return [parentRow, ...childRows]
    })
  }, [resources])
  
  /**
   * Handle mousedown on a date cell - start selection
   */
  const handleCellMouseDown = useCallback((date, resourceId, e) => {
    e.preventDefault()
    mouseDownRef.current = true
    startDateRef.current = date
    startResourceIdRef.current = resourceId
    
    setIsSelecting(true)
    setSelection({
      resourceId,
      startDate: date,
      endDate: date
    })
  }, [])
  
  /**
   * Handle mouseenter on a date cell - expand selection
   */
  const handleCellMouseEnter = useCallback((date, resourceId, e) => {
    if (!mouseDownRef.current || !isSelecting) return
    
    // Only allow selection within the same resource row
    if (resourceId !== startResourceIdRef.current) return
    
    // Update selection end date
    setSelection(prev => {
      if (!prev) return null
      
      return {
        ...prev,
        endDate: date
      }
    })
  }, [isSelecting])
  
  /**
   * Handle mouseup - finalize selection and open modal
   */
  useEffect(() => {
    const handleMouseUp = (e) => {
      if (mouseDownRef.current && isSelecting && selection) {
        mouseDownRef.current = false
        setIsSelecting(false)
        
        // Ensure startDate is before endDate
        const startIndex = getDateIndex(selection.startDate, dates)
        const endIndex = getDateIndex(selection.endDate, dates)
        
        const finalStartDate = startIndex <= endIndex ? selection.startDate : selection.endDate
        const finalEndDate = startIndex <= endIndex ? selection.endDate : selection.startDate
        
        setSelection({
          ...selection,
          startDate: finalStartDate,
          endDate: finalEndDate
        })
        
        // Open modal after a brief delay to prevent accidental clicks
        setTimeout(() => {
          setModalOpen(true)
        }, 100)
      }
    }
    
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isSelecting, selection, dates])
  
  /**
   * Handle modal close - clear selection
   */
  const handleModalClose = useCallback(() => {
    setModalOpen(false)
    setSelection(null)
    mouseDownRef.current = false
    setIsSelecting(false)
  }, [])
  
  /**
   * Handle booking confirmation
   */
  const handleBookingConfirm = useCallback((bookingData) => {
    if (onBookingCreate) {
      onBookingCreate(bookingData)
    }
    handleModalClose()
  }, [onBookingCreate, handleModalClose])
  
  /**
   * Handle parent expand/collapse toggle
   */
  const handleToggleExpand = useCallback((parentId) => {
    const updatedResources = resources.map(parent => {
      if (parent.id === parentId) {
        return { ...parent, expanded: !parent.expanded }
      }
      return parent
    })
    
    if (onResourcesChange) {
      onResourcesChange(updatedResources)
    }
    
    // Clear selection if it was on a child that's now hidden
    if (selection && selection.resourceId !== parentId) {
      const selectedRow = visibleRows.find(r => r.id === selection.resourceId)
      if (selectedRow && selectedRow.type === 'child' && selectedRow.parentId === parentId) {
        setSelection(null)
        setIsSelecting(false)
        mouseDownRef.current = false
      }
    }
  }, [resources, onResourcesChange, selection, visibleRows])
  
  /**
   * Get the resource object for the selected resource
   * Works with both parent and child resources
   */
  const selectedResource = useMemo(() => {
    if (!selection) return null
    
    // First try to find in visibleRows (handles both parent and child)
    const visibleRow = visibleRows.find(r => r.id === selection.resourceId)
    if (visibleRow) {
      return visibleRow
    }
    
    // Fallback: search in original resources structure
    for (const parent of resources) {
      if (parent.id === selection.resourceId) {
        return parent
      }
      const child = (parent.children || []).find(c => c.id === selection.resourceId)
      if (child) {
        return child
      }
    }
    
    return null
  }, [selection, visibleRows, resources])
  
  /**
   * Sync horizontal scrolling between header and timeline
   * 
   * Architecture:
   * - Header and timeline have separate horizontal scroll containers
   * - When one scrolls, we sync the other's scrollLeft
   * - isScrollingRef prevents infinite scroll loops
   * - requestAnimationFrame ensures smooth synchronization
   * 
   * This ensures date headers stay perfectly aligned with date cells
   */
  const handleHeaderScroll = useCallback((e) => {
    if (isScrollingRef.current) return
    isScrollingRef.current = true
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollLeft = e.target.scrollLeft
    }
    requestAnimationFrame(() => {
      isScrollingRef.current = false
    })
  }, [])
  
  const handleTimelineScroll = useCallback((e) => {
    if (isScrollingRef.current) return
    isScrollingRef.current = true
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.target.scrollLeft
    }
    requestAnimationFrame(() => {
      isScrollingRef.current = false
    })
  }, [])
  
  return (
    <div className="w-full h-full flex flex-col bg-white select-none">
      {/* Header Row - Sticky top, contains resource header and date headers */}
      <div className="flex border-b border-gray-300 bg-gray-50 sticky top-0 z-30 shadow-sm">
        {/* Resource Header - Sticky left, fixed width, always visible */}
        <div className="w-48 min-w-48 border-r border-gray-200 bg-gray-50 sticky left-0 z-40 flex items-center justify-center font-semibold text-gray-700">
          Resources
        </div>
        
        {/* Date Headers Container - Horizontal scroll, synced with timeline */}
        <div 
          ref={headerScrollRef}
          className="flex overflow-x-auto overflow-y-hidden hide-scrollbar"
          onScroll={handleHeaderScroll}
        >
          <div className="flex">
            {dates.map(date => (
              <DateHeader
                key={date}
                date={date}
                cellWidth={cellWidth}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Body Container - Single vertical scroll moves both resource column and timeline together */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex">
          {/* Resource Column - Sticky left, scrolls vertically with rows */}
          {/* CRITICAL: Must use same visibleRows array as timeline for perfect alignment */}
          <div className="w-48 min-w-48 border-r border-gray-200 bg-white sticky left-0 z-20">
            {visibleRows.map(row => (
              <div
                key={row.id}
                className={`border-b border-gray-200 bg-white flex items-center font-medium hover:bg-gray-50 transition-colors ${
                  row.type === 'parent' 
                    ? 'font-semibold bg-gray-50' 
                    : 'pl-8 text-gray-700'
                }`}
                style={{ height: '60px' }}
              >
                {row.type === 'parent' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleExpand(row.id)
                    }}
                    className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                    aria-label={row.expanded ? 'Collapse' : 'Expand'}
                  >
                    <svg
                      className={`w-4 h-4 text-gray-600 transform transition-transform duration-200 ${
                        row.expanded ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                {row.type === 'child' && <span className="w-6 flex-shrink-0" />}
                <span className="flex-1 truncate">{row.name}</span>
              </div>
            ))}
          </div>
          
          {/* Timeline Scroll Container - Single horizontal scroll, synced with header */}
          {/* CRITICAL: Must use same visibleRows array as resource column for perfect alignment */}
          <div 
            ref={timelineScrollRef}
            className="flex-1 overflow-x-auto overflow-y-visible hide-scrollbar"
            onScroll={handleTimelineScroll}
          >
            <div className="relative" style={{ minWidth: `${dates.length * cellWidth}px` }}>
              {/* Resource Rows - Only renders visible rows (collapsed children are excluded from DOM) */}
              {visibleRows.map(row => (
                <ResourceRow
                  key={row.id}
                  resource={row}
                  dates={dates}
                  bookings={bookings}
                  selection={selection}
                  onCellMouseDown={handleCellMouseDown}
                  onCellMouseEnter={handleCellMouseEnter}
                  cellWidth={cellWidth}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking Modal */}
      <BookingModal
        isOpen={modalOpen}
        selection={selection}
        resource={selectedResource}
        onClose={handleModalClose}
        onConfirm={handleBookingConfirm}
      />
    </div>
  )
}

export default Scheduler

