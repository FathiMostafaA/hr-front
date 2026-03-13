/**
 * Unified RBAC policy source.
 * Used by both navigation (MainLayout sidebar filtering) and route guards (App.jsx).
 * Ensures that what the user sees in the nav = what they can access via routes.
 */

export const RBAC_ROUTES = {
    '/dashboard':    ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'],
    '/employees':    ['Admin', 'HRManager', 'HR'],
    '/org-chart':    ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'],
    '/departments':  ['Admin', 'HRManager', 'HR'],
    '/attendance':   ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'],
    '/leaves':       ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'],
    '/payroll':      ['Admin', 'HRManager', 'HR'],
    '/my-payroll':   ['Employee'],
    '/recruitment':  ['Admin', 'HRManager', 'HR'],
    '/performance':  ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'],
    '/documents':    ['Admin', 'HRManager', 'HR', 'Employee'],
    '/training':     ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'],
    '/sanctions':    ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'],
    '/feed':         ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'],
    '/reports':      ['Admin', 'HRManager', 'HR'],
    '/settings':     ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'],
    '/users':        ['Admin'],
    '/audit':        ['Admin'],
};

/**
 * HR roles that see the full Payroll page (vs My Payroll for employees).
 */
export const HR_PAYROLL_ROLES = ['Admin', 'HRManager', 'HR'];

/**
 * Check if a user has access to a specific route.
 */
export const hasRouteAccess = (pathname, userRoles) => {
    const allowedRoles = RBAC_ROUTES[pathname];
    if (!allowedRoles) return true; // Non-restricted routes
    return allowedRoles.some(role => userRoles.includes(role));
};

/**
 * Determines the correct payroll path for a user.
 */
export const getPayrollPath = (userRoles) => {
    return HR_PAYROLL_ROLES.some(r => userRoles.includes(r)) ? '/payroll' : '/my-payroll';
};
