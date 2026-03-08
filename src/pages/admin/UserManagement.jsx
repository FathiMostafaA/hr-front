import React, { useState, useEffect } from 'react';
import {
    Users,
    Shield,
    Search,
    Key,
    UserPlus,
    MoreHorizontal,
    UserCheck,
    UserX,
    Lock,
    Unlock,
    Mail,
    RefreshCw,
    Briefcase,
    Plus,
    AlertCircle,
    Copy,
    CheckCircle2,
    ExternalLink,
    Trash2
} from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import UserService from '../../api/services/userService';
import { usePresence } from '../../context/PresenceContext';
import { cn } from '../../utils/cn';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false);

    const [currentUser, setCurrentUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invitationUrl, setInvitationUrl] = useState('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'Employee'
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { getUserStatus } = usePresence();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const data = await UserService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch users', error);
            toast.error('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            role: 'HRManager'
        });
        setIsAddModalOpen(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await UserService.create(formData);
            toast.success('Account created successfully');
            setIsAddModalOpen(false);

            if (response.invitationUrl) {
                const fullUrl = response.invitationUrl.startsWith('http')
                    ? response.invitationUrl
                    : `${window.location.origin}${response.invitationUrl}`;
                setInvitationUrl(fullUrl);
                setIsInvitationModalOpen(true);
            }

            fetchUsers();
        } catch (error) {
            console.error('Creation failed', error);
            const errorMsg = error.response?.data || 'Failed to create user';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(invitationUrl);
        toast.success('Invitation link copied!');
    };

    const handleEdit = (user) => {
        setCurrentUser(user);
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await UserService.update(currentUser.id, formData);
            toast.success('User updated successfully');
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Update failed', error);
            const errorMsg = error.response?.data || 'Failed to update user';
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await UserService.toggleStatus(user.id);
            toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
            fetchUsers();
        } catch (error) {
            console.error('Toggle status failed', error);
            toast.error('Failed to change user status');
        }
    };

    const handleResetPassword = (user) => {
        setCurrentUser(user);
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setIsPasswordModalOpen(true);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        try {
            await UserService.resetPassword(currentUser.id, passwordData.newPassword);
            toast.success('Password reset successfully');
            setIsPasswordModalOpen(false);
        } catch (error) {
            console.error('Password reset failed', error);
            toast.error('Failed to reset password');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await UserService.delete(userToDelete.id);
            toast.success('User account deleted');
            setIsDeleteModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Delete failed', error);
            const errorMsg = error.response?.data || 'Failed to delete user';
            toast.error(errorMsg);
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        switch (role) {
            case 'Admin': return <Badge variant="danger" className="gap-1"><Shield size={12} /> Admin</Badge>;
            case 'HRManager': return <Badge variant="warning" className="gap-1"><Key size={12} /> HR Manager</Badge>;
            case 'HR': return <Badge variant="brand" className="gap-1"><Users size={12} /> HR Specialist</Badge>;
            case 'Manager': return <Badge variant="info" className="gap-1"><Briefcase size={12} /> Manager</Badge>;
            default: return <Badge variant="secondary">Employee</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500">Manage system access, roles, and administrative accounts</p>
                </div>
                <Button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <UserPlus size={18} />
                    Add New User
                </Button>
            </div>

            <Card>
                <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                placeholder="Search users by name, email, or role..."
                                className="pl-10 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchUsers}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-4 font-bold">User Information</th>
                                    <th className="px-6 py-4 font-bold">System Role</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold">Last Activity</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-6 py-4">
                                                <div className="h-10 bg-gray-100 rounded"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic text-sm">
                                            No system accounts found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-9 h-9">
                                                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm text-xs">
                                                            {user.firstName[0]}{user.lastName[0]}
                                                        </div>
                                                        {(() => {
                                                            const status = getUserStatus(user.id);
                                                            return (
                                                                <div
                                                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${status.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                                                    title={status.isOnline ? "Online" : "Offline"}
                                                                />
                                                            );
                                                        })()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 text-sm">{user.firstName} {user.lastName}</div>
                                                        <div className="text-[11px] text-gray-500 flex items-center gap-1">
                                                            <Mail size={10} /> {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={user.isActive ? "success" : "danger"} className="gap-1 h-5 text-[10px]">
                                                    {user.isActive ? <UserCheck size={10} /> : <UserX size={10} />}
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                                                {(() => {
                                                    const status = getUserStatus(user.id);
                                                    const lastActive = status.lastActiveAt || user.lastActiveAt || user.lastLoginAt;
                                                    return lastActive ? new Date(lastActive).toLocaleString() : 'Never logged in';
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => handleEdit(user)}
                                                        title="Edit User"
                                                    >
                                                        <Plus className="w-4 h-4 rotate-45" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50"
                                                        onClick={() => handleResetPassword(user)}
                                                        title="Reset Password"
                                                    >
                                                        <Key size={14} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 w-8 p-0",
                                                            user.isActive
                                                                ? "text-red-500 hover:bg-red-50"
                                                                : "text-emerald-500 hover:bg-emerald-50"
                                                        )}
                                                        onClick={() => handleToggleStatus(user)}
                                                        title={user.isActive ? "Deactivate Account" : "Activate Account"}
                                                    >
                                                        {user.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                                        onClick={() => handleDeleteClick(user)}
                                                        title="Delete System Account"
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Add New User Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Invite Administrator"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex gap-3">
                        <AlertCircle size={18} className="text-indigo-600 shrink-0" />
                        <p className="text-[11px] text-indigo-900 leading-relaxed">
                            An <strong>Invitation Link</strong> will be generated for the user to set their own password and activate their account.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">First Name</label>
                            <Input
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                placeholder="e.g. John"
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Last Name</label>
                            <Input
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                placeholder="e.g. Doe"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Email Address</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="user@example.com"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Administrator Role</label>
                        <select
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="Employee">Employee</option>
                            <option value="HR">HR Specialist</option>
                            <option value="HRManager">HR Manager</option>
                            <option value="Admin">System Administrator</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white border-transparent">
                            {isSubmitting ? 'Processing...' : 'Send Invitation'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Invitation Success Modal */}
            <Modal
                isOpen={isInvitationModalOpen}
                onClose={() => setIsInvitationModalOpen(false)}
                title="Invitation Created"
            >
                <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={32} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Account Invitation Ready</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-1">
                            The system account and employee record have been created. Share the link below with the user to activate their account.
                        </p>
                    </div>

                    <div className="w-full space-y-2 pt-4">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <Input
                                value={invitationUrl}
                                readOnly
                                className="bg-transparent border-none text-xs text-indigo-600 font-mono focus:ring-0 h-auto p-0"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handleCopyLink}
                            >
                                <Copy size={16} />
                            </Button>
                        </div>
                    </div>

                    <div className="flex w-full gap-3 pt-6">
                        <Button
                            className="flex-1"
                            onClick={() => setIsInvitationModalOpen(false)}
                        >
                            Done
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => window.open(invitationUrl, '_blank')}
                        >
                            <ExternalLink size={16} />
                            Preview
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit User Modal - Simplified role edit */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit System Access"
            >
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">First Name</label>
                            <Input
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Last Name</label>
                            <Input
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Email Address</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">System Role</label>
                        <select
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="Employee">Employee</option>
                            <option value="HR">HR Specialist</option>
                            <option value="Manager">Manager</option>
                            <option value="HRManager">HR Manager</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title={`Reset Password: ${currentUser?.firstName}`}
            >
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">New Password</label>
                        <Input
                            type="password"
                            placeholder="Enter new complex password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Confirm Password</label>
                        <Input
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white border-transparent">
                            {isSubmitting ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                title="Permanently Delete User"
                description={`Warning: You are about to delete ${userToDelete?.firstName} ${userToDelete?.lastName}'s system account and all associated permissions. This will NOT delete their employee record, but they will lose all access to the system immediately.`}
                confirmLabel="Delete Account"
            />
        </div>
    );
};

export default UserManagement;
