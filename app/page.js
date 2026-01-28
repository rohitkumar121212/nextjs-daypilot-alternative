'use client'

import React, { useState, useMemo, useEffect } from 'react'
import VirtualizedScheduler from '../components/VirtualizedScheduler'
import dayjs from 'dayjs'

export default function Home() {
  const [resources, setResources] = useState([])
  const [bookings, setBookings] = useState([])
  const [resourcesLoaded, setResourcesLoaded] = useState(false)
  const [bookingsLoaded, setBookingsLoaded] = useState(false)

  const handleBookingCreate = (bookingData) => {
    const newBooking = {
      id: bookings.length + 1,
      ...bookingData
    }
    setBookings(prev => [...prev, newBooking])
  }

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const resourcesRequest = fetch(
          'https://aperfectstay.ai/api/aps-pms/apts/?user=4789839916433408&start=2026-01-20'
        )

        const bookingsRequest = fetch(
          'https://aperfectstay.ai/api/aps-pms/reservations/?user=4789839916433408&start=2026-01-20&end=2026-02-20'
        )

        const [resourcesRes, bookingsRes] = await Promise.all([
          resourcesRequest,
          bookingsRequest
        ])

        const resourcesJson = await resourcesRes.json()
        const bookingsJson = await bookingsRes.json()

        if (cancelled) return

        const normalizedBookingData =
           bookingsJson.data.reservations?.map(parent => ({
            ...parent,
            startDate: dayjs(parent.start).format('YYYY-MM-DD'),
            endDate: dayjs(parent.end).format('YYYY-MM-DD'),
            name: 'Room Booking',
            notes: 'Sample booking for Room-1',
            resourceId: parent?.booking_details?.apartment_id
          })) || []
          
        console.log("Normalized resources:", resourcesJson?.data?.apt_build_details)
        console.log("bookingData:", normalizedBookingData)
        
        setResources(resourcesJson?.data?.apt_build_details || [])
        setResourcesLoaded(true)

        setBookings(normalizedBookingData)
        setBookingsLoaded(true)
      } catch (err) {
        console.error('Failed to load scheduler data', err)
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const validBookings = useMemo(() => {
    if (!resourcesLoaded) return []

    const resourceIds = new Set()
    resources.forEach(parent => {
      parent.children?.forEach(child => {
        resourceIds.add(child.id)
      })
    })

    return bookings.filter(b => resourceIds.has(b.resourceId))
  }, [bookings, resources, resourcesLoaded])

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Resource Scheduler
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Click and drag to select date ranges for booking
        </p>
      </header>

      <div className="flex-1 overflow-hidden">
        {!resourcesLoaded ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Loading resources…
          </div>
        ) : (
          <VirtualizedScheduler
            resources={resources}
            bookings={validBookings}
            onBookingCreate={handleBookingCreate}
            onResourcesChange={setResources}
            daysToShow={15}
            cellWidth={100}
            rowHeight={60}
          />
        )}
      </div>
    </div>
  )
}