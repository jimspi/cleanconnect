import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

export default function Calendar({ events, userType }) {
  // Transform cleaning requests into calendar events
  const calendarEvents = events.map(request => {
    let title = request.properties?.property_name || 'Property Cleaning'
    
    if (userType === 'cleaner' && request.status === 'pending') {
      title = `🔔 ${title} (Pending)`
    } else if (request.status === 'approved') {
      title = `🧹 ${title}`
    } else if (request.status === 'completed') {
      title = `✅ ${title} (Completed)`
    }

    // Create start date/time
    let start = new Date(request.checkout_date)
    if (request.checkout_time) {
      const [hours, minutes] = request.checkout_time.split(':')
      start.setHours(parseInt(hours), parseInt(minutes))
    } else {
      start.setHours(10, 0) // Default to 10 AM if no time specified
    }

    // End time is typically 2-3 hours later for cleaning
    const end = new Date(start)
    end.setHours(start.getHours() + 3)

    return {
      id: request.id,
      title,
      start,
      end,
      resource: request,
      className: `rbc-event-${request.status}`
    }
  })

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3b82f6' // Default blue
    
    switch (event.resource.status) {
      case 'pending':
        backgroundColor = '#f59e0b' // Yellow
        break
      case 'approved':
        backgroundColor = '#10b981' // Green
        break
      case 'completed':
        backgroundColor = '#6b7280' // Gray
        break
      case 'declined':
        backgroundColor = '#ef4444' // Red
        break
    }

    return {
      style: {
        backgroundColor,
        borderColor: backgroundColor,
        color: 'white',
        border: 'none',
        borderRadius: '4px'
      }
    }
  }

  const handleSelectEvent = (event) => {
    // You can add event details modal here
    console.log('Selected event:', event)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Calendar</h2>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span>Approved</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-500 rounded mr-2"></div>
            <span>Completed</span>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4" style={{ height: '600px' }}>
        {calendarEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-600">
                {userType === 'landlord' 
                  ? 'Create cleaning requests to see them on your calendar'
                  : 'Accept cleaning requests to see them in your schedule'
                }
              </p>
            </div>
          </div>
        ) : (
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventStyleGetter}
            views={['month', 'week', 'day']}
            defaultView="month"
            popup
            showMultiDayTimes
            step={60}
            timeslots={1}
          />
        )}
      </div>
    </div>
  )
}
