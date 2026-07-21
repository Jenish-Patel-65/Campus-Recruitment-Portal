import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, LayoutDashboard, Users, Briefcase, FileText, CheckSquare, User as UserIcon } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, userRole, currentPath }) => {
  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Opportunities', path: '/admin/opportunities', icon: Briefcase },
  ];

  const studentLinks = [
    { name: 'Opportunities', path: '/student/opportunities', icon: Briefcase },
    { name: 'My Resumes', path: '/student/resumes', icon: FileText },
    { name: 'Applications', path: '/student/applications', icon: CheckSquare },
    { name: 'My Profile', path: '/student/profile', icon: UserIcon },
  ];

  const links = userRole === 'admin' ? adminLinks : studentLinks;

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 bg-gray-50/50">
          <span className="text-lg font-bold text-blue-600 truncate">
            Placement Portal
          </span>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath.startsWith(link.path);
            
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={onClose}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Optional Footer Space */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-center text-gray-400 font-medium">
            Campus Recruitment Portal
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
