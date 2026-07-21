import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PlacementStatistics from './pages/admin/PlacementStatistics';
import StudentManagement from './pages/admin/StudentManagement';
import OpportunityManagement from './pages/admin/OpportunityManagement';
import OpportunityApplicants from './pages/admin/OpportunityApplicants';
import MyProfile from './pages/student/MyProfile';
import Resumes from './pages/student/Resumes';
import Opportunities from './pages/student/Opportunities';
import OpportunityDetails from './pages/student/OpportunityDetails';
import Applications from './pages/student/Applications';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Protected Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/profile" element={<MyProfile />} />
            <Route path="/student/resumes" element={<Resumes />} />
            <Route path="/student/opportunities" element={<Opportunities />} />
            <Route path="/student/opportunities/:id" element={<OpportunityDetails />} />
            <Route path="/student/applications" element={<Applications />} />
            <Route path="/student/applications/:id" element={<OpportunityDetails />} />
            {/* Future student routes will go here */}
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/dashboard" element={<PlacementStatistics />} />
            <Route path="/admin/students" element={<StudentManagement />} />
            <Route path="/admin/opportunities" element={<OpportunityManagement />} />
            <Route path="/admin/opportunities/:id/applicants" element={<OpportunityApplicants />} />
            {/* Future admin routes will go here */}
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center text-gray-500">
              404 | Page Not Found
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
