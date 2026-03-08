import React, { useState, useEffect } from 'react';
import {
    Briefcase, Plus, Search, UserPlus, MoreHorizontal,
    MapPin, ArrowRight, TrendingUp, CheckCircle2, User,
    Mail, Phone, Calendar, DollarSign, Building, Hash, Eye, XCircle, Play, FileText, Star, Copy, Link
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import RecruitmentService from '../../api/services/recruitmentService';
import AuthService from '../../api/services/authService';
import departmentService from '../../api/services/departmentService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const RecruitmentPage = () => {
    const [jobs, setJobs] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const { user } = useAuth();
    const isAdminOrHR = user?.roles?.some(r => ['Admin', 'HRManager', 'HR'].includes(r));
    const [candidates, setCandidates] = useState([]);
    const [isHireModalOpen, setIsHireModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isJobDetailsModalOpen, setIsJobDetailsModalOpen] = useState(false);
    const [isCandidateDetailsModalOpen, setIsCandidateDetailsModalOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

    const [candidateDetails, setCandidateDetails] = useState(null);

    const [applyForm, setApplyForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        resumeUrl: '',
        coverLetter: ''
    });

    const [hireForm, setHireForm] = useState({
        employeeNumber: '',
        baseSalary: 0,
        departmentId: '',
        jobTitle: ''
    });

    const [jobForm, setJobForm] = useState({
        jobTitle: '',
        departmentId: '',
        jobDescription: '',
        requirements: '',
        salaryRangeMin: '',
        salaryRangeMax: '',
        location: '',
        closingDate: '',
        employmentTypeStr: 'Full-time'
    });

    const [activationLinkInfo, setActivationLinkInfo] = useState(null);

    useEffect(() => {
        fetchJobs();
        fetchDepartments();
    }, []);

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            const data = await RecruitmentService.getJobs();
            setJobs(data);
        } catch (error) {
            toast.error('Failed to load jobs');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const data = await departmentService.getAll();
            setDepartments(data);
        } catch (error) { }
    };

    const handleViewCandidates = async (job) => {
        setSelectedJob(job);
        try {
            const data = await RecruitmentService.getCandidates(job.id);
            setCandidates(data);
        } catch (error) {
            toast.error('Failed to load candidates');
        }
    };

    const openHireModal = (candidate) => {
        setSelectedCandidate(candidate);
        setHireForm({
            ...hireForm,
            jobTitle: selectedJob.jobTitle,
            departmentId: selectedJob.departmentId || '',
            employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`
        });
        setIsHireModalOpen(true);
    };

    const handleHire = async (e) => {
        e.preventDefault();
        try {
            const newEmployee = await RecruitmentService.hireCandidate(selectedCandidate.id, {
                ...hireForm,
                firstName: selectedCandidate.fullName.split(' ')[0],
                lastName: selectedCandidate.fullName.split(' ').slice(1).join(' ') || 'Candidate',
                email: selectedCandidate.email
            });

            // Generate link
            const inviteResp = await AuthService.inviteEmployee(newEmployee.id);
            setActivationLinkInfo({
                name: selectedCandidate.fullName,
                url: `${window.location.origin}${inviteResp.activationUrl}`
            });

            toast.success(`${selectedCandidate.fullName} is now an employee!`);
            setIsHireModalOpen(false);
            handleViewCandidates(selectedJob);
        } catch (error) {
            toast.error('Failed to hire candidate or generate activation link');
        }
    };

    const copyToClipboard = () => {
        if (activationLinkInfo?.url) {
            navigator.clipboard.writeText(activationLinkInfo.url);
            toast.success('Activation link copied to clipboard!');
        }
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();
        try {
            await RecruitmentService.postJob(jobForm);
            toast.success('Job posted successfully');
            setIsJobModalOpen(false);
            fetchJobs();
        } catch (error) {
            toast.error('Failed to post job');
        }
    };

    const handleUpdateJobStatus = async (job, newStatus) => {
        try {
            await RecruitmentService.updateJobStatus(job.id, newStatus);
            toast.success(`Job marked as ${newStatus}`);
            fetchJobs();
            if (selectedJob?.id === job.id) setSelectedJob({ ...selectedJob, status: newStatus });
        } catch (error) {
            toast.error('Failed to update job status');
        }
    };

    const handleUpdateCandidateStage = async (candidate, newStage) => {
        try {
            await RecruitmentService.updateCandidateStage(candidate.id, { currentStage: newStage });
            toast.success('Candidate stage updated');
            handleViewCandidates(selectedJob);
        } catch (error) {
            toast.error('Failed to update candidate stage');
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        try {
            await RecruitmentService.apply({ ...applyForm, jobPostingId: selectedJob.id });
            toast.success('Candidate added successfully');
            setIsApplyModalOpen(false);
            setApplyForm({ firstName: '', lastName: '', email: '', phone: '', resumeUrl: '', coverLetter: '' });
            handleViewCandidates(selectedJob);
        } catch (error) {
            toast.error('Failed to add candidate');
        }
    };

    const handleSaveCandidateNotes = async () => {
        try {
            await RecruitmentService.updateCandidateStage(candidateDetails.id, {
                currentStage: candidateDetails.currentStage,
                rating: candidateDetails.rating,
                notes: candidateDetails.notes
            });
            toast.success('Candidate profile updated');
            handleViewCandidates(selectedJob);
            setIsCandidateDetailsModalOpen(false);
        } catch (error) {
            toast.error('Failed to update candidate profile');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Recruitment</h1>
                    <p className="text-slate-500 mt-1">Manage job postings and track candidate pipeline.</p>
                </div>
                {isAdminOrHR && (
                    <Button variant="accent" onClick={() => setIsJobModalOpen(true)} className="shadow-lg shadow-accent/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Job Post
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-3 border-slate-100 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-4 bg-slate-50/50">
                        <div>
                            <CardTitle className="text-lg">Active Openings</CardTitle>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 italic">
                                    <th className="px-6 py-4">Job Details</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="4" className="px-6 py-4 h-20 bg-slate-50/20" />
                                        </tr>
                                    ))
                                ) : jobs.map((job) => (
                                    <tr key={job.id}
                                        className={`group hover:bg-slate-50 transition-colors cursor-pointer ${selectedJob?.id === job.id ? 'bg-accent/5' : ''}`}
                                        onClick={() => handleViewCandidates(job)}
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${selectedJob?.id === job.id ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'} transition-all`}>
                                                    <Briefcase className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900">{job.jobTitle}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{job.departmentName || 'General'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {job.location || 'Remote'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <Badge variant={job.status === 'Open' ? 'success' : job.status === 'Closed' ? 'error' : 'warning'}>
                                                {job.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-right flex justify-end gap-2 items-center">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedJob(job); setIsJobDetailsModalOpen(true); }}
                                                className="p-1.5 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {isAdminOrHR && (
                                                job.status === 'Open' ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUpdateJobStatus(job, 'Closed'); }}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Close Job"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUpdateJobStatus(job, 'Open'); }}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                                                        title="Reopen Job"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                    </button>
                                                )
                                            )}
                                            <ArrowRight className={`w-4 h-4 ml-2 transition-transform ${selectedJob?.id === job.id ? 'translate-x-1 text-accent' : 'text-slate-200'}`} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <div className="space-y-6">
                    {selectedJob ? (
                        <Card className="border-accent shadow-lg shadow-accent/5 animate-in slide-in-from-right-4">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-black uppercase text-accent tracking-tighter">Candidate Pipeline</CardTitle>
                                    {isAdminOrHR && (
                                        <Button size="sm" variant="accent" className="h-7 px-2 flex items-center gap-1" onClick={() => setIsApplyModalOpen(true)}>
                                            <UserPlus className="w-3 h-3" /> Add
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 font-bold">{selectedJob.jobTitle}</p>
                            </CardHeader>
                            <CardContent className="p-0 overflow-y-auto max-h-[500px]">
                                {candidates.length === 0 ? (
                                    <div className="p-10 text-center">
                                        <UserPlus className="w-10 h-10 text-slate-100 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No candidates yet</p>
                                    </div>
                                ) : candidates.map(c => (
                                    <div key={c.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500">
                                                    {c.fullName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 cursor-pointer hover:text-accent transition-colors" onClick={() => { setCandidateDetails(c); setIsCandidateDetailsModalOpen(true); }}>{c.fullName}</p>
                                                    <select
                                                        className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 mt-1 outline-none focus:border-accent/50 transition-colors"
                                                        value={c.currentStage}
                                                        onChange={(e) => handleUpdateCandidateStage(c, e.target.value)}
                                                    >
                                                        <option value="Applied">Applied</option>
                                                        <option value="Screening">Screening</option>
                                                        <option value="Interviewing">Interviewing</option>
                                                        <option value="Offered">Offered</option>
                                                        <option value="Hired">Hired</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {c.currentStage === 'Hired' ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                isAdminOrHR && (
                                                    <Button size="sm" variant="accent" className="h-7 px-3 text-[10px] font-black uppercase" onClick={() => openHireModal(c)}>
                                                        Hire
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-slate-100 border-dashed bg-slate-50/50">
                            <CardContent className="p-10 text-center opacity-40">
                                <ArrowRight className="w-10 h-10 mx-auto mb-4 -rotate-45" />
                                <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Select an opening to view candidates</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Modal isOpen={isHireModalOpen} onClose={() => setIsHireModalOpen(false)} title="Onboard Candidate">
                {selectedCandidate && (
                    <form onSubmit={handleHire} className="space-y-4 py-2">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center font-black text-emerald-600">
                                {selectedCandidate.fullName[0]}
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900">{selectedCandidate.fullName}</h4>
                                <p className="text-xs text-slate-500">{selectedCandidate.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                                    <Hash className="w-3 h-3" />
                                    Employee Number
                                </label>
                                <input
                                    type="text" required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none font-mono"
                                    value={hireForm.employeeNumber}
                                    onChange={(e) => setHireForm({ ...hireForm, employeeNumber: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" />
                                    Base Salary
                                </label>
                                <input
                                    type="number" required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                    value={hireForm.baseSalary}
                                    onChange={(e) => setHireForm({ ...hireForm, baseSalary: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                                <Briefcase className="w-3 h-3" />
                                Job Title
                            </label>
                            <input
                                type="text" required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={hireForm.jobTitle}
                                onChange={(e) => setHireForm({ ...hireForm, jobTitle: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
                                <Building className="w-3 h-3" />
                                Department
                            </label>
                            <select
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={hireForm.departmentId}
                                onChange={(e) => setHireForm({ ...hireForm, departmentId: e.target.value })}
                            >
                                <option value="">-- Select Department --</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
                            </select>
                        </div>

                        <Button type="submit" variant="accent" className="w-full mt-6 py-4 font-black shadow-xl shadow-accent/20">
                            Confirm Hiring & Create Employee Account
                        </Button>
                    </form>
                )}
            </Modal>

            <Modal isOpen={isJobModalOpen} onClose={() => setIsJobModalOpen(false)} title="New Job Opening">
                <form onSubmit={handleCreateJob} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Job Title</label>
                        <input
                            type="text" required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                            value={jobForm.jobTitle}
                            onChange={(e) => setJobForm({ ...jobForm, jobTitle: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Department</label>
                            <select
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={jobForm.departmentId}
                                onChange={(e) => setJobForm({ ...jobForm, departmentId: e.target.value })}
                            >
                                <option value="">-- Select --</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Employment Type</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={jobForm.employmentTypeStr}
                                onChange={(e) => setJobForm({ ...jobForm, employmentTypeStr: e.target.value })}
                            >
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Location</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                placeholder="e.g. Cairo, Egypt or Remote"
                                value={jobForm.location}
                                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Closing Date (Optional)</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={jobForm.closingDate}
                                onChange={(e) => setJobForm({ ...jobForm, closingDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Min Salary ($)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={jobForm.salaryRangeMin}
                                onChange={(e) => setJobForm({ ...jobForm, salaryRangeMin: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Max Salary ($)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={jobForm.salaryRangeMax}
                                onChange={(e) => setJobForm({ ...jobForm, salaryRangeMax: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Description</label>
                        <textarea
                            required
                            rows="3"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                            value={jobForm.jobDescription}
                            onChange={(e) => setJobForm({ ...jobForm, jobDescription: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Requirements</label>
                        <textarea
                            rows="3"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                            placeholder="List of skills or requirements..."
                            value={jobForm.requirements}
                            onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                        />
                    </div>
                    <Button type="submit" variant="accent" className="w-full mt-4 py-4 font-black">
                        Post Job Opening
                    </Button>
                </form>
            </Modal>

            {/* Job Details Modal */}
            <Modal isOpen={isJobDetailsModalOpen} onClose={() => setIsJobDetailsModalOpen(false)} title="Job Posting Details">
                {selectedJob && (
                    <div className="space-y-6 py-2">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">{selectedJob.jobTitle}</h3>
                            <div className="flex items-center gap-3 mt-2 text-xs font-bold text-slate-500">
                                <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {selectedJob.departmentName || 'General'}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selectedJob.location || 'Remote'}</span>
                                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {selectedJob.employmentTypeStr}</span>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 whitespace-pre-wrap">
                                {selectedJob.jobDescription || 'No description provided.'}
                            </div>
                        </div>

                        {selectedJob.requirements && (
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Requirements</h4>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 whitespace-pre-wrap">
                                    {selectedJob.requirements}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-black uppercase text-slate-400">Salary Range</span>
                                <p className="text-sm font-bold text-slate-900 mt-1">
                                    {selectedJob.salaryRangeMin && selectedJob.salaryRangeMax
                                        ? `$${selectedJob.salaryRangeMin} - $${selectedJob.salaryRangeMax}`
                                        : 'Not specified'}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="text-[10px] font-black uppercase text-slate-400">Status</span>
                                <div className="mt-1">
                                    <Badge variant={selectedJob.status === 'Open' ? 'success' : selectedJob.status === 'Closed' ? 'error' : 'warning'}>
                                        {selectedJob.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Candidate Details Modal */}
            <Modal isOpen={isCandidateDetailsModalOpen} onClose={() => setIsCandidateDetailsModalOpen(false)} title="Candidate Details">
                {candidateDetails && (
                    <div className="space-y-6 py-2">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center font-black text-slate-600 text-xl">
                                {candidateDetails.fullName[0]}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-900">{candidateDetails.fullName}</h4>
                                <Badge variant="accent" className="mt-1">{candidateDetails.currentStage}</Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Mail className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                                    <a href={`mailto:${candidateDetails.email}`} className="text-xs font-semibold text-slate-700 hover:text-accent truncate block max-w-[150px]">{candidateDetails.email}</a>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><Phone className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                                    <p className="text-xs font-semibold text-slate-700 truncate">{candidateDetails.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><Calendar className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Applied On</p>
                                    <p className="text-xs font-semibold text-slate-700">{new Date(candidateDetails.applicationDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-lg"><FileText className="w-4 h-4" /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Resume</p>
                                    {candidateDetails.resumeUrl ? (
                                        <a href={candidateDetails.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent hover:underline">View Resume</a>
                                    ) : (
                                        <p className="text-xs font-semibold text-slate-400">Not provided</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                                    HR Evaluation
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <Star
                                                key={star}
                                                className={`w-5 h-5 cursor-pointer transition-colors ${candidateDetails.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-200'}`}
                                                onClick={() => setCandidateDetails({ ...candidateDetails, rating: star })}
                                            />
                                        ))}
                                    </div>
                                </h4>
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Notes & Internal Comments</h4>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none min-h-[100px]"
                                    placeholder="Add interview notes or evaluation comments here..."
                                    value={candidateDetails.notes || ''}
                                    onChange={(e) => setCandidateDetails({ ...candidateDetails, notes: e.target.value })}
                                />
                            </div>
                            <Button variant="accent" className="w-full" onClick={handleSaveCandidateNotes}>Save Evaluation</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Manually Add Candidate Modal */}
            <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title="Manually Add Candidate">
                <form onSubmit={handleApply} className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">First Name</label>
                            <input
                                type="text" required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={applyForm.firstName}
                                onChange={(e) => setApplyForm({ ...applyForm, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Last Name</label>
                            <input
                                type="text" required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={applyForm.lastName}
                                onChange={(e) => setApplyForm({ ...applyForm, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Email</label>
                            <input
                                type="email" required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={applyForm.email}
                                onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Phone</label>
                            <input
                                type="tel"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={applyForm.phone}
                                onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Resume URL (Optional)</label>
                        <input
                            type="url"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                            placeholder="https://..."
                            value={applyForm.resumeUrl}
                            onChange={(e) => setApplyForm({ ...applyForm, resumeUrl: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-tighter">Cover Letter / Notes</label>
                        <textarea
                            rows="4"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                            value={applyForm.coverLetter}
                            onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
                        />
                    </div>
                    <Button type="submit" variant="accent" className="w-full mt-4 py-4 font-black">
                        Submit Application
                    </Button>
                </form>
            </Modal>

            {/* Generated Activation Link Modal */}
            <Modal isOpen={!!activationLinkInfo} onClose={() => setActivationLinkInfo(null)} title="Employee Hired Successfully!">
                {activationLinkInfo && (
                    <div className="space-y-6 py-4 text-center">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">{activationLinkInfo.name} is now hired!</h3>
                            <p className="text-sm text-slate-500">Please send them the following secure activation link so they can set up their password and log in.</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                            <div className="truncate text-sm font-mono text-slate-600 select-all">
                                {activationLinkInfo.url}
                            </div>
                            <Button variant="accent" onClick={copyToClipboard} className="shrink-0 flex items-center gap-2">
                                <Copy className="w-4 h-4" /> Copy
                            </Button>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setActivationLinkInfo(null)}>
                            Done
                        </Button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default RecruitmentPage;
