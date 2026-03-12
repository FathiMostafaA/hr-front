import React from 'react';
import { X, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';

export const BulkInitModal = ({ onClose, currentYear, handleBulkInit, isSubmitting }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={onClose}>
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 relative">
                <div className="absolute top-8 right-8">
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-slate-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <h2 className="text-xl font-black text-slate-900 font-display tracking-tight">Bulk Initialize Balances</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Reset initial annual leave balances based on employment law</p>
            </div>
            <form onSubmit={handleBulkInit} className="p-8 space-y-6">
                <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Target Year</label>
                        <input type="number" name="year" defaultValue={currentYear} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none" required />
                     </div>
                     <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Default Base Days</label>
                        <input type="number" name="defaultDays" defaultValue="21" className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none" required />
                     </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                     <Button type="button" variant="outline" className="flex-1 rounded-2xl py-7 text-sm font-bold border-slate-200 text-slate-500 hover:bg-slate-50" onClick={onClose}>Cancel</Button>
                     <Button type="submit" variant="accent" className="flex-1 rounded-2xl py-7 text-sm font-black shadow-lg shadow-accent/20 hover:shadow-xl transition-all" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'INITIALIZE'}</Button>
                </div>
            </form>
        </div>
    </div>
);

export const CarryForwardModal = ({ onClose, currentYear, handleCarryForward, isSubmitting }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={onClose}>
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 relative">
                <div className="absolute top-8 right-8">
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-slate-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <h2 className="text-xl font-black text-slate-900 font-display tracking-tight">Carry Forward</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Transfer remaining balances to the next year</p>
            </div>
            <form onSubmit={handleCarryForward} className="p-8 space-y-6">
                <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">From Year</label>
                            <input type="number" name="fromYear" defaultValue={currentYear - 1} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none" required />
                         </div>
                         <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">To Year</label>
                            <input type="number" name="toYear" defaultValue={currentYear} className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none" required />
                         </div>
                     </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                     <Button type="button" variant="outline" className="flex-1 rounded-2xl py-7 text-sm font-bold border-slate-200 text-slate-500 hover:bg-slate-50" onClick={onClose}>Cancel</Button>
                     <Button type="submit" variant="accent" className="flex-1 rounded-2xl py-7 text-sm font-black shadow-lg shadow-accent/20 hover:shadow-xl transition-all" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'EXECUTE'}</Button>
                </div>
            </form>
        </div>
    </div>
);

export const ManualInitModal = ({ onClose, manualForm, setManualForm, employees, leaveTypes, handleManualInit, isSubmitting }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={onClose}>
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 relative">
                <div className="absolute top-8 right-8">
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-slate-900">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <h2 className="text-xl font-black text-slate-900 font-display tracking-tight">Manual Balance Init</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">Assign specific leave balance to an individual employee</p>
            </div>
            <form onSubmit={handleManualInit} className="p-8 space-y-5">
                <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Select Employee</label>
                        <select 
                            value={manualForm.employeeId} 
                            onChange={e => setManualForm(f => ({ ...f, employeeId: e.target.value }))}
                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none appearance-none border-r-[16px] border-transparent" 
                            required
                        >
                            <option value="">Choose Employee...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                            ))}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Leave Type</label>
                        <select 
                            value={manualForm.leaveTypeId} 
                            onChange={e => setManualForm(f => ({ ...f, leaveTypeId: e.target.value }))}
                            className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none appearance-none border-r-[16px] border-transparent" 
                            required
                        >
                            <option value="">Choose Type...</option>
                            {leaveTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.name} ({type.code})</option>
                            ))}
                        </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Year</label>
                            <input 
                                type="number" 
                                value={manualForm.year} 
                                onChange={e => setManualForm(f => ({ ...f, year: e.target.value }))}
                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none" 
                                required 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Total Days</label>
                            <input 
                                type="number" 
                                step="0.5"
                                value={manualForm.totalDays} 
                                onChange={e => setManualForm(f => ({ ...f, totalDays: e.target.value }))}
                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none" 
                                required 
                            />
                         </div>
                     </div>
                </div>
                <div className="flex items-center gap-4 pt-4">
                     <Button type="button" variant="outline" className="flex-1 rounded-2xl py-7 text-sm font-bold border-slate-200 text-slate-500 hover:bg-slate-50" onClick={onClose}>Cancel</Button>
                     <Button type="submit" variant="accent" className="flex-1 rounded-2xl py-7 text-sm font-black shadow-lg shadow-accent/20 hover:shadow-xl transition-all" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'INIT BALANCE'}</Button>
                </div>
            </form>
        </div>
    </div>
);
