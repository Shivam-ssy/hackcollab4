import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services';

const TalentSearchPage = () => {
  const { user } = useAuth();
  const [talentPool, setTalentPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTalent = async () => {
      try {
        setLoading(true);
        const data = await authService.getTalentPool();
        setTalentPool(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch talent:', err);
        setError('Failed to load talent pool.');
      } finally {
        setLoading(false);
      }
    };

    fetchTalent();
  }, []);

  const filteredTalent = talentPool.filter(student => {
    const nameMatch = `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const skillMatch = student.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    const collegeMatch = student.collegeId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || skillMatch || collegeMatch;
  });

  if (loading) return <div className="p-8 text-center">Loading talent database...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Talent Search</h1>
      <p className="text-gray-600 mb-8">Discover top students from participating colleges based on skills and performance.</p>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, skill, or college..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTalent.length === 0 ? (
          <p className="text-gray-500 col-span-full">No students match your search criteria.</p>
        ) : (
          filteredTalent.map(student => (
            <div key={student._id} className="bg-white border rounded-lg shadow-sm p-6 hover:shadow-md transition">
              <h3 className="text-xl font-bold text-gray-900">{student.firstName} {student.lastName}</h3>
              <p className="text-sm text-gray-500 mb-4">{student.collegeId?.name || 'No College Assigned'}</p>
              
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {student.skills && student.skills.length > 0 ? (
                    student.skills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">No skills listed</span>
                  )}
                </div>
              </div>

              {student.resumeUrl && (
                <div className="mb-4">
                  <a href={student.resumeUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">
                    View Resume
                  </a>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => alert(`Initiating contact with ${student.firstName}...`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                >
                  Contact Student
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TalentSearchPage;
