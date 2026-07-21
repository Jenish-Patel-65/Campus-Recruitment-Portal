import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Users, FileText, Download, ArrowLeft, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const OpportunityApplicants = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opportunityName, setOpportunityName] = useState('Opportunity');
  const [resumeLoading, setResumeLoading] = useState(null);
  const [downloadingResumes, setDownloadingResumes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApplicants();
    // Fetch applicants
    fetchOpportunityDetails();
  }, [id]);

  const fetchOpportunityDetails = async () => {
    try {
      const response = await api.get(`/admin/opportunities/${id}`);
      setOpportunityName(`${response.data.data.company_name} - ${response.data.data.role}`);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchApplicants = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/opportunities/${id}/applicants`);
      setApplicants(response.data.data);
    } catch (error) {
      toast.error('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleResultChange = async (applicationId, newResult) => {
    try {
      await api.put(`/admin/opportunities/${id}/applicants/${applicationId}/result`, {
        result: newResult
      });
      toast.success('Status updated successfully');
      // Update local state
      setApplicants(prev => prev.map(app => 
        app.application_id === applicationId ? { ...app, result: newResult } : app
      ));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleViewResume = async (applicationId) => {
    setResumeLoading(applicationId);
    try {
      const response = await api.get(`/admin/opportunities/${id}/applicants/${applicationId}/resume`);
      const signedUrl = response.data.data.signedUrl;
      // Open signed URL
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch resume');
    } finally {
      setResumeLoading(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/admin/opportunities/${id}/applicants/export`, {
        responseType: 'blob' // Important for file download
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      // Extract filename from header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${opportunityName}-Applicants`.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-') + '.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export started');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleDownloadResumes = async () => {
    setDownloadingResumes(true);
    try {
      const response = await api.get(`/admin/opportunities/${id}/applicants/resumes/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      let filename = `${opportunityName}-Resumes`.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-') + '.zip';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Resumes downloaded successfully');
    } catch (error) {
      toast.error('Failed to download resumes');
    } finally {
      setDownloadingResumes(false);
    }
  };

  const getResultBadge = (result) => {
    switch (result?.toLowerCase()) {
      case 'selected':
        return <span className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded-md text-xs font-medium border border-green-200"><CheckCircle className="h-3 w-3 mr-1" /> Selected</span>;
      case 'rejected':
        return <span className="flex items-center text-red-700 bg-red-50 px-2 py-1 rounded-md text-xs font-medium border border-red-200"><XCircle className="h-3 w-3 mr-1" /> Rejected</span>;
      default:
        return <span className="flex items-center text-gray-700 bg-gray-50 px-2 py-1 rounded-md text-xs font-medium border border-gray-200"><Clock className="h-3 w-3 mr-1" /> Pending</span>;
    }
  };

  const filteredApplicants = applicants.filter(app => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return app.student_id && app.student_id.toLowerCase().includes(lowerQuery);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-indigo-500 border-x border-b border-gray-100 gap-4">
        <div>
          <button 
            onClick={() => navigate('/admin/opportunities')}
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Opportunities
          </button>
          <h1 className="text-2xl font-bold text-indigo-950">Applicants</h1>
          <p className="mt-1 text-sm text-gray-500">{opportunityName}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleDownloadResumes}
            disabled={loading || applicants.length === 0 || downloadingResumes || applicants.every(a => a.result !== 'pending')}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 w-full sm:w-auto"
          >
            {downloadingResumes ? (
              <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-2"></div>
            ) : (
              <FileText className="h-4 w-4 mr-2 text-gray-500" />
            )}
            Download Resumes
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading || applicants.length === 0}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-70 w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2 text-gray-500" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-20 bg-slate-50">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No applicants yet</h3>
            <p className="mt-1 text-sm text-gray-500">Students have not applied to this opportunity yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            
            {filteredApplicants.length === 0 ? (
              <div className="text-center py-16 bg-white">
                <Search className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <h3 className="text-md font-medium text-gray-900">No matches found</h3>
                <p className="mt-1 text-sm text-gray-500">No applicants match your search query "{searchQuery}"</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-50/60 border-b border-indigo-100">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                    Student Info
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                    Academics
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                    Resume
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplicants.map((app) => (
                  <tr key={app.application_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {app.profile_photo_url ? (
                            <img className="h-10 w-10 rounded-full object-cover" src={app.profile_photo_url} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                              {app.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{app.name}</div>
                          <div className="text-sm text-slate-600">{app.student_id}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{app.degree} ({app.academic_year === 'pre_final_year' ? 'Pre-Final Year' : 'Final Year'})</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{app.institute_email}</div>
                      <div className="text-sm text-slate-600">{app.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900"><span className="font-medium text-slate-500">CGPA:</span> {app.cgpa}</div>
                      <div className="text-sm text-slate-600"><span className="font-medium text-slate-500">Backlogs:</span> {app.active_backlogs}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        onClick={() => handleViewResume(app.application_id)}
                        disabled={resumeLoading === app.application_id || !app.resume_url || app.result !== 'pending'}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50"
                      >
                        {resumeLoading === app.application_id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                        ) : (
                          <FileText className="h-4 w-4 mr-1.5 text-blue-500" />
                        )}
                        View PDF
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col space-y-2">
                        {getResultBadge(app.result)}
                        <select
                          value={app.result}
                          onChange={(e) => handleResultChange(app.application_id, e.target.value)}
                          className="mt-1 block w-full pl-3 pr-8 py-1 text-xs border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                        >
                          <option value="pending">Pending</option>
                          <option value="selected">Selected</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityApplicants;
