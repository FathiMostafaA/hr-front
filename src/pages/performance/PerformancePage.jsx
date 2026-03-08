import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Star,
    Award,
    MessageSquare,
    Clock,
    ChevronRight,
    Search,
    UserCircle2,
    Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import PerformanceService from '../../api/services/performanceService';
import toast from 'react-hot-toast';
import CreateReviewModal from '../../components/performance/CreateReviewModal';
import ReviewDetailsModal from '../../components/performance/ReviewDetailsModal';

const PerformancePage = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);

    const isManagerOrAdmin = user?.roles?.some(r => ['Admin', 'HRManager', 'HR', 'Manager'].includes(r));

    const fetchReviews = async () => {
        try {
            setLoading(true);
            let data = [];
            if (user?.roles?.some(r => ['Admin', 'HRManager', 'HR'].includes(r))) {
                data = await PerformanceService.getAllReviews();
            } else if (user?.roles?.includes('Manager')) {
                const pending = await PerformanceService.getPendingReviews(user.id);
                const history = await PerformanceService.getEmployeeHistory(user.id);
                // Manager sees both their pending reviews to do, and their own history
                data = [...pending, ...history];
            } else {
                data = await PerformanceService.getEmployeeHistory(user.id);
            }
            setReviews(data);
        } catch (error) {
            console.error("Failed to fetch performance reviews", error);
            toast.error("Failed to load performance reviews");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchReviews();
        }
    }, [user]);

    // Derived metrics
    const ratedReviews = reviews.filter(r => r.overallRating != null);
    const avgRating = ratedReviews.length > 0
        ? (ratedReviews.reduce((sum, r) => sum + r.overallRating, 0) / ratedReviews.length).toFixed(1)
        : '0.0';

    const pendingCount = reviews.filter(r => r.status === 'Draft' || r.status === 'In Progress').length;

    const getStatusVariant = (status) => {
        switch (status) {
            case 'Completed': return 'success';
            case 'Acknowledged': return 'accent'; // or whatever distinct style
            case 'Draft': return 'outline';
            default: return 'warning';
        }
    };

    if (loading && reviews.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Performance Reviews</h1>
                    <p className="text-slate-500 mt-1">Track employee growth, feedback, and career cycles.</p>
                </div>
                {isManagerOrAdmin && (
                    <Button variant="accent" onClick={() => setIsCreateModalOpen(true)}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Start Review Cycle
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-100">
                    <CardContent className="p-6">
                        <Award className="w-8 h-8 mb-4 opacity-50" />
                        <h4 className="text-sm font-bold opacity-80 uppercase tracking-widest">Avg. Rating</h4>
                        <div className="text-4xl font-black mt-1">{avgRating}<span className="text-lg opacity-60">/5.0</span></div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-6">
                        <Clock className="w-8 h-8 mb-4 text-amber-500" />
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pending Reviews</h4>
                        <div className="text-4xl font-black mt-1 text-slate-900">{pendingCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{isManagerOrAdmin ? 'Department Reviews' : 'My Reviews'}</CardTitle>
                        <CardDescription>Track the latest feedback cycles</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Review Period</th>
                                    <th className="px-6 py-4 text-center">Rating</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reviews.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                            No performance reviews found.
                                        </td>
                                    </tr>
                                ) : (
                                    reviews.map((rev) => (
                                        <tr key={rev.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                        <UserCircle2 className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{rev.employeeName}</p>
                                                        <p className="text-xs text-slate-500">Reviewer: {rev.reviewerName}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                                                {new Date(rev.reviewPeriodStart).toLocaleDateString()} - {new Date(rev.reviewPeriodEnd).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {rev.overallRating ? (
                                                    <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs ring-1 ring-amber-200">
                                                        <Star className="w-3.5 h-3.5 fill-current" />
                                                        {rev.overallRating}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Not rated</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <Badge variant={getStatusVariant(rev.status)}>
                                                    {rev.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedReview(rev)}>
                                                    Open Report
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <CreateReviewModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchReviews}
                currentUserId={user?.id}
            />

            <ReviewDetailsModal
                isOpen={!!selectedReview}
                onClose={() => setSelectedReview(null)}
                review={selectedReview}
                onSuccess={fetchReviews}
                currentUserId={user?.id}
                isManagerOrAdmin={isManagerOrAdmin}
            />
        </div>
    );
};

export default PerformancePage;
