import React from 'react';
import { X, Calendar, Clock, User, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import Button from '../../components/ui/Button';

const EventDetailsModal = ({ isOpen, onClose, event }) => {
  if (!isOpen || !event) return null;

  const isHoliday = event.extendedProps.type === 'holiday';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-200 ${isHoliday ? 'bg-emerald-50' : 'bg-blue-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isHoliday ? 'bg-emerald-100' : 'bg-blue-100'}`}>
              {isHoliday ? (
                <Briefcase className={`w-5 h-5 ${isHoliday ? 'text-emerald-600' : 'text-blue-600'}`} />
              ) : (
                <User className={`w-5 h-5 ${isHoliday ? 'text-emerald-600' : 'text-blue-600'}`} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{isHoliday ? 'Public Holiday' : 'Employee Leave'}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors bg-white/50 backdrop-blur-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{event.title}</h3>
            {event.extendedProps.employeeName && (
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <User className="w-4 h-4" />
                {event.extendedProps.employeeName}
              </p>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-3 border border-slate-100">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Duration</p>
                <p className="text-sm text-slate-600">
                  {format(event.start, 'MMM dd, yyyy')} 
                  {event.end && event.end.getTime() !== event.start.getTime() ? ` - ${format(new Date(event.end.getTime() - 86400000), 'MMM dd, yyyy')}` : ''}
                </p>
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
