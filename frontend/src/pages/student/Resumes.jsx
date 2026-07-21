import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, FileText, Trash2, Eye, FileBadge, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import ConfirmResumeDeleteModal from '../../components/student/ConfirmResumeDeleteModal';

const Resumes = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [resumeName, setResumeName] = useState('');
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/student/resumes');
      setResumes(response.data.data);
    } catch (error) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please select a PDF file');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a PDF file to upload');
      return;
    }
    if (!resumeName.trim()) {
      toast.error('Please provide a name for this resume');
      return;
    }

    const formData = new FormData();
    formData.append('resume_name', resumeName.trim());
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/student/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Resume uploaded successfully');
      setResumeName('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchResumes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (resume) => {
    setSelectedResume(resume);
    setDeleteModalOpen(true);
  };

  const handleViewResume = (signedUrl) => {
    if (signedUrl) {
      // Hide PDF download controls in native viewers
      const viewUrl = `${signedUrl}#toolbar=0&navpanes=0`;
      window.open(viewUrl, '_blank');
    } else {
      toast.error('Resume URL is unavailable');
    }
  };

  const limitReached = resumes.length >= 5;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-indigo-500 border-x border-b border-gray-100">
        <h1 className="text-2xl font-bold text-indigo-950">My Resumes</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your resumes for job applications. You can maintain up to 5 active resumes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resumes List Section */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-50/60 flex justify-between items-center">
              <h2 className="text-lg font-medium text-indigo-950">Your Active Resumes</h2>
              <span className="text-sm font-medium text-gray-500 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
                {resumes.length} / 5
              </span>
            </div>
            
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <FileText className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-sm font-medium text-slate-900">No resumes</h3>
                  <p className="mt-1 text-sm text-slate-500">Get started by uploading your first resume.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {resumes.map((resume) => (
                    <div key={resume.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:border-blue-300 hover:shadow-sm transition-all bg-white group gap-4">
                      <div className="flex items-center min-w-0 w-full">
                        <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="ml-4 overflow-hidden flex-1">
                          <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors" title={resume.resume_name}>
                            {resume.resume_name}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Uploaded {new Date(resume.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2 w-full sm:w-auto flex-shrink-0 justify-end mt-4 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-gray-100">
                        <button
                          onClick={() => handleViewResume(resume.signed_url)}
                          className="flex justify-center items-center px-4 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1.5 text-indigo-500" />
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteClick(resume)}
                          disabled={resume.is_in_use}
                          className="flex justify-center items-center px-3 py-1.5 border border-red-200 text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={resume.is_in_use ? "Cannot delete while under review" : "Delete Resume"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
            <h2 className="text-lg font-medium text-indigo-950 mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-500" />
              Upload New Resume
            </h2>

            {limitReached ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  You have reached the maximum limit of 5 resumes. Please delete an existing resume before uploading a new one.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer Resume"
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PDF File (Max 5MB)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors bg-slate-50">
                    <div className="space-y-1 text-center">
                      <FileBadge className="mx-auto h-8 w-8 text-indigo-400" />
                      <div className="flex text-sm text-slate-600 justify-center">
                        <label htmlFor="resume-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>{file ? 'Change file' : 'Select PDF'}</span>
                          <input 
                            id="resume-upload" 
                            type="file" 
                            className="sr-only" 
                            accept="application/pdf"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 truncate max-w-[200px] mx-auto">
                        {file ? file.name : "No file selected"}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !file || !resumeName.trim()}
                  className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    'Upload Resume'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <ConfirmResumeDeleteModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        resume={selectedResume} 
        onSuccess={fetchResumes} 
      />
    </div>
  );
};

export default Resumes;
