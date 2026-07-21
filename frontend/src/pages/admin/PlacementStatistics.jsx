import React, { useState, useEffect } from 'react';
import { Users, Building2, Briefcase, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const PlacementStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/statistics');
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load placement statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-indigo-500 border-x border-b border-gray-100">
        <h1 className="text-2xl font-bold text-indigo-950">Placement Statistics</h1>
        <p className="mt-1 text-sm text-gray-500">Aggregate metrics for the current placement season.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Final Year Stats */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center border-b pb-2">
            <Briefcase className="h-5 w-5 mr-2 text-indigo-600" />
            Final Year (Jobs & Winter Internships)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
              <Building2 className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Companies</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.finalYearCompanies}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
              <Briefcase className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Opportunities</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.finalYearOpportunities}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
              <FileText className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Applications</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.finalYearApplications}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
              <Users className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Students</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.finalYearStudents}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
              <CheckCircle className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Selections</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.finalYearSelections}</p>
            </div>
          </div>
        </div>

        {/* Pre-Final Year Stats */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center border-b pb-2">
            <Briefcase className="h-5 w-5 mr-2 text-violet-600" />
            Pre-Final Year (Summer Internships)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
              <Building2 className="h-6 w-6 text-violet-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Companies</p>
              <p className="text-3xl font-bold text-violet-600">{stats.preFinalYearCompanies}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
              <Briefcase className="h-6 w-6 text-violet-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Opportunities</p>
              <p className="text-3xl font-bold text-violet-600">{stats.preFinalYearOpportunities}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
              <FileText className="h-6 w-6 text-violet-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Applications</p>
              <p className="text-3xl font-bold text-violet-600">{stats.preFinalYearApplications}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
              <Users className="h-6 w-6 text-violet-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Students</p>
              <p className="text-3xl font-bold text-violet-600">{stats.preFinalYearStudents}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 text-center">
              <CheckCircle className="h-6 w-6 text-violet-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Selections</p>
              <p className="text-3xl font-bold text-violet-600">{stats.preFinalYearSelections}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlacementStatistics;
