import { useState } from 'react';
import LeaveService from '../../../api/services/leaveService';
import documentService from '../../../api/services/documentService';
import { toast } from 'react-hot-toast';

export const useLeaveActions = (fetchData, employeeId, isAdmin) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (form, setForm, leaveTypes, setShowModal) => {
        const selectedType = leaveTypes.find(t => t.id === form.leaveTypeId);
        
        if (!form.startDate || (!form.endDate && !form.isHalfDay)) {
            toast.error('Please select start and end dates');
            return;
        }

        const effectiveEndDate = form.isHalfDay ? form.startDate : form.endDate;
        if (new Date(effectiveEndDate) < new Date(form.startDate)) {
            toast.error('End date must be after start date');
            return;
        }

        if (selectedType?.requiresDocumentation && !form.attachment) {
            toast.error('This leave type requires supporting documentation.');
            return;
        }

        setIsSubmitting(true);
        try {
            const finalEmployeeId = isAdmin ? form.employeeId || employeeId : employeeId;
            let attachmentUrl = null;

            if (form.attachment) {
                const docRes = await documentService.uploadDocument(
                    finalEmployeeId, 
                    form.attachment, 
                    form.attachment.name, 
                    'Leave Attachment', 
                    null, 
                    false
                );
                attachmentUrl = docRes.fileUrl || docRes.FileUrl;
            }

            const payload = {
                employeeId: finalEmployeeId,
                leaveTypeId: form.leaveTypeId,
                startDate: form.startDate,
                endDate: effectiveEndDate,
                reason: form.reason || '',
                isHalfDay: form.isHalfDay,
                halfDayPeriod: form.isHalfDay ? form.halfDayPeriod : null,
                attachmentUrl: attachmentUrl
            };

            await LeaveService.request(payload);
            toast.success('Leave request submitted successfully! ✅');
            setShowModal(false);
            setForm({ startDate: '', endDate: '', reason: '', employeeId: '', isHalfDay: false, attachment: null });
            fetchData();
        } catch (err) {
            const msg = err.response?.data;
            toast.error(typeof msg === 'string' ? msg : 'Failed to submit leave request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async (id, approvalComment, setShowApprovalModal, setApprovalComment) => {
        setIsSubmitting(true);
        try {
            await LeaveService.approve(id, approvalComment);
            toast.success('Leave request approved ✅');
            setShowApprovalModal(null);
            setApprovalComment('');
            fetchData();
        } catch {
            toast.error('Failed to approve leave request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (id, approvalComment, setShowApprovalModal, setApprovalComment) => {
        setIsSubmitting(true);
        try {
            await LeaveService.reject(id, approvalComment);
            toast.success('Leave request rejected');
            setShowApprovalModal(null);
            setApprovalComment('');
            fetchData();
        } catch {
            toast.error('Failed to reject leave request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this leave request?')) return;

        setIsSubmitting(true);
        try {
            await LeaveService.cancel(id);
            toast.success('Leave request cancelled successfully');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || 'Failed to cancel leave request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleHRCancel = async (id) => {
        const reason = window.prompt("Enter reason for cancelling this leave on behalf of the employee:");
        if (reason === null) return;

        setIsSubmitting(true);
        try {
            await LeaveService.hrCancel(id, { reason });
            toast.success('Leave cancelled by HR successfully');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || 'Failed to cancel leave by HR');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBulkInit = async (e, setShowBulkInitModal) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            year: parseInt(formData.get('year')),
            defaultEntitledDays: parseInt(formData.get('defaultDays'))
        };
        setIsSubmitting(true);
        try {
            await LeaveService.bulkInitializeBalances(data);
            toast.success(`Bulk initialization for year ${data.year} completed.`);
            setShowBulkInitModal(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || 'Failed bulk init');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCarryForward = async (e, setShowCarryForwardModal) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            fromYear: parseInt(formData.get('fromYear')),
            toYear: parseInt(formData.get('toYear'))
        };
        setIsSubmitting(true);
        try {
            await LeaveService.carryForwardBalances(data);
            toast.success(`Carried forward balances to ${data.toYear} successfully.`);
            setShowCarryForwardModal(false);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data || 'Carry forward failed');
        } finally {
             setIsSubmitting(false);
        }
    };

    const handleManualInit = async (manualForm, setShowManualModal) => {
        if (!manualForm.employeeId || !manualForm.leaveTypeId) {
            toast.error('Please select an employee and leave type');
            return;
        }

        setIsSubmitting(true);
        try {
            await LeaveService.initializeBalance({
                employeeId: manualForm.employeeId,
                leaveTypeId: manualForm.leaveTypeId,
                year: parseInt(manualForm.year),
                totalDays: parseFloat(manualForm.totalDays)
            });
            toast.success('Balance updated successfully! ✅');
            setShowManualModal(false);
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data;
            toast.error(typeof msg === 'string' ? msg : 'Failed to update balance');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        isSubmitting,
        handleSubmit,
        handleApprove,
        handleReject,
        handleCancel,
        handleHRCancel,
        handleBulkInit,
        handleCarryForward,
        handleManualInit
    };
};
