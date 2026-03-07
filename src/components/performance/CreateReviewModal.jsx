import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Loader2 } from 'lucide-react';
import EmployeeService from '../../api/services/employeeService';
import PerformanceService from '../../api/services/performanceService';
import toast from 'react-hot-toast';

const CreateReviewModal = ({ isOpen, onClose, onSuccess, currentUserId }) => {
    const [employees, setEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        employeeId: '',
        reviewerId: currentUserId || '',
        reviewPeriodStart: '',
        reviewPeriodEnd: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen]);

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const data = await EmployeeService.getAll();
            setEmployees(data);
        } catch (error) {
            toast.error("Failed to load employees");
        } finally {
            setLoadingEmployees(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            // Basic validation
            if (!formData.employeeId || !formData.reviewerId || !formData.reviewPeriodStart || !formData.reviewPeriodEnd) {
                toast.error("Please fill in all fields");
                return;
            }

            await PerformanceService.createCycle({
                employeeId: formData.employeeId,
                reviewerId: formData.reviewerId,
                reviewPeriodStart: new Date(formData.reviewPeriodStart).toISOString(),
                reviewPeriodEnd: new Date(formData.reviewPeriodEnd).toISOString()
            });

            toast.success("Review cycle started successfully");
            onSuccess();
            onClose();

            // Reset form
            setFormData(prev => ({ ...prev, employeeId: '', reviewPeriodStart: '', reviewPeriodEnd: '' }));
        } catch (error) {
            toast.error(error.response?.data || "Failed to start review cycle");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Start Review Cycle">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Employee</label>
                    <select
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        disabled={loadingEmployees}
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                        required
                    >
                        <option value="">Select an employee...</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName} ({emp.departmentName || 'No Dept'})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Reviewer (You)</label>
                    <select
                        name="reviewerId"
                        value={formData.reviewerId}
                        onChange={handleChange}
                        disabled={loadingEmployees} // Reviewer is usually the current manager creating it
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
                        required
                    >
                        <option value="">Select a reviewer...</option>
                        {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.firstName} {emp.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Period Start"
                        type="date"
                        name="reviewPeriodStart"
                        value={formData.reviewPeriodStart}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Period End"
                        type="date"
                        name="reviewPeriodEnd"
                        value={formData.reviewPeriodEnd}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="accent" disabled={submitting}>
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Start Cycle
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateReviewModal;
