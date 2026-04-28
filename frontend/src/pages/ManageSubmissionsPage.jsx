import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../services';

const ManageSubmissionsPage = () => {
  const { eventId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEventSubmissions(eventId);
      setSubmissions(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchSubmissions();
  }, [eventId]);

  const handleScoreSubmit = async (submissionId, currentScore) => {
    const scoreStr = prompt(`Enter score (current: ${currentScore}):`, currentScore);
    if (scoreStr === null) return;
    const score = Number(scoreStr);
    if (isNaN(score)) return alert('Invalid score');

    const feedback = prompt('Enter feedback (optional):');

    try {
      await eventService.scoreSubmission(eventId, submissionId, { score, feedback });
      alert('Score updated successfully');
      fetchSubmissions();
    } catch (err) {
      alert(err.message || 'Failed to update score');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading submissions...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Submissions</h1>
          <p className="text-gray-600 mt-1">Review team projects and assign scores.</p>
        </div>
        <Link to="/organizerdashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {submissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No submissions have been made yet.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {submissions.map((sub) => (
              <li key={sub._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-700 mb-1">
                      Team: {sub.teamId?.name || 'Unknown Team'}
                    </h3>
                    <p className="text-gray-600 mb-4">{sub.description}</p>
                    <div className="flex space-x-4">
                      {sub.githubUrl && (
                        <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                          GitHub Repo
                        </a>
                      )}
                      {sub.videoUrl && (
                        <a href={sub.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
                          Video Demo
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-2 inline-block">
                      Score: <span className="font-bold text-lg">{sub.score || 0}</span>
                    </div>
                    <div>
                      <button
                        onClick={() => handleScoreSubmit(sub._id, sub.score || 0)}
                        className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded"
                      >
                        Update Score
                      </button>
                    </div>
                  </div>
                </div>
                {sub.feedback && (
                  <div className="mt-4 bg-gray-50 p-3 rounded text-sm text-gray-700 border-l-4 border-indigo-400">
                    <strong>Your Feedback:</strong> {sub.feedback}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ManageSubmissionsPage;
