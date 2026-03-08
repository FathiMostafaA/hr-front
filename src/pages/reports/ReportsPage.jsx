import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Download, Users, FileText, Calendar, Building, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import reportService from '../../api/services/reportService';
import exportService from '../../api/services/exportService';

const ReportsPage = () => {
    const [employeeSummary, setEmployeeSummary] = useState(null);
    const [payrollSummary, setPayrollSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

    const [leaveFromDate, setLeaveFromDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [leaveToDate, setLeaveToDate] = useState(today.toISOString().split('T')[0]);

    const fetchReports = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [empData, payData] = await Promise.all([
                reportService.getEmployeeSummary(),
                reportService.getPayrollSummary(selectedYear, selectedMonth).catch(() => null) // Payroll might be 404 if no data for month
            ]);
            setEmployeeSummary(empData);
            setPayrollSummary(payData);
        } catch (err) {
            toast.error('Failed to load summary reports');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleDownload = async (action, filename) => {
        try {
            const blob = await action();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success(`${filename} downloaded successfully!`);
        } catch {
            toast.error(`Failed to download ${filename}`);
        }
    };

    if (isLoading && !employeeSummary) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in relative z-10 pb-8 content-visibility-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">System Reports</h1>
                    <p className="text-slate-500 mt-1">Analytics and data exports for human resources and payroll.</p>
                </div>
            </div>

            {/* Demographics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm bg-white/50 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl ring-1 ring-blue-100/50">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Employees</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{employeeSummary?.totalEmployees || 0}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm bg-white/50 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl ring-1 ring-indigo-100/50">
                                <Building className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Active Departments</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{employeeSummary?.departmentDistribution ? Object.keys(employeeSummary.departmentDistribution).length : 0}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 border-none shadow-sm bg-white/50 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl ring-1 ring-emerald-100/50">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Payroll ({selectedYear}/{selectedMonth})</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">${payrollSummary?.totalNetPay?.toLocaleString() || '0.00'}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Exports Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Employee Reports Box */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-xl">
                    <CardHeader className="border-b border-slate-100/50 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-accent" />
                            Employee Reports
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <h4 className="font-bold text-slate-800">Complete Employee Census</h4>
                                <p className="text-sm text-slate-500">Full dump of all employee profiles in Excel format.</p>
                            </div>
                            <Button variant="outline" onClick={() => handleDownload(() => exportService.downloadEmployeeExcel(), 'Employees_Export.xlsx')} className="shrink-0 bg-white">
                                <Download className="w-4 h-4 mr-2 text-slate-500" />
                                Excel
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <h4 className="font-bold text-slate-800">Lightweight Roster</h4>
                                <p className="text-sm text-slate-500">Basic contact dataset in CSV format.</p>
                            </div>
                            <Button variant="outline" onClick={() => handleDownload(() => exportService.downloadEmployeeCsv(), 'Employees_Roster.csv')} className="shrink-0 bg-white">
                                <Download className="w-4 h-4 mr-2 text-slate-500" />
                                CSV
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Payroll Reports Box */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-xl">
                    <CardHeader className="border-b border-slate-100/50 bg-slate-50/50 flex flex-row items-center justify-between py-4">
                        <CardTitle className="flex items-center gap-2 m-0">
                            <DollarSign className="w-5 h-5 text-accent" />
                            Payroll Reports
                        </CardTitle>
                        <div className="flex gap-2">
                            <select
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 transition-all font-sans"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}</option>
                                ))}
                            </select>
                            <select
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 transition-all font-sans"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                            >
                                {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <h4 className="font-bold text-slate-800">Monthly Payroll Ledger</h4>
                                <p className="text-sm text-slate-500">Financial distribution for {selectedMonth}/{selectedYear}</p>
                            </div>
                            <Button variant="outline" onClick={() => handleDownload(() => exportService.downloadPayrollCsv(selectedYear, selectedMonth), `Payroll_${selectedYear}_${selectedMonth}.csv`)} className="shrink-0 bg-white">
                                <Download className="w-4 h-4 mr-2 text-slate-500" />
                                CSV
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Time & Attendance */}
                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-xl md:col-span-2">
                    <CardHeader className="border-b border-slate-100/50 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-accent" />
                            Time & Attendance Exporter
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="space-y-1 flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Date</label>
                                <input
                                    type="date"
                                    value={leaveFromDate}
                                    onChange={(e) => setLeaveFromDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-sans text-sm"
                                />
                            </div>
                            <div className="space-y-1 flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Date</label>
                                <input
                                    type="date"
                                    value={leaveToDate}
                                    onChange={(e) => setLeaveToDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all font-sans text-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => handleDownload(() => exportService.downloadAttendanceReportCsv(leaveFromDate, leaveToDate), `Attendance_${leaveFromDate}_${leaveToDate}.csv`)} className="bg-white hover:bg-slate-100">
                                    <Download className="w-4 h-4 mr-2" />
                                    Attendance
                                </Button>
                                <Button variant="outline" onClick={() => handleDownload(() => exportService.downloadLeaveReportCsv(leaveFromDate, leaveToDate), `Leaves_${leaveFromDate}_${leaveToDate}.csv`)} className="bg-white hover:bg-slate-100">
                                    <Download className="w-4 h-4 mr-2" />
                                    Leaves
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ReportsPage;
