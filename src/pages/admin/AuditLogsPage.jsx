import React, { useState, useEffect } from 'react';
import { Shield, Clock, Database, Search, User, ChevronLeft, ChevronRight, Eye, Code } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import auditService from '../../api/services/auditService';
import { toast } from 'react-hot-toast';

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const data = await auditService.getLogs(page, pageSize);
            setLogs(data);
        } catch (error) {
            toast.error('Failed to load audit logs');
        } finally {
            setIsLoading(false);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'Create': return 'success';
            case 'Update': return 'warning';
            case 'Delete': return 'danger';
            default: return 'secondary';
        }
    };

    const formatJson = (jsonStr) => {
        if (!jsonStr) return null;
        try {
            const obj = JSON.parse(jsonStr);
            return JSON.stringify(obj, null, 2);
        } catch (e) {
            return jsonStr;
        }
    };

    const getChanges = (oldVal, newVal) => {
        if (!oldVal && !newVal) return [];
        try {
            const oldObj = JSON.parse(oldVal || '{}');
            const newObj = JSON.parse(newVal || '{}');
            const changes = [];

            // Ignore internal EF Core fields that aren't useful for users
            const ignoredFields = ['ConcurrencyStamp', 'SecurityStamp', 'PasswordHash', 'NormalizedEmail', 'NormalizedUserName'];

            const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
            allKeys.forEach(key => {
                if (ignoredFields.includes(key)) return;

                const val1 = oldObj[key];
                const val2 = newObj[key];

                if (JSON.stringify(val1) !== JSON.stringify(val2)) {
                    changes.push({
                        field: key,
                        old: val1,
                        new: val2
                    });
                }
            });
            return changes;
        } catch (e) {
            return [];
        }
    };

    const changes = selectedLog ? getChanges(selectedLog.oldValues, selectedLog.newValues) : [];

    return (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">System Audit Logs</h1>
                    <p className="text-slate-500 mt-1">Monitor every data change and action performed in the system.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Card className="border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Action</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Entity</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">User</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Timestamp</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Preview</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-medium text-sm">
                                    {isLoading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan="5" className="h-16 px-6">
                                                    <div className="h-4 bg-slate-100 rounded-full w-full" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id}
                                                className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedLog?.id === log.id ? 'bg-indigo-50/50' : 'active:scale-95 transition-transform'}`}
                                                onClick={() => setSelectedLog(log)}
                                            >
                                                <td className="px-6 py-4">
                                                    <Badge variant={getActionColor(log.action)}>{log.action}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-slate-700 font-bold">{log.entityName}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-500">
                                                        <User className="w-3 h-3" />
                                                        <span className="text-xs truncate max-w-[120px] font-bold">{log.userName || 'System'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        <span className="text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-accent font-bold">
                                                    <span className="text-[10px] uppercase opacity-40 group-hover:opacity-100 italic">View Details</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-400">Page {page}</span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="border-slate-100 shadow-xl sticky top-6 overflow-hidden">
                        <CardHeader className="bg-slate-900 text-white border-none py-4">
                            <CardTitle className="text-xs flex items-center gap-2 uppercase tracking-[0.2em] font-black">
                                <Database className="w-4 h-4 text-accent" />
                                Analysis of Changes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {selectedLog ? (
                                <div className="divide-y divide-slate-50">
                                    {/* Action Header */}
                                    <div className="p-6 bg-slate-50/50 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Operation</span>
                                                <span className="font-bold text-lg text-slate-900">{selectedLog.action} {selectedLog.entityName}</span>
                                            </div>
                                            <Badge variant={getActionColor(selectedLog.action)} size="lg">{selectedLog.action}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                {(selectedLog.userName || 'S').charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] uppercase font-bold text-slate-400">Initiated By</span>
                                                <span className="text-xs font-bold text-slate-700">{selectedLog.userName || 'System'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Human Readable Changes */}
                                    <div className="p-6 space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                                            <div className="w-1 h-3 bg-accent rounded-full" />
                                            Data Intelligence Summary
                                        </h4>

                                        {changes.length > 0 ? (
                                            <div className="space-y-3">
                                                {changes.map((change, idx) => (
                                                    <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm space-y-1">
                                                        <p className="text-xs font-bold text-slate-900 capitalize">{change.field.replace(/([A-Z])/g, ' $1').trim()}</p>
                                                        <div className="flex items-center gap-2 text-[10px] font-medium">
                                                            <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded line-through opacity-60">
                                                                {change.old === null ? 'NULL' : String(change.old)}
                                                            </span>
                                                            <ChevronRight className="w-3 h-3 text-slate-300" />
                                                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded">
                                                                {change.new === null ? 'NULL' : String(change.new)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center">
                                                <p className="text-xs font-bold text-slate-400 italic">No significant data mutations detected.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Raw Data Toggle (Minimized for non-techs) */}
                                    <details className="group border-t border-slate-100">
                                        <summary className="p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-2">
                                                <Code className="w-3 h-3" />
                                                Technical Payload (JSON)
                                            </span>
                                            <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                                        </summary>
                                        <div className="p-6 bg-slate-950 space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-500 uppercase">Entity Reference</p>
                                                <code className="text-[10px] text-accent block break-all opacity-70 italic">{selectedLog.entityId}</code>
                                            </div>

                                            {selectedLog.oldValues && (
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-red-400 uppercase">Input State</p>
                                                    <pre className="text-[9px] text-red-300/60 overflow-auto max-h-32 p-3 bg-red-950/20 rounded-lg">
                                                        {formatJson(selectedLog.oldValues)}
                                                    </pre>
                                                </div>
                                            )}

                                            {selectedLog.newValues && (
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-emerald-400 uppercase">Resultant State</p>
                                                    <pre className="text-[9px] text-emerald-300/60 overflow-auto max-h-32 p-3 bg-emerald-950/20 rounded-lg">
                                                        {formatJson(selectedLog.newValues)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                </div>
                            ) : (
                                <div className="py-40 text-center opacity-40">
                                    <Shield className="w-16 h-16 mx-auto text-slate-100" />
                                    <p className="text-xs font-bold mt-4 tracking-widest uppercase">Select an Audit Entry</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AuditLogsPage;
