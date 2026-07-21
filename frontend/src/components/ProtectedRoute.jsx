import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const getPageTitle = (pathname, role) => {
  if (role === 'admin') {
    if (pathname.includes('/admin/dashboard')) return 'Dashboard';
    if (pathname.includes('/admin/students')) return 'Students';
    if (pathname.includes('/admin/opportunities')) return 'Opportunities';
  } else {
    if (pathname.includes('/student/opportunities')) return 'Opportunities';
    if (pathname.includes('/student/resumes')) return 'My Resumes';
    if (pathname.includes('/student/applications')) return 'Applications';
    if (pathname.includes('/student/profile')) return 'My Profile';
  }
  return 'Campus Recruitment Portal';
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If the user's role is not allowed for this route, redirect them
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/student/opportunities" replace />;
  }

  const title = getPageTitle(location.pathname, user.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/40 flex flex-col">
      {/* App Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-indigo-950 truncate">
              {title}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden sm:flex items-center text-sm font-medium text-gray-500">
               <User className="h-5 w-5 mr-1 text-gray-400" />
               <span className="truncate max-w-[150px]">{user?.email}</span>
               <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                 {user?.role === 'admin' ? 'Admin' : 'Student'}
               </span>
             </div>
             <button
               onClick={logout}
               className="inline-flex items-center p-2 border border-transparent text-sm font-medium rounded-md text-red-700 hover:bg-red-50 focus:outline-none transition-colors"
               title="Logout"
             >
               <LogOut className="h-5 w-5 sm:mr-1" />
               <span className="hidden sm:inline">Logout</span>
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Sidebar Drawer */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        userRole={user?.role} 
        currentPath={location.pathname}
      />
    </div>
  );
};

export default ProtectedRoute;
