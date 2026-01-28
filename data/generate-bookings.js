import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load resources to get all room IDs
const resourcesPath = path.join(__dirname, 'resources.json');
const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));

// Extract all room IDs from resources
const getAllRoomIds = () => {
  const roomIds = [];
  resources.forEach(group => {
    if (group.children) {
      group.children.forEach(room => {
        roomIds.push(room.id);
      });
    }
  });
  return roomIds;
};

// Booking colors and types
const bookingTypes = [
  { color: '#40c970', channel: 'Booking Engine', type: 'confirmed' },
  { color: '#ff6b6b', channel: 'Direct', type: 'confirmed' },
  { color: '#4ecdc4', channel: 'Airbnb', type: 'confirmed' },
  { color: '#45b7d1', channel: 'Booking.com', type: 'confirmed' },
  { color: '#f9ca24', channel: 'Expedia', type: 'pending' },
  { color: '#6c5ce7', channel: 'Phone', type: 'confirmed' },
  { color: '#fd79a8', channel: 'Walk-in', type: 'confirmed' }
];

const guestNames = [
  'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emma Davis', 'James Wilson',
  'Lisa Anderson', 'David Miller', 'Jennifer Taylor', 'Robert Garcia', 'Maria Rodriguez',
  'William Martinez', 'Elizabeth Lopez', 'Christopher Lee', 'Jessica White', 'Daniel Harris',
  'Ashley Clark', 'Matthew Lewis', 'Amanda Walker', 'Anthony Hall', 'Stephanie Allen'
];

// Generate random date within next 15 days
const getRandomDate = (startOffset = 0, maxDays = 15) => {
  const today = new Date();
  const randomDays = Math.floor(Math.random() * maxDays) + startOffset;
  const date = new Date(today);
  date.setDate(today.getDate() + randomDays);
  return date.toISOString().split('T')[0];
};

// Generate booking duration (1-7 days)
const getRandomDuration = () => Math.floor(Math.random() * 7) + 1;

// Generate realistic booking data
const generateBookings = () => {
  const bookings = [];
  const roomIds = getAllRoomIds();
  let bookingId = 5342061332004864;
  
  // Generate 1-3 bookings per room (realistic occupancy)
  roomIds.forEach((roomId, index) => {
    const numBookings = Math.floor(Math.random() * 3) + 1; // 1-3 bookings per room
    
    for (let i = 0; i < numBookings; i++) {
      const bookingType = bookingTypes[Math.floor(Math.random() * bookingTypes.length)];
      const guestName = guestNames[Math.floor(Math.random() * guestNames.length)];
      const startDate = getRandomDate(i * 2, 15); // Spread bookings across 15 days
      const duration = getRandomDuration();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);
      
      const booking = {
        "Lead_Source_icon": "false",
        "backColor": bookingType.color,
        "barHidden": "true",
        "booking_id": bookingId + index * 10 + i,
        "bubbleHtml": `{'rooms': '1', 'price': '${Math.floor(Math.random() * 500) + 100}', 'paid': '${Math.floor(Math.random() * 800) + 200}.0', 'days': '${duration}', 'start': '${startDate} 00:00', 'end': '${endDate.toISOString().split('T')[0]} 00:00', 'name': '${guestName}', 'phone': '+1${Math.floor(Math.random() * 9000000000) + 1000000000}', 'email': '${guestName.toLowerCase().replace(' ', '.')}@example.com', 'apartment': 'Room ${roomId}', 'booking_type': '${bookingType.type}', 'booking_key': '${bookingId + index * 10 + i}', 'adult_count': '${Math.floor(Math.random() * 3) + 1}', 'child_count': '${Math.floor(Math.random() * 2)}', 'nightly_rate': '${Math.floor(Math.random() * 200) + 50}.0', 'enq_app_id': '', 'enq_model_id': '#', 'split_booking': 'False', 'apartment_id': '${Math.floor(Math.random() * 9000000000) + 1000000000}', 'booked_by': '${bookingType.channel}', 'reserved_till': 'NA', 'checkin_status': '${Math.random() > 0.7 ? 'checked_in' : 'pending'}', 'checkout_status': 'NA', 'guarantee': '${Math.random() > 0.5 ? 'true' : 'false'}', 'open_case': 'false', 'open_task': 'false', 'guest_key': '${Math.floor(Math.random() * 9000000000) + 1000000000}', 'sales_channel': '${bookingType.channel}', 'cancellation_policy': '${Math.random() > 0.5 ? 'Flexible' : 'Strict'}', 'notes': '${Math.random() > 0.7 ? 'Special requests noted' : ''}', 'Lead_Source': '${bookingType.channel}', 'reservation_id': ${Math.floor(Math.random() * 9000000000) + 1000000000}, 'channex_id': '', 'booking_notes': '${Math.random() > 0.8 ? 'VIP Guest' : 'Standard'}'}`,
        "consider_for_overbooking": "true",
        "cssClass": "",
        "end": `${endDate.toISOString().split('T')[0]}T00:00:00`,
        "guarantee": Math.random() > 0.5 ? "true" : "false",
        "id": `${bookingId + index * 10 + i}`,
        "is_split": "false",
        "open_case": "false",
        "open_task": "false",
        "requires_attention": Math.random() > 0.9,
        "resourceId": roomId,
        "sales_channel": bookingType.channel,
        "start": `${startDate}T00:00:00`,
        "tags": bookingType.channel,
        "text": guestName,
        "startDate": startDate,
        "endDate": endDate.toISOString().split('T')[0],
        "name": `${guestName} - ${bookingType.channel}`,
        "notes": Math.random() > 0.7 ? `${duration} night stay via ${bookingType.channel}` : `Standard booking`
      };
      
      bookings.push(booking);
    }
  });
  
  return bookings;
};

// Generate and save bookings
const bookings = generateBookings();
const outputPath = path.join(__dirname, 'bookings.json');

fs.writeFileSync(outputPath, JSON.stringify(bookings, null, 2));
console.log(`Generated ${bookings.length} bookings for ${getAllRoomIds().length} rooms`);