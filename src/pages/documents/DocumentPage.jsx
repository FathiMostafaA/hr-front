import React, { useState } from 'react';
import {
    FileText,
    Upload,
    Search,
    Download,
    MoreHorizontal,
    File,
    FileImage,
    AlertCircle,
    Info,
    Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import documentService from '../../api/services/documentService';
import { toast } from 'react-hot-toast';

const DocumentPage = () => {
    const { user } = useAuth();
    const [docs, setDocs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [expiringDocs, setExpiringDocs] = useState([]);
    const fileInputRef = React.useRef(null);

    const canUpload = user?.roles?.some(r => ['Admin', 'HRManager', 'HR'].includes(r));
    const canDelete = user?.roles?.some(r => ['Admin', 'HRManager'].includes(r));

    React.useEffect(() => {
        if (user?.employeeId) {
            fetchDocuments();
        } else {
            setIsLoading(false);
        }
    }, [user?.employeeId]);

    const fetchDocuments = async () => {
        if (!user?.employeeId) return;
        try {
            const data = await documentService.getEmployeeDocuments(user.employeeId);
            setDocs(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load documents');
            setDocs([]);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        if (canUpload || canDelete) {
            documentService.getExpiringDocuments(30).then(setExpiringDocs).catch(() => setExpiringDocs([]));
        }
    }, [canUpload, canDelete]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !user?.employeeId) return;

        setIsPosting(true);
        try {
            await documentService.uploadDocument(
                user.employeeId,
                file,
                file.name,
                'Personal',
                null,
                false
            );
            toast.success('Document uploaded successfully');
            fetchDocuments();
        } catch (error) {
            const msg = error.response?.data?.detail || error.message || 'Failed to upload document';
            toast.error(msg);
        } finally {
            setIsPosting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDownload = async (docId, docName) => {
        try {
            const blob = await documentService.downloadDocument(docId);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', docName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            toast.error('Failed to download document');
        }
    };

    const handleDelete = async (docId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        try {
            await documentService.deleteDocument(docId);
            setDocs(docs.filter(d => d.id !== docId));
            toast.success('Document deleted');
        } catch (error) {
            toast.error('Failed to delete document');
        }
    };

    return (
        <div className="space-y-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Resource Center</h1>
                    <p className="text-slate-500 mt-1">Access policies, contracts, and personal documents.</p>
                </div>
                <div className="flex items-center gap-3">
                    {canUpload && (
                        <Button
                            variant="accent"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isPosting || !user?.employeeId}
                        >
                            {isPosting ? 'Uploading...' : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload File
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    {expiringDocs.length > 0 && (
                        <Card className="bg-slate-900 text-white border-0">
                            <CardHeader>
                                <CardTitle className="text-amber-400 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5" />
                                    Urgent Action
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {expiringDocs.slice(0, 3).map((doc) => {
                                    const daysLeft = doc.expiryDate ? Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
                                    return (
                                        <p key={doc.id} className="text-sm text-slate-400 leading-relaxed">
                                            <span className="text-white font-semibold">{doc.documentName}</span> expires in <span className="text-white font-bold underline decoration-amber-400 underline-offset-4">{daysLeft} days</span>.
                                        </p>
                                    );
                                })}
                                {canUpload && (
                                    <Button variant="accent" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                        Upload Renewed Copy
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Categories</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            {['Company Policies', 'Contracts', 'Personal', 'Certificates', 'Training'].map((cat, i) => (
                                <button key={i} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-left text-sm font-medium text-slate-600 transition-all">
                                    {cat}
                                    <span className="text-[10px] py-0.5 px-2 bg-slate-100 rounded-full font-bold">
                                        {docs.filter(d => d.documentType === cat).length || 0}
                                    </span>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-3">
                    <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b border-slate-100">
                        <div>
                            <CardTitle>All Documents</CardTitle>
                            <CardDescription>Browse through your uploaded and shared resources</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-xs"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-6 py-4">Document Name</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4">Added On</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {!user?.employeeId ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500">Your account is not linked to an employee record. Contact HR to access documents.</td>
                                        </tr>
                                    ) : isLoading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400">Loading documents...</td>
                                        </tr>
                                    ) : docs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-slate-400">No documents found.</td>
                                        </tr>
                                    ) : docs
                                        .filter(d => !searchTerm || (d.documentName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (d.documentType || '').toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((doc) => (
                                        <tr key={doc.id} className="group hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-accent transition-all">
                                                        {(doc.documentName || '').toLowerCase().endsWith('.jpg') ? <FileImage className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 leading-tight">{doc.documentName}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase">{Math.round(doc.fileSize / 1024) || 0} KB</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-semibold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md ring-1 ring-slate-200">{doc.documentType}</span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500 font-medium font-mono">
                                                {new Date(doc.uploadedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <Badge variant={doc.status === 'Verified' ? 'success' : 'warning'}>
                                                    {doc.status || 'Active'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 text-right flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownload(doc.id, doc.documentName + '.pdf')}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                {canDelete && (
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600" onClick={() => handleDelete(doc.id)} title="Delete document">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DocumentPage;
