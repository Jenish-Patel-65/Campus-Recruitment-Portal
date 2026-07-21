import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, ArrowLeft, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import ApplyModal from '../../components/student/ApplyModal';

const OpportunityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const isPastApplicationView = location.pathname.includes('/student/applications');

  useEffect(() => {
    fetchOpportunityDetails();
  }, [id, isPastApplicationView]);

  const fetchOpportunityDetails = async () => {
    setLoading(true);
    try {
      const endpoint = isPastApplicationView 
        ? `/student/applications/${id}` 
        : `/student/opportunities/${id}`;
      const response = await api.get(endpoint);
      setOpportunity(response.data.data);
    } catch (error) {
      toast.error('Failed to load opportunity details');
      navigate(isPastApplicationView ? '/student/applications' : '/student/opportunities');
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

  if (!opportunity) return null;

  const isRegistrationOpen = opportunity.status === 'Open';
  const canApply = isRegistrationOpen && opportunity.isEligible && !opportunity.alreadyApplied && !isPastApplicationView;

  const getResultBadge = (result) => {
    switch (result) {
      case 'selected':
        return <span className="flex items-center text-green-700 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium border border-green-200"><CheckCircle className="h-4 w-4 mr-1.5" /> Selected</span>;
      case 'rejected':
        return <span className="flex items-center text-red-700 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200"><XCircle className="h-4 w-4 mr-1.5" /> Rejected</span>;
      default:
        return <span className="flex items-center text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200"><Clock className="h-4 w-4 mr-1.5" /> Pending</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <button 
        onClick={() => navigate(isPastApplicationView ? '/student/applications' : '/student/opportunities')}
        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {isPastApplicationView ? 'Back to Applications' : 'Back to Opportunities'}
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 h-16 w-16 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-3xl border border-blue-100 shadow-sm">
                {opportunity.company_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{opportunity.role}</h1>
                <p className="text-lg font-medium text-gray-600 mt-1">{opportunity.company_name}</p>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                    <Briefcase className="h-4 w-4 mr-1.5 text-gray-400" />
                    {opportunity.opportunity_type === 'summer_internship' ? 'Summer Internship' : opportunity.opportunity_type === 'winter_internship' ? 'Winter Internship' : opportunity.opportunity_type === 'winter_internship_job' ? 'Winter Internship + Job' : opportunity.opportunity_type === 'job' ? 'Job' : opportunity.opportunity_type}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                    <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                    {opportunity.location}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                    <DollarSign className="h-4 w-4 mr-1.5 text-gray-400" />
                    {opportunity.package_stipend}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="flex flex-col items-start md:items-end gap-3 mt-4 md:mt-0">
              
              {isPastApplicationView ? (
                // Past Application View Controls
                <div className="flex flex-col items-end space-y-3">
                  {opportunity.hasApplied ? (
                    <>
                      {getResultBadge(opportunity.result)}
                      <button
                        onClick={() => window.open(opportunity.resume_signed_url, '_blank', 'noopener,noreferrer')}
                        disabled={!opportunity.resume_signed_url || opportunity.result !== 'pending'}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <FileText className="h-4 w-4 mr-2 text-blue-500" />
                        View Submitted Resume
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto justify-center font-medium">
                      <XCircle className="h-5 w-5 mr-2 text-gray-400" />
                      Did not apply
                    </div>
                  )}
                  {!opportunity.isEligible && (
                    <p className="text-xs text-gray-500 flex items-center font-medium max-w-[200px] text-right mt-2">
                      Did not meet academic criteria
                    </p>
                  )}
                </div>
              ) : (
                // Active Opportunity View Controls
                <>
                  {opportunity.alreadyApplied ? (
                    <div className="flex items-center bg-green-50 text-green-700 px-4 py-2.5 rounded-lg border border-green-200 shadow-sm w-full md:w-auto justify-center font-medium">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      Application Submitted
                    </div>
                  ) : (
                    <button
                      onClick={() => setApplyModalOpen(true)}
                      disabled={!canApply}
                      className={`px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors w-full md:w-auto ${
                        canApply 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border border-transparent focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                      }`}
                    >
                      Apply Now
                    </button>
                  )}

                  {!opportunity.isEligible && !opportunity.alreadyApplied && (
                    <p className="text-xs text-gray-500 flex items-center font-medium max-w-[200px] text-left md:text-right">
                      You do not meet the academic criteria
                    </p>
                  )}
                  {opportunity.isEligible && !opportunity.alreadyApplied && opportunity.status !== 'Open' && (
                    <p className="text-xs text-gray-500 font-medium">
                      Registration is {opportunity.status.toLowerCase()}
                    </p>
                  )}
                </>
              )}

            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          
          {/* Main Content (Left, 2/3 width) */}
          <div className="md:col-span-2 p-8 space-y-8">
            <section>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                Job Description
              </h3>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-5 rounded-xl border border-gray-100">
                {opportunity.job_description}
              </div>
            </section>
          </div>

          {/* Sidebar (Right, 1/3 width) */}
          <div className="p-8 space-y-8 bg-gray-50/50">
            <section>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                Registration Window
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Starts</p>
                    <p className="text-sm text-gray-900 font-medium">{new Date(opportunity.registration_start).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Ends</p>
                    <p className="text-sm text-gray-900 font-medium">{new Date(opportunity.registration_end).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">
                Academic Criteria
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-gray-500">Minimum CGPA</span>
                  <span className="font-medium text-gray-900">{opportunity.min_cgpa || 'None'}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-500">Max Active Backlogs</span>
                  <span className="font-medium text-gray-900">{opportunity.max_active_backlogs !== null ? opportunity.max_active_backlogs : 'None'}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-500">10th Percentage</span>
                  <span className="font-medium text-gray-900">{opportunity.min_tenth_percentage ? `${opportunity.min_tenth_percentage}%` : 'None'}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-500">12th Percentage</span>
                  <span className="font-medium text-gray-900">{opportunity.min_twelfth_percentage ? `${opportunity.min_twelfth_percentage}%` : 'None'}</span>
                </li>
                {opportunity.additional_eligibility_note && (
                  <li className="pt-2 border-t border-gray-200 mt-2">
                    <span className="block text-xs text-gray-500 mb-1">Additional Notes</span>
                    <span className="text-gray-900 italic text-sm">{opportunity.additional_eligibility_note}</span>
                  </li>
                )}
              </ul>
            </section>
          </div>

        </div>
      </div>

      <ApplyModal 
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        opportunityId={opportunity.id}
        onSuccess={fetchOpportunityDetails}
      />
    </div>
  );
};

export default OpportunityDetails;
