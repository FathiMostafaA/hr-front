import React from 'react';
import { X, Calendar as CalendarIcon, CalendarCheck, FileWarning, UploadCloud, Send, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { getLeaveTypeUI } from '../constants/LeaveConfig';

const ApplyLeaveModal = ({ 
    onClose, 
    isAdmin, 
    employees, 
    leaveTypes, 
    form, 
    setForm, 
    onSubmit, 
    isSubmitting, 
    userLanguage,
    calculateDays,
    balanceSummaryAll = [],
    currentYear,
    currentEmployeeId
}) => {
    const selectedEmployeeSummary = isAdmin && form.employeeId && balanceSummaryAll.find(s => 
        (s.employeeId || s.EmployeeId) === form.employeeId
    );
    const selectedBalances = selectedEmployeeSummary?.balances || selectedEmployeeSummary?.Balances || [];

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="relative p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="absolute top-8 right-8">
                        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-slate-900">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">
                        {isAdmin ? 'إضافة إجازة لموظف' : 'طلب إجازة'}
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">
                        {isAdmin ? 'اختر الموظف ثم نوع الإجازة والتواريخ. كل موظف له أرصدته الخاصة.' : 'اختر النوع والتواريخ.'}
                    </p>
                </div>

                <form onSubmit={onSubmit} className="p-8 space-y-6">
                    {/* Employee Selector (HR/Admin only) - required so admin can add leave for any employee */}
                    {isAdmin && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">الموظف *</label>
                            <select
                                value={form.employeeId}
                                onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none appearance-none cursor-pointer border-r-[16px] border-transparent"
                                required
                            >
                                <option value="">اختر الموظف...</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.firstName} {emp.lastName} — {emp.departmentName || 'بدون قسم'}
                                    </option>
                                ))}
                            </select>
                            {selectedBalances.length > 0 && (
                                <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">رصيد الموظف الحالي ({currentYear})</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedBalances.map((b, i) => {
                                            const remaining = b.remainingDays ?? b.RemainingDays ?? 0;
                                            const total = b.totalEntitledDays ?? b.TotalEntitledDays ?? 0;
                                            const name = b.leaveTypeName || b.LeaveTypeName || leaveTypes.find(t => t.id === b.leaveTypeId)?.name || '—';
                                            return (
                                                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700">
                                                    {name}: {remaining}/{total}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Leave Type */}
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">نوع الإجازة</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {leaveTypes.map(type => {
                                const ui = getLeaveTypeUI(type.code);
                                const Icon = ui.icon;
                                const isSelected = form.leaveTypeId === type.id;
                                return (
                                    <button
                                        type="button"
                                        key={type.id}
                                        onClick={() => setForm(f => ({ ...f, leaveTypeId: type.id }))}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center gap-2 group",
                                            isSelected
                                                ? `${ui.bgLight} ${ui.textColor} border-current ring-4 ring-current/5 scale-[1.02] shadow-sm`
                                                : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        <div className={cn("p-2 rounded-xl transition-transform duration-300", isSelected ? "bg-white/50" : "bg-slate-100 group-hover:bg-white")}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-tight uppercase line-clamp-1">
                                            {userLanguage === 'ar' ? type.nameAr : type.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Half Day Toggle */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isHalfDay"
                            checked={form.isHalfDay}
                            onChange={e => setForm(f => ({ ...f, isHalfDay: e.target.checked }))}
                            className="w-4 h-4 rounded text-accent focus:ring-accent border-slate-300"
                        />
                        <label htmlFor="isHalfDay" className="text-sm font-bold text-slate-700">نصف يوم فقط</label>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">من تاريخ</label>
                            <div className="relative group">
                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent transition-colors" />
                                <input
                                    type="date"
                                    value={form.startDate}
                                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>
                        {form.isHalfDay ? (
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">الفترة</label>
                                <select
                                    value={form.halfDayPeriod}
                                    onChange={e => setForm(f => ({ ...f, halfDayPeriod: e.target.value }))}
                                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none appearance-none border-r-[16px] border-transparent"
                                >
                                    <option value="Morning">صباحية</option>
                                    <option value="Afternoon">مسائية</option>
                                </select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">إلى تاريخ</label>
                                <div className="relative group">
                                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent transition-colors" />
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                        min={form.startDate}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none"
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Days Preview */}
                    {calculateDays() > 0 && (
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-accent/5 border border-accent/10 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-xl text-accent">
                                    <CalendarCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-sm font-black text-accent block">المدة التقريبية</span>
                                    <span className="text-xs text-accent/70 font-bold uppercase tracking-tighter">أيام العمل المحسوبة</span>
                                </div>
                            </div>
                            <span className="text-3xl font-black text-accent tracking-tighter">
                                {calculateDays()} <span className="text-[10px] uppercase font-black">يوم</span>
                            </span>
                        </div>
                    )}
                    {/* Documentation */}
                    {leaveTypes.find(t => t.id === form.leaveTypeId)?.requiresDocumentation && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                            <label className="flex items-center gap-2 text-xs font-black text-rose-500 uppercase tracking-widest">
                                <FileWarning className="w-4 h-4" />
                                مرفق مطلوب
                            </label>
                            <div className="relative group">
                                <UploadCloud className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-accent transition-colors" />
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    onChange={e => setForm(f => ({ ...f, attachment: e.target.files[0] }))}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-dashed border-rose-200 rounded-2xl text-sm font-medium focus:border-accent hover:border-accent transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                                    required
                                />
                            </div>
                        </div>
                    )}
                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">السبب / ملاحظة</label>
                        <textarea
                            rows={3}
                            value={form.reason}
                            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                            placeholder="أي تفاصيل إضافية للطلب..."
                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 rounded-2xl py-7 text-sm font-bold border-slate-200 text-slate-500 hover:bg-slate-50"
                            onClick={onClose}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            variant="accent"
                            className="flex-1 rounded-2xl py-7 text-sm font-black shadow-lg shadow-accent/20 hover:shadow-xl transition-all"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    إرسال الطلب
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplyLeaveModal;
