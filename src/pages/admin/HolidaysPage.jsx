import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { holidayService } from '../../api/services/holidayService';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import CreateHolidayModal from './CreateHolidayModal';

const HolidaysPage = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const data = await holidayService.getAllHolidays();
      setHolidays(data || []);
    } catch (error) {
      showNotification('Failed to fetch holidays', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredHolidays = holidays.filter(h => 
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (h.nameAr && h.nameAr.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Holiday Management</h1>
          <p className="text-slate-500 mt-1">Manage public holidays and business closure days</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Holiday
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search holidays..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Holiday Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                    Loading holidays...
                  </td>
                </tr>
              ) : filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <CalendarDays className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-base font-medium text-slate-900">No holidays found</p>
                      <p className="text-sm mt-1">Try adjusting your search or add a new holiday.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((holiday) => {
                  const start = new Date(holiday.startDate);
                  const end = new Date(holiday.endDate);
                  const diffTime = Math.abs(end - start);
                  const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                  
                  return (
                    <tr key={holiday.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{holiday.name}</div>
                        {holiday.nameAr && <div className="text-sm text-slate-500 font-arabic">{holiday.nameAr}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {start.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {end.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {duration} {duration === 1 ? 'day' : 'days'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          holiday.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {holiday.isPaid ? 'Paid Time Off' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateHolidayModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          setIsModalOpen(false);
          fetchHolidays();
        }}
      />
    </div>
  );
};

export default HolidaysPage;
