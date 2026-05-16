import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context';
import { eventService } from '../services';

const JudgeDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'JUDGE') {
      navigate('/home');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAssignedEvents = async () => {
      try {
        setLoading(true);
        const assignedEvents = await eventService.getAssignedEvents();
        setEvents(assignedEvents);
      } catch (err) {
        console.error('Failed to fetch assigned events:', err);
        setError('Failed to load your assigned events.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 px-6 py-8">
          <h1 className="text-3xl font-bold text-white">Judge Dashboard</h1>
          <p className="text-indigo-100 mt-2">Welcome back, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Assigned Events</h2>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {events.length === 0 && !error ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No events assigned</h3>
              <p className="text-gray-500 mt-1">You haven't been assigned to judge any events yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium">Assigned</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <Link 
                        to={`/events/${event._id}`} 
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                      <Link 
                        to={`/events/${event._id}/submissions`} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                      >
                        Score Projects
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JudgeDashboardPage;
