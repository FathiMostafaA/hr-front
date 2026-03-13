import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    UserCheck,
    Calendar,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import AnalyticsService from '../../api/services/analyticsService';
import { useAuth } from '../../context/AuthContext';
import RoleOnboardingCards from '../../components/ui/RoleOnboardingCards';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <Card className="hover:scale-[1.02] transition-transform duration-200">
        <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-lg text-white", color)}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <div className={cn("flex items-center text-xs font-semibold", trend === 'up' ? 'text-emerald-600' : 'text-rose-600')}>
                        <TrendingUp className={cn("w-3 h-3 mr-1", trend === 'down' && 'rotate-180')} />
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        </CardContent>
    </Card>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(true);

    const isAdminOrHR = user?.roles?.some(r => ['Admin', 'HRManager', 'HR'].includes(r));
    const isManager = user?.roles?.some(r => r === 'Manager');
    const showStats = isAdminOrHR || isManager;

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Use the role-aware endpoint as primary source
                const data = await AnalyticsService.getDashboardOverview();
                setDashboardData(data);

                // If Admin/HR, try to fetch even more detailed analytics
                if (isAdminOrHR) {
                    try {
                        const complexStats = await AnalyticsService.getDashboardStats();
                        setDashboardData(prev => ({ ...prev, ...complexStats }));
                    } catch (e) {
                        // Silent fail for complex analytics if restricted
                    }
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, [isAdminOrHR]);

    const stats = [
        { title: 'Total Employees', value: dashboardData?.totalEmployees || 0, icon: Users, trend: 'up', trendValue: '+4%', color: 'bg-primary' },
        { title: 'Active Projects', value: dashboardData?.activeJobPostings || 0, icon: UserCheck, trend: 'up', trendValue: '+12%', color: 'bg-accent' },
        { title: 'Leaves Pending', value: dashboardData?.pendingLeaveRequests || 0, icon: Calendar, trend: 'down', trendValue: '-2%', color: 'bg-amber-500' },
        { title: 'Total Monthly Payroll', value: `$${(dashboardData?.totalMonthlyPayroll || 0).toLocaleString()}`, icon: TrendingUp, trend: 'up', trendValue: '+1.5%', color: 'bg-blue-500' },
    ];

    const recentLeaves = dashboardData?.recentLeaveRequests || [];

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Approved': return <Badge variant="success">Approved</Badge>;
            case 'Pending': return <Badge variant="warning">Pending</Badge>;
            case 'Rejected': return <Badge variant="error">Rejected</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 font-medium animate-pulse">Loading dashboard analytics...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                        {isAdminOrHR ? 'Dashboard Overview' : isManager ? 'Team Overview' : 'Employee Overview'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Welcome back, <span className="text-accent font-semibold">{user?.fullName || 'User'}</span>! Here's what's happening today.
                    </p>
                </div>
                {!isAdminOrHR && !isManager && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/leaves')}
                            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent/90 transition-all shadow-sm shadow-accent/20"
                        >
                            Request Leave
                        </button>
                    </div>
                )}
            </div>

            {/* Onboarding Cards */}
            <RoleOnboardingCards />

            {/* Stats Grid - Show to Privileged Roles */}
            {showStats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {stats.map((stat, i) => (
                        <StatCard key={i} {...stat} />
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity / Leave Requests */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Leave Requests</CardTitle>
                            <CardDescription>Review and manage upcoming employee leaves</CardDescription>
                        </div>
                        <button
                            onClick={() => navigate('/leaves')}
                            className="text-sm font-semibold text-accent hover:underline"
                        >
                            View All
                        </button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                        <th className="pb-4">Employee</th>
                                        <th className="pb-4">Leave Type</th>
                                        <th className="pb-4">Duration</th>
                                        <th className="pb-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentLeaves.map((leave) => (
                                        <tr key={leave.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                        {leave.name?.charAt(0) || leave.employeeName?.charAt(0) || 'E'}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-900">{leave.name || leave.employeeName}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 text-sm text-slate-600">{leave.type || leave.leaveType}</td>
                                            <td className="py-4 text-sm text-slate-600">{leave.date || `${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}`}</td>
                                            <td className="py-4 text-center">{getStatusBadge(leave.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions / Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Frequently used HR tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isAdminOrHR ? (
                            <>
                                <button
                                    onClick={() => navigate('/employees')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-accent hover:bg-accent/5 transition-all text-left text-sm font-medium text-slate-700"
                                >
                                    <Users className="w-4 h-4 text-accent" />
                                    Add New Employee
                                </button>
                                <button
                                    onClick={() => navigate('/training')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-accent hover:bg-accent/5 transition-all text-left text-sm font-medium text-slate-700"
                                >
                                    <Calendar className="w-4 h-4 text-accent" />
                                    Manage Training
                                </button>
                                <button
                                    onClick={() => navigate('/payroll')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-accent hover:bg-accent/5 transition-all text-left text-sm font-medium text-slate-700"
                                >
                                    <TrendingUp className="w-4 h-4 text-accent" />
                                    Run Payroll Report
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate(`/employees/${user.employeeId}`)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-accent hover:bg-accent/5 transition-all text-left text-sm font-medium text-slate-700"
                                >
                                    <Users className="w-4 h-4 text-accent" />
                                    My Profile
                                </button>
                                <button
                                    onClick={() => navigate('/leaves')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-accent hover:bg-accent/5 transition-all text-left text-sm font-medium text-slate-700"
                                >
                                    <Calendar className="w-4 h-4 text-accent" />
                                    My Leave Requests
                                </button>
                                <button
                                    onClick={() => navigate('/attendance')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-accent hover:bg-accent/5 transition-all text-left text-sm font-medium text-slate-700"
                                >
                                    <Clock className="w-4 h-4 text-accent" />
                                    My Attendance
                                </button>
                            </>
                        )}
                        {showStats && dashboardData?.headcountByDepartment && (
                            <div className="mt-6 p-4 bg-slate-900 rounded-xl text-white">
                                <div className="flex items-center gap-2 mb-2 text-amber-400">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Department Headcount</span>
                                </div>
                                <div className="space-y-2 mt-3">
                                    {dashboardData?.headcountByDepartment?.slice(0, 3).map((dept, i) => (
                                        <div key={i} className="flex items-center justify-between text-[11px]">
                                            <span className="text-slate-400">{dept.departmentName}</span>
                                            <span className="font-bold">{dept.count}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => navigate('/departments')}
                                    className="mt-4 text-xs font-semibold text-white hover:text-accent transition-colors w-full text-center"
                                >
                                    View Breakdown →
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
