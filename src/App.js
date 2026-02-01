import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import PublicRoute from './components/PublicRoute';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Home from './pages/Home';
import Courses from './pages/Courses';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Checkout from './pages/Checkout';

// Authenticated Pages
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import ChangePassword from './pages/ChangePassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCourses from './pages/admin/ManageCourses';
import CreateCourse from './pages/admin/CreateCourse';
import EditCourse from './pages/admin/EditCourse';
import AddLesson from './pages/admin/AddLesson';
import Reports from './pages/admin/Reports';
import CreateTeacher from './pages/admin/CreateTeacher';
import ManageTeachers from './pages/admin/ManageTeachers';

function App() {
  return (
    <AuthProvider>
      <Router>
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
            <Route path="/checkout" element={<Checkout />} />
          </Route>

          {/* Student Routes - using DashboardLayout */}
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

            {/* Shared (Admin + Teacher) */}
            <Route path="edit" element={<EditCourse />} />
            <Route path="add-lesson" element={<AddLesson />} />
          </Route>

          {/* Catch all */}
          {/* If logged in, maybe go to dashboard? For now, Home. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
