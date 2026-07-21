import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const StudentFormModal = ({ isOpen, onClose, student = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    institute_email: '',
    personal_email: '',
    name: '',
    student_id: '',
    degree: '',
    branch: '',
    cgpa: '',
    tenth_percentage: '',
    twelfth_percentage: '',
    active_backlogs: '0',
    academic_year: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        institute_email: student.institute_email || '',
        personal_email: student.personal_email || '',
        name: student.name || '',
        student_id: student.student_id || '',
        degree: student.degree || '',
        branch: student.branch || '',
        cgpa: student.cgpa || '',
        tenth_percentage: student.tenth_percentage || '',
        twelfth_percentage: student.twelfth_percentage || '',
        active_backlogs: student.active_backlogs?.toString() || '0',
        academic_year: student.academic_year || ''
      });
    } else {
      setFormData({
        institute_email: '',
        personal_email: '',
        name: '',
        student_id: '',
        degree: '',
        branch: '',
        cgpa: '',
        tenth_percentage: '',
        twelfth_percentage: '',
        active_backlogs: '0',
        academic_year: ''
      });
    }
  }, [student, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
      tenth_percentage: formData.tenth_percentage ? parseFloat(formData.tenth_percentage) : null,
      twelfth_percentage: formData.twelfth_percentage ? parseFloat(formData.twelfth_percentage) : null,
      active_backlogs: parseInt(formData.active_backlogs || '0', 10)
    };

    try {
      if (student) {
        // Edit mode
        const { institute_email, ...updatePayload } = payload;
        await api.put(`/admin/students/${student.id}`, updatePayload);
        toast.success('Student updated successfully');
      } else {
        // Create mode
        await api.post('/admin/students', payload);
        toast.success('Student added successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      const message = error.response?.data?.message || 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-full flex flex-col my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {student ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="student-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {!student && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Institute Email *</label>
                  <input
                    type="email"
                    name="institute_email"
                    required
                    value={formData.institute_email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This creates the user account. The student will use Forgot Password to set their initial password.
                  </p>
                </div>
              )}

              {student && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Institute Email</label>
                  <input
                    type="email"
                    disabled
                    value={formData.institute_email}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm p-2 border text-gray-500 cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Personal Email</label>
                <input
                  type="email"
                  name="personal_email"
                  value={formData.personal_email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Student ID *</label>
                <input
                  type="text"
                  name="student_id"
                  required
                  value={formData.student_id}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Degree *</label>
                <input
                  type="text"
                  name="degree"
                  required
                  placeholder="e.g. B.Tech"
                  value={formData.degree}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Branch *</label>
                <input
                  type="text"
                  name="branch"
                  required
                  placeholder="e.g. CSE"
                  value={formData.branch}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
                <select
                  name="academic_year"
                  required
                  value={formData.academic_year}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border bg-white"
                >
                  <option value="" disabled>Select academic year</option>
                  <option value="pre_final_year">Pre-Final Year</option>
                  <option value="final_year">Final Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  name="cgpa"
                  value={formData.cgpa}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">10th Percentage</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="tenth_percentage"
                  value={formData.tenth_percentage}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">12th Percentage</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="twelfth_percentage"
                  value={formData.twelfth_percentage}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  name="active_backlogs"
                  value={formData.active_backlogs}
                  onChange={handleChange}
                  className="mt-1 block w-full md:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="student-form"
            disabled={loading}
            className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
          >
            {loading ? 'Saving...' : 'Save Student'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentFormModal;
