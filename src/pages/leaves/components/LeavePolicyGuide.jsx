import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../utils/cn';

const LeavePolicyGuide = () => {
    const [open, setOpen] = useState(false);
    return (
        <Card className="border-none shadow-sm ring-1 ring-slate-200/50 bg-slate-50/30 overflow-hidden">
            <CardHeader 
                className="pb-4 border-b border-slate-100 bg-white cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <CardTitle className="text-base font-display flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-accent" />
                        دليل سياسة الإجازات
                    </span>
                    {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </CardTitle>
            </CardHeader>
            {open && (
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { color: 'blue', title: 'إجازة سنوية', text: 'يُفضّل التقديم قبل 3 أيام على الأقل.', bg: 'bg-blue-50', border: 'border-blue-100', textCol: 'text-blue-800' },
                        { color: 'red', title: 'إجازة مرضية', text: 'يُطلب تقرير طبي بعد يومين متتاليين.', bg: 'bg-red-50', border: 'border-red-100', textCol: 'text-red-800' },
                        { color: 'emerald', title: 'تعويضية', text: 'تحتاج موافقة مسبقة من المدير على العمل الإضافي.', bg: 'bg-emerald-50', border: 'border-emerald-100', textCol: 'text-emerald-800' }
                    ].map((policy, idx) => (
                        <div key={idx} className={cn("p-5 rounded-2xl border transition-all duration-300 hover:shadow-md bg-white hover:translate-y-[-2px]", policy.border)}>
                            <div className="flex items-start gap-4">
                                <div className={cn("p-2 rounded-xl mt-0.5 shadow-sm", policy.bg, policy.textCol)}>
                                    <Info className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className={cn("text-sm font-black uppercase tracking-wider mb-2", policy.textCol)}>
                                        {policy.title}
                                    </h4>
                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                        {policy.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
            )}
        </Card>
    );
};

export default LeavePolicyGuide;
