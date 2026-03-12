import React from 'react';
import { format } from 'date-fns';
import { FileWarning, X, AlertCircle, Plus } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { getLeaveTypeUI, StatusBadge } from '../constants/LeaveConfig';

const LeaveRequestsTable = ({ 
    filteredRequests, 
    user, 
    viewMode, 
    onCancel, 
    onHRCancel, 
    onShowModal 
}) => {
    if (filteredRequests.length === 0) {
        return (
            <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                    <AlertCircle className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-base font-bold text-slate-600">No leave requests yet</h3>
                <p className="text-sm text-slate-400 mt-1 mb-6">Your history will appear here once you apply.</p>
                <Button variant="accent" size="sm" className="rounded-xl px-6" onClick={onShowModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Launch First Request
                </Button>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">
                            <th className="px-6 py-4 border-b border-slate-100">Type</th>
                            <th className="px-6 py-4 border-b border-slate-100">Duration</th>
                            <th className="px-6 py-4 border-b border-slate-100">Days</th>
                            <th className="px-6 py-4 border-b border-slate-100">Reason</th>
                            <th className="px-6 py-4 border-b border-slate-100 text-center">Status</th>
                            <th className="px-6 py-4 border-b border-slate-100">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredRequests.map((req) => {
                            const ui = getLeaveTypeUI(req.leaveTypeCode);
                            const Icon = ui.icon;
                            return (
                                <tr key={req.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-xl group-hover:scale-110 transition-transform duration-300", ui.bgLight, ui.textColor)}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-900">
                                                    {user?.language === 'ar' ? req.leaveTypeNameAr : req.leaveTypeName}
                                                </span>
                                                {req.leaveTypeNameAr && user?.language !== 'ar' && (
                                                    <span className="text-[10px] text-slate-400 font-medium">{req.leaveTypeNameAr}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-700">
                                                {format(new Date(req.startDate), 'MMM d, yyyy')}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
                                                to {format(new Date(req.endDate), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-black text-slate-900">{req.workingDays}</span>
                                            <span className="text-[10px] text-slate-400 font-semibold italic">days</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-sm text-slate-500 max-w-[180px] break-words">
                                            {req.reason || <span className="text-slate-300 italic opacity-50 text-xs">No reason provided</span>}
                                        </p>
                                        {req.attachmentUrl && (
                                            <a
                                                href={req.attachmentUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded w-max flex items-center gap-1 hover:bg-accent hover:text-white transition-all"
                                            >
                                                <FileWarning className="w-3 h-3" />
                                                Review Doc
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <StatusBadge status={req.status} />
                                    </td>
                                    <td className="px-6 py-5">
                                        {req.status === 'Pending' ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 group-hover:scale-105 transition-all font-bold text-[10px]"
                                                onClick={() => viewMode === 'organization' ? onHRCancel(req.id) : onCancel(req.id)}
                                            >
                                                <X className="w-3 h-3 mr-1" />
                                                CANCEL
                                            </Button>
                                        ) : req.status === 'Approved' && viewMode === 'organization' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 rounded-lg text-rose-500 hover:bg-rose-50 group-hover:scale-105 transition-all font-bold text-[10px]"
                                                onClick={() => onHRCancel(req.id)}
                                            >
                                                HR CANCEL
                                            </Button>
                                        ) : req.approverName ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">
                                                    {req.approverName.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-slate-700">{req.approverName}</span>
                                                    {req.approvalComments && <span className="text-[9px] text-slate-400 italic truncate max-w-[100px]">"{req.approvalComments}"</span>}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest text-center block">Fixed</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                    const ui = getLeaveTypeUI(req.leaveTypeCode);
                    const Icon = ui.icon;
                    return (
                        <div key={req.id} className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-xl", ui.bgLight, ui.textColor)}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900">
                                            {user?.language === 'ar' ? req.leaveTypeNameAr : req.leaveTypeName}
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                            {format(new Date(req.startDate), 'MMM d')} - {format(new Date(req.endDate), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={req.status} />
                            </div>
                            {viewMode === 'organization' && (
                                <div className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded block w-full mt-2">
                                    Employee: {req.employeeName}
                                </div>
                            )}
                            {(req.status === 'Pending' || (req.status === 'Approved' && viewMode === 'organization')) && (
                                <Button
                                    variant="ghost"
                                    className="w-full h-10 rounded-xl text-rose-500 bg-rose-50 border border-rose-100 font-bold text-xs"
                                    onClick={() => viewMode === 'organization' ? onHRCancel(req.id) : onCancel(req.id)}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    {viewMode === 'organization' ? 'HR CANCEL' : 'CANCEL REQUEST'}
                                </Button>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-slate-900">{req.workingDays}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Working Days</span>
                                </div>
                                {req.approverName && (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                        {req.approverName}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default LeaveRequestsTable;
