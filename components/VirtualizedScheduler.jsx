import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { MultiGrid } from 'react-virtualized'
import 'react-virtualized/styles.css'
import DateHeader from './DateHeader'
import ResourceRow from './ResourceRow'
import BookingModal from './BookingModal'
import FilterBar from './FilterBar'
import { generateDateRange, getDateIndex } from '../utils/dateUtils'

const VirtualizedScheduler = ({
  resources = [],
  bookings = [],
  onBookingCreate,
  onResourcesChange,
  daysToShow = 60, // Increased default to test horizontal scrolling
  cellWidth = 100,
  rowHeight = 60
}) => {
  const dates = useMemo(() => generateDateRange(daysToShow), [daysToShow])
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState('')

  /* =========================
     Selection state
  ========================= */
  const [selection, setSelection] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  /* =========================
     Drag and drop state
  ========================= */
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedBooking: null,
    dragOffset: { x: 0, y: 0 },
    dropTarget: null
  })

  const mouseDownRef = useRef(false)
  const startDateRef = useRef(null)
  const startResourceIdRef = useRef(null)
  const dragStartPosRef = useRef({ x: 0, y: 0 })

  /* =========================
     Horizontal scroll sync
  ========================= */
  const headerScrollRef = useRef(null)
  const timelineScrollRef = useRef(null)
  const resourceScrollRef = useRef(null)
  const timelineListRef = useRef(null)
  const isSyncingRef = useRef(false)

  /* =========================
     Flatten resources with booking ID filter
  ========================= */
  const visibleRows = useMemo(() => {
    let filteredResources = resources
    
    // Filter by booking ID if selected
    if (selectedBookingId) {
      const matchingBookings = bookings.filter(booking => 
        booking.booking_id.toString().includes(selectedBookingId)
      )
      const matchingResourceIds = new Set(matchingBookings.map(b => b.resourceId))
      
      filteredResources = resources.map(parent => ({
        ...parent,
        expanded: true, // Auto-expand when filtering by booking ID
        children: (parent.children || []).filter(child => 
          matchingResourceIds.has(child.id)
        )
      })).filter(parent => parent.children.length > 0)
    }
    
    // Apply search filter
    if (searchTerm) {
      filteredResources = filteredResources.filter(parent => {
        const parentMatches = parent.name.toLowerCase().includes(searchTerm.toLowerCase())
        const childMatches = (parent.children || []).some(child => 
          child.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        return parentMatches || childMatches
      })
    }

    return filteredResources.flatMap(parent => {
      const parentRow = {
        ...parent,
        type: 'parent'
      }

      if (!parent.expanded) return [parentRow]

      const children = (parent.children || [])
        .filter(child => !searchTerm || child.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(child => ({
          ...child,
          parentId: parent.id,
          type: 'child'
        }))

      return [parentRow, ...children]
    })
  }, [resources, searchTerm, selectedBookingId, bookings])

  /* =========================
     Cell interactions
  ========================= */
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

  const handleCellMouseEnter = useCallback((date, resourceId) => {
    if (dragState.isDragging) {
      // Handle drop target highlighting during drag
      setDragState(prev => ({
        ...prev,
        dropTarget: { date, resourceId }
      }))
      return
    }
    
    if (!mouseDownRef.current || !isSelecting) return
    if (resourceId !== startResourceIdRef.current) return

    setSelection(prev =>
      prev ? { ...prev, endDate: date } : null
    )
  }, [isSelecting, dragState.isDragging])

  /* =========================
     Drag and drop handlers
  ========================= */
  const handleBookingDragStart = useCallback((booking, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
    setDragState({
      isDragging: true,
      draggedBooking: booking,
      dragOffset: { x: 0, y: 0 },
      dropTarget: null
    })
  }, [])

  const handleBookingDragMove = useCallback((e) => {
    if (!dragState.isDragging) return
    
    const deltaX = e.clientX - dragStartPosRef.current.x
    const deltaY = e.clientY - dragStartPosRef.current.y
    
    // Find drop target using elementFromPoint
    const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY)
    let dropTarget = null
    
    if (elementUnderMouse) {
      const dateCell = elementUnderMouse.closest('[data-date][data-resource-id]')
      if (dateCell) {
        dropTarget = {
          date: dateCell.getAttribute('data-date'),
          resourceId: dateCell.getAttribute('data-resource-id')
        }
      }
    }
    
    setDragState(prev => ({
      ...prev,
      dragOffset: { x: deltaX, y: deltaY },
      dropTarget
    }))
  }, [dragState.isDragging])

  const handleBookingDragEnd = useCallback((targetDate, targetResourceId) => {
    if (!dragState.isDragging || !dragState.draggedBooking) return
    
    const draggedBooking = dragState.draggedBooking
    
    if (targetDate && targetResourceId) {
      // Calculate booking duration
      const startDate = new Date(draggedBooking.startDate)
      const endDate = new Date(draggedBooking.endDate)
      const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      
      // Calculate new end date
      const newStartDate = targetDate
      const newEndDate = new Date(new Date(targetDate).getTime() + duration * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]
      
      // For now, just log the change - we'll need to update App.jsx to handle booking updates
      console.log('Booking moved:', { 
        from: draggedBooking, 
        to: { resourceId: targetResourceId, startDate: newStartDate, endDate: newEndDate } 
      })
    }
    
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedBooking: null,
      dragOffset: { x: 0, y: 0 },
      dropTarget: null
    })
  }, [dragState, bookings])

  /* =========================
     Booking click handling
  ========================= */
  const handleBookingClick = useCallback((booking) => {
    if (dragState.isDragging) return // Ignore clicks during drag
    setSelectedBooking(booking)
    setSelection(null) // Clear any date selection
    setModalOpen(true)
  }, [dragState.isDragging])

  /* =========================
     Mouse up handling
  ========================= */
  useEffect(() => {
    const onMouseUp = (e) => {
      if (dragState.isDragging) {
        // Always try to find drop target on mouse up, even if dropTarget wasn't set during move
        let finalDropTarget = dragState.dropTarget
        
        if (!finalDropTarget) {
          // Find the element under the mouse cursor
          const elementUnderMouse = document.elementFromPoint(e.clientX, e.clientY)
          if (elementUnderMouse) {
            // Look for date cell attributes
            const dateCell = elementUnderMouse.closest('[data-date][data-resource-id]')
            if (dateCell) {
              finalDropTarget = {
                date: dateCell.getAttribute('data-date'),
                resourceId: dateCell.getAttribute('data-resource-id')
              }
            }
          }
        }
        
        if (finalDropTarget) {
          handleBookingDragEnd(finalDropTarget.date, finalDropTarget.resourceId)
        } else {
          // No valid drop target, reset drag state
          setDragState({
            isDragging: false,
            draggedBooking: null,
            dragOffset: { x: 0, y: 0 },
            dropTarget: null
          })
        }
        return
      }
      
      if (!mouseDownRef.current || !selection) return

      mouseDownRef.current = false
      setIsSelecting(false)

      const startIdx = getDateIndex(selection.startDate, dates)
      const endIdx = getDateIndex(selection.endDate, dates)

      setSelection({
        ...selection,
        startDate: startIdx <= endIdx ? selection.startDate : selection.endDate,
        endDate: startIdx <= endIdx ? selection.endDate : selection.startDate
      })

      setTimeout(() => setModalOpen(true), 80)
    }

    const onMouseMove = (e) => {
      handleBookingDragMove(e)
    }

    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [selection, dates, dragState, handleBookingDragEnd, handleBookingDragMove])

  /* =========================
     Booking modal
  ========================= */
  const handleModalClose = useCallback(() => {
    setModalOpen(false)
    setSelection(null)
    setSelectedBooking(null)
    mouseDownRef.current = false
    setIsSelecting(false)
  }, [])

  const handleBookingConfirm = useCallback(
    (data) => {
      onBookingCreate?.(data)
      handleModalClose()
    },
    [onBookingCreate, handleModalClose]
  )

  /* =========================
     Expand / collapse
  ========================= */
  const handleToggleExpand = useCallback(
    (parentId) => {
      onResourcesChange?.(
        resources.map(r =>
          r.id === parentId ? { ...r, expanded: !r.expanded } : r
        )
      )
    },
    [resources, onResourcesChange]
  )

  /* =========================
     Horizontal scroll sync
  ========================= */
  const syncScroll = (source, target) => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    target.scrollLeft = source.scrollLeft
    requestAnimationFrame(() => {
      isSyncingRef.current = false
    })
  }

  /* =========================
     MultiGrid setup
  ========================= */
  const multiGridRef = useRef(null)
  const RESOURCE_COLUMN_WIDTH = 200
  const HEADER_HEIGHT = 50
  
  // Virtualization settings for better performance
  const OVERSCAN_COLUMN_COUNT = 5 // Render 5 extra columns outside viewport
  const OVERSCAN_ROW_COUNT = 3    // Render 3 extra rows outside viewport
  
  const cellRenderer = ({ columnIndex, key, rowIndex, style }) => {
    // Header row
    if (rowIndex === 0) {
      if (columnIndex === 0) {
        return (
          <div key={key} style={style} className="bg-gray-50 border-r border-b border-gray-200 flex items-center justify-center font-semibold">
            Resources
          </div>
        )
      }
      const date = dates[columnIndex - 1]
      return (
        <div key={key} style={style}>
          <DateHeader date={date} cellWidth={cellWidth} />
        </div>
      )
    }
    
    // Data rows
    const row = visibleRows[rowIndex - 1]
    if (!row) return null
    
    // Resource column (sticky left)
    if (columnIndex === 0) {
      return (
        <div
          key={key}
          style={style}
          className={`border-r border-b border-gray-200 bg-white flex items-center px-2 ${
            row.type === 'parent'
              ? 'font-semibold bg-gray-50'
              : 'pl-8 text-gray-700'
          }`}
        >
          {row.type === 'parent' && (
            <button
              onClick={() => handleToggleExpand(row.id)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              ▶
            </button>
          )}
          <span className="truncate">{row.name}</span>
        </div>
      )
    }
    
    // Timeline cells
    const date = dates[columnIndex - 1]
    return (
      <div key={key} style={style} className="border-b border-gray-200 relative">
        {/* Date Cell */}
        <div 
          className="w-full h-full border-r border-gray-100 hover:bg-blue-50 cursor-pointer flex items-center justify-center"
          data-date={date}
          data-resource-id={row.id}
          onMouseDown={(e) => handleCellMouseDown(date, row.id, e)}
          onMouseEnter={() => handleCellMouseEnter(date, row.id)}
        >
          {/* Show booking if it starts on this date */}
          {bookings
            .filter(b => b.resourceId === row.id && b.startDate === date)
            .map(booking => {
              const startIdx = dates.indexOf(booking.startDate)
              const endIdx = dates.indexOf(booking.endDate)
              const duration = endIdx - startIdx // Exclude end date
              const width = duration * cellWidth
              
              return (
                <div
                  key={booking.id}
                  className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded cursor-pointer z-10"
                  style={{ 
                    width: `${width - 2}px`,
                    height: '50px'
                  }}
                  onClick={() => handleBookingClick(booking)}
                  onMouseDown={(e) => handleBookingDragStart(booking, e)}
                >
                  {booking.name}
                </div>
              )
            })
          }
        </div>
      </div>
    )
  }

  const containerHeight = 500

  return (
    <div className="w-full h-full flex flex-col bg-white select-none">
      {/* ================= FILTER BAR ================= */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        bookings={bookings}
        selectedBookingId={selectedBookingId}
        onBookingIdChange={setSelectedBookingId}
        onClearFilters={() => {
          setSearchTerm('')
          setSelectedBookingId('')
        }}
      />

      {/* ================= BODY ================= */}
      <div className="flex-1" style={{ height: containerHeight }}>
        <MultiGrid
          ref={multiGridRef}
          cellRenderer={cellRenderer}
          columnCount={dates.length + 1}
          rowCount={visibleRows.length + 1}
          columnWidth={({ index }) => index === 0 ? RESOURCE_COLUMN_WIDTH : cellWidth}
          rowHeight={({ index }) => index === 0 ? HEADER_HEIGHT : rowHeight}
          fixedColumnCount={1}
          fixedRowCount={1}
          width={window?.innerWidth || 1200}
          height={containerHeight}
          overscanColumnCount={OVERSCAN_COLUMN_COUNT}
          overscanRowCount={OVERSCAN_ROW_COUNT}
          styleBottomLeftGrid={{ outline: 'none' }}
          styleBottomRightGrid={{ outline: 'none' }}
          styleTopLeftGrid={{ outline: 'none' }}
          styleTopRightGrid={{ outline: 'none' }}
          className="scheduler-grid"
        />
      </div>

      {/* ================= MODAL ================= */}
      <BookingModal
        isOpen={modalOpen}
        selection={selection}
        booking={selectedBooking}
        resource={visibleRows.find(r => r.id === (selectedBooking?.resourceId || selection?.resourceId))}
        onClose={handleModalClose}
        onConfirm={handleBookingConfirm}
      />
    </div>
  )
}

export default VirtualizedScheduler

// 'use client';
// import { useEffect, useState, useMemo } from 'react';
// import dayjs from 'dayjs';
// import VirtualScheduler from './VirtualScheduler/VirtualScheduler';
// import FilterContainer from './Filter/FilterContainer';

// const ReservationChart = ()=>{
//   const [resources, setResources] = useState([])
//   const [bookings, setBookings] = useState([])
//   const [searchTerm, setSearchTerm] = useState('')
//   const [bookingIdFilter, setBookingIdFilter] = useState('')
//   const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'))
//   const [daysToShow, setDaysToShow] = useState(30)

//   const [resourcesLoaded, setResourcesLoaded] = useState(false)
//   const [bookingsLoaded, setBookingsLoaded] = useState(false)

//   /* =========================
//      Filter resources by search term and booking ID
//   ========================= */
//   const filteredResources = useMemo(() => {
//     let resourcesResult = resources;
    
//     // Filter by booking ID first - show only apartments that have the booking
//     if (bookingIdFilter.trim()) {
//       const matchingBookings = bookings.filter(booking => 
//         booking.booking_id?.toString().includes(bookingIdFilter) ||
//         booking.id?.toString().includes(bookingIdFilter)
//       );
      
//       const matchingApartmentIds = new Set(matchingBookings.map(booking => booking.resourceId));
      
//       resourcesResult = resources.map(parent => {
//         const matchingChildren = (parent.children || []).filter(child => 
//           matchingApartmentIds.has(child.id)
//         );
        
//         if (matchingChildren.length > 0) {
//           return { ...parent, children: matchingChildren };
//         }
        
//         return null;
//       }).filter(Boolean);
//     }
    
//     // Then filter by search term
//     if (searchTerm.trim()) {
//       resourcesResult = resourcesResult.map(parent => {
//         const parentMatches = parent.name.toLowerCase().includes(searchTerm.toLowerCase());
//         const matchingChildren = (parent.children || []).filter(child => 
//           child.name.toLowerCase().includes(searchTerm.toLowerCase())
//         );
        
//         if (parentMatches) {
//           return parent; // Show all children if parent matches
//         } else if (matchingChildren.length > 0) {
//           return { ...parent, children: matchingChildren }; // Show only matching children
//         }
        
//         return null; // Hide this parent entirely
//       }).filter(Boolean);
//     }
    
//     return resourcesResult;
//   }, [resources, searchTerm, bookingIdFilter, bookings]);

//   /* =========================
//      Create booking (local)
//   ========================= */
//   const handleBookingCreate = (bookingData) => {
//     const newBooking = {
//       id: bookings.length + 1,
//       ...bookingData
//     }
//     setBookings(prev => [...prev, newBooking])
//   }

//   /* =========================
//      Parallel data fetching
//   ========================= */
//   useEffect(() => {
//     let cancelled = false

//     async function loadData() {
//       try {
//         const endDate = dayjs(startDate).add(daysToShow, 'day').format('YYYY-MM-DD')
        
//         const resourcesRequest = fetch(
//           `https://aperfectstay.ai/api/aps-pms/apts/?user=6552614495846400&start=${startDate}`
//         )

//         const bookingsRequest = fetch(
//           `https://aperfectstay.ai/api/aps-pms/reservations/?user=6552614495846400&start=${startDate}&end=${endDate}`
//         )

//         // 🚀 parallel execution
//         const [resourcesRes, bookingsRes] = await Promise.all([
//           resourcesRequest,
//           bookingsRequest
//         ])

//         const resourcesJson = await resourcesRes.json()
//         const bookingsJson = await bookingsRes.json()

//         if (cancelled) return

//         const normalizedBookingData =
//            bookingsJson.data.reservations?.map(parent => ({
//             ...parent,
//             startDate: dayjs(parent.start).format('YYYY-MM-DD'),
//             endDate: dayjs(parent.end).format('YYYY-MM-DD'),
//             name: 'Room Booking',
//             notes: 'Sample booking for Room-1',
//             resourceId: parent?.booking_details?.apartment_id
//           })) || []
          
//         setResources(resourcesJson?.data?.apt_build_details || [])
//         setResourcesLoaded(true)

//         setBookings(normalizedBookingData)
//         setBookingsLoaded(true)
//       } catch (err) {
//         console.error('Failed to load scheduler data', err)
//       }
//     }

//     loadData()

//     return () => {
//       cancelled = true
//     }
//   }, [startDate, daysToShow])
//     return (
//         <div className="flex-1 overflow-hidden flex flex-col">
//             <div className="flex-1 border-b-2 border-gray-300">
//             <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
//                 <h2 className="text-lg font-semibold text-blue-800">SimpleVirtualScheduler (Custom Implementation)</h2>
//                 <p className="text-sm text-blue-600">Manual virtualization without external dependencies</p>
//             </div>
//             <FilterContainer 
//               onSearchChange={setSearchTerm}
//               onBookingIdChange={setBookingIdFilter}
//               onDateChange={setStartDate}
//               onDaysChange={setDaysToShow}
//               bookings={bookings}
//             />
//             <div className="h-[82vh]">
//                 <VirtualScheduler
//                 resources={filteredResources}
//                 bookings={bookings}
//                 onBookingCreate={handleBookingCreate}
//                 onResourcesChange={setResources}
//                 startDate={startDate}
//                 daysToShow={daysToShow}
//                 cellWidth={100}
//                 rowHeight={60}
//                 />
//             </div>
//             </div> 
//          </div>
//     );
// }

// export default ReservationChart;