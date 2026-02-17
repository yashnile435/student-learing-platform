import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import PublicRoute from './components/common/PublicRoute';
import Loading from './components/common/Loading';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Courses = lazy(() => import('./pages/student/Courses'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

// Authenticated Pages
const Dashboard = lazy(() => import('./pages/student/Dashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageCourses = lazy(() => import('./pages/admin/ManageCourses'));
const CreateCourse = lazy(() => import('./pages/admin/CreateCourse'));
const ManageTeachers = lazy(() => import('./pages/admin/ManageTeachers'));
const ReceivedPayments = lazy(() => import('./pages/admin/ReceivedPayments'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const CreateTeacher = lazy(() => import('./pages/admin/CreateTeacher'));

// Teacher Pages (Shared/Moved)
const EditCourse = lazy(() => import('./pages/teacher/EditCourse'));
const AddLesson = lazy(() => import('./pages/teacher/AddLesson'));
const DeleteLessons = lazy(() => import('./pages/teacher/DeleteLessons'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loading /></div>}>
          <Routes>
            {/* Public Context */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route
                path="/login"
                element={<PublicRoute><Login /></PublicRoute>}
              />
              <Route
                path="/signup"
                element={<PublicRoute><Signup /></PublicRoute>}
              />
            </Route>

            {/* Student Routes - using DashboardLayout */}
            <Route element={<PrivateRoute roleRequired="student"><DashboardLayout /></PrivateRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            {/* Common Authenticated Routes (Profile, Settings) */}
            <Route element={<PrivateRoute roleRequired={['student', 'admin', 'teacher']}><DashboardLayout /></PrivateRoute>}>
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Route>

            {/* Admin & Teacher Routes - using DashboardLayout */}
            <Route path="/admin" element={<PrivateRoute roleRequired={['admin', 'teacher']}><DashboardLayout /></PrivateRoute>}>
              <Route index element={<AdminDashboard />} />

              {/* Admin Only */}
              <Route path="manage" element={<PrivateRoute roleRequired="admin"><ManageCourses /></PrivateRoute>} />
              <Route path="create" element={<PrivateRoute roleRequired="admin"><CreateCourse /></PrivateRoute>} />
              <Route path="create-teacher" element={<PrivateRoute roleRequired="admin"><CreateTeacher /></PrivateRoute>} />
              <Route path="manage-teachers" element={<PrivateRoute roleRequired="admin"><ManageTeachers /></PrivateRoute>} />
              <Route path="reports" element={<PrivateRoute roleRequired="admin"><Reports /></PrivateRoute>} />
              <Route path="received-payments" element={<PrivateRoute roleRequired="admin"><ReceivedPayments /></PrivateRoute>} />

              {/* Shared (Admin + Teacher) */}
              <Route path="edit" element={<EditCourse />} />
              <Route path="add-lesson" element={<AddLesson />} />
              <Route path="delete-lessons" element={<DeleteLessons />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
