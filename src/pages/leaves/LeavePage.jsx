import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import 'react-day-picker/dist/style.css';

// Hooks
import { useLeaveData } from './hooks/useLeaveData';
import { useLeaveActions } from './hooks/useLeaveActions';

// Components
import LeaveBalanceCard from './components/LeaveBalanceCard';
import LeaveCalendar from './components/LeaveCalendar';
import PendingApprovals from './components/PendingApprovals';
import LeaveRequestsTable from './components/LeaveRequestsTable';
import LeavePolicyGuide from './components/LeavePolicyGuide';

// Modals
import ApplyLeaveModal from './modals/ApplyLeaveModal';
import ApprovalModal from './modals/ApprovalModal';
import { BulkInitModal, CarryForwardModal, ManualInitModal } from './modals/HRManagementModals';

const LeavePage = () => {
    const { user } = useAuth();
    const currentYear = new Date().getFullYear();
    const employeeId = user?.employeeId ?? null;
    const isAdmin = user?.roles?.some(r => r === 'Admin' || r === 'HRManager' || r === 'HR');
    const canApprove = user?.roles?.some(r => r === 'Admin' || r === 'HRManager' || r === 'Manager');
    const hasEmployeeContext = !!user?.employeeId;

    const [viewMode, setViewMode] = useState('my_leaves'); // 'my_leaves' | 'organization'
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const {
        requests,
        pendingRequests,
        leaveTypes,
        balances,
        isLoading,
        employees,
        hrRequests,
        calendarEvents,
        fetchData
    } = useLeaveData(user, isAdmin, canApprove, viewMode, currentYear);

    const {
        isSubmitting,
        handleSubmit,
        handleApprove,
        handleReject,
        handleCancel,
        handleHRCancel,
        handleBulkInit,
        handleCarryForward,
        handleManualInit
    } = useLeaveActions(fetchData, employeeId, isAdmin);

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(null);
    const [approvalComment, setApprovalComment] = useState('');
    const [showBulkInitModal, setShowBulkInitModal] = useState(false);
    const [showCarryForwardModal, setShowCarryForwardModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);

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

    const [manualForm, setManualForm] = useState({
        employeeId: '',
        leaveTypeId: '',
        year: currentYear,
        totalDays: 21
    });

    useEffect(() => {
        if (leaveTypes.length > 0 && !form.leaveTypeId) {
            const firstId = leaveTypes[0].id;
            if (firstId) {
                setForm(f => ({ ...f, leaveTypeId: firstId }));
            }
        }
    }, [leaveTypes, form.leaveTypeId]);

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
            if (day !== 5 && day !== 6) count++;
            cur.setDate(cur.getDate() + 1);
        }
        return count;
    };

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
            {/* Header */}
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
                    disabled={!hasEmployeeContext && !isAdmin}
                    title={!hasEmployeeContext && !isAdmin ? 'Link an employee to your account to apply for leave' : ''}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Apply for Leave
                </Button>
            </div>

            {/* Balance Cards - only when user has employee context */}
            {hasEmployeeContext && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                        ))
                    ) : balances.map((bal, i) => (
                        <LeaveBalanceCard key={i} bal={bal} userLanguage={user?.language} />
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar View */}
                <LeaveCalendar 
                    currentMonth={currentMonth} 
                    setCurrentMonth={setCurrentMonth} 
                    calendarEvents={calendarEvents} 
                />

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
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold text-slate-900 focus:ring-4 focus:ring-accent/10 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Pending Requests */}
                <PendingApprovals 
                    filteredPending={filteredPending} 
                    onReview={(req) => { setShowApprovalModal(req); setApprovalComment(''); }} 
                />

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
                                <Button variant="outline" size="sm" className="text-xs font-bold" onClick={() => {
                                    setManualForm(f => ({ ...f, year: currentYear }));
                                    setShowManualModal(true);
                                }}>Manual Init</Button>
                                <Button variant="accent" size="sm" className="text-xs font-bold" onClick={() => setShowBulkInitModal(true)}>Bulk Init Balances</Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                            </div>
                        ) : (
                            <LeaveRequestsTable 
                                filteredRequests={filteredRequests}
                                user={user}
                                viewMode={viewMode}
                                onCancel={handleCancel}
                                onHRCancel={handleHRCancel}
                                onShowModal={() => setShowModal(true)}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Leave Policy Info */}
                <LeavePolicyGuide />

                {/* Modals */}
                {showModal && (
                    <ApplyLeaveModal 
                        onClose={() => setShowModal(false)}
                        isAdmin={isAdmin}
                        employees={employees}
                        leaveTypes={leaveTypes}
                        form={form}
                        setForm={setForm}
                        onSubmit={(e) => { e.preventDefault(); handleSubmit(form, setForm, leaveTypes, setShowModal); }}
                        isSubmitting={isSubmitting}
                        userLanguage={user?.language}
                        calculateDays={calculateDays}
                    />
                )}

                {showApprovalModal && (
                    <ApprovalModal 
                        showApprovalModal={showApprovalModal}
                        onClose={() => setShowApprovalModal(null)}
                        approvalComment={approvalComment}
                        setApprovalComment={setApprovalComment}
                        handleReject={(id) => handleReject(id, approvalComment, setShowApprovalModal, setApprovalComment)}
                        handleApprove={(id) => handleApprove(id, approvalComment, setShowApprovalModal, setApprovalComment)}
                        isSubmitting={isSubmitting}
                    />
                )}

                {showBulkInitModal && (
                    <BulkInitModal 
                        onClose={() => setShowBulkInitModal(false)}
                        currentYear={currentYear}
                        handleBulkInit={(e) => handleBulkInit(e, setShowBulkInitModal)}
                        isSubmitting={isSubmitting}
                    />
                )}

                {showCarryForwardModal && (
                    <CarryForwardModal 
                        onClose={() => setShowCarryForwardModal(false)}
                        currentYear={currentYear}
                        handleCarryForward={(e) => handleCarryForward(e, setShowCarryForwardModal)}
                        isSubmitting={isSubmitting}
                    />
                )}

                {showManualModal && (
                    <ManualInitModal 
                        onClose={() => setShowManualModal(false)}
                        manualForm={manualForm}
                        setManualForm={setManualForm}
                        employees={employees}
                        leaveTypes={leaveTypes}
                        handleManualInit={(e) => { e.preventDefault(); handleManualInit(manualForm, setShowManualModal); }}
                        isSubmitting={isSubmitting}
                    />
                )}
            </div>
        </div>
    );
};

export default LeavePage;
