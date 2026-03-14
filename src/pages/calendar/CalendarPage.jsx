import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { calendarService } from '../../api/services/calendarService';
import { useNotification } from '../../context/NotificationContext';
import EventDetailsModal from './EventDetailsModal';
import { toast } from 'react-hot-toast';

const CalendarPage = () => {
  const { connection } = useNotification();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (!connection) return;

    connection.emit('joinRoom', 'calendar');

    const handleRefresh = () => {
      console.log('Refreshing calendar due to real-time update');
      fetchEvents();
    };

    connection.on('LeaveRequested', handleRefresh);
    connection.on('LeaveUpdated', handleRefresh);
    connection.on('HolidayCreated', handleRefresh);

    return () => {
      connection.emit('leaveRoom', 'calendar');
      connection.off('LeaveRequested', handleRefresh);
      connection.off('LeaveUpdated', handleRefresh);
      connection.off('HolidayCreated', handleRefresh);
    };
  }, [connection]);

  const fetchEvents = async (year, month) => {
    try {
      setLoading(true);
      // If we don't pass year/month, the backend defaults to current
      const data = await calendarService.getEvents(year, month);
      
      const formattedEvents = data.map(evt => ({
        id: evt.id,
        title: evt.title,
        start: evt.startDate,
        end: evt.endDate, // FullCalendar needs end date to be exclusive for allDay, so it works out well since the backend adds 1 day
        allDay: true,
        backgroundColor: evt.type === 'holiday' ? '#10b981' : '#3b82f6', // emerald-500 vs blue-500
        borderColor: evt.type === 'holiday' ? '#059669' : '#2563eb',
        textColor: '#ffffff',
        extendedProps: {
          type: evt.type,
          employeeName: evt.employeeName
        }
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleDatesSet = (dateInfo) => {
    // Determine the year and month that is *currently* being displayed centrally
    // We add 15 days to the start date to ensure we hit the true active month
    const activeDate = new Date(dateInfo.start.getTime() + 15 * 24 * 60 * 60 * 1000);
    fetchEvents(activeDate.getFullYear(), activeDate.getMonth() + 1);
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company Calendar</h1>
        <p className="text-slate-500 mt-1">View public holidays and approved employee leaves</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500"></div>
            <span className="text-sm text-slate-600 font-medium">Public Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-sm text-slate-600 font-medium">Employee Leave</span>
          </div>
        </div>

        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            height="auto"
            dayMaxEvents={3}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
          />
        </div>
      </div>

      <EventDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        event={selectedEvent}
      />
      
      <style>{`
        /* Minimal custom styling mapping FullCalendar to generic UI style */
        .fc-theme-standard th {
          border-color: #e2e8f0;
          padding: 12px 0;
          background-color: #f8fafc;
          color: #475569;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
        }
        .fc-theme-standard td, .fc-theme-standard .fc-scrollgrid {
          border-color: #e2e8f0;
        }
        .fc .fc-button-primary {
          background-color: #0f172a;
          border-color: #0f172a;
          transition: background-color 0.2s;
        }
        .fc .fc-button-primary:hover {
          background-color: #334155;
          border-color: #334155;
        }
        .fc .fc-button-primary:disabled {
          background-color: #94a3b8;
          border-color: #94a3b8;
        }
        .fc-event {
          cursor: pointer;
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .fc-daygrid-day-number {
          padding: 8px !important;
          color: #334155;
          font-weight: 500;
        }
        .fc-day-today {
          background-color: #f0fdf4 !important;
        }
        .fc-col-header-cell {
            padding: 1rem 0;
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
