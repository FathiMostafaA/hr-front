import React, { useState, useEffect } from 'react';
import { Users, Building2, ChevronRight, ChevronDown, User, Search, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import OrgService from '../../api/services/orgService';
import { Card, CardContent } from '../../components/ui/Card';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/cn';

const OrgNode = ({ node, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasReports = node.directReports && node.directReports.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* Connection Line from Parent */}
            {level > 0 && <div className="w-px h-8 bg-slate-200" />}

            <div className={cn(
                "relative group flex flex-col items-center p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 min-w-[200px] max-w-[280px]",
                "hover:border-accent/40"
            )}>
                {/* Employee Info */}
                <div className="flex flex-col items-center gap-3 w-full">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                        <User className="w-6 h-6" />
                    </div>
                    <div className="text-center overflow-hidden w-full">
                        <h4 className="text-sm font-black text-slate-900 truncate">{node.name}</h4>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">{node.jobTitle}</p>
                        {node.departmentName && (
                            <div className="mt-2 flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] text-slate-500 font-medium">{node.departmentName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expansion Toggle */}
                {hasReports && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-accent hover:border-accent transition-all z-10"
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {/* Connection Line to Children */}
            {hasReports && isExpanded && (
                <div className="flex flex-col items-center w-full">
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="flex gap-8 px-4 relative">
                        {/* Horizontal Connection Beam */}
                        {node.directReports.length > 1 && (
                            <div className="absolute top-0 left-[calc(50%/n)] right-[calc(50%/n)] h-px bg-slate-200"
                                style={{
                                    left: `calc(100% / ${node.directReports.length * 2})`,
                                    right: `calc(100% / ${node.directReports.length * 2})`
                                }}
                            />
                        )}
                        {node.directReports.map((report) => (
                            <OrgNode key={report.id} node={report} level={level + 1} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const OrgChartPage = () => {
    const [chartData, setChartData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const data = await OrgService.getOrgChart();
            setChartData(data);
        } catch (error) {
            console.error('Failed to fetch org chart', error);
            toast.error('Failed to load organizational chart');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 h-fit">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Organizational Chart</h1>
                    <p className="text-slate-500 mt-1">Visualize the reporting structure and hierarchy.</p>
                </div>

                <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                        className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-slate-600 w-12 text-center">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                        className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-100 mx-1" />
                    <button
                        onClick={() => setZoom(1)}
                        className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <Card className="flex-1 min-h-[600px] overflow-hidden bg-slate-50/50 relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-accent rounded-full animate-spin" />
                        <p className="mt-4 text-sm font-medium text-slate-400">Building hierarchy...</p>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-sm">
                            <Users className="w-10 h-10" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No Hierarchy Data</h3>
                        <p className="text-slate-500 mt-1 max-w-md">
                            Assign managers to employees in the employee list to build the organizational structure.
                        </p>
                    </div>
                ) : (
                    <div className="absolute inset-0 overflow-auto p-12">
                        <div
                            className="flex justify-center transition-transform duration-300 origin-top"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            <div className="flex gap-16">
                                {chartData.map((root) => (
                                    <OrgNode key={root.id} node={root} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default OrgChartPage;
