import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';
import { getLeaveTypeUI } from '../constants/LeaveConfig';

const LeaveBalanceCard = ({ bal, userLanguage }) => {
    const ui = getLeaveTypeUI(bal.code);
    const Icon = ui.icon;
    
    return (
        <Card className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white ring-1 ring-slate-200/50">
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-150", ui.color)} />
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2.5 rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110", ui.bgLight, ui.textColor)}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        {bal.code || 'LEAVE'}
                    </span>
                </div>

                <h3 className="text-sm font-bold text-slate-600 mb-1 truncate">
                    {userLanguage === 'ar' ? bal.typeNameAr : bal.typeName}
                </h3>

                <div className="flex items-baseline gap-1.5 mb-4">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">{bal.remainingDays}</span>
                    <span className="text-xs font-semibold text-slate-400">/ {bal.totalEntitledDays} days left</span>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-slate-400">Utilization</span>
                        <span className={ui.textColor}>{Math.round((bal.usedDays / bal.totalEntitledDays) * 100 || 0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-1000 ease-out", ui.color)}
                            style={{ width: `${Math.min(100, (bal.usedDays / bal.totalEntitledDays) * 100)}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default LeaveBalanceCard;
