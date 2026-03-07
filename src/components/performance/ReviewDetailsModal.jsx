import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Loader2, Star, CheckCircle } from 'lucide-react';
import PerformanceService from '../../api/services/performanceService';
import toast from 'react-hot-toast';

const ReviewDetailsModal = ({ isOpen, onClose, review, onSuccess, currentUserId, isManagerOrAdmin }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        overallRating: '',
        goals: '',
        achievements: '',
        areasForImprovement: '',
        comments: '',
        status: ''
    });

    useEffect(() => {
        if (review && isOpen) {
            setFormData({
                overallRating: review.overallRating || '',
                goals: review.goals || '',
                achievements: review.achievements || '',
                areasForImprovement: review.areasForImprovement || '',
                comments: review.comments || '',
                status: review.status || 'Draft'
            });
        }
    }, [review, isOpen]);

    if (!review) return null;

    const isEmployee = currentUserId === review.employeeId;
    const isReviewer = currentUserId === review.reviewerId || isManagerOrAdmin;
    const canEdit = isReviewer && review.status !== 'Acknowledged';
    const canAcknowledge = isEmployee && review.status === 'Completed';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await PerformanceService.updateReview(review.id, {
                ...formData,
                overallRating: formData.overallRating ? parseInt(formData.overallRating) : null
            });
            toast.success("Review updated successfully");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to update review");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAcknowledge = async () => {
        try {
            setSubmitting(true);
            await PerformanceService.acknowledge(review.id);
            toast.success("Review acknowledged");
            onSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to acknowledge review");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Performance Review: ${review.employeeName}`}>
            <div className="space-y-6">
                {/* Info Header */}
                <div className="bg-slate-50 p-4 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Reviewer</p>
                        <p className="font-bold text-slate-900">{review.reviewerName}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Period</p>
                        <p className="font-bold text-slate-900">
                            {new Date(review.reviewPeriodStart).toLocaleDateString()} - {new Date(review.reviewPeriodEnd).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Status</p>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${review.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                review.status === 'Acknowledged' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-200 text-slate-700'
                            }`}>
                            {review.status}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Overall Rating (1-5)</label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                name="overallRating"
                                value={formData.overallRating}
                                onChange={handleChange}
                                disabled={!canEdit}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={!canEdit}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Completed">Completed (Ready for Employee)</option>
                                {review.status === 'Acknowledged' && <option value="Acknowledged">Acknowledged</option>}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Goals</label>
                        <textarea
                            name="goals"
                            value={formData.goals}
                            onChange={handleChange}
                            disabled={!canEdit}
                            rows="2"
                            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Achievements</label>
                        <textarea
                            name="achievements"
                            value={formData.achievements}
                            onChange={handleChange}
                            disabled={!canEdit}
                            rows="2"
                            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Areas For Improvement</label>
                        <textarea
                            name="areasForImprovement"
                            value={formData.areasForImprovement}
                            onChange={handleChange}
                            disabled={!canEdit}
                            rows="2"
                            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                            Close
                        </Button>

                        {canEdit && (
                            <Button type="submit" variant="primary" disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Save Changes
                            </Button>
                        )}

                        {canAcknowledge && (
                            <Button
                                type="button"
                                variant="success"
                                onClick={handleAcknowledge}
                                disabled={submitting}
                            >
                                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                Acknowledge Review
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ReviewDetailsModal;
