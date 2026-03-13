import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowRight, Home } from 'lucide-react';
import Button from '../../components/ui/Button';
import { getRoleDisplayName } from '../../config/roleDisplayMap';

const AccessDeniedPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const requiredRoles = location.state?.requiredRoles || [];

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
                        ليس لديك صلاحية الوصول
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        لا تملك الصلاحيات المطلوبة للوصول إلى هذه الصفحة.
                        يرجى التواصل مع مدير النظام إذا كنت تعتقد أن هذا خطأ.
                    </p>
                </div>

                {/* Required Roles */}
                {requiredRoles.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            الصلاحيات المطلوبة
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {requiredRoles.map((role) => (
                                <span
                                    key={role}
                                    className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700"
                                >
                                    {getRoleDisplayName(role)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 justify-center pt-2">
                    <Button
                        variant="outline"
                        className="rounded-xl px-6"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowRight className="w-4 h-4 ml-2 rotate-180" />
                        العودة
                    </Button>
                    <Button
                        variant="accent"
                        className="rounded-xl px-6 shadow-lg shadow-accent/20"
                        onClick={() => navigate('/dashboard')}
                    >
                        <Home className="w-4 h-4 ml-2" />
                        الرئيسية
                    </Button>
                </div>

                {/* Error Code */}
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest pt-4">
                    خطأ 403 — الوصول مرفوض
                </p>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
