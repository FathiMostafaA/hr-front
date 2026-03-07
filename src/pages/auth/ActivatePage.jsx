import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import AuthService from '../../api/services/authService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';

const ActivatePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token || !email) {
            toast.error("Invalid activation link.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);
        try {
            await AuthService.completeActivation({
                token,
                email,
                newPassword: password
            });
            setIsSuccess(true);
            toast.success("Account activated successfully!");
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            console.error('Activation failed', error);
            const errorMsg = error.response?.data?.title || error.response?.data?.message || error.response?.data || "Activation failed. The link may be expired.";
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
                <Card className="w-full max-w-md border-red-100 shadow-xl">
                    <CardContent className="pt-8 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Invalid Link</h2>
                        <p className="text-slate-500">The activation link is missing required information. Please contact your HR department.</p>
                        <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
                <Card className="w-full max-w-md border-emerald-100 shadow-xl">
                    <CardContent className="pt-8 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-bounce">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Account Activated</h2>
                        <p className="text-slate-500">Your password has been set and your account is now ready. Redirecting to login...</p>
                        <Button className="w-full" onClick={() => navigate('/login')}>
                            Go to Login Now
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden px-4">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-primary rounded-xl shadow-lg mb-4 text-white">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Activate Account</h1>
                    <p className="text-slate-500">Set your password to gain system access</p>
                    <div className="mt-2 text-xs font-semibold text-accent bg-accent/10 py-1 px-3 rounded-full inline-block">
                        {email}
                    </div>
                </div>

                <Card className="border-slate-100 shadow-xl backdrop-blur-sm bg-white/80">
                    <CardHeader>
                        <CardTitle>Set Your Password</CardTitle>
                        <CardDescription>Minimum 6 characters with letters and numbers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-3 top-9 w-4 h-4 text-slate-400" />
                                <Input
                                    label="New Password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-9 w-4 h-4 text-slate-400" />
                                <Input
                                    label="Confirm Password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full mt-2 group"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Activate My Account
                                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ActivatePage;
