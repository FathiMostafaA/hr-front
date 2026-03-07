import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign, Clock, Building, ArrowRight, User, Mail, Phone, FileText } from 'lucide-react';
import RecruitmentService from '../../api/services/recruitmentService';
import { toast } from 'react-hot-toast';

const CareersPage = () => {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [applyForm, setApplyForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        resumeUrl: '',
        coverLetter: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        setIsLoading(true);
        try {
            // Only fetch Open jobs for the public careers page
            const data = await RecruitmentService.getJobs('Open');
            setJobs(data);
        } catch (error) {
            toast.error('Failed to load active job postings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyClick = (job) => {
        setSelectedJob(job);
        setSubmissionSuccess(false);
        setApplyForm({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            resumeUrl: '',
            coverLetter: ''
        });
        // Scroll to form if needed
        setTimeout(() => {
            document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSubmitApplication = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await RecruitmentService.apply({ ...applyForm, jobPostingId: selectedJob.id });
            setSubmissionSuccess(true);
            toast.success('Your application has been submitted successfully!');
        } catch (error) {
            toast.error(error?.response?.data || 'Failed to submit application. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header / Hero */}
            <div className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Join Our Team</h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Discover your next career opportunity and help us build the future. We're looking for passionate people to join our mission.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm text-sm font-bold text-white uppercase tracking-widest shadow-xl">
                        <Briefcase className="w-4 h-4 text-emerald-400" />
                        {jobs.length} Open Positions
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 -mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Jobs List */}
                    <div className="lg:col-span-5 space-y-4">
                        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <span className="w-8 h-1 bg-accent rounded-full inline-block"></span>
                            Latest Openings
                        </h2>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-40 bg-white rounded-2xl animate-pulse shadow-sm border border-slate-100" />
                                ))}
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="bg-white p-10 rounded-3xl text-center border border-slate-100 shadow-sm">
                                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold">No open positions at the moment.</p>
                                <p className="text-sm text-slate-400 mt-2">Check back later for new opportunities.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobs.map(job => (
                                    <div
                                        key={job.id}
                                        className={`bg-white p-6 rounded-2xl border transition-all cursor-pointer group ${selectedJob?.id === job.id
                                                ? 'border-accent shadow-lg shadow-accent/10 ring-2 ring-accent/20'
                                                : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
                                            }`}
                                        onClick={() => handleApplyClick(job)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 group-hover:text-accent transition-colors">{job.jobTitle}</h3>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{job.departmentName || 'General'}</p>
                                            </div>
                                            <div className={`p-2 rounded-xl transition-colors ${selectedJob?.id === job.id ? 'bg-accent text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                                <ArrowRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" /> {job.employmentTypeStr}
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location || 'Remote'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Job Details & Application Form */}
                    <div className="lg:col-span-7" id="application-form">
                        {selectedJob ? (
                            <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-xl shadow-slate-200/40 animate-in slide-in-from-right-8 duration-500">

                                <div className="mb-8 border-b border-slate-100 pb-8">
                                    <h2 className="text-3xl font-black text-slate-900 leading-tight mb-4">{selectedJob.jobTitle}</h2>

                                    <div className="flex flex-wrap gap-4 mb-8">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Building className="w-4 h-4" /></div>
                                            {selectedJob.departmentName || 'General'}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500"><MapPin className="w-4 h-4" /></div>
                                            {selectedJob.location || 'Remote'}
                                        </div>
                                        {selectedJob.salaryRangeMin && (
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-500"><DollarSign className="w-4 h-4" /></div>
                                                ${selectedJob.salaryRangeMin} - ${selectedJob.salaryRangeMax}
                                            </div>
                                        )}
                                    </div>

                                    {selectedJob.jobDescription && (
                                        <div className="mb-6">
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-accent"></span> About The Role
                                            </h4>
                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedJob.jobDescription}</p>
                                        </div>
                                    )}

                                    {selectedJob.requirements && (
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-accent"></span> Requirements
                                            </h4>
                                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{selectedJob.requirements}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Application Form */}
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 mb-6">Apply for this position</h3>

                                    {submissionSuccess ? (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-in zoom-in-95 duration-500">
                                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <h4 className="text-xl font-black text-emerald-900 mb-2">Application Received!</h4>
                                            <p className="text-emerald-700 text-sm">Thank you for applying to {selectedJob.jobTitle}. Our hiring team will review your application and get back to you soon.</p>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmitApplication} className="space-y-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><User className="w-3.5 h-3.5" /> First Name *</label>
                                                    <input
                                                        type="text" required
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-shadow"
                                                        value={applyForm.firstName} onChange={e => setApplyForm({ ...applyForm, firstName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><User className="w-3.5 h-3.5" /> Last Name *</label>
                                                    <input
                                                        type="text" required
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-shadow"
                                                        value={applyForm.lastName} onChange={e => setApplyForm({ ...applyForm, lastName: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email Address *</label>
                                                    <input
                                                        type="email" required
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-shadow"
                                                        value={applyForm.email} onChange={e => setApplyForm({ ...applyForm, email: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-shadow"
                                                        value={applyForm.phone} onChange={e => setApplyForm({ ...applyForm, phone: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Portfolio / LinkedIn / Resume URL</label>
                                                <input
                                                    type="url" placeholder="https://..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-shadow"
                                                    value={applyForm.resumeUrl} onChange={e => setApplyForm({ ...applyForm, resumeUrl: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Cover Letter (Optional)</label>
                                                <textarea
                                                    rows="4" placeholder="Tell us why you're a great fit..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-shadow resize-none"
                                                    value={applyForm.coverLetter} onChange={e => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
                                                ></textarea>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-accent hover:bg-accent/90 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-xl shadow-accent/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                ) : (
                                                    <span>Submit Application</span>
                                                )}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-100/50 rounded-3xl p-10 flex flex-col items-center justify-center h-full min-h-[400px] border border-slate-200/50 border-dashed text-center">
                                <FileText className="w-16 h-16 text-slate-300 mb-6" />
                                <h3 className="text-xl font-black text-slate-600 mb-2">Select a Position</h3>
                                <p className="text-slate-400 max-w-sm">Choose an opening from the list to view its details and submit your application.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CareersPage;
