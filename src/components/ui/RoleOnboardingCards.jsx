import React from 'react';
import { PlayCircle, FileText, CheckCircle2, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RoleOnboardingCards = () => {
    const { user } = useAuth();
    const primaryRole = user?.roles?.[0] || 'Employee';

    // Different onboarding content based on role
    const content = {
        Admin: [
            { icon: Users, title: 'Manage Users', desc: 'Add new users and configure their permissions' },
            { icon: CheckCircle2, title: 'System Settings', desc: 'Review core system configurations' },
            { icon: FileText, title: 'Audit Logs', desc: 'View system audit logs and activity' }
        ],
        HRManager: [
            { icon: Users, title: 'Add Employee', desc: 'Start by adding a new employee profile' },
            { icon: CheckCircle2, title: 'Leave Requests', desc: 'Review pending time-off requests' },
            { icon: FileText, title: 'Payroll Run', desc: 'Setup and review the upcoming payroll run' }
        ],
        Employee: [
            { icon: FileText, title: 'Update Profile', desc: 'Complete your profile and upload documents' },
            { icon: CheckCircle2, title: 'Request Leave', desc: 'Submit your first time-off request' },
            { icon: PlayCircle, title: 'Salary & Attendance', desc: 'View your payslips and attendance records' }
        ]
    };

    // Fallback to Employee if role specific not found
    const cards = content[primaryRole] || content['HR'] || content['Employee'];

    return (
        <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Your First Steps</h2>
            <div className="grid border border-slate-200 rounded-2xl overflow-hidden bg-white sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x">
                {cards.map((card, i) => (
                    <div key={i} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <card.icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1">{card.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoleOnboardingCards;
