import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    Plus,
    CheckCircle2,
    Clock,
    XCircle,
    Info,
    CalendarCheck,
    Coffee,
    Stethoscope,
    Plane,
    Baby,
    AlertCircle,
    X,
    Send,
    Loader2,
    UserCheck,
    MessageSquare,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LeaveService from '../../api/services/leaveService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';
import { DayPicker } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, addMonths, subMonths } from 'date-fns';
import 'react-day-picker/dist/style.css';

const UI_CONFIG = {
    ANNUAL: { icon: Plane, color: 'bg-blue-500', bgLight: 'bg-blue-50', textColor: 'text-blue-700' },
    SICK: { icon: Stethoscope, color: 'bg-red-500', bgLight: 'bg-red-50', textColor: 'text-red-700' },
    CASUAL: { icon: Clock, color: 'bg-amber-500', bgLight: 'bg-amber-50', textColor: 'text-amber-700' },
    MATERNITY: { icon: Baby, color: 'bg-pink-500', bgLight: 'bg-pink-50', textColor: 'text-pink-700' },
    PATERNITY: { icon: Baby, color: 'bg-indigo-500', bgLight: 'bg-indigo-50', textColor: 'text-indigo-700' },
    UNPAID: { icon: Coffee, color: 'bg-slate-500', bgLight: 'bg-slate-50', textColor: 'text-slate-700' },
    COMPENSATORY: { icon: CalendarCheck, color: 'bg-emerald-500', bgLight: 'bg-emerald-50', textColor: 'text-emerald-700' },
    DEFAULT: { icon: Info, color: 'bg-slate-500', bgLight: 'bg-slate-50', textColor: 'text-slate-700' }
};

const getLeaveTypeUI = (code) => UI_CONFIG[code?.toUpperCase()] || UI_CONFIG.DEFAULT;

const StatusBadge = ({ status }) => {
    const config = {
        Pending: { icon: Clock, variant: 'warning', label: 'Pending' },
        Approved: { icon: CheckCircle2, variant: 'success', label: 'Approved' },
        Rejected: { icon: XCircle, variant: 'error', label: 'Rejected' },
        Cancelled: { icon: XCircle, variant: 'default', label: 'Cancelled' },
    };
    const c = config[status] || config.Pending;
    return (
        <Badge variant={c.variant}>
            <c.icon className="w-3 h-3 mr-1" />
            {c.label}
        </Badge>
    );
};

const LeavePage = () => {
    const [requests, setRequests] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [balances, setBalances] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(null);
    const [approvalComment, setApprovalComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    const [currentMonth, setCurrentMonth] = useState(new Date());

    const employeeId = user?.employeeId || user?.id;
    const isAdmin = user?.roles?.includes('Admin') || user?.roles?.includes('HRManager');
    const currentYear = new Date().getFullYear();

    // Form state
    const [form, setForm] = useState({
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: ''
    });

    const fetchData = useCallback(async () => {
        if (!employeeId) return;
        setIsLoading(true);
        try {
            // Fetch dynamic leave types
            const types = await LeaveService.getLeaveTypes();
            setLeaveTypes(types || []);

            // Set default leave type in form if not set
            if (types.length > 0 && !form.leaveTypeId) {
                setForm(f => ({ ...f, leaveTypeId: types[0].id }));
            }

            // Fetch leave history
            const history = await LeaveService.getHistory(employeeId);
            setRequests(history || []);

            // Fetch balances for all fetched leave types
            const balancePromises = types.map(type =>
                LeaveService.getBalance(employeeId, type.id, currentYear)
                    .then(bal => ({ ...bal, typeName: type.name, typeNameAr: type.nameAr, code: type.code }))
                    .catch(() => ({
                        typeName: type.name,
                        typeNameAr: type.nameAr,
                        code: type.code,
                        totalEntitledDays: 0,
                        usedDays: 0,
                        remainingDays: 0
                    }))
            );
            const balanceResults = await Promise.all(balancePromises);
            setBalances(balanceResults);

            // If admin, also fetch pending requests
            if (isAdmin) {
                try {
                    const pending = await LeaveService.getPending();
                    setPendingRequests(pending || []);
                } catch {
                    setPendingRequests([]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch leave data', error);
            toast.error('Failed to load leave configuration');
        } finally {
            setIsLoading(false);
        }
    }, [employeeId, isAdmin, currentYear, form.leaveTypeId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.startDate || !form.endDate) {
            toast.error('Please select start and end dates');
            return;
        }
        if (new Date(form.endDate) < new Date(form.startDate)) {
            toast.error('End date must be after start date');
            return;
        }

        setIsSubmitting(true);
        try {
            await LeaveService.request({
                leaveTypeId: form.leaveTypeId,
                startDate: form.startDate,
                endDate: form.endDate,
                reason: form.reason
            });
            toast.success('Leave request submitted successfully! ✅');
            setShowModal(false);
            setForm(f => ({ ...f, startDate: '', endDate: '', reason: '' }));
            fetchData();
        } catch (error) {
            const msg = error.response?.data;
            toast.error(typeof msg === 'string' ? msg : 'Failed to submit leave request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async (id) => {
        setIsSubmitting(true);
        try {
            await LeaveService.approve(id, approvalComment);
            toast.success('Leave request approved ✅');
            setShowApprovalModal(null);
            setApprovalComment('');
            fetchData();
        } catch (error) {
            toast.error('Failed to approve leave request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (id) => {
        setIsSubmitting(true);
        try {
            await LeaveService.reject(id, approvalComment);
            toast.success('Leave request rejected');
            setShowApprovalModal(null);
            setApprovalComment('');
            fetchData();
        } catch (error) {
            toast.error('Failed to reject leave request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateDays = () => {
        if (!form.startDate || !form.endDate) return 0;
        const start = new Date(form.startDate);
        const end = new Date(form.endDate);
        const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(0, diff);
    };

    const getLeaveTypeById = (id) => leaveTypes.find(t => t.id === id);

    const calendarEvents = useMemo(() => {
        const events = {};
        requests.forEach(req => {
            if (req.status === 'Approved' || req.status === 'Pending') {
                const interval = eachDayOfInterval({
                    start: new Date(req.startDate),
                    end: new Date(req.endDate)
                });
                interval.forEach(date => {
                    const key = format(date, 'yyyy-MM-dd');
                    events[key] = {
                        status: req.status,
                        type: req.leaveTypeName,
                        code: req.leaveTypeCode // We should ensure backend returns this
                    };
                });
            }
        });
        return events;
    }, [requests]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Leave Management</h1>
                    <p className="text-slate-500 mt-1">Request and track your leave applications with dynamic policies.</p>
                </div>
                <Button variant="accent" onClick={() => setShowModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Apply for Leave
                </Button>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="animate-pulse bg-slate-50 border-transparent h-28" />
                    ))
                ) : balances.map((bal, i) => {
                    const ui = getLeaveTypeUI(bal.code);
                    const Icon = ui.icon;
                    return (
                        <Card key={i} className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={cn("p-1.5 rounded-lg", ui.bgLight, ui.textColor)}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 truncate">{user?.language === 'ar' ? bal.typeNameAr : bal.typeName}</span>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-slate-900">{bal.remainingDays}</span>
                                    <span className="text-[10px] font-semibold text-slate-400">/ {bal.totalEntitledDays} days</span>
                                </div>
                                {bal.usedDays > 0 && (
                                    <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                                        <div
                                            className={cn("h-1.5 rounded-full", ui.color)}
                                            style={{ width: `${Math.min(100, (bal.usedDays / bal.totalEntitledDays) * 100)}%` }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar View */}
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-accent" />
                            Leave Calendar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-4">
                        <div className="flex items-center justify-between mb-4">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-slate-900">{format(currentMonth, 'MMMM yyyy')}</span>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <DayPicker
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            className="bg-white rounded-xl border-none shadow-none mx-auto"
                            modifiers={{
                                leave: (date) => !!calendarEvents[format(date, 'yyyy-MM-dd')],
                                weekend: (date) => isWeekend(date)
                            }}
                            modifiersClassNames={{
                                leave: "bg-accent/10 font-bold text-accent rounded-full",
                                weekend: "text-slate-300"
                            }}
                            components={{
                                DayContent: ({ date }) => {
                                    const event = calendarEvents[format(date, 'yyyy-MM-dd')];
                                    return (
                                        <div className="relative w-full h-full flex items-center justify-center p-2">
                                            <span>{date.getDate()}</span>
                                            {event && (
                                                <div className={cn(
                                                    "absolute bottom-1 w-1 h-1 rounded-full",
                                                    event.status === 'Approved' ? "bg-emerald-500" : "bg-amber-500"
                                                )} />
                                            )}
                                        </div>
                                    );
                                }
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Admin: Pending Requests */}
                {isAdmin && pendingRequests.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-800">
                                <Clock className="w-5 h-5" />
                                Pending Approvals ({pendingRequests.length})
                            </CardTitle>
                            <CardDescription>Leave requests waiting for your approval</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {pendingRequests.map((req) => {
                                    const ui = getLeaveTypeUI(req.leaveTypeCode);
                                    const Icon = ui.icon;
                                    return (
                                        <div key={req.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-2 rounded-lg", ui.bgLight, ui.textColor)}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{req.employeeName}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {req.leaveTypeName} · {req.workingDays} working days · {new Date(req.startDate).toLocaleDateString()} → {new Date(req.endDate).toLocaleDateString()}
                                                    </p>
                                                    {req.reason && (
                                                        <p className="text-xs text-slate-400 mt-0.5 italic">"{req.reason}"</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="accent"
                                                    size="sm"
                                                    onClick={() => { setShowApprovalModal(req); setApprovalComment(''); }}
                                                >
                                                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                                                    Review
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* My Requests Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>My Leave Requests</CardTitle>
                            <CardDescription>Your leave request history and current applications</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                            <th className="pb-4">Type</th>
                                            <th className="pb-4">Duration</th>
                                            <th className="pb-4">Days</th>
                                            <th className="pb-4">Reason</th>
                                            <th className="pb-4 text-center">Status</th>
                                            <th className="pb-4">Approver</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {requests.length > 0 ? requests.map((req) => {
                                            const ui = getLeaveTypeUI(req.leaveTypeCode);
                                            const Icon = ui.icon;
                                            return (
                                                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn("p-1.5 rounded-lg", ui.bgLight, ui.textColor)}>
                                                                <Icon className="w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-900">
                                                                {user?.language === 'ar' ? req.leaveTypeNameAr : req.leaveTypeName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-sm text-slate-600">
                                                        {new Date(req.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        {' → '}
                                                        {new Date(req.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </td>
                                                    <td className="py-4 text-sm font-semibold text-slate-700">
                                                        {req.workingDays}d <span className="text-[10px] text-slate-400 font-normal">({req.totalDays} total)</span>
                                                    </td>
                                                    <td className="py-4 text-sm text-slate-500 max-w-[200px] truncate">
                                                        {req.reason || '—'}
                                                    </td>
                                                    <td className="py-4 text-center">
                                                        <StatusBadge status={req.status} />
                                                    </td>
                                                    <td className="py-4 text-sm text-slate-500">
                                                        {req.approverName || '—'}
                                                        {req.approvalComments && (
                                                            <p className="text-[10px] text-slate-400 italic mt-0.5">"{req.approvalComments}"</p>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="6" className="py-12 text-center">
                                                    <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                                    <p className="text-slate-500 text-sm">No leave requests yet.</p>
                                                    <Button variant="accent" size="sm" className="mt-3" onClick={() => setShowModal(true)}>
                                                        <Plus className="w-3.5 h-3.5 mr-1" />
                                                        Submit Your First Request
                                                    </Button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Leave Policy Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Leave Policy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-4 bg-blue-50 rounded-lg flex gap-3">
                                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    <span className="font-bold text-blue-800">Annual Leave:</span> Submit at least <span className="font-bold">3 days</span> in advance.
                                </p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg flex gap-3">
                                <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    <span className="font-bold text-red-800">Sick Leave:</span> Medical report required after 2 consecutive days.
                                </p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-lg flex gap-3">
                                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    <span className="font-bold text-emerald-800">Compensatory:</span> Requires prior overtime approval from your manager.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Request Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Apply for Leave</h2>
                                    <p className="text-sm text-slate-500">Fill in the details for your leave request</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Leave Type */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Leave Type</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                                                        "p-3 rounded-xl border-2 text-center transition-all text-xs font-semibold",
                                                        isSelected
                                                            ? `${ui.bgLight} ${ui.textColor} border-current`
                                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                                    )}
                                                >
                                                    <Icon className="w-4 h-4 mx-auto mb-1" />
                                                    {user?.language === 'ar' ? type.nameAr : type.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            value={form.startDate}
                                            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
                                        <input
                                            type="date"
                                            value={form.endDate}
                                            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                            min={form.startDate}
                                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Days Preview */}
                                {calculateDays() > 0 && (
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/20">
                                        <Calendar className="w-5 h-5 text-accent" />
                                        <span className="text-sm font-semibold text-accent">
                                            {calculateDays()} working day{calculateDays() > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}

                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Reason (optional)</label>
                                    <textarea
                                        rows={3}
                                        value={form.reason}
                                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                        placeholder="Briefly describe the reason for your leave..."
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="accent" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4 mr-2" />
                                        )}
                                        Submit Request
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Approval Modal */}
                {showApprovalModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowApprovalModal(null)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900">Review Leave Request</h2>
                                <button onClick={() => setShowApprovalModal(null)} className="p-2 rounded-lg hover:bg-slate-100">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Request Details */}
                                <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Employee</span>
                                        <span className="font-semibold text-slate-900">{showApprovalModal.employeeName}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Type</span>
                                        <span className="font-semibold text-slate-900">{showApprovalModal.leaveTypeName}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Duration</span>
                                        <span className="font-semibold text-slate-900">
                                            {new Date(showApprovalModal.startDate).toLocaleDateString()} → {new Date(showApprovalModal.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Working Days</span>
                                        <span className="font-semibold text-accent font-mono text-lg">{showApprovalModal.workingDays}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Total Calendar Days</span>
                                        <span className="font-semibold text-slate-900">{showApprovalModal.totalDays}</span>
                                    </div>
                                    {showApprovalModal.reason && (
                                        <div className="text-sm">
                                            <span className="text-slate-500">Reason:</span>
                                            <p className="text-slate-700 italic mt-1">"{showApprovalModal.reason}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Comment */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                                        Comment (optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={approvalComment}
                                        onChange={e => setApprovalComment(e.target.value)}
                                        placeholder="Add a comment..."
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-2">
                                    <Button
                                        variant="danger"
                                        className="flex-1"
                                        disabled={isSubmitting}
                                        onClick={() => handleReject(showApprovalModal.id)}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        variant="accent"
                                        className="flex-1"
                                        disabled={isSubmitting}
                                        onClick={() => handleApprove(showApprovalModal.id)}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                        )}
                                        Approve
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeavePage;
