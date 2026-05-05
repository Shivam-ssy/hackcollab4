import { useState, useEffect } from 'react';
import { collegeService } from '../../services';

const CollegeManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const data = await collegeService.getAllColleges();
      setColleges(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch colleges');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (collegeId) => {
    try {
      await collegeService.approveCollege(collegeId);
      setColleges(colleges.map(c => 
        c._id === collegeId ? { ...c, isApproved: true, subscriptionStatus: 'ACTIVE' } : c
      ));
      setSuccessMessage('College approved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to approve college');
    }
  };

  const handleSubscriptionUpdate = async (collegeId, status) => {
    try {
      await collegeService.updateSubscription(collegeId, status);
      setColleges(colleges.map(c => 
        c._id === collegeId ? { ...c, subscriptionStatus: status } : c
      ));
      setSuccessMessage(`Subscription updated to ${status}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">College Management</h2>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        {colleges.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No colleges found.</div>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">College Name</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Payment Status</th>
                <th className="py-3 px-6 text-left">Approval</th>
                <th className="py-3 px-6 text-center">Subscription</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm">
              {colleges.map(college => (
                <tr key={college._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left whitespace-nowrap font-medium">{college.name}</td>
                  <td className="py-3 px-6 text-left">{college.email}</td>
                  <td className="py-3 px-6 text-left">
                    <span className={`py-1 px-3 rounded-full text-xs font-bold ${
                      college.paymentStatus === 'COMPLETED' ? 'bg-green-200 text-green-800' :
                      college.paymentStatus === 'FAILED' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {college.paymentStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-left">
                    <span className={`py-1 px-3 rounded-full text-xs font-bold ${
                      college.isApproved ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {college.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <select
                      className="border rounded px-2 py-1 text-sm bg-gray-50"
                      value={college.subscriptionStatus}
                      onChange={(e) => handleSubscriptionUpdate(college._id, e.target.value)}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </td>
                  <td className="py-3 px-6 text-center">
                    {!college.isApproved && (
                      <button
                        onClick={() => handleApprove(college._id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded-md text-sm transition-colors"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CollegeManagement;
