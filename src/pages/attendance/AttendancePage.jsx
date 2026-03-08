import React, { useState, useEffect, useCallback } from 'react';
import {
    Clock,
    Play,
    Square,
    History,
    Calendar,
    CheckCircle2,
    Timer,
    TrendingUp,
    AlertCircle,
    Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AttendanceService from '../../api/services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const AttendancePage = () => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClocking, setIsClocking] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayRecord, setTodayRecord] = useState(null);
    const { user } = useAuth();

    // Admin view state
    const [activeTab, setActiveTab] = useState('my'); // 'my' | 'all'
    const [allRecords, setAllRecords] = useState([]);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminDateFrom, setAdminDateFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [adminDateTo, setAdminDateTo] = useState(() => new Date().toISOString().split('T')[0]);

    const isAdminOrHR = user?.roles?.some(r => r === 'Admin' || r === 'HRManager' || r === 'HR');
    const employeeId = user?.employeeId || user?.id;

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch my attendance data
    const fetchData = useCallback(async () => {
        if (!employeeId) return;
        setIsLoading(true);
        try {
            try {
                const today = await AttendanceService.getTodayAttendance(employeeId);
                setTodayRecord(today);
            } catch {
                setTodayRecord(null);
            }
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const data = await AttendanceService.getHistory(
                employeeId,
                thirtyDaysAgo.toISOString().split('T')[0],
                now.toISOString().split('T')[0]
            );
            setHistory(data || []);
        } catch (error) {
            console.error('Failed to fetch attendance data', error);
        } finally {
            setIsLoading(false);
        }
    }, [employeeId]);

    // Fetch all employees' attendance (admin)
    const fetchAllAttendance = useCallback(async () => {
        setAdminLoading(true);
        try {
            const data = await AttendanceService.getAll(adminDateFrom, adminDateTo);
            setAllRecords(data || []);
        } catch (error) {
            toast.error('Failed to load attendance records');
        } finally {
            setAdminLoading(false);
        }
    }, [adminDateFrom, adminDateTo]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => {
        if (activeTab === 'all' && isAdminOrHR) fetchAllAttendance();
    }, [activeTab, fetchAllAttendance, isAdminOrHR]);

    const isClockedIn = todayRecord && !todayRecord.clockOutTime;

    const handleClockIn = async () => {
        setIsClocking(true);
        try {
            const result = await AttendanceService.clockIn({ employeeId, notes: 'Started working' });
            setTodayRecord(result);
            toast.success('Clocked in successfully! 🟢');
            fetchData();
        } catch (error) {
            const msg = error.response?.data || 'Failed to clock in';
            toast.error(typeof msg === 'string' ? msg : 'Failed to clock in');
        } finally {
            setIsClocking(false);
        }
    };

    const handleClockOut = async () => {
        if (!todayRecord?.id) { toast.error('No active session found'); return; }
        setIsClocking(true);
        try {
            const result = await AttendanceService.clockOut({ attendanceId: todayRecord.id, notes: 'Finished for the day' });
            setTodayRecord(result);
            toast.success(`Clocked out! Worked ${formatHours(result.workHours)} today. 🔴`);
            fetchData();
        } catch (error) {
            const msg = error.response?.data || 'Failed to clock out';
            toast.error(typeof msg === 'string' ? msg : 'Failed to clock out');
        } finally {
            setIsClocking(false);
        }
    };

    const formatHours = (decimal) => {
        if (!decimal) return '0h 0m';
        const hours = Math.floor(decimal);
        const minutes = Math.round((decimal - hours) * 60);
        return `${hours}h ${minutes}m`;
    };

    const getElapsedTime = () => {
        if (!todayRecord?.clockInTime) return null;
        const clockIn = new Date(todayRecord.clockInTime);
        const diff = currentTime - clockIn;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const totalDays = history.length;
    const totalHours = history.reduce((sum, r) => sum + (r.workHours || 0), 0);
    const totalOvertime = history.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Attendance</h1>
                    <p className="text-slate-500 mt-1">Track work hours and view attendance history.</p>
                </div>
                {/* Admin/HR Tab Switcher */}
                {isAdminOrHR && (
                    <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'my' ? 'bg-white shadow text-accent' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Clock className="w-4 h-4" /> My Attendance
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'all' ? 'bg-white shadow text-accent' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Users className="w-4 h-4" /> All Employees
                        </button>
                    </div>
                )}
            </div>

            {/* ========== MY ATTENDANCE TAB ========== */}
            {activeTab === 'my' && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Days (30d)</p>
                                <p className="text-xl font-bold text-slate-900">{totalDays}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Timer className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Total Hours</p>
                                <p className="text-xl font-bold text-slate-900">{formatHours(totalHours)}</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 uppercase">Monthly Delays</p>
                                <p className="text-xl font-bold text-slate-900">
                                    {history.reduce((sum, r) => sum + (r.delayMinutes || 0), 0)}m
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1 border-accent/20 bg-gradient-to-br from-accent/5 to-white shadow-sm overflow-hidden relative">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-accent" />
                                    Current Status
                                </CardTitle>
                                <CardDescription>
                                    {isClockedIn ? '🟢 Currently working' : '⚪ Not clocked in'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center py-8">
                                <div className="text-4xl font-black text-slate-900 mb-2 font-mono">
                                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                                <div className="text-sm font-medium text-slate-500 mb-4">
                                    {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                                {isClockedIn && (
                                    <div className="mb-6 text-center space-y-4">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Session Duration</p>
                                            <p className="text-2xl font-bold text-emerald-600 font-mono">{getElapsedTime()}</p>
                                        </div>
                                        {todayRecord?.delayMinutes > 0 && (
                                            <div className="p-2 px-4 rounded-full bg-red-50 border border-red-100 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                                <span className="text-xs font-bold text-red-700">Late by {todayRecord.delayMinutes}m</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {todayRecord?.clockOutTime && (
                                    <div className="mb-6 text-center space-y-2">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Today's Hours</p>
                                            <p className="text-2xl font-bold text-blue-600">{formatHours(todayRecord.workHours)}</p>
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {todayRecord.overtimeHours > 0 && (
                                                <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-bold">+{formatHours(todayRecord.overtimeHours)} OT</span>
                                            )}
                                            {todayRecord.delayMinutes > 0 && (
                                                <span className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold">{todayRecord.delayMinutes}m Late</span>
                                            )}
                                            {todayRecord.earlyLeavingMinutes > 0 && (
                                                <span className="px-2 py-1 rounded-md bg-orange-50 text-orange-600 text-[10px] font-bold">{todayRecord.earlyLeavingMinutes}m Early Leave</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="w-full max-w-[200px] relative">
                                    {todayRecord?.clockOutTime ? (
                                        <div className="w-full h-16 rounded-2xl bg-slate-100 flex items-center justify-center gap-2 text-slate-500 font-semibold">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Day Complete
                                        </div>
                                    ) : (
                                        <Button
                                            variant={isClockedIn ? 'danger' : 'accent'}
                                            className="w-full h-16 rounded-2xl text-lg font-bold shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95"
                                            onClick={isClockedIn ? handleClockOut : handleClockIn}
                                            disabled={isClocking}
                                        >
                                            {isClocking ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : isClockedIn ? (
                                                <><Square className="w-5 h-5 mr-2 fill-current" /> Clock Out</>
                                            ) : (
                                                <><Play className="w-5 h-5 mr-2 fill-current" /> Clock In</>
                                            )}
                                        </Button>
                                    )}
                                    {isClockedIn && (
                                        <div className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white animate-pulse" />
                                    )}
                                </div>
                            </CardContent>
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Clock className="w-24 h-24" />
                            </div>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle>Attendance History</CardTitle>
                                    <CardDescription>Your recent clock-in/out logs with delay tracking</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={fetchData}>
                                    <History className="w-4 h-4 mr-2" /> Refresh
                                </Button>
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
                                                    <th className="pb-4">Date</th>
                                                    <th className="pb-4">Clock In</th>
                                                    <th className="pb-4">Clock Out</th>
                                                    <th className="pb-4">Hours</th>
                                                    <th className="pb-4">Delays</th>
                                                    <th className="pb-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {history.length > 0 ? history.map((row) => (
                                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-4 text-sm font-medium text-slate-900">
                                                            {new Date(row.attendanceDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </td>
                                                        <td className="py-4 text-sm text-slate-600 font-mono">
                                                            {row.clockInTime ? new Date(row.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                            {row.delayMinutes > 0 && (
                                                                <span className="block text-[10px] text-red-500 font-bold">+{row.delayMinutes}m late</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 text-sm text-slate-600 font-mono">
                                                            {row.clockOutTime ? new Date(row.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                            {row.earlyLeavingMinutes > 0 && (
                                                                <span className="block text-[10px] text-orange-500 font-bold">{row.earlyLeavingMinutes}m early</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 text-sm text-slate-600 font-mono">
                                                            {formatHours(row.workHours)}
                                                            {row.overtimeHours > 0 && (
                                                                <span className="block text-[10px] text-amber-500 font-bold">+{formatHours(row.overtimeHours)} OT</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 text-sm font-mono">
                                                            {(row.delayMinutes || 0) + (row.earlyLeavingMinutes || 0) > 0 ? (
                                                                <span className="text-red-600 font-medium">{(row.delayMinutes || 0) + (row.earlyLeavingMinutes || 0)}m</span>
                                                            ) : (
                                                                <span className="text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 text-center">
                                                            {row.clockOutTime ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Active</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan="6" className="py-12 text-center">
                                                            <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                                            <p className="text-slate-500 text-sm">No attendance logs found for this period.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}

            {/* ========== ALL EMPLOYEES TAB (Admin/HRManager) ========== */}
            {activeTab === 'all' && isAdminOrHR && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-accent" /> All Employees Attendance
                                </CardTitle>
                                <CardDescription>Filter by date range to generate attendance reports</CardDescription>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-slate-500">From</label>
                                    <input
                                        type="date"
                                        className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                        value={adminDateFrom}
                                        onChange={e => setAdminDateFrom(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-semibold text-slate-500">To</label>
                                    <input
                                        type="date"
                                        className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                        value={adminDateTo}
                                        onChange={e => setAdminDateTo(e.target.value)}
                                    />
                                </div>
                                <Button size="sm" variant="accent" onClick={fetchAllAttendance}>Apply Filter</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {adminLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                                            <th className="px-6 py-4">Employee</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Clock In</th>
                                            <th className="px-6 py-4">Clock Out</th>
                                            <th className="px-6 py-4">Work Hours</th>
                                            <th className="px-6 py-4">Overtime</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {allRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-16 text-center">
                                                    <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                                    <p className="text-slate-500 font-medium">No attendance records in this date range.</p>
                                                </td>
                                            </tr>
                                        ) : allRecords.map(row => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                                                            {row.employeeName?.[0] || '?'}
                                                        </div>
                                                        <span className="text-sm font-semibold text-slate-900">{row.employeeName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                                    {new Date(row.attendanceDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{row.clockInTime ? new Date(row.clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{row.clockOutTime ? new Date(row.clockOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{formatHours(row.workHours)}</td>
                                                <td className="px-6 py-4 text-sm font-mono">
                                                    {row.overtimeHours > 0 ? <span className="text-amber-600 font-semibold">+{formatHours(row.overtimeHours)}</span> : <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {row.clockOutTime ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Active</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default AttendancePage;

