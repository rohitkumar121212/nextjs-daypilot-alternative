import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import DateHeader from './DateHeader'
import ResourceRow from './ResourceRow'
import BookingModal from './BookingModal'
import { generateDateRange, getDateIndex } from '../utils/dateUtils'

/**
 * OptimizedScheduler - Performance-optimized scheduler with debounced interactions
 */
const OptimizedScheduler = ({
  resources = [],
  bookings = [],
  onBookingCreate,
  onResourcesChange,
  daysToShow = 30,
  cellWidth = 100
}) => {
  const dates = useMemo(() => generateDateRange(daysToShow), [daysToShow])
  
  // Selection state
  const [selection, setSelection] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  
  // Track mouse state
  const mouseDownRef = useRef(false)
  const startDateRef = useRef(null)
  const startResourceIdRef = useRef(null)
  const debounceRef = useRef(null)
  
  // Refs for scroll synchronization
  const headerScrollRef = useRef(null)
  const timelineScrollRef = useRef(null)
  const isScrollingRef = useRef(false)
  
  // Memoized visible rows
  const visibleRows = useMemo(() => {
    return resources.flatMap(parent => {
      const parentRow = {
        ...parent,
        type: 'parent',
        isParent: true
      }
      
      if (!parent.expanded) {
        return [parentRow]
      }
      
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
  
  // Debounced mouse enter handler
  const handleCellMouseEnter = useCallback((date, resourceId, e) => {
    if (!mouseDownRef.current || !isSelecting) return
    if (resourceId !== startResourceIdRef.current) return
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Debounce the selection update
    debounceRef.current = setTimeout(() => {
      setSelection(prev => {
        if (!prev) return null
        return {
          ...prev,
          endDate: date
        }
      })
    }, 16) // ~60fps
  }, [isSelecting])
  
  // Handle mousedown on a date cell
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
  
  // Handle mouseup
  useEffect(() => {
    const handleMouseUp = (e) => {
      if (mouseDownRef.current && isSelecting && selection) {
        mouseDownRef.current = false
        setIsSelecting(false)
        
        // Clear any pending debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
        
        const startIndex = getDateIndex(selection.startDate, dates)
        const endIndex = getDateIndex(selection.endDate, dates)
        
        const finalStartDate = startIndex <= endIndex ? selection.startDate : selection.endDate
        const finalEndDate = startIndex <= endIndex ? selection.endDate : selection.startDate
        
        setSelection({
          ...selection,
          startDate: finalStartDate,
          endDate: finalEndDate
        })
        
        setTimeout(() => {
          setModalOpen(true)
        }, 100)
      }
    }
    
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [isSelecting, selection, dates])
  
  // Handle modal close
  const handleModalClose = useCallback(() => {
    setModalOpen(false)
    setSelection(null)
    mouseDownRef.current = false
    setIsSelecting(false)
  }, [])
  
  // Handle booking confirmation
  const handleBookingConfirm = useCallback((bookingData) => {
    if (onBookingCreate) {
      onBookingCreate(bookingData)
    }
    handleModalClose()
  }, [onBookingCreate, handleModalClose])
  
  // Handle parent expand/collapse toggle
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
  }, [resources, onResourcesChange])
  
  // Get selected resource
  const selectedResource = useMemo(() => {
    if (!selection) return null
    
    const visibleRow = visibleRows.find(r => r.id === selection.resourceId)
    if (visibleRow) return visibleRow
    
    for (const parent of resources) {
      if (parent.id === selection.resourceId) return parent
      const child = (parent.children || []).find(c => c.id === selection.resourceId)
      if (child) return child
    }
    
    return null
  }, [selection, visibleRows, resources])
  
  // Throttled scroll handlers
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
      {/* Header Row */}
      <div className="flex border-b border-gray-300 bg-gray-50 sticky top-0 z-30 shadow-sm">
        <div className="w-48 min-w-48 border-r border-gray-200 bg-gray-50 sticky left-0 z-40 flex items-center justify-center font-semibold text-gray-700">
          Resources
        </div>
        
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
      
      {/* Body Container */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex">
          {/* Resource Column */}
          <div className="w-48 min-w-48 border-r border-gray-200 bg-white sticky left-0 z-20">
            {visibleRows.map(row => (
              <div
                key={row.id}
                className={`border-b border-gray-200 bg-white flex items-center font-medium hover:bg-gray-50 ${
                  row.type === 'parent' 
                    ? 'font-semibold bg-gray-50' 
                    : 'pl-8 text-gray-700'
                }`}
                style={{ height: 60 }}
              >
                {row.type === 'parent' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleExpand(row.id)
                    }}
                    className="mr-2 p-1 hover:bg-gray-200 rounded flex-shrink-0"
                  >
                    <svg
                      className={`w-4 h-4 text-gray-600 transform ${
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
          
          {/* Timeline */}
          <div 
            ref={timelineScrollRef}
            className="flex-1 overflow-x-auto overflow-y-visible hide-scrollbar"
            onScroll={handleTimelineScroll}
          >
            <div className="relative" style={{ minWidth: dates.length * cellWidth }}>
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

export default OptimizedScheduler