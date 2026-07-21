import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const DEGREES = ['B.Tech', 'M.Tech', 'M.Sc.IT', 'M.Sc.DS', 'M.Des'];

// Format ISO for datetime-local
const formatForInput = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  // Adjust to local timezone
  const tzOffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
  return localISOTime;
};

// Format to UTC ISO
const formatForAPI = (localString) => {
  if (!localString) return '';
  return new Date(localString).toISOString();
};

const OpportunityFormModal = ({ isOpen, onClose, opportunityId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    role: '',
    opportunity_type: 'job',
    location: '',
    package_stipend: '',
    registration_start: '',
    registration_end: '',
    job_description: '',
    min_cgpa: '',
    max_active_backlogs: '',
    min_tenth_percentage: '',
    min_twelfth_percentage: '',
    additional_eligibility_note: '',
    eligible_degrees: []
  });

  useEffect(() => {
    if (isOpen && opportunityId) {
      fetchOpportunityDetails(opportunityId);
    } else if (isOpen) {
      // Reset form on new open
      setFormData({
        company_name: '',
        role: '',
        opportunity_type: 'job',
        location: '',
        package_stipend: '',
        registration_start: '',
        registration_end: '',
        job_description: '',
        min_cgpa: '',
        max_active_backlogs: '',
        min_tenth_percentage: '',
        min_twelfth_percentage: '',
        additional_eligibility_note: '',
        eligible_degrees: []
      });
    }
  }, [isOpen, opportunityId]);

  const fetchOpportunityDetails = async (id) => {
    setFetching(true);
    try {
      const response = await api.get(`/admin/opportunities/${id}`);
      const opp = response.data.data;
      setFormData({
        company_name: opp.company_name || '',
        role: opp.role || '',
        opportunity_type: opp.opportunity_type || 'job',
        location: opp.location || '',
        package_stipend: opp.package_stipend || '',
        registration_start: formatForInput(opp.registration_start),
        registration_end: formatForInput(opp.registration_end),
        job_description: opp.job_description || '',
        min_cgpa: opp.min_cgpa || '',
        max_active_backlogs: opp.max_active_backlogs !== null ? opp.max_active_backlogs : '',
        min_tenth_percentage: opp.min_tenth_percentage || '',
        min_twelfth_percentage: opp.min_twelfth_percentage || '',
        additional_eligibility_note: opp.additional_eligibility_note || '',
        eligible_degrees: opp.eligible_degrees || []
      });
    } catch (error) {
      toast.error('Failed to fetch opportunity details');
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      const currentList = prev[field];
      if (currentList.includes(value)) {
        return { ...prev, [field]: currentList.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...currentList, value] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    if (formData.eligible_degrees.length === 0) {
      toast.error('Please select at least one eligible degree');
      return;
    }

    const payload = {
      ...formData,
      registration_start: formatForAPI(formData.registration_start),
      registration_end: formatForAPI(formData.registration_end),
      min_cgpa: formData.min_cgpa ? parseFloat(formData.min_cgpa) : null,
      max_active_backlogs: formData.max_active_backlogs !== '' ? parseInt(formData.max_active_backlogs, 10) : 0,
      min_tenth_percentage: formData.min_tenth_percentage ? parseFloat(formData.min_tenth_percentage) : null,
      min_twelfth_percentage: formData.min_twelfth_percentage ? parseFloat(formData.min_twelfth_percentage) : null,
    };

    setLoading(true);
    try {
      if (opportunityId) {
        await api.put(`/admin/opportunities/${opportunityId}`, payload);
        toast.success('Opportunity updated successfully');
      } else {
        await api.post('/admin/opportunities', payload);
        toast.success('Opportunity created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="relative z-10 inline-block w-full max-w-4xl overflow-hidden text-left align-middle transition-all transform bg-white rounded-xl shadow-xl sm:my-8 text-gray-900">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
              {opportunityId ? 'Edit Opportunity' : 'Create Opportunity'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {fetching ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <form id="opportunity-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Section: Basic Details */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Basic Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                      <input type="text" required name="company_name" value={formData.company_name} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                      <input type="text" required name="role" value={formData.role} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select name="opportunity_type" required value={formData.opportunity_type} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        <option value="job">Job (Final Year)</option>
                        <option value="winter_internship">Winter Internship (Final Year)</option>
                        <option value="winter_internship_job">Winter Internship + Job (Final Year)</option>
                        <option value="summer_internship">Summer Internship (Pre-Final Year)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                      <input type="text" required name="location" value={formData.location} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package/Stipend *</label>
                      <input type="text" required name="package_stipend" value={formData.package_stipend} onChange={handleChange} placeholder="e.g. 12 LPA or 40k/month" className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                  </div>
                </div>

                {/* Section: Registration Window */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Registration Window</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                      <input type="datetime-local" required name="registration_start" value={formData.registration_start} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                      <input type="datetime-local" required name="registration_end" value={formData.registration_end} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                  </div>
                </div>

                {/* Section: Institutional Eligibility */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Institutional Eligibility</h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Eligible Degrees *</label>
                      <div className="flex flex-wrap gap-3">
                        {DEGREES.map(deg => (
                          <label key={deg} className="inline-flex items-center bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-4 w-4" 
                              checked={formData.eligible_degrees.includes(deg)}
                              onChange={() => handleCheckboxChange('eligible_degrees', deg)}
                            />
                            <span className="ml-2 text-sm text-gray-700">{deg}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {/* Section: Academic Eligibility */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Academic Eligibility</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum CGPA</label>
                      <input type="number" step="0.01" min="0" max="10" name="min_cgpa" value={formData.min_cgpa} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Active Backlogs</label>
                      <input type="number" min="0" step="1" name="max_active_backlogs" value={formData.max_active_backlogs} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min 10th Percentage</label>
                      <input type="number" step="0.01" min="0" max="100" name="min_tenth_percentage" value={formData.min_tenth_percentage} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min 12th Percentage</label>
                      <input type="number" step="0.01" min="0" max="100" name="min_twelfth_percentage" value={formData.min_twelfth_percentage} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                      <textarea name="additional_eligibility_note" rows="2" value={formData.additional_eligibility_note} onChange={handleChange} className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
                    </div>
                  </div>
                </div>

                {/* Section: Job Description */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 border-b pb-2">Job Description *</h4>
                  <textarea 
                    name="job_description" 
                    required 
                    rows="6" 
                    value={formData.job_description} 
                    onChange={handleChange} 
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Enter detailed job description, responsibilities, and requirements..."
                  ></textarea>
                </div>

              </form>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 rounded-b-xl">
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
              form="opportunity-form"
              disabled={loading || fetching}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Opportunity'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityFormModal;
