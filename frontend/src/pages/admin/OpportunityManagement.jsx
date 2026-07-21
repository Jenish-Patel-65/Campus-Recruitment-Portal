import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, MapPin, DollarSign, Calendar, Edit2, Trash2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import OpportunityFormModal from '../../components/admin/OpportunityFormModal';
import ConfirmOpportunityDeleteModal from '../../components/admin/ConfirmOpportunityDeleteModal';

const OpportunityManagement = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [opportunityToDelete, setOpportunityToDelete] = useState(null);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/opportunities');
      setOpportunities(response.data.data);
    } catch (error) {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleCreate = () => {
    setSelectedOpportunityId(null);
    setFormModalOpen(true);
  };

  const handleEdit = (id) => {
    setSelectedOpportunityId(id);
    setFormModalOpen(true);
  };

  const handleDelete = (opp) => {
    setOpportunityToDelete(opp);
    setDeleteModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">Open</span>;
      case 'Upcoming':
        return <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200">Upcoming</span>;
      case 'Closed':
        return <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full border border-gray-200">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border-t-4 border-t-indigo-500 border-x border-b border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-indigo-950">Opportunities</h1>
          <p className="mt-1 text-sm text-gray-500">Manage placement and internship opportunities.</p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Opportunity
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-20 bg-gray-50">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No opportunities found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new opportunity.</p>
            <button
              onClick={handleCreate}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Opportunity
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-50/60 border-b border-indigo-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Company & Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Package & Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-900 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-indigo-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl border border-blue-100 shadow-sm">
                          {opp.company_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{opp.company_name}</div>
                          <div className="text-sm text-slate-600">
                            {opp.role} ({opp.opportunity_type === 'summer_internship' ? 'Summer Internship' : opp.opportunity_type === 'winter_internship' ? 'Winter Internship' : opp.opportunity_type === 'winter_internship_job' ? 'Winter Internship + Job' : opp.opportunity_type === 'job' ? 'Job' : opp.opportunity_type})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-700 flex items-center mb-1">
                        <DollarSign className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> {opp.package_stipend}
                      </div>
                      <div className="text-sm text-slate-600 flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-rose-500" /> {opp.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center mb-1">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                        {new Date(opp.registration_start).toLocaleDateString('en-IN')}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-red-400" />
                        {new Date(opp.registration_end).toLocaleDateString('en-IN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(opp.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/opportunities/${opp.id}/applicants`}
                          className="p-1.5 bg-gray-50 text-gray-600 rounded-md border border-gray-200 hover:bg-white hover:text-green-600 hover:border-green-300 transition-colors"
                          title="View Applicants"
                        >
                          <Users className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleEdit(opp.id)}
                          className="p-1.5 bg-gray-50 text-gray-600 rounded-md border border-gray-200 hover:bg-white hover:text-blue-600 hover:border-blue-300 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(opp)}
                          className="p-1.5 bg-gray-50 text-gray-600 rounded-md border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formModalOpen && (
        <OpportunityFormModal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          opportunityId={selectedOpportunityId}
          onSuccess={fetchOpportunities}
        />
      )}

      {deleteModalOpen && (
        <ConfirmOpportunityDeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          opportunity={opportunityToDelete}
          onSuccess={fetchOpportunities}
        />
      )}
    </div>
  );
};

export default OpportunityManagement;
