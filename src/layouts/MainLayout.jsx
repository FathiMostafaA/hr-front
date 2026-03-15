import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import EmployeeService from '../api/services/employeeService';
import {
    LayoutDashboard,
    Users,
    Building2,
    Clock,
    CalendarDays,
    Wallet,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    ChevronRight,
    Briefcase,
    TrendingUp,
    FileText,
    Newspaper,
    GraduationCap,
    ShieldAlert,
    History,
    BarChart3,
    Calendar
} from 'lucide-react';
import { useNotification, NotificationProvider } from '../context/NotificationContext';
import { PresenceProvider } from '../context/PresenceContext';
import NotificationDropdown from '../components/ui/NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';
import { getRoleDisplayName } from '../config/roleDisplayMap';
import Button from '../components/ui/Button';

const SidebarItem = ({ icon: Icon, label, href, active, collapsed }) => (
    <Link
        to={href}
        className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
            active
                ? "bg-accent/10 text-accent font-semibold"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
        )}
    >
        <Icon className={cn("w-5 h-5 min-w-[20px]", active ? "text-accent" : "group-hover:text-white")} />
        {!collapsed && <span className="text-sm truncate">{label}</span>}

        {collapsed && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                {label}
            </div>
        )}

        {active && !collapsed && <ChevronRight className="ml-auto w-4 h-4" />}
    </Link>
);

const MainLayoutContent = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const { user, logout } = useAuth();
    const { unreadCount } = useNotification();
    const location = useLocation();
    const navigate = useNavigate();

    const userRoles = useMemo(() => user?.roles || [], [user]);

    // RBAC: Define allowed roles for each route
    const allNavItems = useMemo(() => [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'] },
        { icon: CalendarDays, label: 'Company Calendar', href: '/company-calendar', roles: ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'] },
        { icon: Users, label: 'Employees', href: '/employees', roles: ['Admin', 'HRManager', 'HR'] },
        { icon: TrendingUp, label: 'Org Chart', href: '/org-chart', roles: ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'] },
        { icon: Building2, label: 'Departments', href: '/departments', roles: ['Admin', 'HRManager', 'HR'] },
        { icon: Clock, label: 'Attendance', href: '/attendance', roles: ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'] },
        { icon: CalendarDays, label: 'Leaves', href: '/leaves', roles: ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'] },
        {
            icon: Wallet,
            label: 'Payroll',
            href: userRoles.some(r => ['Admin', 'HRManager', 'HR'].includes(r)) ? '/payroll' : '/my-payroll',
            roles: ['Admin', 'HRManager', 'HR', 'Employee']
        },
        { icon: Briefcase, label: 'Recruitment', href: '/recruitment', roles: ['Admin', 'HRManager', 'HR'] },
        { icon: TrendingUp, label: 'Performance', href: '/performance', roles: ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'] },
        { icon: FileText, label: 'Documents', href: '/documents', roles: ['Admin', 'HRManager', 'HR', 'Employee'] },
        { icon: GraduationCap, label: 'Training', href: '/training', roles: ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'] },
        { icon: ShieldAlert, label: 'Sanctions', href: '/sanctions', roles: ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'] },
        { icon: Newspaper, label: 'Company Feed', href: '/feed', roles: ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'] },
        { icon: Users, label: 'User Accounts', href: '/users', roles: ['Admin'] },
        { icon: BarChart3, label: 'Reports', href: '/reports', roles: ['Admin', 'HRManager', 'HR'] },
        { icon: Calendar, label: 'Holidays', href: '/holidays', roles: ['Admin', 'HRManager', 'HR'] },
        { icon: History, label: 'Audit Logs', href: '/audit', roles: ['Admin'] },
        { icon: Settings, label: 'Settings', href: '/settings', roles: ['Admin', 'HRManager', 'HR', 'Manager', 'Employee'] },
    ], [userRoles]);
    const navItems = useMemo(() => allNavItems.filter(item =>
        item.roles.some(role => userRoles.includes(role))
    ), [allNavItems, userRoles]);

    // Search functionality
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();

        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim().length === 0) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }
            
            setIsSearching(true);
            try {
                // 1. Search Navigation
                const matchingNavs = navItems.filter(item =>
                    item.label.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(item => ({
                    type: 'page',
                    id: item.href,
                    title: item.label,
                    subtitle: 'Quick Navigation',
                    url: item.href,
                    icon: item.icon
                }));

                // 2. Search Employees (Async) with signal
                let employees = [];
                try {
                    employees = await EmployeeService.search(searchTerm, { signal: controller.signal });
                } catch (e) {
                    if (e.name !== 'CanceledError' && e.name !== 'AbortError') {
                        console.error("Employee search error", e);
                    }
                    return; // Don't update state if cancelled
                }

                const matchingEmployees = employees.map(emp => ({
                    type: 'employee',
                    id: emp.id,
                    title: emp.fullName,
                    subtitle: `${emp.jobTitle ?? ''} • ${emp.departmentName ?? ''}`,
                    url: `/employees/${emp.id}`,
                    avatarData: { char: emp.firstName?.[0] }
                }));

                setSearchResults([...matchingNavs, ...matchingEmployees]);
            } catch (error) {
                if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
                    console.error("Search failed", error);
                }
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => {
            clearTimeout(delayDebounceFn);
            controller.abort();
        };
    }, [searchTerm, navItems]);

    // Click-outside to close search results
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchResults([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "hidden md:flex flex-col bg-primary text-white transition-all duration-300 ease-in-out border-r border-slate-800",
                    sidebarCollapsed ? "w-20" : "w-64"
                )}
            >
                <div className="p-6 flex items-center justify-between">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tight">
                            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white">
                                <Users className="w-5 h-5" />
                            </div>
                            <span>HR Master</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors mx-auto"
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 py-4 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            {...item}
                            active={location.pathname === item.href || location.pathname.startsWith(item.href + '/')}
                            collapsed={sidebarCollapsed}
                        />
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full text-slate-400 hover:text-white hover:bg-destructive/20 border-0 justify-start px-3",
                            sidebarCollapsed ? "justify-center" : ""
                        )}
                        onClick={logout}
                    >
                        <LogOut className="w-5 h-5 min-w-[20px]" />
                        {!sidebarCollapsed && <span className="ml-3">Logout</span>}
                    </Button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 relative">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            className="md:hidden p-2 -ml-2 text-slate-600"
                            onClick={() => setMobileMenuOpen(true)}
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Mobile Search Button */}
                        <button
                            className="sm:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        >
                            <Search className="w-5 h-5" />
                        </button>
                        <div className="relative w-full max-w-md hidden sm:block" ref={searchRef}>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg w-full focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                                <Search className={`w-4 h-4 ${isSearching ? 'text-accent animate-pulse' : 'text-slate-400'}`} />
                                <input
                                    type="text"
                                    placeholder="بحث عن موظفين..."
                                    className="bg-transparent border-none text-sm outline-none w-full text-slate-600 placeholder:text-slate-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setSearchResults([]);
                                            setSearchTerm('');
                                            e.target.blur();
                                        }
                                    }}
                                />
                            </div>

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-lg shadow-xl border border-slate-100 max-h-96 overflow-y-auto z-50">
                                    <div className="p-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        Results ({searchResults.length})
                                    </div>
                                    {searchResults.map((result, index) => (
                                        <div
                                            key={result.id + index}
                                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3 transition-colors"
                                            onClick={() => {
                                                navigate(result.url);
                                                setSearchTerm('');
                                                setSearchResults([]);
                                            }}
                                        >
                                            {result.type === 'page' ? (
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <result.icon className="w-4 h-4" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                                                    {result.avatarData.char}
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-sm font-medium text-slate-700">{result.title}</p>
                                                <p className="text-xs text-slate-500">{result.subtitle}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {searchTerm.trim() && !isSearching && searchResults.length === 0 && (
                                <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-lg shadow-xl border border-slate-100 z-50 p-6 text-center">
                                    <Search className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-medium text-slate-500">No results found for "{searchTerm}"</p>
                                    <p className="text-xs text-slate-400 mt-1">Try searching by first name or department</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                onClick={() => setNotificationOpen(!notificationOpen)}
                            >
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                                )}
                            </button>
                            <NotificationDropdown isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
                        </div>

                        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-900">{user?.fullName || 'User Name'}</p>
                                <div className="flex items-center gap-1 justify-end mt-0.5">
                                    <p className="text-xs text-slate-500 capitalize">{getRoleDisplayName(user?.roles?.[0]) || 'User'}</p>
                                    {user?.roles?.length > 1 && (
                                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold" title={user.roles.slice(1).map(getRoleDisplayName).join(', ')}>
                                            +{user.roles.length - 1}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div
                                className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-blue-500 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                                onClick={() => navigate('/settings')}
                            >
                                {user?.profileImageUrl ? (
                                    <img 
                                        src={`${import.meta.env.VITE_API_BASE_URL || 'https://api.eventra.site'}${user.profileImageUrl}`} 
                                        alt={user?.fullName} 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-tr from-accent to-blue-600 flex items-center justify-center text-white">
                                        {user?.fullName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <aside className="absolute top-0 left-0 bottom-0 w-72 bg-primary text-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
                        <div className="p-6 flex items-center justify-between border-b border-slate-800">
                            <div className="flex items-center gap-2 font-display font-bold text-xl">
                                <Users className="w-6 h-6 text-accent" />
                                <span>HR Master</span>
                            </div>
                            <button onClick={() => setMobileMenuOpen(false)}>
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                            {navItems.map((item) => (
                                <SidebarItem
                                    key={item.href}
                                    {...item}
                                    active={location.pathname === item.href || location.pathname.startsWith(item.href + '/')}
                                    collapsed={false}
                                />
                            ))}
                        </nav>
                        <div className="p-4 border-t border-slate-800">
                            <Button
                                variant="ghost"
                                className="w-full text-slate-400 hover:text-white hover:bg-destructive/20 border-0 justify-start"
                                onClick={logout}
                            >
                                <LogOut className="w-5 h-5 mr-3" />
                                Logout
                            </Button>
                        </div>
                    </aside>
                </div>
            )}            {/* Mobile Search Overlay */}
            {mobileSearchOpen && (
                <div className="fixed inset-0 z-50 sm:hidden">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileSearchOpen(false)} />
                    <div className="absolute top-0 left-0 right-0 bg-white p-4 shadow-xl animate-in slide-in-from-top duration-300">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative" ref={searchRef}>
                                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg w-full focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                                    <Search className={`w-4 h-4 ${isSearching ? 'text-accent animate-pulse' : 'text-slate-400'}`} />
                                    <input
                                        type="text"
                                        placeholder="Search employees..."
                                        className="bg-transparent border-none text-sm outline-none w-full text-slate-600 placeholder:text-slate-400"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                setSearchResults([]);
                                                setSearchTerm('');
                                                setMobileSearchOpen(false);
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-lg shadow-xl border border-slate-100 max-h-72 overflow-y-auto z-50">
                                        {searchResults.map((result, index) => (
                                            <div
                                                key={result.id + index}
                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3"
                                                onClick={() => {
                                                    navigate(result.url);
                                                    setSearchTerm('');
                                                    setSearchResults([]);
                                                    setMobileSearchOpen(false);
                                                }}
                                            >
                                                {result.type === 'page' ? (
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                        <result.icon className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                                                        {result.avatarData.char}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700">{result.title}</p>
                                                    <p className="text-xs text-slate-500">{result.subtitle}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchTerm.trim() && !isSearching && searchResults.length === 0 && (
                                    <div className="absolute top-full mt-2 left-0 w-full bg-white rounded-lg shadow-xl border border-slate-100 z-50 p-6 text-center">
                                        <p className="text-sm font-medium text-slate-500">No results found for "{searchTerm}"</p>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { setMobileSearchOpen(false); setSearchTerm(''); setSearchResults([]); }}
                                className="p-2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

import { Toaster } from 'react-hot-toast';

const MainLayout = () => (
    <NotificationProvider>
        <PresenceProvider>
            <Toaster position="top-right" />
            <MainLayoutContent />
        </PresenceProvider>
    </NotificationProvider>
);

export default MainLayout;
