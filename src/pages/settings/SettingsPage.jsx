import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AuthService from '../../api/services/authService';
import { toast } from 'react-hot-toast';
import { Lock, User, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';

const SettingsPage = () => {
    const { user } = useAuth();
    const [passData, setPassData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setPassData({ ...passData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            toast.error("New passwords don't match");
            return;
        }

        setLoading(true);
        try {
            await AuthService.changePassword(user.id, passData.currentPassword, passData.newPassword);
            toast.success("Password changed successfully");
            setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                <p className="text-slate-500">Manage your account preferences and security.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Your personal information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                                {user?.firstName?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900">{user?.fullName}</h3>
                                <p className="text-sm text-slate-500 capitalize">{user?.roles?.[0]}</p>
                            </div>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <User className="w-4 h-4" />
                                <span>{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Shield className="w-4 h-4" />
                                <span>Role: {user?.roles?.join(', ')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Update your password to keep your account safe</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passData.currentPassword}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passData.newPassword}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button type="submit" isLoading={loading}>
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SettingsPage;
