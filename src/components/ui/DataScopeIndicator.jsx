import React from 'react';
import { Network, User, Users } from 'lucide-react';
import { cn } from '../../utils/cn';

const DataScopeIndicator = ({ scope = 'org', className }) => {
    // scope: 'my' | 'team' | 'org'
    
    const config = {
        my: { icon: User, label: 'My Data Only', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        team: { icon: Users, label: 'Team Data', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        org: { icon: Network, label: 'Organization Data', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    };

    const current = config[scope] || config.my;
    const Icon = current.icon;

    return (
        <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold",
            current.bg,
            current.color,
            current.border,
            className
        )}>
            <Icon className="w-3.5 h-3.5" />
            <span>Scope: {current.label}</span>
        </div>
    );
};

export default DataScopeIndicator;
