import React, { useMemo, useState } from 'react'

const FilterBar = ({ searchTerm, onSearchChange, onClearFilters, bookings, selectedBookingId, onBookingIdChange }) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // Get booking ID suggestions based on input
  const bookingSuggestions = useMemo(() => {
    if (!selectedBookingId) return []
    return bookings
      .filter(booking => booking.booking_id.toString().includes(selectedBookingId))
      .slice(0, 10)
      .map(booking => ({
        id: booking.booking_id,
        name: booking.name || booking.text,
        resourceId: booking.resourceId
      }))
  }, [bookings, selectedBookingId])
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Booking ID Search */}
        <div className="min-w-48 relative">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.023.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <input
              type="text"
              placeholder="Search booking ID..."
              value={selectedBookingId}
              onChange={(e) => {
                onBookingIdChange(e.target.value)
                setShowSuggestions(e.target.value.length > 0)
              }}
              onFocus={() => setShowSuggestions(selectedBookingId.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && bookingSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {bookingSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => {
                    onBookingIdChange(suggestion.id.toString())
                    setShowSuggestions(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
                >
                  <div className="font-medium">{suggestion.id}</div>
                  <div className="text-gray-600 text-xs">{suggestion.name} - {suggestion.resourceId}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || selectedBookingId) && (
          <button
            onClick={onClearFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

export default FilterBar