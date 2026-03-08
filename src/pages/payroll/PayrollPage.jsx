import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    Calculator,
    Download,
    FileText,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PayrollService from '../../api/services/payrollService';
import ReportService from '../../api/services/reportService';
import exportService from '../../api/services/exportService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const PayrollPage = () => {
    const [payrollHistory, setPayrollHistory] = useState([]);
    const [summary, setSummary] = useState(null);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [showPayslip, setShowPayslip] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const isHRManager = user?.roles?.some(r => r === 'Admin' || r === 'HRManager');

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [historyData, summaryData] = await Promise.all([
                PayrollService.getHistory(),
                ReportService.getPayrollSummary(currentYear, currentMonth)
            ]);
            setPayrollHistory(historyData);
            setSummary(summaryData);
        } catch (err) {
            console.error('Failed to fetch payroll data', err);
            toast.error('Failed to load payroll records');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunPayroll = async () => {
        if (!window.confirm(`Run payroll for ${now.toLocaleString('default', { month: 'long' })} ${currentYear}?`)) return;

        setIsLoading(true);
        try {
            const count = await PayrollService.processMonthly(currentYear, currentMonth);
            toast.success(`Successfully processed payroll for ${count} employees!`);
            fetchData();
        } catch (err) {
            console.error('Payroll processing failed', err);
            toast.error('Failed to process monthly payroll');
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewPayslip = (payroll) => {
        setSelectedPayroll(payroll);
        setShowPayslip(true);
    };

    const handleDownloadPdf = async () => {
        if (!selectedPayroll) return;
        try {
            const blob = await exportService.downloadPayrollPdf(selectedPayroll.id);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Payslip_${selectedPayroll.id.substring(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            toast.success('Payslip downloaded successfully');
        } catch (err) {
            toast.error('Failed to download payslip PDF');
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Payroll Management</h1>
                    <p className="text-slate-500 mt-1">Process salaries, manage deductions, and view reports.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Payslips
                    </Button>
                    {isHRManager && (
                        <Button variant="accent" onClick={handleRunPayroll} disabled={isLoading}>
                            {isLoading ? 'Processing...' : (
                                <>
                                    <Calculator className="w-4 h-4 mr-2" />
                                    Run Payroll
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1 border-accent/20 bg-accent/[0.02]">
                    <CardHeader>
                        <CardTitle className="text-accent underline decoration-accent/20 underline-offset-8">Financial Overview</CardTitle>
                        <CardDescription>{now.toLocaleString('default', { month: 'long' })} {currentYear}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-900 mb-1">
                            {summary?.currency || '$'}{summary?.totalNetPay?.toLocaleString() || '0.00'}
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            Total Net Disbursement
                        </p>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">Gross Salary</span>
                                <span className="text-slate-900 font-bold">{summary?.currency || '$'}{summary?.totalGrossPay?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">Tax Deductions</span>
                                <span className="text-rose-500 font-bold">-{summary?.currency || '$'}{summary?.totalTax?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">Social Security</span>
                                <span className="text-rose-500 font-bold">-{summary?.currency || '$'}{summary?.totalSocialSecurity?.toLocaleString() || '0'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 font-medium">Average Net Pay</span>
                                <span className="text-slate-900 font-bold">
                                    {summary?.currency || '$'}
                                    {summary?.totalPayrolls > 0
                                        ? (summary.totalNetPay / summary.totalPayrolls).toLocaleString(undefined, { maximumFractionDigits: 0 })
                                        : '0'}
                                </span>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-base">
                                <span className="text-slate-900 font-black">Total Processed</span>
                                <span className="text-accent font-black">{summary?.totalPayrolls || 0} Records</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Payroll History</CardTitle>
                        <CardDescription>Log of all previous payroll cycles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                                        <th className="pb-4">Payment Period</th>
                                        <th className="pb-4">Total Disbursement</th>
                                        <th className="pb-4 text-center">Status</th>
                                        <th className="pb-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {payrollHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="py-12 text-center">
                                                <div className="flex flex-col items-center text-slate-400">
                                                    <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                                    <p className="text-sm font-medium">No payroll records found.</p>
                                                    <p className="text-xs">Click "Run Payroll" to generate new records.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        payrollHistory.map((row) => (
                                            <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-white transition-colors">
                                                            <Calendar className="w-4 h-4 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">{row.employeeName}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">
                                                                {new Date(row.payPeriodStart).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-sm font-bold text-slate-700">
                                                    {row.currency} {row.netPay.toLocaleString()}
                                                </td>
                                                <td className="py-4 text-center">
                                                    <Badge variant={row.status === 'Paid' ? 'success' : row.status === 'Processed' ? 'info' : 'warning'}>
                                                        {row.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewPayslip(row)}>
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        Payslip
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payslip Modal */}
            <Modal
                isOpen={showPayslip}
                onClose={() => setShowPayslip(false)}
                title="Employee Payslip"
                size="lg"
            >
                {selectedPayroll && (
                    <div className="space-y-6 py-4">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">{selectedPayroll.employeeName}</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Period: {new Date(selectedPayroll.payPeriodStart).toLocaleDateString()} - {new Date(selectedPayroll.payPeriodEnd).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <Badge variant="success" className="mb-2">{selectedPayroll.status}</Badge>
                                <p className="text-xs text-slate-400">ID: {selectedPayroll.id.substring(0, 8)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Earnings</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Base Salary</span>
                                        <span className="font-bold text-slate-900">{selectedPayroll.currency} {selectedPayroll.baseSalary.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Allowances</span>
                                        <span className="font-bold text-emerald-600">+{selectedPayroll.currency} {selectedPayroll.allowances.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Bonuses</span>
                                        <span className="font-bold text-emerald-600">+{selectedPayroll.currency} {selectedPayroll.bonuses.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Overtime Pay</span>
                                        <span className="font-bold text-emerald-600">+{selectedPayroll.currency} {selectedPayroll.overtimePay.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-50 flex justify-between text-sm font-black">
                                        <span className="text-slate-900">Gross Pay</span>
                                        <span className="text-slate-900">{selectedPayroll.currency} {selectedPayroll.grossPay.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Deductions</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Tax</span>
                                        <span className="font-bold text-rose-500">-{selectedPayroll.currency} {selectedPayroll.taxDeduction.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Social Security</span>
                                        <span className="font-bold text-rose-500">-{selectedPayroll.currency} {selectedPayroll.socialSecurityDeduction.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Other Deductions (Absence/Lates)</span>
                                        <span className="font-bold text-rose-500">-{selectedPayroll.currency} {selectedPayroll.otherDeductions?.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-2 border-t border-slate-50 flex justify-between text-sm font-black">
                                        <span className="text-slate-900">Total Deductions</span>
                                        <span className="text-rose-500">{selectedPayroll.currency} {selectedPayroll.totalDeductions.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-slate-900 rounded-2xl flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-1">Net Pay</p>
                                <p className="text-3xl font-black text-white">{selectedPayroll.currency} {selectedPayroll.netPay.toLocaleString()}</p>
                            </div>
                            <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={handleDownloadPdf}>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default PayrollPage;
