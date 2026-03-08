import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, Plus, Search, ChevronRight, GraduationCap, Clock, CheckCircle2, MapPin, User, Trash2 } from 'lucide-react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import trainingService from '../../api/services/trainingService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const TrainingPage = () => {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        instructor: '',
        location: '',
        startDate: '',
        endDate: '',
        maxParticipants: 20
    });

    // Delete state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Auth & Enrollment
    const { user } = useAuth();
    const isAdminOrHR = user?.roles?.some(r => r === 'Admin' || r === 'HRManager' || r === 'HR');
    const employeeId = user?.employeeId || user?.id;
    const [enrollments, setEnrollments] = useState([]);
    const [enrollingCourseId, setEnrollingCourseId] = useState(null);

    const fetchCourses = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await trainingService.getCourses();
            setCourses(data);
        } catch {
            toast.error('Failed to load training courses');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchEnrollments = React.useCallback(async () => {
        if (!employeeId) return;
        try {
            const data = await trainingService.getEmployeeEnrollments(employeeId);
            setEnrollments(data || []);
        } catch (err) {
            console.error('Failed to load enrollments', err);
        }
    }, [employeeId]);

    useEffect(() => {
        fetchCourses();
        if (employeeId) {
            fetchEnrollments();
        }
    }, [employeeId, fetchCourses, fetchEnrollments]);

    const handleEnroll = async (e, courseId) => {
        e.stopPropagation();
        setEnrollingCourseId(courseId);
        try {
            await trainingService.enrollEmployee(courseId, employeeId);
            toast.success('Successfully enrolled in course');
            fetchEnrollments();
            fetchCourses(); // to update enrolledCount
        } catch (err) {
            const errorMsg = err.response?.data?.title || err.response?.data || 'Failed to enroll';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to enroll');
        } finally {
            setEnrollingCourseId(null);
        }
    };


    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            await trainingService.createCourse(courseForm);
            toast.success('Training course created');
            setIsModalOpen(false);
            fetchCourses();
        } catch {
            toast.error('Failed to create course');
        }
    };

    const handleDeleteClick = (course) => {
        setCourseToDelete(course);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!courseToDelete) return;
        setIsDeleting(true);
        try {
            await trainingService.deleteCourse(courseToDelete.id);
            toast.success('Course deleted');
            setIsDeleteModalOpen(false);
            fetchCourses();
        } catch (err) {
            const errorMsg = err.response?.data?.title || err.response?.data || 'Failed to delete course';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to delete course');
        } finally {
            setIsDeleting(false);
            setCourseToDelete(null);
        }
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Training & Development</h1>
                    <p className="text-slate-500 mt-1">Upskill your workforce and manage employee certifications.</p>
                </div>
                {isAdminOrHR && (
                    <Button variant="accent" onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-accent/20">
                        <Plus className="w-5 h-5 mr-2" />
                        New Course
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-none">
                    <CardContent className="p-6">
                        <BookOpen className="w-8 h-8 opacity-20 mb-4" />
                        <h3 className="text-indigo-100 text-sm font-bold uppercase tracking-wider">Active Courses</h3>
                        <p className="text-3xl font-black mt-1">{courses.filter(c => c.status === 'InProgress').length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardContent className="p-6">
                        <Users className="w-8 h-8 text-emerald-500 opacity-20 mb-4" />
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Enrolled</h3>
                        <p className="text-3xl font-black text-slate-900 mt-1">{courses.reduce((acc, c) => acc + c.enrolledCount, 0)}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white border-slate-100 shadow-sm">
                    <CardContent className="p-6">
                        <GraduationCap className="w-8 h-8 text-amber-500 opacity-20 mb-4" />
                        <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">Completed</h3>
                        <p className="text-3xl font-black text-slate-900 mt-1">{courses.filter(c => c.status === 'Completed').length}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search courses or instructors..."
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
                    <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No courses found</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your search or create a new course to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <Card key={course.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-100 overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant={course.status === 'InProgress' ? 'success' : 'secondary'}>
                                        {course.status}
                                    </Badge>
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {course.enrolledCount}/{course.maxParticipants}
                                    </span>
                                    {isAdminOrHR && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(course);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <CardTitle className="text-xl group-hover:text-accent transition-colors">{course.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">{course.description || 'No description provided.'}</p>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span>{course.instructor || 'TBA'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span>{new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span>{course.location || 'Remote'}</span>
                                    </div>
                                </div>

                                {isAdminOrHR ? (
                                    <Button variant="secondary" className="w-full mt-4 group-hover:bg-accent group-hover:text-white transition-all">
                                        Manage Course
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : enrollments.some(e => e.courseId === course.id) ? (
                                    <div className="w-full mt-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 border border-emerald-100 shadow-sm">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Enrolled
                                    </div>
                                ) : (
                                    <Button
                                        variant="accent"
                                        className="w-full mt-4"
                                        onClick={(e) => handleEnroll(e, course.id)}
                                        isLoading={enrollingCourseId === course.id}
                                        disabled={course.enrolledCount >= course.maxParticipants}
                                    >
                                        {course.enrolledCount >= course.maxParticipants ? 'Course Full' : 'Enroll Now'}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Training Course"
            >
                <form onSubmit={handleCreateCourse} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Course Title</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                            placeholder="e.g. Advanced React Architecture"
                            value={courseForm.title}
                            onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Description</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                            rows="3"
                            placeholder="Detailed course overview..."
                            value={courseForm.description}
                            onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Instructor</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={courseForm.instructor}
                                onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Max Participants</label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={courseForm.maxParticipants}
                                onChange={(e) => setCourseForm({ ...courseForm, maxParticipants: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">Start Date</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={courseForm.startDate}
                                onChange={(e) => setCourseForm({ ...courseForm, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-tight">End Date</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none"
                                value={courseForm.endDate}
                                onChange={(e) => setCourseForm({ ...courseForm, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <Button type="submit" variant="accent" className="w-full mt-4 py-4 font-bold shadow-lg shadow-accent/20">
                        Publish Course
                    </Button>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                title="Delete Training Course"
                description={`Are you sure you want to delete "${courseToDelete?.title}"? This will also remove all student enrollments for this course. This action cannot be undone.`}
            />
        </div>
    );
};

export default TrainingPage;
