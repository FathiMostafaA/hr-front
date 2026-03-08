import React, { useState, useEffect } from 'react';
import {
    Plus,
    Building2,
    Users,
    ChevronRight,
    Search,
    MoreHorizontal,
    LayoutGrid,
    Users2,
    Edit2,
    Trash2,
    X,
    FileText,
    Code,
    Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { cn } from '../../utils/cn';
import DepartmentService from '../../api/services/departmentService';
import EmployeeService from '../../api/services/employeeService';
import { useAuth } from '../../context/AuthContext';

const DepartmentList = () => {
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const isAdminOrHR = user?.roles?.some(r => ['Admin', 'HRManager', 'HR'].includes(r));
    const isHRManager = user?.roles?.some(r => ['Admin', 'HRManager'].includes(r));

    // Auth/CRUD Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDepartment, setCurrentDepartment] = useState(null);
    const [formData, setFormData] = useState({
        departmentName: '',
        departmentCode: '',
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Team Modal
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [teamEmployees, setTeamEmployees] = useState([]);
    const [isFetchingTeam, setIsFetchingTeam] = useState(false);

    // Delete Confirmation Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [transferDepartmentId, setTransferDepartmentId] = useState('');

    // Manager Assignment Modal
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
    const [allEmployees, setAllEmployees] = useState([]);
    const [isFetchingEmployees, setIsFetchingEmployees] = useState(false);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        setIsLoading(true);
        try {
            const data = await DepartmentService.getAll();
            setDepartments(data);
        } catch (error) {
            console.error('Failed to fetch departments', error);
            toast.error('Failed to load departments');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignManager = async (dept) => {
        setSelectedDepartment(dept);
        setIsManagerModalOpen(true);
        setIsFetchingEmployees(true);
        try {
            const employees = await EmployeeService.getAll();
            setAllEmployees(employees);
        } catch (error) {
            console.error('Failed to fetch employees', error);
            toast.error('Failed to load employee list');
        } finally {
            setIsFetchingEmployees(false);
        }
    };

    const confirmAssignManager = async (managerId) => {
        if (!selectedDepartment) return;

        setIsSubmitting(true);
        try {
            await DepartmentService.assignManager(selectedDepartment.id, managerId);
            toast.success('Manager assigned and roles synchronized successfully');
            setIsManagerModalOpen(false);
            fetchDepartments();
        } catch (error) {
            console.error('Failed to assign manager', error);
            const errorMsg = error.response?.data?.message || 'Failed to assign manager';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewTeam = async (dept) => {
        setSelectedDepartment(dept);
        setIsTeamModalOpen(true);
        setIsFetchingTeam(true);
        try {
            const employees = await DepartmentService.getEmployees(dept.id);
            setTeamEmployees(employees);
        } catch (error) {
            console.error('Failed to fetch team', error);
            toast.error('Failed to load team members');
        } finally {
            setIsFetchingTeam(false);
        }
    };

    const handleAdd = () => {
        setCurrentDepartment(null);
        setFormData({
            departmentName: '',
            departmentCode: '',
            description: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (dept) => {
        setCurrentDepartment(dept);
        setFormData({
            departmentName: dept.departmentName,
            departmentCode: dept.departmentCode,
            description: dept.description || ''
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = (dept) => {
        setDepartmentToDelete(dept);
        setTransferDepartmentId('');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!departmentToDelete) return;

        const hasEmployees = departmentToDelete.employeeCount > 0;
        if (hasEmployees && !transferDepartmentId) {
            toast.error('Please select a department to transfer employees to');
            return;
        }

        setIsDeleting(true);
        try {
            await DepartmentService.delete(
                departmentToDelete.id,
                hasEmployees ? transferDepartmentId : undefined
            );
            toast.success('Department deleted successfully');
            setIsDeleteModalOpen(false);
            setDepartmentToDelete(null);
            setTransferDepartmentId('');
            fetchDepartments();
        } catch (error) {
            const msg = error.response?.data?.detail || error.response?.data?.message || error.response?.data || 'Failed to delete department';
            toast.error(typeof msg === 'string' ? msg : 'Failed to delete department');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (currentDepartment) {
                await DepartmentService.update(currentDepartment.id, formData);
                toast.success('Department updated successfully');
            } else {
                await DepartmentService.create(formData);
                toast.success('Department created successfully');
            }
            setIsModalOpen(false);
            fetchDepartments();
        } catch (error) {
            toast.error(currentDepartment ? 'Failed to update department' : 'Failed to create department');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredDepartments = departments.filter(dept =>
        dept.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.departmentCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Departments</h1>
                    <p className="text-slate-500 mt-1">Manage organizational structure and departmental teams.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search departments..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isHRManager && (
                        <Button variant="accent" onClick={handleAdd}>
                            <Plus className="w-4 h-4 mr-2" />
                            New Department
                        </Button>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm font-medium text-slate-500">Loading structure...</p>
                </div>
            ) : filteredDepartments.length === 0 ? (
                <Card className="p-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No departments found</h3>
                    <p className="text-slate-500 mt-1">
                        {searchTerm ? "No results match your search." : "Start by adding your first department to the organization."}
                    </p>
                    {!searchTerm && (
                        <Button variant="accent" className="mt-6" onClick={handleAdd}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Department
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDepartments.map((dept) => (
                        <Card key={dept.id} className="group hover:shadow-md transition-all border-slate-200/60 overflow-hidden">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-slate-50/50 border-b border-slate-100">
                                <div className="p-2 rounded-lg bg-white border border-slate-200">
                                    <Building2 className="w-5 h-5 text-accent" />
                                </div>
                                {isHRManager && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEdit(dept)}
                                            className="p-1.5 text-slate-400 hover:text-accent hover:bg-white rounded-md transition-all"
                                            title="Edit Department"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(dept)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-md transition-all"
                                            title="Delete Department"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="mb-4">
                                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{dept.departmentCode || 'DEPT'}</span>
                                    <CardTitle className="mt-0.5 group-hover:text-accent transition-colors">{dept.departmentName}</CardTitle>
                                    <CardDescription className="line-clamp-2 mt-1">{dept.description || 'No description provided for this department.'}</CardDescription>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex flex-col gap-1 items-start text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                            <Users2 size={14} className="text-slate-400" />
                                            {dept.managerName || 'No Manager Assigned'}
                                        </div>
                                        {isHRManager && (
                                            <button
                                                onClick={() => handleAssignManager(dept)}
                                                className="text-accent hover:underline font-semibold"
                                            >
                                                {dept.managerName ? 'Change Manager' : 'Assign Manager'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 pr-2 border-r border-slate-100">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span className="font-semibold text-slate-900">{dept.employeeCount || 0}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-[10px] font-bold px-2 uppercase tracking-tight"
                                            onClick={() => handleViewTeam(dept)}
                                        >
                                            Team
                                            <ChevronRight className="w-3 h-3 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Assign Manager Modal */}
            {isManagerModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
                            <div>
                                <CardTitle>Assign Manager</CardTitle>
                                <CardDescription>{selectedDepartment?.departmentName}</CardDescription>
                            </div>
                            <button onClick={() => setIsManagerModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search employees..."
                                    className="pl-10 text-xs"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-lg">
                                {isFetchingEmployees ? (
                                    <div className="p-10 text-center flex flex-col items-center gap-2">
                                        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs text-slate-500 font-medium">Loading potential managers...</p>
                                    </div>
                                ) : allEmployees.length === 0 ? (
                                    <p className="p-10 text-center text-sm text-slate-500">No employees eligible for management.</p>
                                ) : (
                                    allEmployees.map((emp) => (
                                        <div
                                            key={emp.id}
                                            className={cn(
                                                "p-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors border-b last:border-0 border-slate-50",
                                                selectedDepartment?.managerId === emp.id && "bg-accent/5 ring-1 ring-inset ring-accent/10"
                                            )}
                                            onClick={() => confirmAssignManager(emp.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                                                    {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold text-slate-900 leading-tight">{emp.fullName}</p>
                                                    <p className="text-[9px] text-slate-500 leading-tight uppercase font-medium tracking-tighter">{emp.jobTitle}</p>
                                                </div>
                                            </div>
                                            {selectedDepartment?.managerId === emp.id ? (
                                                <Badge variant="success" className="text-[8px] h-4 py-0">Active</Badge>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-[9px] font-bold px-2 uppercase hover:bg-accent hover:text-white"
                                                >
                                                    Assign
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-2.5">
                                <Shield size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                <div className="text-[10px] text-amber-900 leading-relaxed font-medium">
                                    <strong>Automation Notice:</strong> Assigning a manager triggers:
                                    <div className="mt-1 flex flex-col gap-1">
                                        <div className="flex gap-1.5">• <span>Automatic system role promotion to <strong>Manager</strong>.</span></div>
                                        <div className="flex gap-1.5">• <span>Transfer of all <strong>Pending Leave Requests</strong>.</span></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <div className="p-4 pt-0 flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setIsManagerModalOpen(false)}>Cancel</Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Department Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
                            <div>
                                <CardTitle>{currentDepartment ? 'Edit Department' : 'Add Department'}</CardTitle>
                                <CardDescription>Define organizational unit details.</CardDescription>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Department Name</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            required
                                            className="pl-10"
                                            value={formData.departmentName}
                                            onChange={e => setFormData({ ...formData, departmentName: e.target.value })}
                                            placeholder="e.g. Engineering"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Department Code</label>
                                    <div className="relative">
                                        <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            required
                                            className="pl-10"
                                            value={formData.departmentCode}
                                            onChange={e => setFormData({ ...formData, departmentCode: e.target.value })}
                                            placeholder="e.g. ENG-01"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                        <textarea
                                            className="w-full min-h-[100px] pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Brief description of the department's role..."
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <div className="p-6 pt-0 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="accent" isLoading={isSubmitting}>
                                    {currentDepartment ? 'Update' : 'Create'} Department
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Team Modal */}
            {isTeamModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                                    <Users2 className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <CardTitle>{selectedDepartment?.departmentName} Team</CardTitle>
                                    <CardDescription>{teamEmployees.length} productive members identified.</CardDescription>
                                </div>
                            </div>
                            <button onClick={() => setIsTeamModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                            {isFetchingTeam ? (
                                <div className="py-20 flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-medium text-slate-500">Retrieving team list...</p>
                                </div>
                            ) : teamEmployees.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 font-medium">No employees assigned to this department yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {teamEmployees.map((emp) => (
                                        <div key={emp.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200">
                                                {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-slate-900">{emp.fullName || `${emp.firstName} ${emp.lastName}`}</p>
                                                <p className="text-xs text-slate-500">{emp.jobTitle}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold px-3" onClick={() => window.location.href = `/employees/${emp.id}`}>
                                                Profile
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <div className="p-4 border-t border-slate-100 flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => setIsTeamModalOpen(false)}>Close</Button>
                        </div>
                    </Card>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
                            <div>
                                <CardTitle className="text-red-600">Delete Department</CardTitle>
                                <CardDescription>This action cannot be undone.</CardDescription>
                            </div>
                            <button onClick={() => { setIsDeleteModalOpen(false); setDepartmentToDelete(null); setTransferDepartmentId(''); }} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Are you sure you want to delete <strong>{departmentToDelete?.departmentName}</strong>?
                            </p>

                            {departmentToDelete?.subDepartmentCount > 0 && (
                                <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                                    ❌ This department has <strong>{departmentToDelete.subDepartmentCount}</strong> sub-department(s).
                                    You must reassign or delete them first before you can delete this department.
                                </p>
                            )}

                            {departmentToDelete?.employeeCount > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                        ⚠️ This department has <strong>{departmentToDelete.employeeCount}</strong> employee(s)
                                        {departmentToDelete.managerName && (<> and manager <strong>{departmentToDelete.managerName}</strong></>)}.
                                        Select a department to transfer them to:
                                    </p>
                                    <select
                                        value={transferDepartmentId}
                                        onChange={(e) => setTransferDepartmentId(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                    >
                                        <option value="">-- Select target department --</option>
                                        {departments
                                            .filter(d => d.id !== departmentToDelete?.id && d.isActive !== false)
                                            .map(d => (
                                                <option key={d.id} value={d.id}>
                                                    {d.departmentName} ({d.employeeCount || 0} employees)
                                                </option>
                                            ))
                                        }
                                    </select>
                                    {departmentToDelete.managerName && (
                                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            ℹ️ Manager <strong>{departmentToDelete.managerName}</strong> will be demoted to <strong>Employee</strong> role and transferred to the selected department.
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                        <div className="p-4 pt-0 flex justify-end gap-3">
                            <Button variant="ghost" size="sm" onClick={() => { setIsDeleteModalOpen(false); setDepartmentToDelete(null); setTransferDepartmentId(''); }}>Cancel</Button>
                            <Button
                                variant="accent"
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={confirmDelete}
                                isLoading={isDeleting}
                                disabled={departmentToDelete?.employeeCount > 0 && !transferDepartmentId}
                            >
                                {departmentToDelete?.employeeCount > 0 ? 'Transfer & Delete' : 'Delete'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default DepartmentList;
