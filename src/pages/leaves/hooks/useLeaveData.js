import { useState, useEffect, useCallback, useMemo } from 'react';
import LeaveService from '../../../api/services/leaveService';
import EmployeeService from '../../../api/services/employeeService';
import { toast } from 'react-hot-toast';
import { format, eachDayOfInterval } from 'date-fns';

export const useLeaveData = (user, isAdmin, canApprove, viewMode, currentYear) => {
    const employeeId = user?.employeeId || user?.id;

    const [requests, setRequests] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [balances, setBalances] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [hrRequests, setHrRequests] = useState([]);

    const fetchData = useCallback(async () => {
        if (!employeeId) return;
        setIsLoading(true);
        try {
            // Fetch dynamic leave types
            const rawTypes = await LeaveService.getLeaveTypes();
            const types = (rawTypes || []).map(t => ({
                id: t.id || t.Id,
                name: t.name || t.Name,
                nameAr: t.nameAr || t.NameAr,
                code: t.code || t.Code,
                requiresDocumentation: t.requiresDocumentation || t.RequiresDocumentation || false,
                genderRestriction: t.genderRestriction || t.GenderRestriction || null
            }));
            setLeaveTypes(types);

            // Fetch leave history
            const rawHistory = await LeaveService.getHistory(employeeId);
            const normalizedHistory = (rawHistory || []).map(r => ({
                id: r.id || r.Id,
                employeeName: r.employeeName || r.EmployeeName,
                leaveTypeName: r.leaveTypeName || r.LeaveTypeName,
                leaveTypeCode: r.leaveTypeCode || r.LeaveTypeCode,
                startDate: r.startDate || r.StartDate,
                endDate: r.endDate || r.EndDate,
                workingDays: r.workingDays || r.WorkingDays,
                status: r.status || r.Status,
                approverName: r.approverName || r.ApproverName,
                approvalComments: r.approvalComments || r.ApprovalComments,
                reason: r.reason || r.Reason,
                attachmentUrl: r.attachmentUrl || r.AttachmentUrl,
                isHalfDay: r.isHalfDay || r.IsHalfDay,
            }));
            setRequests(normalizedHistory);

            // Fetch balances
            const balancePromises = types.map(type =>
                LeaveService.getBalance(employeeId, type.id, currentYear)
                    .then(bal => ({
                        ...bal,
                        typeName: type.name,
                        typeNameAr: type.nameAr,
                        code: type.code,
                        remainingDays: bal.remainingDays ?? bal.RemainingDays ?? 0,
                        totalEntitledDays: bal.totalEntitledDays ?? bal.TotalEntitledDays ?? 0,
                        usedDays: bal.usedDays ?? bal.UsedDays ?? 0
                    }))
                    .catch(() => ({
                        typeName: type.name,
                        typeNameAr: type.nameAr,
                        code: type.code,
                        totalEntitledDays: 0,
                        usedDays: 0,
                        remainingDays: 0
                    }))
            );
            const balanceResults = await Promise.all(balancePromises);
            setBalances(balanceResults);

            // Fetch pending requests for Manager/Admin
            if (canApprove) {
                try {
                    const isHR = user?.roles?.some(r => r === 'Admin' || r === 'HRManager' || r === 'HR');
                    const rawPending = isHR
                        ? await LeaveService.getPending()
                        : await LeaveService.getMyPending();

                    const normalizedPending = (rawPending || []).map(r => ({
                        id: r.id || r.Id,
                        employeeName: r.employeeName || r.EmployeeName,
                        leaveTypeName: r.leaveTypeName || r.LeaveTypeName,
                        leaveTypeCode: r.leaveTypeCode || r.LeaveTypeCode,
                        startDate: r.startDate || r.StartDate,
                        endDate: r.endDate || r.EndDate,
                        workingDays: r.workingDays || r.WorkingDays,
                        status: r.status || r.Status,
                        reason: r.reason || r.Reason
                    }));
                    setPendingRequests(normalizedPending);
                } catch (err) {
                    console.error('Failed to fetch pending requests', err);
                    setPendingRequests([]);
                }
            }

            // Fetch Organization leaves if Admin
            if (isAdmin && viewMode === 'organization') {
               try {
                   const orgLeavesResponse = await LeaveService.getAll({ page: 1, pageSize: 200 });
                   const normalizedOrgHistory = (orgLeavesResponse?.items || []).map(r => ({
                        id: r.id || r.Id,
                        employeeName: r.employeeName || r.EmployeeName,
                        leaveTypeName: r.leaveTypeName || r.LeaveTypeName,
                        leaveTypeCode: r.leaveTypeCode || r.LeaveTypeCode,
                        startDate: r.startDate || r.StartDate,
                        endDate: r.endDate || r.EndDate,
                        workingDays: r.workingDays || r.WorkingDays,
                        status: r.status || r.Status,
                        approverName: r.approverName || r.ApproverName,
                        approvalComments: r.approvalComments || r.ApprovalComments,
                        reason: r.reason || r.Reason,
                        attachmentUrl: r.attachmentUrl || r.AttachmentUrl,
                        isHalfDay: r.isHalfDay || r.IsHalfDay,
                    }));
                    setHrRequests(normalizedOrgHistory);
               } catch(err) {
                   console.error('Failed to fetch org leaves', err);
               }
            }

            // Fetch all employees for HR actions
            if (isAdmin) {
                try {
                    const allEmployees = await EmployeeService.getAll();
                    setEmployees(allEmployees);
                } catch (err) {
                    console.error('Failed to fetch employees', err);
                }
            }
        } catch (err) {
            console.error('Failed to fetch leave data', err);
            const msg = err.response?.data;
            toast.error(typeof msg === 'string' ? msg : 'Failed to load leave configuration');
        } finally {
            setIsLoading(false);
        }
    }, [employeeId, isAdmin, canApprove, currentYear, user?.roles, viewMode]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const calendarEvents = useMemo(() => {
        const events = {};
        requests.forEach(req => {
            if (req.status === 'Approved' || req.status === 'Pending') {
                try {
                    const interval = eachDayOfInterval({
                        start: new Date(req.startDate),
                        end: new Date(req.endDate)
                    });
                    interval.forEach(date => {
                        const key = format(date, 'yyyy-MM-dd');
                        events[key] = {
                            status: req.status,
                            type: req.leaveTypeName,
                            code: req.leaveTypeCode
                        };
                    });
                } catch (e) {
                    console.error('Error calculating calendar interval', e);
                }
            }
        });
        return events;
    }, [requests]);

    return {
        requests,
        pendingRequests,
        leaveTypes,
        balances,
        isLoading,
        employees,
        hrRequests,
        calendarEvents,
        fetchData
    };
};
