import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    Calendar,
    ArrowDownRight,
    ArrowUpRight,
    Download,
    FileText,
    History,
    CreditCard,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Info
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import PayrollService from '../../api/services/payrollService';
import exportService from '../../api/services/exportService';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';

const MyPayroll = () => {
    const { user } = useAuth();
    const [payrolls, setPayrolls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPayroll, setSelectedPayroll] = useState(null);

    useEffect(() => {
        if (user?.employeeId) {
            fetchPayrollHistory();
        }
    }, [user]);

    const fetchPayrollHistory = async () => {
        try {
            const data = await PayrollService.getEmployeeHistory(user.employeeId);
            setPayrolls(data);
            if (data.length > 0) {
                setSelectedPayroll(data[0]); // Default to latest
            }
        } catch (error) {
            console.error('Failed to fetch payroll history', error);
            toast.error('Could not load your payroll history');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
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
        } catch (error) {
            toast.error('Failed to download payslip PDF');
            console.error(error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: selectedPayroll?.currency || 'EGP',
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid': return <Badge variant="success" className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Paid</Badge>;
            case 'processed': return <Badge variant="accent" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Processed</Badge>;
            case 'draft': return <Badge variant="ghost" className="flex items-center gap-1"><FileText className="w-3 h-3" /> Draft</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium italic">Loading your financial records...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Payroll & Compensation</h1>
                    <p className="text-slate-500 mt-1">Review your income breakdown, bonuses, and deductions.</p>
                </div>
                {selectedPayroll && (
                    <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadPdf}>
                        <Download className="w-4 h-4" />
                        Download PDF Payslip
                    </Button>
                )}
            </div>

            {selectedPayroll ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Summary Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-premium overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-900 text-white">
                            <CardContent className="p-8">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="space-y-4">
                                        <div className="p-3 bg-white/10 rounded-2xl w-fit">
                                            <CreditCard className="w-6 h-6 text-indigo-200" />
                                        </div>
                                        <div>
                                            <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider">Net Salary - {new Date(selectedPayroll.payPeriodEnd).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                            <h2 className="text-5xl font-bold mt-1 tabular-nums">{formatCurrency(selectedPayroll.netPay)}</h2>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-2">
                                        {getStatusBadge(selectedPayroll.status)}
                                        <p className="text-xs text-indigo-300">Payment ID: {selectedPayroll.id.substring(0, 8).toUpperCase()}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
                                    <div>
                                        <p className="text-xs text-indigo-300 font-medium mb-1">Gross Earnings</p>
                                        <p className="text-lg font-bold flex items-center gap-1.5">
                                            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                            {formatCurrency(selectedPayroll.grossPay)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-indigo-300 font-medium mb-1">Total Deductions</p>
                                        <p className="text-lg font-bold flex items-center gap-1.5">
                                            <ArrowDownRight className="w-4 h-4 text-rose-400" />
                                            {formatCurrency(selectedPayroll.totalDeductions)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-indigo-300 font-medium mb-1">Pay Period</p>
                                        <p className="text-sm font-medium">Monthly</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detailed Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Earnings breakdown */}
                            <Card className="border-none shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                        Earnings Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-4">
                                    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500">Base Salary (Pro-rated)</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(selectedPayroll.baseSalary)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500">Allowances & Housing</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(selectedPayroll.allowances)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500">Overtime Pay</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(selectedPayroll.overtimePay)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm py-2">
                                        <span className="text-slate-500">Bonuses & Adjustments</span>
                                        <span className="font-bold text-emerald-600">{formatCurrency(selectedPayroll.bonuses)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Deductions breakdown */}
                            <Card className="border-none shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <ArrowDownRight className="w-4 h-4 text-rose-500" />
                                        Deductions Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-4">
                                    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500">Tax Withholding</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(selectedPayroll.taxDeduction)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm py-2 border-b border-slate-50">
                                        <span className="text-slate-500">Social Security / Insurance</span>
                                        <span className="font-bold text-slate-900">{formatCurrency(selectedPayroll.socialSecurityDeduction)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm py-2">
                                        <span className="text-slate-500">Other (Sanctions, Unpaid Leave)</span>
                                        <span className="font-bold text-rose-600">{formatCurrency(selectedPayroll.otherDeductions)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Note about pro-rata and sanctions */}
                        {(selectedPayroll.otherDeductions > 0) && (
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-4">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-amber-900">Adjustment Notice</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        Your payroll contains specific deductions/adjustments. This may include unpaid leave days, financial sanctions, or pro-rata adjustments if your employment status changed during the cycle. Please contact HR for a full itemized view.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* History Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-none shadow-sm min-h-[500px]">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <History className="w-5 h-5 text-indigo-500" />
                                    Payment History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {payrolls.map((payroll) => (
                                        <button
                                            key={payroll.id}
                                            onClick={() => setSelectedPayroll(payroll)}
                                            className={cn(
                                                "w-full text-left p-4 hover:bg-slate-50 transition-all flex items-center justify-between group",
                                                selectedPayroll.id === payroll.id ? "bg-indigo-50/50 border-l-4 border-indigo-500" : ""
                                            )}
                                        >
                                            <div className="space-y-1">
                                                <p className="font-bold text-slate-900">
                                                    {new Date(payroll.payPeriodEnd).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    {formatDate(payroll.payDate || payroll.payPeriodEnd)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-slate-900">{formatCurrency(payroll.netPay)}</p>
                                                <div className="flex justify-end mt-1">
                                                    {getStatusBadge(payroll.status)}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Legal info footer */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                <Info className="w-3.5 h-3.5" />
                                Legal Compliance
                            </h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                This payslip is a digital record of compensation compliant with Egyptian Labor Law. For official use, please request a stamped hardcopy from the Finance department.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <div className="p-6 bg-slate-50 rounded-full">
                        <DollarSign className="w-12 h-12 text-slate-300" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">No payroll records</h3>
                        <p className="text-slate-500 mt-1 max-w-xs mx-auto">Your payroll records will appear here once they are processed by the Finance team.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPayroll;
