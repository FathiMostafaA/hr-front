import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { holidayService } from '../../api/services/holidayService';
import { useNotification } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';

const CreateHolidayModal = ({ isOpen, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    startDate: '',
    endDate: '',
    isPaid: true,
    country: 'Egypt'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await holidayService.createHoliday(formData);
      showNotification('Holiday created successfully', 'success');
      onCreated();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to create holiday', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Add New Holiday</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="holidayForm" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 focus-within:text-accent">
                <label className="text-sm font-medium text-slate-700">Name (English) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                  placeholder="e.g. Eid Al-Fitr"
                />
              </div>
              <div className="space-y-1.5 focus-within:text-accent">
                <label className="text-sm font-medium text-slate-700">Name (Arabic)</label>
                <input
                  type="text"
                  name="nameAr"
                  value={formData.nameAr}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-right dir-rtl font-arabic"
                  placeholder="مثال: عيد الفطر"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 focus-within:text-accent">
                <label className="text-sm font-medium text-slate-700">Start Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                />
              </div>
              <div className="space-y-1.5 focus-within:text-accent">
                <label className="text-sm font-medium text-slate-700">End Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={formData.startDate}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5 focus-within:text-accent">
              <label className="text-sm font-medium text-slate-700">Country <span className="text-red-500">*</span></label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors bg-white"
              >
                <option value="Egypt">Egypt</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    name="isPaid"
                    checked={formData.isPaid}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-slate-300 text-accent focus:ring-accent transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <div className="font-medium text-slate-800">Paid Public Holiday</div>
                  <div className="text-xs text-slate-500">Employees will not be deducted for this day</div>
                </div>
              </label>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 mt-auto">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="holidayForm" isLoading={loading}>
            Create Holiday
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateHolidayModal;
