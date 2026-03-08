import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Building2,
    Calendar,
    Download,
    Users,
    Edit2,
    Trash2,
    X,
    CheckCircle2,
    Eye,
    Lock,
    Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmployeeService from '../../api/services/employeeService';
import AuthService from '../../api/services/authService';
import DepartmentService from '../../api/services/departmentService';
import { usePresence } from '../../context/PresenceContext';
import { useAuth } from '../../context/AuthContext'; // Added useAuth
import { cn } from '../../utils/cn';

// Helper for safe Date conversion
const toSafeISO = (dateVal) => {
    if (!dateVal) return null;
    const date = new Date(dateVal);
    return !isNaN(date.getTime()) ? date.toISOString() : null;
};

const formatDateForInput = (dateVal) => {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
};

const EmployeeList = () => {
    const { user } = useAuth(); // Get current user
    const [employees, setEmployees] = useState([]);
    // ... previous state ...
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [filterDept, setFilterDept] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isFilterVisible, setIsFilterVisible] = useState(false);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);
    const [activationUrl, setActivationUrl] = useState('');
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nameInArabic: '',
        email: '',
        phone: '',
        jobTitle: '',
        departmentId: '',
        managerId: '',
        baseSalary: 0,
        currency: 'EGP',
        employmentTypeStr: 'FullTime',
        hireDate: new Date().toISOString().split('T')[0],
        nationalId: '',
        nationalIdExpiry: '',
        maritalStatusStr: '',
        militaryStatusStr: '',
        gender: '',
        dateOfBirth: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        probationEndDate: '',
        bankName: '',
        bankAccountNumber: '',
        iban: '',
        isInsured: false,
        socialInsuranceNumber: '',
        socialInsuranceSalary: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // RBAC: Check if user has management permissions
    const isAdminOrHR = user?.roles?.some(r => r === 'Admin' || r === 'HRManager' || r === 'HR');
    const isSelf = currentEmployee && user?.employeeId === currentEmployee.id;

    const canEditField = (fieldName) => {
        if (isAdminOrHR) return true;

        // Employees can only update their own personal info
        if (isSelf) {
            return ['firstName', 'lastName', 'phone', 'email'].includes(fieldName);
        }

        return false;
    };

    // ... handleAdd, handleEdit, handleDeleteClick, handleDeleteConfirm, handleSubmit remain mostly same but use canEditField ...

    const renderLockIcon = (fieldName) => {
        if (!canEditField(fieldName)) {
            return <Lock className="w-3 h-3 text-amber-500 ml-1.5 inline-block" title="Restricted field" />;
        }
        return null;
    };

    // ... previous methods ...

    // Filtered Employees: Hide sensitive if not authorized (Backend masks it, but we can double check)
    // ... remainder of file with canEditField used in Input elements ...

    // Delete confirmation state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { getEmployeeStatus } = usePresence();

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, []);

    const fetchEmployees = async () => {
        try {
            const data = await EmployeeService.getAll();
            setEmployees(data);
        } catch (error) {
            console.error('Failed to fetch employees', error);
            const errorMsg = error.response?.data?.title || error.response?.data?.message || 'Failed to load employee directory';
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const data = await DepartmentService.getAll();
            setDepartments(data);
        } catch (error) {
            console.error('Failed to fetch departments', error);
        }
    };

    const handleAdd = () => {
        setCurrentEmployee(null);
        setFormData({
            firstName: '',
            lastName: '',
            nameInArabic: '',
            email: '',
            phone: '',
            jobTitle: '',
            departmentId: '',
            managerId: '',
            baseSalary: 0,
            currency: 'EGP',
            employmentTypeStr: 'FullTime',
            hireDate: new Date().toISOString().split('T')[0],
            nationalId: '',
            nationalIdExpiry: '',
            maritalStatusStr: '',
            militaryStatusStr: '',
            gender: '',
            dateOfBirth: '',
            emergencyContactName: '',
            emergencyContactPhone: '',
            probationEndDate: '',
            bankName: '',
            bankAccountNumber: '',
            iban: '',
            isInsured: false,
            socialInsuranceNumber: '',
            socialInsuranceSalary: 0
        });
        setIsFormModalOpen(true);
    };

    const handleEdit = (emp) => {
        setCurrentEmployee(emp);
        setFormData({
            firstName: emp.firstName,
            lastName: emp.lastName,
            nameInArabic: emp.nameInArabic || '',
            email: emp.email,
            phone: emp.phone || '',
            jobTitle: emp.jobTitle,
            departmentId: emp.departmentId || '',
            managerId: emp.managerId || '',
            baseSalary: emp.baseSalary,
            currency: emp.currency || 'EGP',
            employmentTypeStr: emp.employmentTypeStr || 'FullTime',
            hireDate: formatDateForInput(emp.hireDate) || formatDateForInput(new Date()),
            nationalId: emp.nationalId || '',
            nationalIdExpiry: formatDateForInput(emp.nationalIdExpiry),
            maritalStatusStr: emp.maritalStatus || '',
            militaryStatusStr: emp.militaryStatus || '',
            gender: emp.gender || '',
            dateOfBirth: formatDateForInput(emp.dateOfBirth),
            emergencyContactName: emp.emergencyContactName || '',
            emergencyContactPhone: emp.emergencyContactPhone || '',
            probationEndDate: formatDateForInput(emp.probationEndDate),
            bankName: emp.bankName || '',
            bankAccountNumber: emp.bankAccountNumber || '',
            iban: emp.iban || '',
            isInsured: emp.isInsured || false,
            socialInsuranceNumber: emp.socialInsuranceNumber || '',
            socialInsuranceSalary: emp.socialInsuranceSalary || 0
        });
        setIsFormModalOpen(true);
    };

    // Smart Autofill for Egyptian National ID
    const handleNationalIdChange = (e) => {
        const id = e.target.value;
        const updates = { nationalId: id };

        if (id.length === 14 && /^\d+$/.test(id)) {
            // Century logic
            const centuryDigit = parseInt(id.substring(0, 1));
            const year = id.substring(1, 3);
            const month = id.substring(3, 5);
            const day = id.substring(5, 7);

            const fullYear = (centuryDigit === 2 ? 1900 : 2000) + parseInt(year);
            const extractedDob = `${fullYear}-${month}-${day}`;

            // Gender logic
            const genderDigit = parseInt(id.substring(12, 13));
            const extractedGender = (genderDigit % 2 !== 0) ? 'Male' : 'Female';

            updates.dateOfBirth = extractedDob;
            updates.gender = extractedGender;
        }

        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleDeleteClick = (emp) => {
        setEmployeeToDelete(emp);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!employeeToDelete) return;

        setIsDeleting(true);
        try {
            await EmployeeService.delete(employeeToDelete.id);
            toast.success('Employee deleted successfully');
            fetchEmployees();
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Failed to delete employee', error);
            const errorData = error.response?.data;
            const errorMsg = errorData?.detail || errorData?.message || errorData?.title || (typeof errorData === 'string' ? errorData : 'Failed to delete employee');
            toast.error(errorMsg);
        } finally {
            setIsDeleting(false);
            setEmployeeToDelete(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const submissionData = {
            ...formData,
            managerId: formData.managerId === "" ? null : formData.managerId,
            departmentId: formData.departmentId === "" ? null : formData.departmentId,
            baseSalary: Number(formData.baseSalary),
            socialInsuranceSalary: Number(formData.socialInsuranceSalary),
            hireDate: toSafeISO(formData.hireDate),
            dateOfBirth: toSafeISO(formData.dateOfBirth),
            nationalIdExpiry: toSafeISO(formData.nationalIdExpiry),
            probationEndDate: toSafeISO(formData.probationEndDate)
        };

        try {
            if (currentEmployee) {
                await EmployeeService.update(currentEmployee.id, submissionData);
                toast.success('Employee updated successfully');
            } else {
                const newEmployee = await EmployeeService.create(submissionData);
                toast.success('Employee added successfully');

                // Generate activation link automatically
                try {
                    const inviteResponse = await AuthService.inviteEmployee(newEmployee.id);
                    setActivationUrl(inviteResponse.activationUrl);
                    setIsInvitationModalOpen(true);
                } catch (inviteError) {
                    console.error('Failed to generate invitation', inviteError);
                    const errorMsg = inviteError.response?.data?.title || inviteError.response?.data?.message || 'Employee created, but failed to generate invitation link.';
                    toast.error(errorMsg);
                }
            }
            fetchEmployees();
            setIsFormModalOpen(false);
        } catch (error) {
            console.error('Save failed', error);
            toast.error(currentEmployee ? 'Failed to update employee' : 'Failed to add employee');
        } finally {
            setIsSubmitting(false);
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

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDept === 'all' || emp.departmentId === filterDept;
        const matchesStatus = filterStatus === 'all' || emp.employmentStatus === filterStatus;
        return matchesSearch && matchesDept && matchesStatus;
    });

    const handleExport = () => {
        if (filteredEmployees.length === 0) {
            toast.error('No data to export');
            return;
        }

        const headers = ['ID', 'Full Name', 'Email', 'Job Title', 'Department', 'Status', 'Hire Date'];
        const csvRows = filteredEmployees.map(emp => [
            emp.employeeNumber || emp.id,
            emp.fullName || `${emp.firstName} ${emp.lastName}`,
            emp.email,
            emp.jobTitle,
            emp.departmentName || '',
            emp.employmentStatus,
            new Date(emp.hireDate).toLocaleDateString()
        ].map(val => `"${val}"`).join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `employee_directory_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Directory exported to CSV');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
                    <p className="text-slate-500 mt-1">Manage all your organization's members in one place.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="hidden sm:flex" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                    </Button>
                    <Button variant="accent" onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Employee
                    </Button>
                </div>
            </div>

            {/* Filters and Controls */}
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-md">
                <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-accent transition-colors" />
                        <Input
                            placeholder="Search by name, email, or title..."
                            className="pl-10 bg-white border-slate-200 focus:border-accent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex p-1 bg-slate-100 rounded-lg">
                            <button
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    viewMode === 'table' ? "bg-white shadow-sm text-accent" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    viewMode === 'grid' ? "bg-white shadow-sm text-accent" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                            </button>
                        </div>
                        <Button
                            variant={isFilterVisible ? "accent" : "outline"}
                            className="flex-1 md:flex-none"
                            onClick={() => setIsFilterVisible(!isFilterVisible)}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                        </Button>
                    </div>
                </CardContent>
                {isFilterVisible && (
                    <div className="px-4 pb-4 border-t border-slate-100 mt-2 pt-4 flex flex-wrap gap-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">By Department</label>
                            <select
                                className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-accent/20 outline-none w-48"
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                            >
                                <option value="all">All Departments</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.departmentName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">By Status</label>
                            <select
                                className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-accent/20 outline-none w-40"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="OnLeave">On Leave</option>
                                <option value="Terminated">Terminated</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 text-xs"
                                onClick={() => {
                                    setFilterDept('all');
                                    setFilterStatus('all');
                                    setSearchTerm('');
                                }}
                            >
                                <X className="w-3 h-3 mr-1" />
                                Reset
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* List View */}
            <Card className="border-none shadow-sm overflow-hidden min-h-[400px]">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-4">
                            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-500 font-medium italic">Loading directory...</p>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                            <div className="p-6 bg-slate-50 rounded-full">
                                <Users className="w-12 h-12 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">No employees found</h3>
                                <p className="text-slate-500 mt-1 max-w-xs mx-auto">Try adjusting your search filters or add a new employee to the system.</p>
                            </div>
                            <Button variant="outline" onClick={() => setSearchTerm('')}>Clear Search</Button>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-tight">Employee</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-tight">Designation</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-tight">Department</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-tight text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-tight text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filteredEmployees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-primary group-hover:text-white transition-all">
                                                            {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                                                        </div>
                                                        {(() => {
                                                            const status = getEmployeeStatus(emp.id);
                                                            return (
                                                                <div
                                                                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${status.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                                    title={status.isOnline ? "Online" : `Last active: ${status.lastActiveAt ? new Date(status.lastActiveAt).toLocaleString() : 'Never'}`}
                                                                />
                                                            );
                                                        })()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 leading-none">{emp.fullName || `${emp.firstName} ${emp.lastName}`}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{emp.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-600 font-medium">{emp.jobTitle}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                                                    <Building2 className="w-4 h-4 text-slate-300" />
                                                    {emp.departmentName || 'No Dept.'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(emp.employmentStatus)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link
                                                        to={`/employees/${emp.id}`}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                                                        title="View Profile"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleEdit(emp)}
                                                        className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-50 transition-all"
                                                        title="Edit Details"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(emp)}
                                                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                                        title="Delete Employee"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-slate-50/30">
                            {filteredEmployees.map((emp) => (
                                <Card key={emp.id} className="overflow-hidden group hover:shadow-md transition-all border-slate-200/60 bg-white">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="relative w-12 h-12">
                                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                                                    {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                                                </div>
                                                {(() => {
                                                    const status = getEmployeeStatus(emp.id);
                                                    return (
                                                        <div
                                                            className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${status.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                            title={status.isOnline ? "Online" : `Last active: ${status.lastActiveAt ? new Date(status.lastActiveAt).toLocaleString() : 'Never'}`}
                                                        />
                                                    );
                                                })()}
                                            </div>
                                            {getStatusBadge(emp.employmentStatus)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 group-hover:text-accent transition-colors">
                                                {emp.fullName || `${emp.firstName} ${emp.lastName}`}
                                            </h4>
                                            <p className="text-sm text-slate-500">{emp.jobTitle}</p>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                                {emp.departmentName || 'No Department'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                {emp.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(emp)} className="text-xs font-semibold text-accent hover:underline">Edit</button>
                                            <button onClick={() => handleDeleteClick(emp)} className="text-xs font-semibold text-red-500 hover:underline">Delete</button>
                                        </div>
                                        <Link
                                            to={`/employees/${emp.id}`}
                                            className="text-xs font-semibold text-slate-600 hover:underline"
                                        >
                                            View Profile
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Employee Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={currentEmployee ? 'Edit Employee' : 'Add New Employee'}
                className="max-w-4xl"
            >
                <form onSubmit={handleSubmit}>
                    <div className="max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    First Name
                                    {renderLockIcon('firstName')}
                                </label>
                                <Input
                                    required
                                    disabled={!canEditField('firstName')}
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="John"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Last Name
                                    {renderLockIcon('lastName')}
                                </label>
                                <Input
                                    required
                                    disabled={!canEditField('lastName')}
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="Doe"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Arabic Name (Optional)
                                    {renderLockIcon('nameInArabic')}
                                </label>
                                <Input
                                    disabled={!canEditField('nameInArabic')}
                                    value={formData.nameInArabic}
                                    onChange={e => setFormData({ ...formData, nameInArabic: e.target.value })}
                                    placeholder="الاسم بالكامل"
                                    dir="rtl"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Email
                                    {renderLockIcon('email')}
                                </label>
                                <Input
                                    required
                                    type="email"
                                    disabled={!canEditField('email')}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john.doe@company.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Phone Number
                                    {renderLockIcon('phone')}
                                </label>
                                <Input
                                    disabled={!canEditField('phone')}
                                    value={formData.phone || ''}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Job Title
                                    {renderLockIcon('jobTitle')}
                                </label>
                                <Input
                                    required
                                    disabled={!canEditField('jobTitle')}
                                    value={formData.jobTitle}
                                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                                    placeholder="Software Engineer"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Department
                                    {renderLockIcon('departmentId')}
                                </label>
                                <select
                                    disabled={!canEditField('departmentId')}
                                    className={cn(
                                        "w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all hover:border-slate-300",
                                        !canEditField('departmentId') && "bg-slate-50 text-slate-500 cursor-not-allowed"
                                    )}
                                    value={formData.departmentId}
                                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.departmentName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Direct Manager
                                    {renderLockIcon('managerId')}
                                </label>
                                <select
                                    disabled={!canEditField('managerId')}
                                    className={cn(
                                        "w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all hover:border-slate-300",
                                        !canEditField('managerId') && "bg-slate-50 text-slate-500 cursor-not-allowed"
                                    )}
                                    value={formData.managerId}
                                    onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                                >
                                    <option value="">No Manager (Top Level)</option>
                                    {employees
                                        .filter(e => e.id !== currentEmployee?.id)
                                        .map(e => (
                                            <option key={e.id} value={e.id}>{e.fullName} ({e.jobTitle})</option>
                                        ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Employment Type
                                    {renderLockIcon('employmentTypeStr')}
                                </label>
                                <select
                                    disabled={!canEditField('employmentTypeStr')}
                                    className={cn(
                                        "w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all hover:border-slate-300",
                                        !canEditField('employmentTypeStr') && "bg-slate-50 text-slate-500 cursor-not-allowed"
                                    )}
                                    value={formData.employmentTypeStr}
                                    onChange={e => setFormData({ ...formData, employmentTypeStr: e.target.value })}
                                >
                                    <option value="FullTime">Full Time</option>
                                    <option value="PartTime">Part Time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Internship">Internship</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Hire Date
                                    {renderLockIcon('hireDate')}
                                </label>
                                <Input
                                    required
                                    type="date"
                                    disabled={!canEditField('hireDate')}
                                    value={formData.hireDate}
                                    onChange={e => setFormData({ ...formData, hireDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                    Base Salary
                                    {renderLockIcon('baseSalary')}
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        disabled={!canEditField('baseSalary')}
                                        type="number"
                                        className="flex-1"
                                        value={formData.baseSalary || ''}
                                        onChange={e => {
                                            const val = parseFloat(e.target.value);
                                            setFormData({ ...formData, baseSalary: isNaN(val) ? 0 : val });
                                        }}
                                    />
                                    <select
                                        disabled={!canEditField('currency')}
                                        className="w-24 h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                        value={formData.currency}
                                        onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                    >
                                        <option value="EGP">EGP</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Enterprise Fields Section - Only show when editing, as onboarding should be simple */}
                        {currentEmployee && (
                            <div className="pt-4 border-t border-slate-100 animate-in fade-in duration-300">
                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-accent" />
                                    Enterprise Data (Compliance & Bank)
                                </h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            National ID (14 Digits)
                                            {renderLockIcon('nationalId')}
                                        </label>
                                        <Input
                                            disabled={!canEditField('nationalId')}
                                            value={formData.nationalId}
                                            maxLength={14}
                                            onChange={handleNationalIdChange}
                                            placeholder="29901010101234"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            ID Expiry
                                            {renderLockIcon('nationalIdExpiry')}
                                        </label>
                                        <Input
                                            type="date"
                                            disabled={!canEditField('nationalIdExpiry')}
                                            value={formData.nationalIdExpiry}
                                            onChange={e => setFormData({ ...formData, nationalIdExpiry: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            Gender & DOB (Auto-filled)
                                        </label>
                                        <div className="flex gap-2">
                                            <Input
                                                disabled={true}
                                                value={formData.gender || ''}
                                                placeholder="Gender"
                                            />
                                            <Input
                                                type="date"
                                                disabled={true}
                                                value={formData.dateOfBirth || ''}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-1">Extracted from a valid 14-digit National ID.</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            Marital Status
                                            {renderLockIcon('maritalStatusStr')}
                                        </label>
                                        <select
                                            disabled={!canEditField('maritalStatusStr')}
                                            className={cn(
                                                "w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all hover:border-slate-300",
                                                !canEditField('maritalStatusStr') && "bg-slate-50 text-slate-500 cursor-not-allowed"
                                            )}
                                            value={formData.maritalStatusStr || ''}
                                            onChange={e => setFormData({ ...formData, maritalStatusStr: e.target.value })}
                                        >
                                            <option value="">Select Status</option>
                                            <option value="Single">Single</option>
                                            <option value="Married">Married</option>
                                            <option value="Divorced">Divorced</option>
                                            <option value="Widowed">Widowed</option>
                                        </select>
                                    </div>
                                </div>

                                {formData.gender === 'Male' && (
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                                Military Status
                                                {renderLockIcon('militaryStatusStr')}
                                            </label>
                                            <select
                                                disabled={!canEditField('militaryStatusStr')}
                                                className={cn(
                                                    "w-full h-10 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all hover:border-slate-300",
                                                    !canEditField('militaryStatusStr') && "bg-slate-50 text-slate-500 cursor-not-allowed"
                                                )}
                                                value={formData.militaryStatusStr || ''}
                                                onChange={e => setFormData({ ...formData, militaryStatusStr: e.target.value })}
                                            >
                                                <option value="">Select Status</option>
                                                <option value="NotApplicable">Not Applicable</option>
                                                <option value="Exempt">Exempt</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Postponed">Postponed</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            Emergency Name
                                            {renderLockIcon('emergencyContactName')}
                                        </label>
                                        <Input
                                            disabled={!canEditField('emergencyContactName')}
                                            value={formData.emergencyContactName}
                                            onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            Emergency Phone
                                            {renderLockIcon('emergencyContactPhone')}
                                        </label>
                                        <Input
                                            disabled={!canEditField('emergencyContactPhone')}
                                            value={formData.emergencyContactPhone}
                                            onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            Probation End Date
                                            {renderLockIcon('probationEndDate')}
                                        </label>
                                        <Input
                                            type="date"
                                            disabled={!canEditField('probationEndDate')}
                                            value={formData.probationEndDate}
                                            onChange={e => setFormData({ ...formData, probationEndDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="space-y-0.5">
                                            <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                                Social Insurance Registration
                                                {renderLockIcon('isInsured')}
                                            </h5>
                                            <p className="text-[10px] text-slate-500">Check this box if the employee has an active social insurance file.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={formData.isInsured}
                                                onChange={e => setFormData({ ...formData, isInsured: e.target.checked })}
                                                disabled={!canEditField('isInsured')}
                                            />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent disabled:opacity-50"></div>
                                        </label>
                                    </div>

                                    {formData.isInsured && (
                                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                                    Social Insurance #
                                                    {renderLockIcon('socialInsuranceNumber')}
                                                </label>
                                                <Input
                                                    disabled={!canEditField('socialInsuranceNumber')}
                                                    value={formData.socialInsuranceNumber}
                                                    onChange={e => setFormData({ ...formData, socialInsuranceNumber: e.target.value })}
                                                    required={formData.isInsured}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                                    Insured Salary (EGP)
                                                    {renderLockIcon('socialInsuranceSalary')}
                                                </label>
                                                <Input
                                                    type="number"
                                                    disabled={!canEditField('socialInsuranceSalary')}
                                                    value={formData.socialInsuranceSalary || ''}
                                                    onChange={e => {
                                                        const val = parseFloat(e.target.value);
                                                        setFormData({ ...formData, socialInsuranceSalary: isNaN(val) ? 0 : val });
                                                    }}
                                                    required={formData.isInsured}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            Bank Name
                                            {renderLockIcon('bankName')}
                                        </label>
                                        <Input
                                            disabled={!canEditField('bankName')}
                                            value={formData.bankName}
                                            onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            Account #
                                            {renderLockIcon('bankAccountNumber')}
                                        </label>
                                        <Input
                                            disabled={!canEditField('bankAccountNumber')}
                                            value={formData.bankAccountNumber}
                                            onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase flex items-center">
                                            IBAN
                                            {renderLockIcon('iban')}
                                        </label>
                                        <Input
                                            disabled={!canEditField('iban')}
                                            value={formData.iban}
                                            onChange={e => setFormData({ ...formData, iban: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="accent" isLoading={isSubmitting}>
                            {currentEmployee ? 'Update' : 'Create'} Employee
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Invitation Link Modal */}
            <Modal
                isOpen={isInvitationModalOpen}
                onClose={() => setIsInvitationModalOpen(false)}
                title="Employee Activation Link"
            >
                <div className="space-y-4 py-2">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-bold text-emerald-900">Employee Created!</p>
                            <p className="text-xs text-emerald-700">Next steps: 1. Assign a <strong>System Role</strong> in User Management. 2. Activate their account using the link below.</p>
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
                        <p className="text-[10px] text-slate-400 italic">This link is valid for 24 hours and can only be used once.</p>
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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                title="Delete Employee"
                description={`Are you sure you want to delete ${employeeToDelete?.fullName}? This will permanently remove their records from the system. This action cannot be undone.`}
                confirmLabel="Delete Permanently"
            />
        </div >
    );
};

export default EmployeeList;
