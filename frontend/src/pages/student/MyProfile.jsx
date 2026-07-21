import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Camera, Save, User, BookOpen, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const fileInputRef = useRef(null);

  // Editable form state
  const [formData, setFormData] = useState({
    phone_number: '',
    personal_email: '',
    github_url: '',
    linkedin_url: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/student/profile');
      const data = response.data.data;
      setProfile(data);
      setFormData({
        phone_number: data.phone_number || '',
        personal_email: data.personal_email || '',
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/student/profile', formData);
      toast.success('Profile updated successfully');
      // Update local state
      setProfile(prev => ({ ...prev, ...formData }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size validation
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('photo', file);

    setUploading(true);
    try {
      const response = await api.post('/student/profile/photo', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { profile_photo_signed_url } = response.data.data;
      
      // Update profile
      setProfile(prev => ({
        ...prev,
        profile_photo_signed_url
      }));
      
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Profile Header & Photo */}
        <div className="px-4 sm:px-8 py-8 relative bg-blue-50 border-b border-blue-100">
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8">
            <div className="relative group z-10 mx-auto sm:mx-0 mb-4 sm:mb-0">
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white relative">
                {profile.profile_photo_signed_url ? (
                  <img 
                    src={profile.profile_photo_signed_url} 
                    alt="Profile" 
                    className={`h-full w-full object-cover ${uploading ? 'opacity-50' : ''}`}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-500">
                    <User className="h-16 w-16" />
                  </div>
                )}
                
                {/* Upload Overlay */}
                <button 
                  onClick={handlePhotoClick}
                  disabled={uploading}
                  className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="h-8 w-8 text-white" />
                  )}
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{profile.name}</h1>
              <p className="text-sm font-medium text-gray-600 mt-1">{profile.student_id} • {profile.degree} in {profile.branch}</p>
            </div>

          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <nav className="flex -mb-px px-4 sm:px-6 space-x-8">
            <button
              onClick={() => setActiveTab('personal')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'personal'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="h-4 w-4 mr-2" />
              Personal Information
            </button>
            <button
              onClick={() => setActiveTab('academic')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'academic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Academic Information
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'personal' && (
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Read-Only Identity */}
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" disabled value={profile.name} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm p-2 border text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Institute Email</label>
                  <input type="email" disabled value={profile.institute_email} className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm p-2 border text-gray-500 cursor-not-allowed" />
                </div>
                <div className="sm:col-span-2 text-xs text-gray-500 flex items-start">
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span>Name and Institute Email are controlled by the Placement Cell and cannot be changed here.</span>
                </div>
              </div>

              {/* Editable Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Personal Email</label>
                <input
                  type="email"
                  name="personal_email"
                  value={formData.personal_email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">GitHub Profile URL</label>
                <input
                  type="url"
                  name="github_url"
                  placeholder="https://github.com/username"
                  value={formData.github_url}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">LinkedIn Profile URL</label>
                <input
                  type="url"
                  name="linkedin_url"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedin_url}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Academic information is strictly maintained by the Placement Cell Admin. 
              If any of the information below is incorrect, please contact the placement office directly to request a correction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Student ID</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.student_id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Degree</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.degree}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Branch</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.branch}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Academic Year</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.academic_year === 'pre_final_year' ? 'Pre-Final Year' : 'Final Year'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Current CGPA</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.cgpa || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">Active Backlogs</p>
              <p className={`mt-1 text-lg font-semibold ${profile.active_backlogs > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {profile.active_backlogs}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">10th Percentage</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.tenth_percentage ? `${profile.tenth_percentage}%` : 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase">12th Percentage</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{profile.twelfth_percentage ? `${profile.twelfth_percentage}%` : 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
