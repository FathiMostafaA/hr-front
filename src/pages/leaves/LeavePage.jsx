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
    ChevronRight,
    UploadCloud,
    FileWarning
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LeaveService from '../../api/services/leaveService';
import EmployeeService from '../../api/services/employeeService';
import documentService from '../../api/services/documentService';
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
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [employees, setEmployees] = useState([]);
    
    // HR Management States
    const [viewMode, setViewMode] = useState('my_leaves'); // 'my_leaves' | 'organization'
    const [hrRequests, setHrRequests] = useState([]);
    const [showBulkInitModal, setShowBulkInitModal] = useState(false);
    const [showCarryForwardModal, setShowCarryForwardModal] = useState(false);
    
    const { user } = useAuth();

    const [currentMonth, setCurrentMonth] = useState(new Date());

    const employeeId = user?.employeeId || user?.id;
    const isAdmin = user?.roles?.some(r => r === 'Admin' || r === 'HRManager' || r === 'HR');
    const canApprove = user?.roles?.some(r => r === 'Admin' || r === 'HRManager' || r === 'Manager');
    const currentYear = new Date().getFullYear();

    const [form, setForm] = useState({
        employeeId: '',
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        isHalfDay: false,
        halfDayPeriod: 'Morning',
        attachment: null
    });

    const fetchData = useCallback(async () => {
        if (!employeeId) return;
        setIsLoading(true);
        try {
            // Fetch dynamic leave types
            const rawTypes = await LeaveService.getLeaveTypes();
            const types = (rawTypes || []).map(t => ({
                id: t.id || t.Id,
                name: t.name || t.Name,
                nameAr: t.nameAr || t.NameAr,
                code: t.code || t.Code,
                requiresDocumentation: t.requiresDocumentation || t.RequiresDocumentation || false,
                genderRestriction: t.genderRestriction || t.GenderRestriction || null
            }));
            setLeaveTypes(types);

            // Fetch leave history
            const rawHistory = await LeaveService.getHistory(employeeId);
            const normalizedHistory = (rawHistory || []).map(r => ({
                id: r.id || r.Id,
                employeeName: r.employeeName || r.EmployeeName,
                leaveTypeName: r.leaveTypeName || r.LeaveTypeName,
                leaveTypeCode: r.leaveTypeCode || r.LeaveTypeCode,
                startDate: r.startDate || r.StartDate,
                endDate: r.endDate || r.EndDate,
                workingDays: r.workingDays || r.WorkingDays,
                status: r.status || r.Status,
                approverName: r.approverName || r.ApproverName,
                approvalComments: r.approvalComments || r.ApprovalComments,
                reason: r.reason || r.Reason,
                attachmentUrl: r.attachmentUrl || r.AttachmentUrl,
                isHalfDay: r.isHalfDay || r.IsHalfDay,
            }));
            setRequests(normalizedHistory);

            // Fetch balances
            const balancePromises = types.map(type =>
                LeaveService.getBalance(employeeId, type.id, currentYear)
                    .then(bal => ({
                        ...bal,
                        typeName: type.name,
                        typeNameAr: type.nameAr,
                        code: type.code,
                        remainingDays: bal.remainingDays ?? bal.RemainingDays ?? 0,
                        totalEntitledDays: bal.totalEntitledDays ?? bal.TotalEntitledDays ?? 0,
                        usedDays: bal.usedDays ?? bal.UsedDays ?? 0
                    }))
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

            // Fetch pending requests for Manager/Admin
            if (canApprove) {
                try {
                    const isHR = user?.roles?.some(r => r === 'Admin' || r === 'HRManager' || r === 'HR');
                    const rawPending = isHR
                        ? await LeaveService.getPending()
                        : await LeaveService.getMyPending();

                    const normalizedPending = (rawPending || []).map(r => ({
                        id: r.id || r.Id,
                        employeeName: r.employeeName || r.EmployeeName,
                        leaveTypeName: r.leaveTypeName || r.LeaveTypeName,
                        leaveTypeCode: r.leaveTypeCode || r.LeaveTypeCode,
                        startDate: r.startDate || r.StartDate,
                        endDate: r.endDate || r.EndDate,
                        workingDays: r.workingDays || r.WorkingDays,
                        status: r.status || r.Status,
                        reason: r.reason || r.Reason
                    }));
                    setPendingRequests(normalizedPending);
                } catch (err) {
                    console.error('Failed to fetch pending requests', err);
                    setPendingRequests([]);
                }
            }

            // Fetch Organization leaves if Admin
            if (isAdmin && viewMode === 'organization') {
               try {
                   const orgLeavesResponse = await LeaveService.getAll({ page: 1, pageSize: 200 });
                   // map it
                   const normalizedOrgHistory = (orgLeavesResponse?.items || []).map(r => ({
                        id: r.id || r.Id,
                        employeeName: r.employeeName || r.EmployeeName,
                        leaveTypeName: r.leaveTypeName || r.LeaveTypeName,
                        leaveTypeCode: r.leaveTypeCode || r.LeaveTypeCode,
                        startDate: r.startDate || r.StartDate,
                        endDate: r.endDate || r.EndDate,
                        workingDays: r.workingDays || r.WorkingDays,
                        status: r.status || r.Status,
                        approverName: r.approverName || r.ApproverName,
                        approvalComments: r.approvalComments || r.ApprovalComments,
                        reason: r.reason || r.Reason,
                        attachmentUrl: r.attachmentUrl || r.AttachmentUrl,
                        isHalfDay: r.isHalfDay || r.IsHalfDay,
                    }));
                    setHrRequests(normalizedOrgHistory);
               } catch(err) {
                   console.error('Failed to fetch org leaves', err);
               }
            }

            // Fetch all employees for HR actions
            if (isAdmin) {
                try {
                    const allEmployees = await EmployeeService.getAll();
                    setEmployees(allEmployees);
                } catch (err) {
                    console.error('Failed to fetch employees', err);
                }
            }
        } catch (err) {
            console.error('Failed to fetch leave data', err);
            const msg = err.response?.data;
            toast.error(typeof msg === 'string' ? msg : 'Failed to load leave configuration');
        } finally {
            setIsLoading(false);
        }
    }, [employeeId, isAdmin, canApprove, currentYear, user?.roles]);

    useEffect(() => {
        if (leaveTypes.length > 0 && !form.leaveTypeId) {
            const firstId = leaveTypes[0].id;
            if (firstId) {
                setForm(f => ({ ...f, leaveTypeId: firstId }));
            }
        }
    }, [leaveTypes, form.leaveTypeId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const selectedType = leaveTypes.find(t => t.id === form.leaveTypeId);
        
        if (!form.startDate || (!form.endDate && !form.isHalfDay)) {
            toast.error('Please select start and end dates');
            return;
        }

        const effectiveEndDate = form.isHalfDay ? form.startDate : form.endDate;
        if (new Date(effectiveEndDate) < new Date(form.startDate)) {
            toast.error('End date must be after start date');
            return;
        }

        if (selectedType?.requiresDocumentation && !form.attachment) {
            toast.error('This leave type requires supporting documentation.');
            return;
        }

        setIsSubmitting(true);
        try {
            const finalEmployeeId = isAdmin ? form.employeeId || employeeId : employeeId;
            let attachmentUrl = null;

            if (form.attachment) {
                const docRes = await documentService.uploadDocument(
                    finalEmployeeId, 
                    form.attachment, 
                    form.attachment.name, 
                    'Leave Attachment', 
                    null, 
                    false
                );
                attachmentUrl = docRes.fileUrl || docRes.FileUrl;
            }

            const payload = {
                employeeId: finalEmployeeId,
                leaveTypeId: form.leaveTypeId,
                startDate: form.startDate,
                endDate: effectiveEndDate,
                reason: form.reason || '',
                isHalfDay: form.isHalfDay,
                halfDayPeriod: form.isHalfDay ? form.halfDayPeriod : null,
                attachmentUrl: attachmentUrl
            };

            await LeaveService.request(payload);
            toast.success('Leave request submitted successfully! ✅');
            setShowModal(false);
            setForm(f => ({ ...f, startDate: '', endDate: '', reason: '', employeeId: '', isHalfDay: false, attachment: null }));
            fetchData();
        } catch (err) {
            const msg = err.response?.data;
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
        } catch {
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
        } catch {
            toast.error('Failed to reject leave request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) return;

        setIsSubmitting(true);
        try {
            await LeaveService.cancel(id);
            toast.success('Leave request cancelled successfully');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || 'Failed to cancel leave request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleHRCancel = async (id) => {
        const reason = window.prompt("Enter reason for cancelling this leave on behalf of the employee:");
        if (reason === null) return;

        setIsSubmitting(true);
        try {
            await LeaveService.hrCancel(id, { reason });
            toast.success('Leave cancelled by HR successfully');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || 'Failed to cancel leave by HR');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkInit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            year: parseInt(formData.get('year')),
            defaultEntitledDays: parseInt(formData.get('defaultDays'))
        };
        setIsSubmitting(true);
        try {
            await LeaveService.bulkInitializeBalances(data);
            toast.success(`Bulk initialization for year ${data.year} completed.`);
            setShowBulkInitModal(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || 'Failed bulk init');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCarryForward = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            fromYear: parseInt(formData.get('fromYear')),
            toYear: parseInt(formData.get('toYear'))
        };
        setIsSubmitting(true);
        try {
            await LeaveService.carryForwardBalances(data);
            toast.success(`Carried forward balances to ${data.toYear} successfully.`);
            setShowCarryForwardModal(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || 'Carry forward failed');
        } finally {
             setIsSubmitting(false);
        }
    };

    const calculateDays = () => {
        if (form.isHalfDay) return 0.5;
        if (!form.startDate || !form.endDate) return 0;
        const start = new Date(form.startDate);
        const end = new Date(form.endDate);
        if (end < start) return 0;

        let count = 0;
        let cur = new Date(start);
        while (cur <= end) {
            const day = cur.getDay();
            // 5 = Friday, 6 = Saturday (Egyptian weekends)
            if (day !== 5 && day !== 6) {
                count++;
            }
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    };

    const calendarEvents = useMemo(() => {
        const events = {};
        requests.forEach(req => {
            if (req.status === 'Approved' || req.status === 'Pending') {
                try {
                    const interval = eachDayOfInterval({
                        start: new Date(req.startDate),
                        end: new Date(req.endDate)
                    });
                    interval.forEach(date => {
                        const key = format(date, 'yyyy-MM-dd');
                        events[key] = {
                            status: req.status,
                            type: req.leaveTypeName,
                            code: req.leaveTypeCode
                        };
                    });
                } catch (e) {
                    console.error('Error calculating calendar interval', e);
                }
            }
        });
        return events;
    }, [requests]);

    const filteredRequests = useMemo(() => {
        const sourceData = viewMode === 'organization' ? hrRequests : requests;
        return sourceData.filter(req => {
            const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
            const matchesSearch = !searchTerm ||
                req.leaveTypeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (req.reason && req.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (req.employeeName && req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()));
            return matchesStatus && matchesSearch;
        });
    }, [requests, hrRequests, viewMode, statusFilter, searchTerm]);

    const filteredPending = useMemo(() => {
        return pendingRequests.filter(req => {
            const matchesSearch = !searchTerm ||
                req.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                req.leaveTypeName?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [pendingRequests, searchTerm]);

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
                        Leave Management
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg max-w-2xl">
                        Request and track your leave applications with dynamic policies and real-time balances.
                    </p>
                </div>
                <Button
                    variant="accent"
                    size="lg"
                    className="shadow-lg shadow-accent/20 hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 rounded-xl px-8"
                    onClick={() => setShowModal(true)}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Apply for Leave
                </Button>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                    ))
                ) : balances.map((bal, i) => {
                    const ui = getLeaveTypeUI(bal.code);
                    const Icon = ui.icon;
                    return (
                        <Card
                            key={i}
                            className="group relative overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 bg-white ring-1 ring-slate-200/50"
                        >
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
                                    {user?.language === 'ar' ? bal.typeNameAr : bal.typeName}
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
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar View */}
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

                {/* Filters & Search */}
                <div className="lg:col-span-3 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-200/50 mb-2">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
                        {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                                    statusFilter === status
                                        ? "bg-accent text-white shadow-md shadow-accent/20"
                                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-80 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Plus className="w-4 h-4 text-slate-400 rotate-45 group-focus-within:text-accent transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by reason or type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Pending Requests for Managers/Admin */}
                {canApprove && filteredPending.length > 0 && (
                    <Card className="border-none shadow-lg shadow-amber-500/5 ring-1 ring-amber-200/50 bg-amber-50/20 overflow-hidden">
                        <CardHeader className="pb-4 bg-amber-50/50 border-b border-amber-100">
                            <CardTitle className="flex items-center gap-2 text-amber-900 font-display">
                                <div className="p-2 rounded-lg bg-amber-500 text-white shadow-md">
                                    <Clock className="w-5 h-5 animate-pulse" />
                                </div>
                                Pending Approvals
                                <span className="bg-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold border-none ml-2">
                                    {pendingRequests.length}
                                </span>
                            </CardTitle>
                            <CardDescription className="text-amber-700/70">Requires your immediate action</CardDescription>
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
                                            {canApprove && (
                                                <Button
                                                    variant="accent"
                                                    className="w-full sm:w-auto shadow-sm hover:shadow-md transition-all rounded-xl py-6 sm:py-2"
                                                    onClick={() => { setShowApprovalModal(req); setApprovalComment(''); }}
                                                >
                                                    <UserCheck className="w-4 h-4 mr-2" />
                                                    Review
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Requests Table */}
                <Card className="border-none shadow-sm ring-1 ring-slate-200/50 overflow-hidden bg-white">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 border-b border-slate-100">
                        <div>
                            <CardTitle className="font-display">
                                {isAdmin ? (
                                    <div className="flex gap-4 items-center mb-1">
                                        <button onClick={() => setViewMode('my_leaves')} className={cn("text-xl transition-colors", viewMode === 'my_leaves' ? "text-slate-900 font-bold" : "text-slate-400 font-medium hover:text-slate-600")}>My Leaves</button>
                                        <button onClick={() => setViewMode('organization')} className={cn("text-xl transition-colors", viewMode === 'organization' ? "text-slate-900 font-bold" : "text-slate-400 font-medium hover:text-slate-600")}>Organization</button>
                                    </div>
                                ) : "My Leave Requests"}
                            </CardTitle>
                            <CardDescription>
                                {viewMode === 'my_leaves' ? "Your leave request history and current applications" : "View and manage all organization requests"}
                            </CardDescription>
                        </div>
                        {isAdmin && viewMode === 'organization' && (
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" className="hidden sm:flex text-xs font-bold" onClick={() => setShowCarryForwardModal(true)}>Carry Forward</Button>
                                <Button variant="accent" size="sm" className="text-xs font-bold" onClick={() => setShowBulkInitModal(true)}>Bulk Init Balances</Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            </div>
                        ) : requests.length > 0 ? (
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
                                                                    onClick={() => viewMode === 'organization' ? handleHRCancel(req.id) : handleCancel(req.id)}
                                                                >
                                                                    <X className="w-3 h-3 mr-1" />
                                                                    CANCEL
                                                                </Button>
                                                            ) : req.status === 'Approved' && viewMode === 'organization' ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 rounded-lg text-rose-500 hover:bg-rose-50 group-hover:scale-105 transition-all font-bold text-[10px]"
                                                                    onClick={() => handleHRCancel(req.id)}
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
                                                        onClick={() => viewMode === 'organization' ? handleHRCancel(req.id) : handleCancel(req.id)}
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
                        ) : (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                                    <AlertCircle className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-base font-bold text-slate-600">No leave requests yet</h3>
                                <p className="text-sm text-slate-400 mt-1 mb-6">Your history will appear here once you apply.</p>
                                <Button variant="accent" size="sm" className="rounded-xl px-6" onClick={() => setShowModal(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Launch First Request
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Leave Policy Info */}
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

                {/* Request Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => setShowModal(false)}>
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
                            <div className="relative p-8 border-b border-slate-100 bg-slate-50/50">
                                <div className="absolute top-8 right-8">
                                    <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-slate-900">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">Apply for Leave</h2>
                                <p className="text-slate-500 mt-1 font-medium">Plan your time off with ease</p>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                {/* Employee Selector (HR/Admin only) */}
                                {isAdmin && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Applying for</label>
                                        <select
                                            value={form.employeeId}
                                            onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none appearance-none cursor-pointer border-r-[16px] border-transparent"
                                            required={isAdmin}
                                        >
                                            <option value="">Select Employee...</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.firstName} {emp.lastName} ({emp.departmentName || 'No Dept'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Leave Type */}
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Select Type</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                                                        "p-4 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center gap-2 group",
                                                        isSelected
                                                            ? `${ui.bgLight} ${ui.textColor} border-current ring-4 ring-current/5 scale-[1.02] shadow-sm`
                                                            : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                                                    )}
                                                >
                                                    <div className={cn("p-2 rounded-xl transition-transform duration-300", isSelected ? "bg-white/50" : "bg-slate-100 group-hover:bg-white")}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-[10px] font-bold tracking-tight uppercase line-clamp-1">
                                                        {user?.language === 'ar' ? type.nameAr : type.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Half Day Toggle */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isHalfDay"
                                        checked={form.isHalfDay}
                                        onChange={e => setForm(f => ({ ...f, isHalfDay: e.target.checked }))}
                                        className="w-4 h-4 rounded text-accent focus:ring-accent border-slate-300"
                                    />
                                    <label htmlFor="isHalfDay" className="text-sm font-bold text-slate-700">This is a half-day leave</label>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                                        <div className="relative group">
                                            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent transition-colors" />
                                            <input
                                                type="date"
                                                value={form.startDate}
                                                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                    {form.isHalfDay ? (
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Period</label>
                                            <select
                                                value={form.halfDayPeriod}
                                                onChange={e => setForm(f => ({ ...f, halfDayPeriod: e.target.value }))}
                                                className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none appearance-none border-r-[16px] border-transparent"
                                            >
                                                <option value="Morning">Morning</option>
                                                <option value="Afternoon">Afternoon</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">End Date</label>
                                            <div className="relative group">
                                                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent transition-colors" />
                                                <input
                                                    type="date"
                                                    value={form.endDate}
                                                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                                    min={form.startDate}
                                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Days Preview */}
                                {calculateDays() > 0 && (
                                    <div className="flex items-center justify-between p-5 rounded-2xl bg-accent/5 border border-accent/10 animate-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-accent/10 rounded-xl text-accent">
                                                <CalendarCheck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-black text-accent block">Estimated Duration</span>
                                                <span className="text-xs text-accent/70 font-bold uppercase tracking-tighter">Working days will be calculated</span>
                                            </div>
                                        </div>
                                        <span className="text-3xl font-black text-accent tracking-tighter">
                                            {calculateDays()} <span className="text-[10px] uppercase font-black">Days</span>
                                        </span>
                                    </div>
                                )}
                                {/* Documentation */}
                                {leaveTypes.find(t => t.id === form.leaveTypeId)?.requiresDocumentation && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <label className="flex items-center gap-2 text-xs font-black text-rose-500 uppercase tracking-widest">
                                            <FileWarning className="w-4 h-4" />
                                            Supporting Document Required
                                        </label>
                                        <div className="relative group">
                                            <UploadCloud className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-accent transition-colors" />
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                onChange={e => setForm(f => ({ ...f, attachment: e.target.files[0] }))}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-dashed border-rose-200 rounded-2xl text-sm font-medium focus:border-accent hover:border-accent transition-all outline-none file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                                {/* Reason */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Reason / Note</label>
                                    <textarea
                                        rows={3}
                                        value={form.reason}
                                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                        placeholder="Add any additional context for your request..."
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-medium text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none resize-none"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-4 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 rounded-2xl py-7 text-sm font-bold border-slate-200 text-slate-500 hover:bg-slate-50"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="accent"
                                        className="flex-1 rounded-2xl py-7 text-sm font-black shadow-lg shadow-accent/20 hover:shadow-xl transition-all"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4 mr-2" />
                                                SUBMIT REQUEST
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Approval Modal */}
                {showApprovalModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => setShowApprovalModal(null)}>
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 relative">
                                <div className="absolute top-8 right-8">
                                    <button onClick={() => setShowApprovalModal(null)} className="p-2 rounded-xl hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-slate-900">
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
                )}
                {/* Bulk Init Modal */}
                {showBulkInitModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => setShowBulkInitModal(false)}>
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 relative">
                                <div className="absolute top-8 right-8">
                                    <button onClick={() => setShowBulkInitModal(false)} className="p-2 rounded-xl hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-slate-900">
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
                                     <Button type="button" variant="outline" className="flex-1 rounded-2xl py-7 text-sm font-bold border-slate-200 text-slate-500 hover:bg-slate-50" onClick={() => setShowBulkInitModal(false)}>Cancel</Button>
                                     <Button type="submit" variant="accent" className="flex-1 rounded-2xl py-7 text-sm font-black shadow-lg shadow-accent/20 hover:shadow-xl transition-all" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'INITIALIZE'}</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Carry Forward Modal */}
                {showCarryForwardModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300" onClick={() => setShowCarryForwardModal(false)}>
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 relative">
                                <div className="absolute top-8 right-8">
                                    <button onClick={() => setShowCarryForwardModal(false)} className="p-2 rounded-xl hover:bg-slate-200/50 transition-colors text-slate-400 hover:text-slate-900">
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
                                     <Button type="button" variant="outline" className="flex-1 rounded-2xl py-7 text-sm font-bold border-slate-200 text-slate-500 hover:bg-slate-50" onClick={() => setShowCarryForwardModal(false)}>Cancel</Button>
                                     <Button type="submit" variant="accent" className="flex-1 rounded-2xl py-7 text-sm font-black shadow-lg shadow-accent/20 hover:shadow-xl transition-all" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : 'EXECUTE'}</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeavePage;
