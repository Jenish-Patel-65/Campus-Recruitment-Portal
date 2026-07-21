import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Calendar, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/student/opportunities');
      setOpportunities(response.data.data);
    } catch (error) {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200 shadow-sm">Open Now</span>;
      case 'Upcoming':
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200 shadow-sm">Upcoming</span>;
      case 'Closed':
        return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-200 shadow-sm">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full border border-slate-200 shadow-sm">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-indigo-500 border-x border-b border-gray-100">
        <h1 className="text-2xl font-bold text-indigo-950">Opportunities</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse and apply to job and internship opportunities matched with your degree and academic year.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No matching opportunities found</h3>
          <p className="mt-1 text-sm text-gray-500">Check back later when new opportunities are posted by the placement cell.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-indigo-50/60 border-b border-indigo-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Company & Role</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Package & Location</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Deadline</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">View</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {opportunities.map((opp) => (
                <tr 
                  key={opp.id} 
                  onClick={() => window.location.href = `/student/opportunities/${opp.id}`}
                  className="hover:bg-gray-50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl border border-blue-100 shadow-sm">
                        {opp.company_name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{opp.role}</div>
                        <div className="text-sm text-gray-500">{opp.company_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600">
                      <DollarSign className="h-4 w-4 mr-1 text-emerald-500" />
                      {opp.package_stipend}
                    </div>
                    <div className="flex items-center text-xs text-slate-500 mt-1">
                      <MapPin className="h-3.5 w-3.5 mr-1 text-rose-500" />
                      {opp.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(opp.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                      {new Date(opp.registration_end).toLocaleDateString('en-IN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Opportunities;
