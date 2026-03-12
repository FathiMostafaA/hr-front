import React from 'react';
import { 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Info, 
    CalendarCheck, 
    Coffee, 
    Stethoscope, 
    Plane, 
    Baby 
} from 'lucide-react';
import { cn } from '../../../utils/cn';

export const UI_CONFIG = {
    ANNUAL: { icon: Plane, color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-700' },
    SICK: { icon: Stethoscope, color: 'bg-red-500', bgLight: 'bg-red-50', textColor: 'text-red-700' },
    CASUAL: { icon: Clock, color: 'bg-amber-500', bgLight: 'bg-amber-50', textColor: 'text-amber-700' },
    MATERNITY: { icon: Baby, color: 'bg-pink-500', bgLight: 'bg-pink-50', textColor: 'text-pink-700' },
    PATERNITY: { icon: Baby, color: 'bg-indigo-500', bgLight: 'bg-indigo-50', textColor: 'text-indigo-700' },
    UNPAID: { icon: Coffee, color: 'bg-slate-500', bgLight: 'bg-slate-50', textColor: 'text-slate-700' },
    COMPENSATORY: { icon: CalendarCheck, color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700' },
    DEFAULT: { icon: Info, color: 'bg-slate-500', bgLight: 'bg-slate-50', textColor: 'text-slate-700' }
};

export const getLeaveTypeUI = (code) => UI_CONFIG[code?.toUpperCase()] || UI_CONFIG.DEFAULT;

export const StatusBadge = ({ status }) => {
    const config = {
        Pending: { icon: Clock, variant: 'warning', label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
        Approved: { icon: CheckCircle2, variant: 'success', label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
        Rejected: { icon: XCircle, variant: 'error', label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
        Cancelled: { icon: XCircle, variant: 'default', label: 'Cancelled', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
        CancelledByHR: { icon: XCircle, variant: 'default', label: 'HR Cancelled', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    };
    const c = config[status] || config.Pending;
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all duration-300",
            c.bg, c.text, c.border
        )}>
            <c.icon className="w-3 h-3" />
            {c.label}
        </span>
    );
};
