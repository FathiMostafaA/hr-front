import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, History, Plus, Search, FileText, User, Calendar, DollarSign, ExternalLink, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import sanctionService from '../../api/services/sanctionService';
import employeeService from '../../api/services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const SanctionsPage = () => {
    const [violations, setViolations] = useState([]);
    const [employees, setEmployees] = useState([]);
    // const [isLoading, setIsLoading] = useState(true);
    const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
    const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false);
    const [selectedViolation, setSelectedViolation] = useState(null);
    const { user } = useAuth();
    const isAdminOrHR = user?.roles?.some(r => r === 'Admin' || r === 'HRManager' || r === 'HR');

    const [violationForm, setViolationForm] = useState({
        employeeId: '',
        violationDate: new Date().toISOString().split('T')[0],
        violationType: 'Conduct',
        description: '',
        evidenceUrl: ''
    });

    const [sanctionForm, setSanctionForm] = useState({
        violationId: '',
        type: 'VerbalWarning',
        description: '',
        deductionAmount: 0,
        sanctionDate: new Date().toISOString().split('T')[0],
        expiryDate: ''
    });

    // Delete state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [violationToDelete, setViolationToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // setIsLoading(true);
        try {
            const [violationData, employeeData] = await Promise.all([
                sanctionService.getAllViolations(),
                employeeService.getAll()
            ]);
            setViolations(violationData);
            setEmployees(employeeData);
        } catch {
            toast.error('Failed to load data');
        } finally {
            // setIsLoading(false);
        }
    };

    const handleRecordViolation = async (e) => {
        e.preventDefault();
        try {
            await sanctionService.recordViolation(violationForm);
            toast.success('Violation recorded successfully');
            setIsViolationModalOpen(false);
            fetchData();
        } catch {
            toast.error('Failed to record violation');
        }
    };

    const handleApplySanction = async (e) => {
        e.preventDefault();
        try {
            await sanctionService.applySanction({
                ...sanctionForm,
                violationId: selectedViolation.id
            });
            toast.success('Sanction applied');
            setIsSanctionModalOpen(false);
            fetchData();
        } catch {
            toast.error('Failed to apply sanction');
        }
    };

    const handleDeleteClick = (violation) => {
        setViolationToDelete(violation);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!violationToDelete) return;
        setIsDeleting(true);
        try {
            await sanctionService.deleteViolation(violationToDelete.id);
            toast.success('Incident record removed');
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.title || err.response?.data || 'Failed to delete incident';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to delete incident');
        } finally {
            setIsDeleting(false);
            setViolationToDelete(null);
        }
    };

    const getSanctionColor = (type) => {
        switch (type) {
            case 'Termination': return 'danger';
            case 'Suspension': return 'warning';
            case 'FinancialDeduction': return 'accent';
            default: return 'secondary';
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Violations & Sanctions</h1>
                    <p className="text-slate-500 mt-1">Maintain workplace standards and record disciplinary actions.</p>
                </div>
                {isAdminOrHR && (
                    <Button variant="danger" onClick={() => setIsViolationModalOpen(true)} className="shadow-lg shadow-red-200">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Record Violation
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Major Violations</p>
                            <p className="text-2xl font-black text-red-900">{violations.filter(v => v.violationType === 'Severe').length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-100">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                            <History className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Resolved Cases</p>
                            <p className="text-2xl font-black text-emerald-900">{violations.filter(v => v.sanction).length}</p>
                        </div>
                    </CardContent>
                </Card>
                {/* Add more stats if needed */}
            </div>

            <Card className="border-slate-100 overflow-hidden shadow-sm">
                <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="w-5 h-5 text-slate-400" />
                        Incident History
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Incident</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Violation Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Severity</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Sanction</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {violations.map((v) => (
                                <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                                                {v.employeeName[0]}
                                            </div>
                                            <span className="font-bold text-slate-900">{v.employeeName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-slate-700 line-clamp-1">{v.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-slate-500 font-medium">
                                            {new Date(v.violationDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={v.violationType === 'Severe' ? 'danger' : 'warning'}>
                                            {v.violationType}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {v.sanction ? (
                                            <Badge variant={getSanctionColor(v.sanction.type)}>
                                                {v.sanction.type}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-300">Pending Action</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {isAdminOrHR && !v.sanction && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedViolation(v);
                                                        setIsSanctionModalOpen(true);
                                                    }}
                                                >
                                                    Apply Sanction
                                                </Button>
                                            )}
                                            {isAdminOrHR && (
                                                <button
                                                    onClick={() => handleDeleteClick(v)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isViolationModalOpen} onClose={() => setIsViolationModalOpen(false)} title="Record Disciplinary Incident">
                <form onSubmit={handleRecordViolation} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Select Employee</label>
                        <select
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                            value={violationForm.employeeId}
                            onChange={(e) => setViolationForm({ ...violationForm, employeeId: e.target.value })}
                        >
                            <option value="">-- Select Employee --</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Incident Date</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={violationForm.violationDate}
                                onChange={(e) => setViolationForm({ ...violationForm, violationDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Violation Type</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={violationForm.violationType}
                                onChange={(e) => setViolationForm({ ...violationForm, violationType: e.target.value })}
                            >
                                <option value="Minor">Minor</option>
                                <option value="Major">Major</option>
                                <option value="Severe">Severe</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Incident Description</label>
                        <textarea
                            required
                            rows="4"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                            placeholder="Describe what happened..."
                            value={violationForm.description}
                            onChange={(e) => setViolationForm({ ...violationForm, description: e.target.value })}
                        />
                    </div>
                    <Button type="submit" variant="danger" className="w-full mt-4 py-4 font-bold shadow-lg shadow-red-200">
                        Record Incident
                    </Button>
                </form>
            </Modal>

            <Modal isOpen={isSanctionModalOpen} onClose={() => setIsSanctionModalOpen(false)} title="Apply Sanction">
                {selectedViolation && (
                    <form onSubmit={handleApplySanction} className="space-y-4 py-2">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-900">{selectedViolation.employeeName}</span>
                            </div>
                            <p className="text-sm text-slate-500 italic">"{selectedViolation.description}"</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Sanction Type</label>
                            <select
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={sanctionForm.type}
                                onChange={(e) => setSanctionForm({ ...sanctionForm, type: e.target.value })}
                            >
                                <option value="VerbalWarning">Verbal Warning</option>
                                <option value="WrittenWarning">Written Warning</option>
                                <option value="FinancialDeduction">Financial Deduction</option>
                                <option value="Suspension">Suspension</option>
                                <option value="Termination">Termination</option>
                            </select>
                        </div>

                        {sanctionForm.type === 'FinancialDeduction' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Deduction Amount ($)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                        value={sanctionForm.deductionAmount}
                                        onChange={(e) => setSanctionForm({ ...sanctionForm, deductionAmount: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Effective Date</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={sanctionForm.sanctionDate}
                                onChange={(e) => setSanctionForm({ ...sanctionForm, sanctionDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Internal Note</label>
                            <textarea
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                placeholder="Rationale for this sanction..."
                                value={sanctionForm.description}
                                onChange={(e) => setSanctionForm({ ...sanctionForm, description: e.target.value })}
                            />
                        </div>

                        <Button type="submit" variant="accent" className="w-full mt-4 py-4 font-bold shadow-lg shadow-accent/20">
                            Apply Penalty
                        </Button>
                    </form>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                title="Delete Incident Record"
                description={`Are you sure you want to delete the incident record for ${violationToDelete?.employeeName}? This will also remove any applied sanctions. This action cannot be undone.`}
            />
        </div>
    );
};

export default SanctionsPage;
