import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, subMonths, addMonths, isWeekend } from 'date-fns';
import { cn } from '../../../utils/cn';

const LeaveCalendar = ({ currentMonth, setCurrentMonth, calendarEvents }) => {
    return (
        <Card className="lg:col-span-1 border-none shadow-sm ring-1 ring-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="pb-4 bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2 font-display">
                    <CalendarIcon className="w-5 h-5 text-accent" />
                    Leave Calendar
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-slate-900 text-lg">{format(currentMonth, 'MMMM yyyy')}</span>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-900"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="calendar-modern">
                    <DayPicker
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        className="border-none shadow-none mx-auto"
                        modifiers={{
                            leave: (date) => !!calendarEvents[format(date, 'yyyy-MM-dd')],
                            weekend: (date) => isWeekend(date)
                        }}
                        modifiersClassNames={{
                            leave: "bg-accent/10 font-bold text-accent rounded-xl",
                            weekend: "text-slate-300 opacity-50"
                        }}
                        components={{
                            DayContent: ({ date }) => {
                                const event = calendarEvents[format(date, 'yyyy-MM-dd')];
                                return (
                                    <div className="relative w-full h-full flex items-center justify-center p-2 group cursor-default">
                                        <span className="text-sm font-medium z-10 transition-transform group-hover:scale-110">{date.getDate()}</span>
                                        {event && (
                                            <div className={cn(
                                                "absolute inset-1 rounded-xl transition-all duration-300",
                                                event.status === 'Approved' ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"
                                            )} />
                                        )}
                                    </div>
                                );
                            }
                        }}
                    />
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-slate-500">Approved</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-slate-500">Pending</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default LeaveCalendar;
