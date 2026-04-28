import React, { useState, useEffect } from 'react';
import { eventService, leaderboardService } from '../services';

const SponsorDashboard = () => {
  const [events, setEvents] = useState([]);
  const [topTalent, setTopTalent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // For mock purposes, fetching all events since companies can see public events to sponsor
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // This should ideally be an endpoint that fetches public events or a specific sponsor feed
        const data = await eventService.getAllEvents();
        setEvents(data || []);

        const talentData = await leaderboardService.getTopPerformers();
        setTopTalent(Array.isArray(talentData) ? talentData : talentData?.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleSponsorClick = (eventId) => {
    alert(`Mock Sponsorship: You have successfully pledged sponsorship for Event ID ${eventId}`);
  };

  if (loading) return <div className="p-8 text-center">Loading sponsorship opportunities...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Sponsor Dashboard</h1>
      <p className="text-gray-600 mb-8">Browse upcoming hackathons and connect your brand with top student talent.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div key={event._id} className="bg-white border rounded-lg shadow-md overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</p>
              <p className="text-gray-700 mb-4 line-clamp-3">{event.description}</p>
              <div className="mt-auto">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {event.sponsors?.length || 0} Current Sponsors
                </span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-200">
              <button
                onClick={() => handleSponsorClick(event._id)}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Become a Sponsor
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-gray-500 col-span-full text-center py-12">No hackathons currently available for sponsorship.</p>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">Top Talent Recruitment Pool</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {topTalent.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">No talent data available yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {topTalent.map((talent, index) => (
              <li key={talent.userId || index} className="p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{talent.userName}</h3>
                  <p className="text-sm text-gray-500">Total Score: <span className="font-bold text-green-600">{talent.totalScore}</span></p>
                  <p className="text-sm text-gray-500">Participated in {talent.eventCount} events</p>
                </div>
                <div>
                  <button onClick={() => alert(`Message sent to ${talent.userName}`)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium">
                    Contact for Interview
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SponsorDashboard;
