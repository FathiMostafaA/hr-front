import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Home, SendHorizonal } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';

const AccessDeniedPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const requiredRoles = location.state?.requiredRoles || [];

    const handleRequestAccess = () => {
        // In a real system, this would open a workflow / send a request to admin
        toast.success('Access request sent to system administrator', {
            icon: '📩',
            duration: 4000,
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-sm">
                    <ShieldAlert className="w-10 h-10 text-rose-500" />
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        Access Denied
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        You do not have the required permissions to access this page.
                        Please contact the system administrator if you believe this is an error.
                    </p>
                </div>

                {/* Required Roles */}
                {requiredRoles.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Required Permissions
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {requiredRoles.map((role) => (
                                <span
                                    key={role}
                                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                                >
                                    {role}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col items-center gap-3 pt-2">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="rounded-xl px-6"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                            Go Back
                        </Button>
                        <Button
                            variant="accent"
                            className="rounded-xl px-6 shadow-lg shadow-accent/20"
                            onClick={() => navigate('/dashboard')}
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Dashboard
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        className="rounded-xl px-6 text-accent hover:bg-accent/10"
                        onClick={handleRequestAccess}
                    >
                        <SendHorizonal className="w-4 h-4 mr-2" />
                        Request Access
                    </Button>
                </div>

                {/* Error Code */}
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-4">
                    Error 403 — Forbidden
                </p>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
