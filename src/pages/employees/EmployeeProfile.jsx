import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    User,
    Mail,
    Briefcase,
    Calendar,
    DollarSign,
    Shield,
    Clock,
    CheckCircle2,
    MapPin,
    Plus,
    FileText,
    Download,
    X,
    Upload,
    Edit2,
    Building2,
    AlertCircle,
    Lock,
    ShieldCheck,
    Wallet,
    CreditCard,
    Contact
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmployeeService from '../../api/services/employeeService';
import AuthService from '../../api/services/authService';
import DocumentService from '../../api/services/documentService';
import PayrollService from '../../api/services/payrollService';
import DepartmentService from '../../api/services/departmentService';
import { useAuth } from '../../context/AuthContext'; // Added useAuth
const EmployeeProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [activationUrl, setActivationUrl] = useState('');
    const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'professional', 'financial', 'documents', 'payroll'
    const [documents, setDocuments] = useState([]);
    const [salaryComponents, setSalaryComponents] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmittingComponent, setIsSubmittingComponent] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showComponentModal, setShowComponentModal] = useState(false);
    const [isEditingComponent, setIsEditingComponent] = useState(false);
    const [editingComponentId, setEditingComponentId] = useState(null);
    const [uploadForm, setUploadForm] = useState({
        name: '',
        type: 'Contract',
        expiryDate: ''
    });
    const [componentForm, setComponentForm] = useState({
        name: '',
        type: 'Earning',
        amount: '',
        isPercentage: false,
        isActive: true
    });
    const [selectedFile, setSelectedFile] = useState(null);

    const { user } = useAuth(); // Get current user
    const isAdminOrHR = user?.roles?.some(r => r === 'Admin' || r === 'HRManager');
    const isSelf = user?.employeeId === id;

    const canEditField = (fieldName) => {
        if (isAdminOrHR) return true;

        // Employees can edit their own personal, compliance and financial data
        if (isSelf) {
            const selfServiceFields = [
                'phone', 'address', 'nationalId', 'nationalIdExpiry',
                'emergencyContactName', 'emergencyContactPhone',
                'bankName', 'bankAccountNumber', 'iban', 'socialInsuranceNumber'
            ];
            return selfServiceFields.includes(fieldName);
        }

        return false;
    };

    const renderLockIcon = (fieldName) => {
        if (!canEditField(fieldName)) {
            return <Lock className="w-3 h-3 text-amber-500 ml-1.5 inline-block" title="HR Restricted field" />;
        }
        return null;
    };

    // Edit Profile State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        departmentId: '',
        hireDate: '',
        employmentStatus: '',
        employmentTypeStr: '',
        baseSalary: '',
        currency: 'EGP',
        address: '',
        nationalId: '',
        nationalIdExpiry: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        probationEndDate: '',
        bankName: '',
        bankAccountNumber: '',
        iban: '',
        socialInsuranceNumber: ''
    });

    const fetchEmployee = async () => {
        try {
            const data = await EmployeeService.getById(id);
            setEmployee(data);
            if (activeTab === 'documents') {
                fetchDocuments();
            } else if (activeTab === 'payroll') {
                fetchSalaryComponents();
            }
        } catch (error) {
            console.error('Failed to fetch employee details', error);
            toast.error('Failed to load employee profile');
            navigate('/employees');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDocuments = async () => {
        try {
            const docs = await DocumentService.getEmployeeDocuments(id);
            setDocuments(docs);
        } catch (error) {
            console.error('Failed to fetch documents', error);
        }
    };

    useEffect(() => {
        fetchEmployee();
        fetchDepartments();
    }, [id, navigate]);

    useEffect(() => {
        if (activeTab === 'documents') {
            fetchDocuments();
        }
    }, [activeTab]);

    const fetchSalaryComponents = async () => {
        try {
            const components = await PayrollService.getEmployeeComponents(id);
            setSalaryComponents(components);
        } catch (error) {
            console.error('Failed to fetch salary components', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'documents') fetchDocuments();
        if (activeTab === 'payroll') fetchSalaryComponents();
    }, [activeTab]);

    const fetchDepartments = async () => {
        try {
            const data = await DepartmentService.getAll();
            setDepartments(data);
        } catch (error) {
            console.error('Failed to fetch departments', error);
        }
    };

    const handleEditProfile = () => {
        setEditForm({
            firstName: employee.firstName || '',
            lastName: employee.lastName || '',
            email: employee.email || '',
            phone: employee.phone || '',
            jobTitle: employee.jobTitle || '',
            departmentId: employee.departmentId || '',
            hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
            employmentStatus: employee.employmentStatus || 'Active',
            employmentTypeStr: employee.employmentTypeStr || 'FullTime',
            baseSalary: employee.baseSalary || 0,
            currency: employee.currency || 'EGP',
            address: employee.address || '',
            nationalId: employee.nationalId || '',
            nationalIdExpiry: employee.nationalIdExpiry ? employee.nationalIdExpiry.split('T')[0] : '',
            emergencyContactName: employee.emergencyContactName || '',
            emergencyContactPhone: employee.emergencyContactPhone || '',
            probationEndDate: employee.probationEndDate ? employee.probationEndDate.split('T')[0] : '',
            bankName: employee.bankName || '',
            bankAccountNumber: employee.bankAccountNumber || '',
            iban: employee.iban || '',
            socialInsuranceNumber: employee.socialInsuranceNumber || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await EmployeeService.update(id, editForm);
            toast.success('Employee profile updated successfully');
            setIsEditModalOpen(false);
            fetchEmployee();
        } catch (error) {
            console.error('Update failed', error);
            toast.error('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }
        setIsUploading(true);
        try {
            await DocumentService.uploadDocument(
                id,
                selectedFile,
                uploadForm.type,
                uploadForm.expiryDate,
                false // requiresSignature defaults to false
            );
            toast.success('Document uploaded successfully');
            setShowUploadModal(false);
            setUploadForm({ name: '', type: 'Contract', expiryDate: '' });
            setSelectedFile(null);
            fetchDocuments();
        } catch (error) {
            toast.error('Failed to upload document');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteDocument = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            await DocumentService.deleteDocument(docId);
            toast.success('Document deleted');
            fetchDocuments();
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    const handleCreateComponent = async (e) => {
        e.preventDefault();
        if (!componentForm.name || !componentForm.amount) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmittingComponent(true);
        try {
            if (isEditingComponent) {
                await PayrollService.updateComponent(editingComponentId, {
                    ...componentForm,
                    amount: parseFloat(componentForm.amount)
                });
                toast.success('Salary component updated');
            } else {
                await PayrollService.addComponent({
                    employeeId: id,
                    ...componentForm,
                    amount: parseFloat(componentForm.amount)
                });
                toast.success('Salary component added');
            }
            setShowComponentModal(false);
            setComponentForm({ name: '', type: 'Earning', amount: '', isPercentage: false, isActive: true });
            setIsEditingComponent(false);
            setEditingComponentId(null);
            fetchSalaryComponents();
        } catch (error) {
            toast.error(isEditingComponent ? 'Failed to update component' : 'Failed to add component');
        } finally {
            setIsSubmittingComponent(false);
        }
    };

    const handleEditComponent = (comp) => {
        setComponentForm({
            name: comp.name,
            type: comp.type,
            amount: comp.amount,
            isPercentage: comp.isPercentage,
            isActive: comp.isActive
        });
        setEditingComponentId(comp.id);
        setIsEditingComponent(true);
        setShowComponentModal(true);
    };
    const handleDeleteComponent = async (compId) => {
        if (!window.confirm('Are you sure you want to remove this salary component?')) return;
        try {
            await PayrollService.deleteComponent(compId);
            toast.success('Component removed');
            fetchSalaryComponents();
        } catch (error) {
            toast.error('Failed to remove component');
        }
    };

    const handleInvite = async () => {
        setIsInviting(true);
        try {
            const data = await AuthService.inviteEmployee(id);
            setActivationUrl(data.activationUrl);
            setIsInvitationModalOpen(true);
            toast.success('Invitation link generated');
        } catch (error) {
            console.error('Failed to generate invitation', error);
            toast.error('Failed to generate invitation link');
        } finally {
            setIsInviting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return <Badge variant="success">Active</Badge>;
            case 'onleave': return <Badge variant="warning">On Leave</Badge>;
            case 'terminated': return <Badge variant="error">Terminated</Badge>;
            default: return <Badge>{status || 'Active'}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading employee profile...</p>
            </div>
        );
    }

    if (!employee) return null;

    // --- Public Profile View (Non-Owner & Non-Admin) ---
    if (!isSelf && !isAdminOrHR) {
        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Back Button */}
                <Button variant="ghost" className="pl-0 hover:bg-transparent group" onClick={() => navigate('/employees')}>
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Directory
                </Button>

                {/* Public Profile Header */}
                <Card className="border-none shadow-sm overflow-hidden bg-white">
                    <div className="h-32 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-b border-slate-200" />
                    <CardContent className="px-8 pb-8 -mt-12 relative">
                        <div className="flex flex-col md:flex-row items-end gap-6">
                            <div className="w-32 h-32 rounded-full bg-white shadow-lg border-4 border-white flex items-center justify-center text-4xl font-bold text-slate-400">
                                {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                            </div>
                            <div className="flex-1 pb-2 space-y-2">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900">{employee.fullName || `${employee.firstName} ${employee.lastName}`}</h1>
                                    <p className="text-lg text-slate-500 font-medium">{employee.jobTitle}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200">
                                        <Building2 className="w-3 h-3 mr-1" />
                                        {employee.departmentName || 'Unassigned'}
                                    </Badge>
                                    {getStatusBadge(employee.employmentStatus)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Contact & Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" />
                                    About
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Work Email</p>
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        <a href={`mailto:${employee.email}`} className="hover:text-accent transition-colors">
                                            {employee.email}
                                        </a>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Manager</p>
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        {employee.managerName ? (
                                            <Link to={`/employees/${employee.managerId}`} className="hover:text-accent transition-colors underline-offset-4 hover:underline">
                                                {employee.managerName}
                                            </Link>
                                        ) : (
                                            <span className="text-slate-400 italic">None</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase">Joined</p>
                                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'N/A'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Professional Details */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Skills Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-slate-400" />
                                    Skills & Expertise
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {employee.skills?.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {employee.skills.map((skill, idx) => (
                                            <Badge key={idx} variant="secondary" className="bg-slate-50 border-slate-100 text-slate-700 px-3 py-1">
                                                {skill.skillName}
                                                <span className="ml-2 text-xs text-slate-400 border-l border-slate-200 pl-2">
                                                    {skill.proficiencyLevel}
                                                </span>
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No skills listed.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Education Section */}
                        {employee.education?.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        Education
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {employee.education.map((edu, idx) => (
                                        <div key={idx} className="flex items-start justify-between pb-4 last:pb-0 border-b border-slate-50 last:border-0">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{edu.degree}</p>
                                                <p className="text-xs text-slate-500">{edu.institution}</p>
                                            </div>
                                            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">{edu.graduationYear}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- Full Admin/Owner View ---
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="pl-0 hover:bg-transparent group" onClick={() => navigate('/employees')}>
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Directory
                </Button>
                <div className="flex items-center gap-3">
                    {activeTab === 'documents' && (
                        <Button variant="accent" size="sm" onClick={() => setShowUploadModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Upload Document
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleEditProfile}>Edit Profile</Button>
                </div>
                {/* Document Upload Modal */}
                <Modal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    title="Upload New Document"
                >
                    <form onSubmit={handleUpload} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Document Name</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                                placeholder="e.g. Employment Contract 2024"
                                value={uploadForm.name}
                                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Document Type</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                                    value={uploadForm.type}
                                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                                >
                                    <option value="Contract">Contract</option>
                                    <option value="ID">Identity Proof</option>
                                    <option value="Certificate">Certificate</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all"
                                    value={uploadForm.expiryDate}
                                    onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Select File</label>
                            <div
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-slate-50 ${selectedFile ? "border-accent bg-accent/5" : "border-slate-200"
                                    }`}
                                onClick={() => document.getElementById('file-upload').click()}
                            >
                                <Upload className={`w-8 h-8 mb-2 ${selectedFile ? "text-accent" : "text-slate-300"}`} />
                                <p className="text-sm font-medium text-slate-600">
                                    {selectedFile ? selectedFile.name : 'Click to select or drag and drop'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOC (Max 5MB)</p>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setShowUploadModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="accent"
                                className="flex-1 shadow-lg shadow-accent/20"
                                isLoading={isUploading}
                            >
                                Upload File
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>

            {/* Profile Overview Card */}
            <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
                <div className="h-32 bg-gradient-to-r from-accent/20 via-primary/10 to-accent/5 border-b border-slate-100" />
                <CardContent className="px-8 pb-0 -mt-12">
                    <div className="flex flex-col md:flex-row items-end gap-6 mb-6">
                        <div className="w-24 h-24 rounded-2xl bg-white shadow-md border-4 border-white flex items-center justify-center text-3xl font-bold text-accent">
                            {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                        </div>
                        <div className="flex-1 pb-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{employee.fullName || `${employee.firstName} ${employee.lastName}`}</h1>
                                {getStatusBadge(employee.employmentStatus)}
                            </div>
                            <p className="text-slate-500 font-medium mt-1">{employee.jobTitle}</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-8 mt-4 border-b border-slate-100">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'profile' ? "text-accent" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            Overview
                            {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('professional')}
                            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'professional' ? "text-accent" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            Professional
                            {activeTab === 'professional' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'financial' ? "text-accent" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            Financial
                            {activeTab === 'financial' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'documents' ? "text-accent" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            Documents
                            {activeTab === 'documents' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('payroll')}
                            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'payroll' ? "text-accent" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            Pay History
                            {activeTab === 'payroll' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {activeTab === 'profile' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    {/* Main Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="w-5 h-5 text-accent" />
                                    Personal Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Full Name</p>
                                    <p className="text-slate-900 font-medium">{employee.fullName || `${employee.firstName} ${employee.lastName}`}</p>
                                    {employee.nameInArabic && (
                                        <p className="text-sm text-slate-500 font-medium mt-0.5" dir="rtl">{employee.nameInArabic}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Email Address</p>
                                    <p className="text-accent font-medium flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        {employee.email}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Employee ID</p>
                                    <code className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{employee.id?.substring(0, 8)}</code>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Home Address</p>
                                    <p className="text-slate-900 font-medium flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        {employee.address || 'Not specified'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {isAdminOrHR && !employee.isAccountActivated && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-accent" />
                                        System Access
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Account Access</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Control how this employee logins to the system</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="bg-white"
                                            onClick={handleInvite}
                                            isLoading={isInviting}
                                        >
                                            Generate Invitation
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Demographics & Compliance Details - Visible to Self or Admin/HR only */}
                        {(isSelf || isAdminOrHR) && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        Compliance & Demographics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">National ID</p>
                                        <p className="text-sm font-medium text-slate-900">{employee.nationalId || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">ID Expiry Date</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {employee.nationalIdExpiry ? new Date(employee.nationalIdExpiry).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Date of Birth</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Gender</p>
                                        <p className="text-sm font-medium text-slate-900">{employee.gender || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Marital Status</p>
                                        <p className="text-sm font-medium text-slate-900">{employee.maritalStatus || 'N/A'}</p>
                                    </div>
                                    {employee.gender === 'Male' && (
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-500">Military Status</p>
                                            <p className="text-sm font-medium text-slate-900">{employee.militaryStatus || 'N/A'}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Financial Information - Visible to Self or Admin/HR only */}
                        {(isSelf || isAdminOrHR) && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <Wallet className="w-4 h-4" />
                                        Financial Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Base Salary</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {employee.baseSalary?.toLocaleString()} {employee.currency}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                            Social Insurance Status
                                            {employee.isInsured ? (
                                                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">Insured</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">Not Insured</Badge>
                                            )}
                                        </p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {employee.isInsured ? employee.socialInsuranceNumber : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Insured Salary</p>
                                        <p className="text-sm font-medium text-slate-900">
                                            {employee.isInsured && employee.socialInsuranceSalary
                                                ? `${employee.socialInsuranceSalary.toLocaleString()} EGP`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Banking Information - Visible to Self or Admin/HR only */}
                        {(isSelf || isAdminOrHR) && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
                                        <CreditCard className="w-4 h-4" />
                                        Banking Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Bank Name</p>
                                        <p className="text-sm font-medium text-slate-900">{employee.bankName || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Account Number</p>
                                        <p className="text-sm font-medium text-slate-900">{employee.bankAccountNumber || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">IBAN</p>
                                        <p className="text-sm font-medium text-slate-900 text-xs truncate" title={employee.iban}>
                                            {employee.iban || 'N/A'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-accent" />
                                    Professional Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Department</p>
                                    <p className="text-slate-900 font-medium flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        {employee.departmentName || 'Unassigned'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Job Designation</p>
                                    <p className="text-slate-900 font-medium">{employee.jobTitle}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Hiring Date</p>
                                    <p className="text-slate-900 font-medium flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Employment Type</p>
                                    <Badge variant="outline">{employee.employmentTypeStr || 'Full Time'}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <Card className="bg-slate-900 text-white border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-white">
                                    <DollarSign className="w-5 h-5 text-accent" />
                                    Compensation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Base Salary (Annual)</p>
                                        <p className="text-2xl font-bold mt-1">{employee.currency} {employee.baseSalary?.toLocaleString()}</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-800">
                                        <p className="text-xs font-bold text-slate-400">Pay Frequency</p>
                                        <p className="text-sm font-medium mt-1">Monthly</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-accent" />
                                    System Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Last Login
                                    </span>
                                    <span className="font-medium text-slate-900">
                                        {employee.lastLoginAt ? new Date(employee.lastLoginAt).toLocaleString() : 'Never'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Account Status
                                    </span>
                                    {employee.isAccountActivated ? (
                                        <span className="text-green-600 font-semibold flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Activated
                                        </span>
                                    ) : (
                                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" /> Inactive
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : activeTab === 'professional' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-accent" />
                                Professional Skills
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {employee.skills?.length > 0 ? (
                                <div className="space-y-4">
                                    {employee.skills.map((skill, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{skill.skillName}</p>
                                                <p className="text-xs text-slate-500">Proficiency: {skill.proficiencyLevel}</p>
                                            </div>
                                            <Badge variant="outline" className="bg-white">{skill.proficiencyLevel}</Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-400 italic text-sm">No skills recorded yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="w-5 h-5 text-accent" />
                                Education History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {employee.education?.length > 0 ? (
                                <div className="space-y-4">
                                    {employee.education.map((edu, idx) => (
                                        <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all">
                                            <p className="text-sm font-bold text-slate-900">{edu.degree}</p>
                                            <p className="text-xs text-slate-600 mt-0.5">{edu.institution}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Graduated {edu.graduationYear}</span>
                                                {edu.grade && <Badge variant="secondary" className="text-[10px]">{edu.grade}</Badge>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-400 italic text-sm">No education history recorded yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : activeTab === 'financial' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-accent" />
                                Bank Account & IBAN
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Bank Name</p>
                                    <p className="text-slate-900 font-medium">{employee.bankName || 'Not Set'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Account Number</p>
                                    <p className="text-slate-900 font-medium">{employee.bankAccountNumber || 'Not Set'}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">IBAN</p>
                                <code className="text-accent bg-accent/5 px-3 py-1 rounded text-xs font-mono block mt-1">
                                    {employee.iban || 'Not Set'}
                                </code>
                            </div>
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                <p className="text-xs text-amber-700">Financial details are encrypted and only accessible to authorized HR/Finance personnel.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5 text-accent" />
                                Legal & Compliance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">National ID</p>
                                    <p className="text-slate-900 font-medium">{employee.nationalId || 'Not Set'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">ID Expiry</p>
                                    <p className="text-slate-900 font-medium">
                                        {employee.nationalIdExpiry ? new Date(employee.nationalIdExpiry).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Social Insurance #</p>
                                    <p className="text-slate-900 font-medium">{employee.socialInsuranceNumber || 'Not Set'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Probation Status</p>
                                    <Badge variant={employee.probationStatus === 'Completed' ? 'success' : 'warning'}>
                                        {employee.probationStatus || 'Under Probation'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1 pt-2 border-t border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Emergency Contact</p>
                                <p className="text-slate-900 font-medium mt-1">
                                    {employee.emergencyContactName ? `${employee.emergencyContactName} (${employee.emergencyContactPhone})` : 'Not Set'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : activeTab === 'documents' ? (
                <div className="animate-in fade-in duration-300 min-h-[400px]">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Document Repository</CardTitle>
                                <CardDescription>Manage IDs, contracts, and certifications</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setShowUploadModal(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Document
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {documents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="group p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 hover:shadow-md hover:border-accent/10 transition-all">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-accent/5 group-hover:text-accent transition-colors">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{doc.documentName}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[10px] h-4 py-0">{doc.documentType}</Badge>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {doc.expiryDate && (
                                                    <p className={`text-[10px] font-bold mt-1 ${new Date(doc.expiryDate) < new Date() ? "text-rose-500" : "text-slate-400"
                                                        }`}>
                                                        {new Date(doc.expiryDate) < new Date() ? 'Expired' : 'Expires'}: {new Date(doc.expiryDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-accent" onClick={() => (window.location.href = doc.fileUrl)}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-rose-500" onClick={() => handleDeleteDocument(doc.id)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-slate-900 font-bold">No documents yet</h3>
                                    <p className="text-slate-500 text-sm max-w-xs mt-1">Upload employment contracts, identity proofs, or educational certificates here.</p>
                                    <Button variant="accent" className="mt-6 shadow-lg shadow-accent/20" onClick={() => setShowUploadModal(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Upload First Document
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : activeTab === 'payroll' ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Salary Components</h3>
                            <p className="text-sm text-slate-500">Manage monthly allowances and deductions for this employee.</p>
                        </div>
                        <Button variant="accent" size="sm" onClick={() => setShowComponentModal(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Component
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1 border-slate-100 bg-slate-50/50">
                            <CardHeader>
                                <CardTitle className="text-sm">Base Salary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-slate-900">
                                    {employee.currency} {employee.baseSalary?.toLocaleString()}
                                </div>
                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-tight font-bold">Base Monthly Rate</p>
                                <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                        <span>Statutory Items</span>
                                        <span>Status</span>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-slate-600">Income Tax (15%)</span>
                                        <Badge variant="outline">Automatic</Badge>
                                    </div>
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-slate-600">Social Security (10%)</span>
                                        <Badge variant="outline">Automatic</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-2 space-y-4">
                            {salaryComponents.length === 0 ? (
                                <div className="p-12 text-center bg-white border border-slate-100 rounded-3xl">
                                    <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">No custom components found</p>
                                    <p className="text-xs text-slate-400 mt-1">Add allowances or specific deductions for this employee.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {salaryComponents.map((comp) => (
                                        <Card key={comp.id} className="group border-slate-100 hover:border-accent/20 transition-all">
                                            <CardContent className="p-5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3 rounded-xl ${comp.type === 'Earning' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        <DollarSign className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{comp.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant={comp.type === 'Earning' ? 'success' : 'error'} className="text-[10px] h-4">
                                                                {comp.type}
                                                            </Badge>
                                                            {!comp.isActive && <Badge variant="secondary" className="text-[10px] h-4">Inactive</Badge>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-black ${comp.type === 'Earning' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {comp.type === 'Earning' ? '+' : '-'}{employee.currency} {comp.amount.toLocaleString()}
                                                        {comp.isPercentage && '%'}
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-400 hover:text-accent"
                                                            onClick={() => handleEditComponent(comp)}
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-slate-300 hover:text-rose-500"
                                                            onClick={() => handleDeleteComponent(comp.id)}
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Salary Component Modal */}
            <Modal
                isOpen={showComponentModal}
                onClose={() => {
                    setShowComponentModal(false);
                    setIsEditingComponent(false);
                    setEditingComponentId(null);
                    setComponentForm({ name: '', type: 'Earning', amount: '', isPercentage: false, isActive: true });
                }}
                title={isEditingComponent ? "Edit Salary Component" : "Add Salary Component"}
            >
                <form onSubmit={handleCreateComponent} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Component Name</label>
                        <input
                            type="text"
                            className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                            placeholder="e.g. Transport Allowance"
                            value={componentForm.name}
                            onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Type</label>
                            <select
                                className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none"
                                value={componentForm.type}
                                onChange={(e) => setComponentForm({ ...componentForm, type: e.target.value })}
                            >
                                <option value="Earning">Earning (Allowance)</option>
                                <option value="Deduction">Deduction</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Amount</label>
                            <input
                                type="number"
                                className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                placeholder="0.00"
                                value={componentForm.amount}
                                onChange={(e) => setComponentForm({ ...componentForm, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8 py-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-200 text-accent focus:ring-accent/20 transition-all cursor-pointer"
                                checked={componentForm.isPercentage}
                                onChange={(e) => setComponentForm({ ...componentForm, isPercentage: e.target.checked })}
                            />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight group-hover:text-slate-900 transition-colors">Apply as Percentage</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-200 text-accent focus:ring-accent/20 transition-all cursor-pointer"
                                checked={componentForm.isActive}
                                onChange={(e) => setComponentForm({ ...componentForm, isActive: e.target.checked })}
                            />
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-tight group-hover:text-slate-900 transition-colors">Is Active</span>
                        </label>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setShowComponentModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="accent"
                            className="flex-1 shadow-lg shadow-accent/20"
                            isLoading={isSubmittingComponent}
                        >
                            Save Component
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Document Upload Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                title="Upload New Document"
            >
                <form onSubmit={handleUpload} className="space-y-4 py-2">
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-slate-50 ${selectedFile ? "border-accent bg-accent/5" : "border-slate-200"
                            }`}
                        onClick={() => document.getElementById('fileInput').click()}
                    >
                        <input
                            id="fileInput"
                            type="file"
                            className="hidden"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                        />
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${selectedFile ? "bg-accent text-white" : "bg-slate-100 text-slate-400"
                            }`}>
                            <Plus className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                            {selectedFile ? selectedFile.name : "Click to select or drag and drop"}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Friendly Name</label>
                        <input
                            type="text"
                            className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                            placeholder="e.g. Passport Copy"
                            value={uploadForm.name}
                            onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Document Type</label>
                            <select
                                className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none"
                                value={uploadForm.type}
                                onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                            >
                                <option value="Contract">Contract</option>
                                <option value="Identity">National ID / Passport</option>
                                <option value="Certificate">Certificate</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Expiry Date (Optional)</label>
                            <input
                                type="date"
                                className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                value={uploadForm.expiryDate}
                                onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setShowUploadModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="accent"
                            className="flex-1 shadow-lg shadow-accent/20"
                            isLoading={isUploading}
                        >
                            Upload File
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Invitation Link Modal */}
            <Modal
                isOpen={isInvitationModalOpen}
                onClose={() => setIsInvitationModalOpen(false)}
                title="Account Activation Link"
            >
                <div className="space-y-4 py-2">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-emerald-900">Link Generated</p>
                            <p className="text-xs text-emerald-700">Send this link to the employee to set their password.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Activation URL</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-600 truncate">
                                {activationUrl}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(activationUrl);
                                    toast.success('Link copied to clipboard');
                                }}
                            >
                                Copy
                            </Button>
                        </div>
                        <p className="text-[10px] text-slate-400 italic">Valid for 24 hours. Single-use only.</p>
                    </div>

                    <div className="pt-2">
                        <Button
                            className="w-full"
                            variant="secondary"
                            onClick={() => setIsInvitationModalOpen(false)}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Employee Profile"
            >
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {canEditField('firstName') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    First Name
                                    {renderLockIcon('firstName')}
                                </label>
                                <input
                                    type="text"
                                    disabled={!canEditField('firstName')}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('firstName') ? "cursor-not-allowed text-slate-500" : ""}`}
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        {canEditField('lastName') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Last Name
                                    {renderLockIcon('lastName')}
                                </label>
                                <input
                                    type="text"
                                    disabled={!canEditField('lastName')}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('lastName') ? "cursor-not-allowed text-slate-500" : ""}`}
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {canEditField('email') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Email
                                    {renderLockIcon('email')}
                                </label>
                                <input
                                    type="email"
                                    disabled={!canEditField('email')}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('email') ? "cursor-not-allowed text-slate-500" : ""}`}
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        {canEditField('phone') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Phone
                                    {renderLockIcon('phone')}
                                </label>
                                <input
                                    type="tel"
                                    disabled={!canEditField('phone')}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('phone') ? "cursor-not-allowed text-slate-500" : ""}`}
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                />
                            </div>
                        )}
                    </div>

                    {canEditField('address') && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                Address
                                {renderLockIcon('address')}
                            </label>
                            <input
                                type="text"
                                disabled={!canEditField('address')}
                                className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('address') ? "cursor-not-allowed text-slate-500" : ""}`}
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {canEditField('departmentId') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Department
                                    {renderLockIcon('departmentId')}
                                </label>
                                <select
                                    disabled={!canEditField('departmentId')}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('departmentId') ? "cursor-not-allowed text-slate-500" : ""}`}
                                    value={editForm.departmentId}
                                    onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {canEditField('jobTitle') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Job Title
                                    {renderLockIcon('jobTitle')}
                                </label>
                                <input
                                    type="text"
                                    disabled={!canEditField('jobTitle')}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('jobTitle') ? "cursor-not-allowed text-slate-500" : ""}`}
                                    value={editForm.jobTitle}
                                    onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {canEditField('hireDate') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Hire Date
                                    {renderLockIcon('hireDate')}
                                </label>
                                <input
                                    type="date"
                                    disabled={!canEditField('hireDate')}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('hireDate') ? "cursor-not-allowed text-slate-500" : ""}`}
                                    value={editForm.hireDate}
                                    onChange={(e) => setEditForm({ ...editForm, hireDate: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                        {canEditField('baseSalary') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Base Salary
                                    {renderLockIcon('baseSalary')}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400 text-sm">{editForm.currency}</span>
                                    <input
                                        type="number"
                                        disabled={!canEditField('baseSalary')}
                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg pl-12 pr-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('baseSalary') ? "cursor-not-allowed text-slate-500 font-mono" : ""}`}
                                        value={editForm.baseSalary}
                                        onChange={(e) => setEditForm({ ...editForm, baseSalary: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {canEditField('employmentStatus') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Employment Status
                                    {renderLockIcon('employmentStatus')}
                                </label>
                                <select
                                    disabled={!canEditField('employmentStatus')}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('employmentStatus') ? "cursor-not-allowed text-slate-500" : ""}`}
                                    value={editForm.employmentStatus}
                                    onChange={(e) => setEditForm({ ...editForm, employmentStatus: e.target.value })}
                                >
                                    <option value="Active">Active</option>
                                    <option value="OnLeave">On Leave</option>
                                    <option value="Terminated">Terminated</option>
                                </select>
                            </div>
                        )}
                        {canEditField('employmentTypeStr') && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Employment Type
                                    {renderLockIcon('employmentTypeStr')}
                                </label>
                                <select
                                    disabled={!canEditField('employmentTypeStr')}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('employmentTypeStr') ? "cursor-not-allowed text-slate-500" : ""}`}
                                    value={editForm.employmentTypeStr}
                                    onChange={(e) => setEditForm({ ...editForm, employmentTypeStr: e.target.value })}
                                >
                                    <option value="FullTime">Full Time</option>
                                    <option value="PartTime">Part Time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Internship">Internship</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Enterprise & Legal</h4>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {canEditField('nationalId') && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center">
                                        National ID (14 Digits)
                                        {renderLockIcon('nationalId')}
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={14}
                                        disabled={!canEditField('nationalId')}
                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('nationalId') ? "cursor-not-allowed text-slate-500" : ""}`}
                                        value={editForm.nationalId}
                                        onChange={(e) => setEditForm({ ...editForm, nationalId: e.target.value })}
                                    />
                                </div>
                            )}
                            {canEditField('nationalIdExpiry') && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center">
                                        ID Expiry
                                        {renderLockIcon('nationalIdExpiry')}
                                    </label>
                                    <input
                                        type="date"
                                        disabled={!canEditField('nationalIdExpiry')}
                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('nationalIdExpiry') ? "cursor-not-allowed text-slate-500" : ""}`}
                                        value={editForm.nationalIdExpiry}
                                        onChange={(e) => setEditForm({ ...editForm, nationalIdExpiry: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {canEditField('emergencyContactName') && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center">
                                        Emergency Name
                                        {renderLockIcon('emergencyContactName')}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!canEditField('emergencyContactName')}
                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('emergencyContactName') ? "cursor-not-allowed text-slate-500" : ""}`}
                                        value={editForm.emergencyContactName}
                                        onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                                    />
                                </div>
                            )}
                            {canEditField('emergencyContactPhone') && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center">
                                        Emergency Phone
                                        {renderLockIcon('emergencyContactPhone')}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!canEditField('emergencyContactPhone')}
                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('emergencyContactPhone') ? "cursor-not-allowed text-slate-500" : ""}`}
                                        value={editForm.emergencyContactPhone}
                                        onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {canEditField('probationEndDate') && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center">
                                        Probation End
                                        {renderLockIcon('probationEndDate')}
                                    </label>
                                    <input
                                        type="date"
                                        disabled={!canEditField('probationEndDate')}
                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('probationEndDate') ? "cursor-not-allowed text-slate-500" : ""}`}
                                        value={editForm.probationEndDate}
                                        onChange={(e) => setEditForm({ ...editForm, probationEndDate: e.target.value })}
                                    />
                                </div>
                            )}
                            {canEditField('socialInsuranceNumber') && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center">
                                        Social Insurance #
                                        {renderLockIcon('socialInsuranceNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!canEditField('socialInsuranceNumber')}
                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('socialInsuranceNumber') ? "cursor-not-allowed text-slate-500" : ""}`}
                                        value={editForm.socialInsuranceNumber}
                                        onChange={(e) => setEditForm({ ...editForm, socialInsuranceNumber: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {canEditField('bankName') && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center">
                                        Bank Name
                                        {renderLockIcon('bankName')}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!canEditField('bankName')}
                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('bankName') ? "cursor-not-allowed text-slate-500" : ""}`}
                                        value={editForm.bankName}
                                        onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                                    />
                                </div>
                            )}
                            {canEditField('bankAccountNumber') && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center">
                                        Account #
                                        {renderLockIcon('bankAccountNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!canEditField('bankAccountNumber')}
                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('bankAccountNumber') ? "cursor-not-allowed text-slate-500" : ""}`}
                                        value={editForm.bankAccountNumber}
                                        onChange={(e) => setEditForm({ ...editForm, bankAccountNumber: e.target.value })}
                                    />
                                </div>
                            )}
                            {canEditField('iban') && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-tight flex items-center">
                                        IBAN
                                        {renderLockIcon('iban')}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={!canEditField('iban')}
                                        className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent/20 outline-none ${!canEditField('iban') ? "cursor-not-allowed text-slate-500 font-mono" : ""}`}
                                        value={editForm.iban}
                                        onChange={(e) => setEditForm({ ...editForm, iban: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="accent" isLoading={isLoading}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EmployeeProfile;
