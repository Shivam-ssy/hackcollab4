import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../services';
import { useAuth } from '../context/AuthContext';
import ProjectSubmission from '../components/events/ProjectSubmission';

const TeamManagement = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  
  const [teams, setTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await eventService.getTeamsForEvent(eventId);
      setTeams(data);
      
      const foundMyTeam = data.find(t => t.leaderId === user.id || t.members.some(m => m.userId === user.id));
      setMyTeam(foundMyTeam || null);
    } catch (err) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchTeams();
  }, [eventId]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName) return;
    try {
      await eventService.createTeam({ name: newTeamName, eventId });
      setNewTeamName('');
      fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleJoinRequest = async (teamId) => {
    try {
      await eventService.requestJoinTeam(teamId);
      alert('Join request sent!');
      fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleApprove = async (teamId, targetUserId) => {
    try {
      await eventService.approveJoinRequest(teamId, targetUserId);
      fetchTeams();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading teams...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
        <Link to={`/events/${eventId}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
          Back to Event
        </Link>
      </div>

      {myTeam ? (
        <div className="bg-white shadow rounded-lg p-6 mb-8 border-l-4 border-indigo-500">
          <h2 className="text-2xl font-semibold mb-4">Your Team: {myTeam.name}</h2>
          
          <h3 className="font-medium text-gray-700 mb-2">Members ({myTeam.members.length})</h3>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            {myTeam.members.map(m => (
              <li key={m.userId} className={m.userId === myTeam.leaderId ? 'font-bold' : ''}>
                User ID: {m.userId} {m.userId === myTeam.leaderId ? '(Leader)' : ''}
              </li>
            ))}
          </ul>

          {myTeam.leaderId === user.id && myTeam.pendingRequests.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2 border-t pt-4">Pending Requests</h3>
              <ul className="space-y-3">
                {myTeam.pendingRequests.map(r => (
                  <li key={r.userId} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <span>User ID: {r.userId}</span>
                    <button
                      onClick={() => handleApprove(myTeam._id, r.userId)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {myTeam.leaderId === user.id && (
            <ProjectSubmission 
              eventId={eventId} 
              teamId={myTeam._id} 
              onSuccess={() => fetchTeams()} 
            />
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create a New Team</h2>
          <form onSubmit={handleCreateTeam} className="flex gap-4">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Enter team name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">
              Create Team
            </button>
          </form>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-gray-800">All Teams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(t => (
          <div key={t._id} className="bg-white border rounded-lg shadow-sm p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{t.members.length} member(s)</p>
            </div>
            
            {!myTeam && (
              <button
                onClick={() => handleJoinRequest(t._id)}
                disabled={t.pendingRequests.some(r => r.userId === user.id)}
                className={`w-full py-2 rounded-md font-medium text-sm transition-colors ${
                  t.pendingRequests.some(r => r.userId === user.id)
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {t.pendingRequests.some(r => r.userId === user.id) ? 'Request Pending' : 'Request to Join'}
              </button>
            )}
          </div>
        ))}
        {teams.length === 0 && <p className="text-gray-500 col-span-full">No teams formed yet.</p>}
      </div>
    </div>
  );
};

export default TeamManagement;
