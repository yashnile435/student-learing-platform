
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Courses from './pages/Courses';
import Home from './pages/Home';
import Login from './pages/Login';
import SetupAdmin from './pages/SetupAdmin';
import Signup from './pages/Signup';
import UserProfile from './pages/UserProfile';
import TestFirebase from './pages/TestFirebase';
import Checkout from './pages/Checkout';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import ManageCourses from './pages/admin/ManageCourses';
import CreateCourse from './pages/admin/CreateCourse';
import EditCourse from './pages/admin/EditCourse';
import AddLesson from './pages/admin/AddLesson';
import Reports from './pages/admin/Reports';

const DashboardSwitcher = () => {
  const { userRole } = useAuth();
  if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
  }
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/setup-admin" element={<SetupAdmin />} />
          <Route path="/test" element={<TestFirebase />} />

          {/* Protected Routes */}

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardSwitcher />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <Checkout />
              </PrivateRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <PrivateRoute>
                <ChangePassword />
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute roleRequired="admin"><AdminLayout /></PrivateRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="manage" element={<ManageCourses />} />
            <Route path="create" element={<CreateCourse />} />
            <Route path="edit" element={<EditCourse />} />
            <Route path="add-lesson" element={<AddLesson />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
