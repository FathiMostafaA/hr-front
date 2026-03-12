import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Info } from 'lucide-react';
import { cn } from '../../../utils/cn';

const LeavePolicyGuide = () => {
    return (
        <Card className="border-none shadow-sm ring-1 ring-slate-200/50 bg-slate-50/30 overflow-hidden">
            <CardHeader className="pb-4 border-b border-slate-100 bg-white">
                <CardTitle className="text-base font-display flex items-center gap-2">
                    <Info className="w-5 h-5 text-accent" />
                    Leave Policy Quick Guide
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { color: 'blue', title: 'Annual Leave', text: 'Submit at least 3 days in advance.', bg: 'bg-blue-50', border: 'border-blue-100', textCol: 'text-blue-800' },
                        { color: 'red', title: 'Sick Leave', text: 'Medical report required after 2 consecutive days.', bg: 'bg-red-50', border: 'border-red-100', textCol: 'text-red-800' },
                        { color: 'emerald', title: 'Compensatory', text: 'Requires prior overtime approval from your manager.', bg: 'bg-emerald-50', border: 'border-emerald-100', textCol: 'text-emerald-800' }
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
        </Card>
    );
};

export default LeavePolicyGuide;
