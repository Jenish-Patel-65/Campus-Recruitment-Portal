import React, { useState, useEffect } from 'react';
import { Search, Plus, Upload, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

import StudentFormModal from '../../components/admin/StudentFormModal';
import CSVImportModal from '../../components/admin/CSVImportModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data.data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAdd = () => {
    setSelectedStudent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleDelete = (student) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  const filteredStudents = students.filter(s => {
    const term = searchTerm.toLowerCase();
    return (s.student_id && s.student_id.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-indigo-500 border-x border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-950">Student Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage student academic records and access.</p>
        </div>
        
        <div className="flex space-x-3 w-full sm:w-auto">
          <button
            onClick={() => setIsCsvOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="h-4 w-4 mr-2 text-gray-500" />
            Import CSV
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by student id..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-50/60 border-b border-indigo-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                  Student Details
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                  Academic Info
                </th>
                <th scope="col" className="relative px-6 py-4 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-slate-600">{student.institute_email}</div>
                          {student.personal_email && <div className="text-xs text-slate-500 mt-0.5">{student.personal_email}</div>}
                          <div className="text-xs text-slate-500 mt-0.5">Student ID: {student.student_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.degree} - {student.branch}</div>
                      <div className="text-sm text-slate-600">{student.academic_year === 'pre_final_year' ? 'Pre-Final Year' : 'Final Year'}</div>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="text-xs font-medium text-slate-600">CGPA: {student.cgpa || 'N/A'}</div>
                        {student.active_backlogs > 0 && (
                          <div className="text-xs text-red-600 font-medium">
                            {student.active_backlogs} Backlog(s)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Edit Student"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(student)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <StudentFormModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        student={selectedStudent} 
        onSuccess={fetchStudents} 
      />
      
      <CSVImportModal 
        isOpen={isCsvOpen} 
        onClose={() => setIsCsvOpen(false)} 
        onSuccess={fetchStudents} 
      />
      
      <ConfirmDeleteModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        student={selectedStudent} 
        onSuccess={fetchStudents} 
      />
    </div>
  );
};

export default StudentManagement;
