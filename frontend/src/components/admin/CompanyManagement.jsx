import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchPendingCompanies = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const authServiceUrl = 'https://hackcollab-auth-service.onrender.com' || 'http://localhost:8001';
      
      const res = await axios.get(`${authServiceUrl}/api/admin/companies/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCompanies(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch pending companies:', err);
      setError('Failed to load pending companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const handleApprove = async (companyId) => {
    try {
      const token = localStorage.getItem('token');
      const authServiceUrl = 'https://hackcollab-auth-service.onrender.com' || 'http://localhost:8001';
      
      await axios.put(`${authServiceUrl}/api/admin/companies/${companyId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Remove the approved company from the list
      setCompanies(companies.filter(c => c._id !== companyId));
      alert('Company approved successfully!');
    } catch (err) {
      console.error('Failed to approve company:', err);
      alert('Failed to approve company');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading companies...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Companies</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Review and approve companies waiting to join the platform.
          </p>
        </div>
      </div>
      
      {companies.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No pending companies found.
        </div>
      ) : (
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {companies.map((company) => (
              <li key={company._id} className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-md font-bold text-gray-900">{company.name}</h4>
                  <p className="text-sm text-gray-500">{company.email}</p>
                  {company.website && <p className="text-xs text-blue-500"><a href={company.website} target="_blank" rel="noreferrer">{company.website}</a></p>}
                  {company.industry && <p className="text-xs text-gray-400">Industry: {company.industry}</p>}
                </div>
                <div>
                  <button
                    onClick={() => handleApprove(company._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
                  >
                    Approve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
