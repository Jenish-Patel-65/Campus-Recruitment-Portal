import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ApplyModal = ({ isOpen, onClose, opportunityId, onSuccess }) => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchResumes();
    } else {
      setSelectedResumeId('');
    }
  }, [isOpen]);

  const fetchResumes = async () => {
    setFetching(true);
    try {
      const response = await api.get('/student/resumes');
      setResumes(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedResumeId(response.data.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load resumes');
    } finally {
      setFetching(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      toast.error('Please select a resume');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/student/opportunities/${opportunityId}/apply`, {
        resume_id: selectedResumeId
      });
      toast.success('Application submitted successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Apply to Opportunity</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {fetching ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-500 mb-4">You don't have any resumes uploaded.</p>
              <button 
                onClick={() => {
                  onClose();
                  window.location.href = '/student/resumes';
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Go to My Resumes to upload one
              </button>
            </div>
          ) : (
            <form id="apply-form" onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a Resume for this Application
                </label>
                <div className="space-y-2">
                  {resumes.map((resume) => (
                    <label 
                      key={resume.id} 
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedResumeId === resume.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resume"
                        value={resume.id}
                        checked={selectedResumeId === resume.id}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3 flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">
                          {resume.resume_name}
                        </span>
                        <span className="block text-xs text-gray-500">
                          Uploaded {new Date(resume.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading || fetching}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="apply-form"
            disabled={loading || fetching || resumes.length === 0 || !selectedResumeId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyModal;
