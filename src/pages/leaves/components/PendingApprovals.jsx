import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Clock, Calendar as CalendarIcon, UserCheck } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { getLeaveTypeUI } from '../constants/LeaveConfig';

const PendingApprovals = ({ filteredPending, onReview }) => {
    if (filteredPending.length === 0) return null;

    return (
        <Card className="border-none shadow-lg shadow-amber-500/5 ring-1 ring-amber-200/50 bg-amber-50/20 overflow-hidden">
            <CardHeader className="pb-4 bg-amber-50/50 border-b border-amber-100">
                <CardTitle className="flex items-center gap-2 text-amber-900 font-display">
                    <div className="p-2 rounded-lg bg-amber-500 text-white shadow-md">
                        <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    طلبات بانتظار الموافقة
                    <span className="bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold border-none ml-2">
                        {filteredPending.length}
                    </span>
                </CardTitle>
                <CardDescription className="text-amber-700/70">تحتاج موافقتك</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                    {filteredPending.map((req) => {
                        const ui = getLeaveTypeUI(req.leaveTypeCode);
                        const Icon = ui.icon;
                        return (
                            <div
                                key={req.id}
                                className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-amber-200 hover:shadow-md transition-all duration-300 gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn("p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300", ui.bgLight, ui.textColor)}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-4">
                                            <p className="text-base font-bold text-slate-900 mb-0.5">{req.employeeName}</p>
                                            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl text-[10px] font-black border border-emerald-100/50 shadow-sm">
                                                BALANCE: {req.remainingBalance}d
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                                            <span className={cn("px-2 py-0.5 rounded-full", ui.bgLight, ui.textColor)}>
                                                {req.leaveTypeName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="w-3 h-3" />
                                                {new Date(req.startDate).toLocaleDateString()}
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-slate-100 rounded-md font-mono text-slate-700">
                                                {req.workingDays}d
                                            </span>
                                        </div>
                                        {req.reason && (
                                            <p className="text-xs text-slate-400 mt-2 italic bg-slate-50 p-2 rounded-lg border-l-2 border-slate-200">
                                                "{req.reason}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="accent"
                                    className="w-full sm:w-auto shadow-sm hover:shadow-md transition-all rounded-xl py-6 sm:py-2"
                                    onClick={() => onReview(req)}
                                >
                                    <UserCheck className="w-4 h-4 mr-2" />
                                    مراجعة
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default PendingApprovals;
