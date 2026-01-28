# DayPilot Alternative - Resource Scheduler (Next.js)

A custom-built resource scheduler similar to DayPilot, built with Next.js App Router, React and Tailwind CSS.

## Features

- **Resource-based scheduling**: Display multiple resources (properties) in a fixed left column
- **Interactive date selection**: Click and drag to select date ranges for booking
- **Visual feedback**: Real-time selection highlighting with smooth transitions
- **Booking management**: Create and view bookings with a modal interface
- **Responsive layout**: Horizontal and vertical scrolling with sticky headers
- **Clean architecture**: Modular components with single responsibilities

## Tech Stack

- **Next.js 14** (App Router)
- **React.js** (functional components + hooks)
- **Tailwind CSS** (utility-first styling)
- **dayjs** (date manipulation)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── layout.js                # Root layout with metadata
├── page.js                  # Home page (main scheduler)
└── globals.css              # Global styles with Tailwind

components/
├── Scheduler.jsx            # Main scheduler container
├── ResourceRow.jsx          # Individual resource row
├── DateHeader.jsx           # Timeline date headers
├── DateCell.jsx             # Individual date cells
├── BookingBlock.jsx         # Existing booking visualization
├── SelectionOverlay.jsx     # Selection range overlay
├── VirtualizedScheduler.jsx # Virtualized scheduler implementation
└── BookingModal.jsx         # Booking creation modal

utils/
└── dateUtils.js             # Date utility functions

data/
├── resources.json           # Sample resource data
└── bookings.json            # Sample booking data
```

## Usage

The main scheduler is now implemented as a Next.js App Router page with client-side interactivity.

### Component API

Same API as before, but now optimized for Next.js:

**Scheduler Props:**
- `resources` (Array): Array of resource objects with `id` and `name`
- `bookings` (Array): Array of booking objects
- `onBookingCreate` (Function): Callback when a new booking is created
- `daysToShow` (Number): Number of days to display (default: 15)
- `cellWidth` (Number): Width of each date cell in pixels (default: 100)

## Migration Changes

- Migrated from Vite to Next.js 14 App Router
- Moved components to root-level `components/` directory
- Updated global styles to `app/globals.css`
- Added `'use client'` directive for interactive components
- Maintained all existing functionality and dependencies

## Browser Support

Modern browsers with ES6+ support (Chrome, Firefox, Safari, Edge)