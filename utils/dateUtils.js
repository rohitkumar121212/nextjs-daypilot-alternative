import dayjs from 'dayjs'

/**
 * Generate array of dates for the visible timeline
 * @param {number} days - Number of days to generate (default: 30)
 * @param {string} startDate - Start date in YYYY-MM-DD format (optional)
 * @returns {Array} Array of date strings in YYYY-MM-DD format
 */
export const generateDateRange = (days = 30, startDate = null) => {
  const start = startDate ? dayjs(startDate) : dayjs()
  const dates = []
  
  for (let i = 0; i < days; i++) {
    dates.push(start.add(i, 'day').format('YYYY-MM-DD'))
  }
  
  return dates
}

/**
 * Format date for display in header
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Object} Object with day name, day number, and month
 */
export const formatDateHeader = (dateStr) => {
  const date = dayjs(dateStr)
  return {
    dayName: date.format('ddd'),
    dayNumber: date.format('D'),
    month: date.format('MMM'),
    isToday: date.isSame(dayjs(), 'day')
  }
}

/**
 * Calculate number of days between two dates (inclusive)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {number} Number of days
 */
export const daysBetween = (startDate, endDate) => {
  return dayjs(endDate).diff(dayjs(startDate), 'day') + 1
}

/**
 * Get date index in the dates array
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {Array<string>} dates - Array of date strings
 * @returns {number} Index of the date, or -1 if not found
 */
export const getDateIndex = (dateStr, dates) => {
  return dates.findIndex(d => d === dateStr)
}

/**
 * Check if a date is within a range (inclusive)
 * @param {string} dateStr - Date to check
 * @param {string} startDate - Range start
 * @param {string} endDate - Range end
 * @returns {boolean}
 */
export const isDateInRange = (dateStr, startDate, endDate) => {
  const date = dayjs(dateStr)
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  
  return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
}

