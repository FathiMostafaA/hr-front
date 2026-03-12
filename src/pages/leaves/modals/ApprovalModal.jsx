import React from 'react';
import { X, MessageSquare, XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { format } from 'date-fns';
import { cn } from '../../../utils/cn';
import { getLeaveTypeUI } from '../constants/LeaveConfig';

const ApprovalModal = ({ 
    showApprovalModal, 
    onClose, 
    approvalComment, 
    setApprovalComment, 
    handleReject, 
    handleApprove, 
    isSubmitting 
}) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 relative">
                    <div className="absolute top-8 right-8">
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-slate-900">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Review Request</h2>
                    <p className="text-slate-500 mt-1 font-medium">Verify and respond to the application</p>
                </div>

                <div className="p-8 space-y-6">
                    {/* Request Details */}
                    <div className="space-y-4 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100/50 shadow-inner">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Employee</span>
                            <span className="text-sm font-black text-slate-900">{showApprovalModal.employeeName}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Type</span>
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const ui = getLeaveTypeUI(showApprovalModal.leaveTypeCode);
                                    const Icon = ui.icon;
                                    return (
                                        <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm", ui.bgLight, ui.textColor)}>
                                            <Icon className="w-3 h-3" />
                                            {showApprovalModal.leaveTypeName}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Duration</span>
                            <span className="text-sm font-bold text-slate-700">
                                {format(new Date(showApprovalModal.startDate), 'MMM d')} - {format(new Date(showApprovalModal.endDate), 'MMM d, yyyy')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Working Days</span>
                            <div className="px-4 py-2 bg-accent/10 rounded-xl text-accent border border-accent/20">
                                <span className="text-2xl font-black">{showApprovalModal.workingDays}</span>
                                <span className="text-[9px] uppercase font-black ml-1.5 opacity-70">Days</span>
                            </div>
                        </div>
                        {showApprovalModal.reason && (
                            <div className="pt-3">
                                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-2">Reason</span>
                                <div className="p-4 bg-white/50 rounded-xl border border-slate-200 italic text-sm text-slate-600 leading-relaxed shadow-sm">
                                    "{showApprovalModal.reason}"
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                            Add a Response Tip
                        </label>
                        <div className="relative group">
                            <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-slate-400 group-focus-within:text-accent transition-colors" />
                            <textarea
                                rows={2}
                                value={approvalComment}
                                onChange={e => setApprovalComment(e.target.value)}
                                placeholder="Write an internal note or message to the employee..."
                                className="w-full pl-11 pr-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-2xl py-7 text-sm font-bold border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
                            disabled={isSubmitting}
                            onClick={() => handleReject(showApprovalModal.id)}
                        >
                            <XCircle className="w-5 h-5 mr-2" />
                            REJECT
                        </Button>
                        <Button
                            variant="accent"
                            className="flex-1 rounded-2xl py-7 text-sm font-black shadow-lg shadow-accent/20 hover:shadow-xl transition-all"
                            disabled={isSubmitting}
                            onClick={() => handleApprove(showApprovalModal.id)}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    APPROVE
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApprovalModal;
