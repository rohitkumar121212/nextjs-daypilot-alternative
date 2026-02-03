import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { MultiGrid } from 'react-virtualized'
import 'react-virtualized/styles.css'
import DateHeader from './DateHeader'
import BookingModal from './BookingModal'
import FilterBar from './FilterBar'
import GridBookingCell from './GridBookingCell'
import { generateDateRange, getDateIndex } from '../utils/dateUtils'

const VirtualizedScheduler = ({
  resources = [],
  bookings = [],
  onBookingCreate,
  onResourcesChange,
  daysToShow = 60,
  cellWidth = 100,
  rowHeight = 60
}) => {
  const dates = useMemo(() => generateDateRange(daysToShow), [daysToShow])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [selection, setSelection] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const mouseDownRef = useRef(false)
  const startDateRef = useRef(null)
  const startResourceIdRef = useRef(null)

  const visibleRows = useMemo(() => {
    let filteredResources = resources
    
    if (selectedBookingId) {
      const matchingBookings = bookings.filter(booking => 
        booking.booking_id.toString().includes(selectedBookingId)
      )
      const matchingResourceIds = new Set(matchingBookings.map(b => b.resourceId))
      
      filteredResources = resources.map(parent => ({
        ...parent,
        expanded: true,
        children: (parent.children || []).filter(child => 
          matchingResourceIds.has(child.id)
        )
      })).filter(parent => parent.children.length > 0)
    }
    
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
      const parentRow = { ...parent, type: 'parent' }
      if (!parent.expanded) return [parentRow]

      const children = (parent.children || [])
        .filter(child => !searchTerm || child.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .map(child => ({ ...child, parentId: parent.id, type: 'child' }))

      return [parentRow, ...children]
    })
  }, [resources, searchTerm, selectedBookingId, bookings])

  const handleCellMouseDown = useCallback((date, resourceId, e) => {
    e.preventDefault()
    mouseDownRef.current = true
    startDateRef.current = date
    startResourceIdRef.current = resourceId

    setIsSelecting(true)
    setSelection({ resourceId, startDate: date, endDate: date })
  }, [])

  const handleCellMouseEnter = useCallback((date, resourceId) => {
    if (!mouseDownRef.current || !isSelecting) return
    if (resourceId !== startResourceIdRef.current) return

    setSelection(prev => prev ? { ...prev, endDate: date } : null)
  }, [isSelecting])

  const handleBookingClick = useCallback((booking) => {
    setSelectedBooking(booking)
    setSelection(null)
    setModalOpen(true)
  }, [])

  const handleToggleExpand = useCallback((parentId) => {
    onResourcesChange?.(
      resources.map(r =>
        r.id === parentId ? { ...r, expanded: !r.expanded } : r
      )
    )
  }, [resources, onResourcesChange])

  useEffect(() => {
    const onMouseUp = (e) => {
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

    window.addEventListener('mouseup', onMouseUp)
    return () => window.removeEventListener('mouseup', onMouseUp)
  }, [selection, dates])

  const handleModalClose = useCallback(() => {
    setModalOpen(false)
    setSelection(null)
    setSelectedBooking(null)
    mouseDownRef.current = false
    setIsSelecting(false)
  }, [])

  const handleBookingConfirm = useCallback((data) => {
    onBookingCreate?.(data)
    handleModalClose()
  }, [onBookingCreate, handleModalClose])

  const multiGridRef = useRef(null)
  const RESOURCE_COLUMN_WIDTH = 200
  const HEADER_HEIGHT = 50
  const OVERSCAN_COLUMN_COUNT = 5
  const OVERSCAN_ROW_COUNT = 3
  
  const cellRenderer = ({ columnIndex, key, rowIndex, style }) => {
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
    
    const row = visibleRows[rowIndex - 1]
    if (!row) return null
    
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
    
    const date = dates[columnIndex - 1]
    return (
      <div key={key} style={style} className="border-b border-gray-200 relative">
        <div 
          className="w-full h-full border-r border-gray-100 hover:bg-blue-50 cursor-pointer flex items-center justify-center"
          data-date={date}
          data-resource-id={row.id}
          onMouseDown={(e) => handleCellMouseDown(date, row.id, e)}
          onMouseEnter={() => handleCellMouseEnter(date, row.id)}
        >
          {bookings
            .filter(b => b.resourceId === row.id)
            .filter(booking => {
              // Subtract 1 day from endDate since checkout date should not be included
              const displayEndDate = new Date(new Date(booking.endDate).getTime() - 24 * 60 * 60 * 1000)
                .toISOString().split('T')[0]
              
              // Show booking if it overlaps with visible range using same logic as BookingBlock
              const startIdx = dates.indexOf(booking.startDate)
              const endIdx = dates.indexOf(displayEndDate)
              
              const bookingStartsBeforeRange = startIdx === -1 && booking.startDate < dates[0]
              const bookingEndsAfterRange = endIdx === -1 && displayEndDate > dates[dates.length - 1]
              const bookingSpansEntireRange = bookingStartsBeforeRange && bookingEndsAfterRange
              const bookingOverlapsRange = startIdx !== -1 || endIdx !== -1 || bookingSpansEntireRange
              
              return bookingOverlapsRange
            })
            .filter(booking => {
              // Only render on the first visible date of the booking
              const startIdx = dates.indexOf(booking.startDate)
              const visibleStartIdx = Math.max(0, startIdx === -1 ? 0 : startIdx)
              return dates[visibleStartIdx] === date
            })
            .map(booking => (
              <GridBookingCell
                key={booking.id}
                booking={booking}
                dates={dates}
                cellWidth={cellWidth}
                onBookingClick={handleBookingClick}
              />
            ))
          }
        </div>
      </div>
    )
  }

  const containerHeight = 500

  return (
    <div className="w-full h-full flex flex-col bg-white select-none">
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