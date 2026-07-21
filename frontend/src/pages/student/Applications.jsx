import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, CheckCircle, XCircle, Clock, FileText, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const Applications = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applied');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/student/applications');
      setOpportunities(response.data.data);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const eligibleOpps = opportunities.filter(opp => opp.isEligible && !opp.hasApplied);
  const appliedOpps = opportunities.filter(opp => opp.hasApplied);
  const notEligibleOpps = opportunities.filter(opp => !opp.isEligible && !opp.hasApplied);

  const getResultBadge = (result) => {
    switch (result) {
      case 'selected':
        return <span className="inline-flex items-center text-green-700 bg-green-50 px-2.5 py-1 rounded-md text-xs font-medium border border-green-200"><CheckCircle className="h-3.5 w-3.5 mr-1" /> Selected</span>;
      case 'rejected':
        return <span className="inline-flex items-center text-red-700 bg-red-50 px-2.5 py-1 rounded-md text-xs font-medium border border-red-200"><XCircle className="h-3.5 w-3.5 mr-1" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center text-gray-700 bg-gray-50 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200"><Clock className="h-3.5 w-3.5 mr-1" /> Pending</span>;
    }
  };

  const renderTable = (data, type) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-b-xl border-x border-b border-gray-100">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No opportunities found</h3>
          <p className="mt-1 text-sm text-gray-500">There are no records in this category.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto bg-white rounded-b-xl border border-gray-100 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-50/60 border-b border-indigo-100">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Company & Role</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Package & Location</th>
              {type === 'applied' && (
                <>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Result</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Resume</th>
                </>
              )}
              {type === 'eligible' && (
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Status</th>
              )}
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-indigo-900 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((opp) => (
              <tr
                key={opp.id}
                onClick={() => navigate(`/student/applications/${opp.id}`)}
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl border border-blue-100 shadow-sm">
                      {opp.company_name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">{opp.role}</div>
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

                {type === 'applied' && (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getResultBadge(opp.result)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="truncate max-w-[120px]" title={opp.resume_name}>{opp.resume_name}</span>
                      </div>
                    </td>
                  </>
                )}

                {type === 'eligible' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200">
                      <XCircle className="h-3.5 w-3.5 mr-1 text-gray-400" /> Did not apply
                    </span>
                  </td>
                )}

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors inline-block" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-indigo-500 border-x border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-indigo-950">Applications</h1>
          <p className="mt-1 text-sm text-gray-500">Track and review your application history for past opportunities.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white rounded-t-xl px-2 pt-2">
            <nav className="-mb-px flex space-x-8 px-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('applied')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'applied'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Applied ({appliedOpps.length})
              </button>
              <button
                onClick={() => setActiveTab('eligible')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'eligible'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Not Applied ({eligibleOpps.length})
              </button>
              <button
                onClick={() => setActiveTab('not_eligible')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'not_eligible'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                Not Eligible ({notEligibleOpps.length})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'applied' && renderTable(appliedOpps, 'applied')}
          {activeTab === 'eligible' && renderTable(eligibleOpps, 'eligible')}
          {activeTab === 'not_eligible' && renderTable(notEligibleOpps, 'not_eligible')}
        </div>
      )}
    </div>
  );
};

export default Applications;
