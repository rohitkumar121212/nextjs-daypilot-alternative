import React, { useState, useEffect } from 'react'
import { daysBetween } from '../utils/dateUtils'

/**
 * BookingModal - Modal dialog for creating/editing bookings
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Object} props.selection - Selection object with resourceId, startDate, endDate
 * @param {Object} props.booking - Existing booking object (for editing)
 * @param {Object} props.resource - Resource object for the selected resource
 * @param {Function} props.onClose - Handler to close the modal
 * @param {Function} props.onConfirm - Handler to confirm booking creation/update
 */
const BookingModal = ({ isOpen, selection, booking, resource, onClose, onConfirm }) => {
  const [bookingName, setBookingName] = useState('')
  const [notes, setNotes] = useState('')
  
  const isEditing = !!booking
  const modalData = booking || selection
  
  useEffect(() => {
    if (isOpen && booking) {
      // Editing existing booking
      setBookingName(booking.text || booking.name || '')
      setNotes(booking.notes || '')
    } else if (isOpen) {
      // Creating new booking
      setBookingName('')
      setNotes('')
    }
  }, [isOpen, booking])
  
  if (!isOpen || !modalData || !resource) return null
  
  const dayCount = daysBetween(modalData.startDate, modalData.endDate)
  
  const handleConfirm = () => {
    if (bookingName.trim()) {
      onConfirm({
        ...(booking || {}), // Include existing booking data if editing
        resourceId: modalData.resourceId,
        startDate: modalData.startDate,
        endDate: modalData.endDate,
        text: bookingName,  // Use 'text' field instead of 'name'
        notes: notes
      })
      onClose()
    }
  }
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Booking' : 'Create Booking'}
          </h2>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Resource info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource
            </label>
            <div className="text-gray-900 font-medium">{resource.name}</div>
          </div>
          
          {/* Date range info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <div className="text-gray-900">
              {modalData.startDate} to {modalData.endDate}
              <span className="text-gray-500 ml-2">({dayCount} {dayCount === 1 ? 'day' : 'days'})</span>
            </div>
          </div>
          
          {/* Booking name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bookingName}
              onChange={(e) => setBookingName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter booking name"
              autoFocus
            />
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes (optional)"
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!bookingName.trim()}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isEditing ? 'Update Booking' : 'Create Booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingModal

