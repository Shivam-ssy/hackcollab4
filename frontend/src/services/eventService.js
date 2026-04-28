import axios from 'axios';

// Base URL for event service
const API_URL = import.meta.env.VITE_API_URL + "/api/events"
// Create axios instance with default config
const eventApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
eventApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Event service functions
const eventService = {
  // Get all events
  getAllEvents: async (filters = {}) => {
    try {
      const response = await eventApi.get('/', { params: filters });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch events');
    }
  },

  // Get my registrations
  getMyRegistrations: async () => {
    try {
      const response = await eventApi.get('/my-registrations');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch my registrations');
    }
  },

  // Get Organizer Stats
  getOrganizerStats: async () => {
    try {
      const response = await eventApi.get('/stats/organizer');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch organizer stats');
    }
  },

  // Get Admin Stats
  getAdminEventStats: async () => {
    try {
      const response = await eventApi.get('/stats/admin');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch admin stats');
    }
  },

  // Get event by ID
  getEventById: async (eventId) => {
    // Validate eventId before making API call
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid _id: ' + eventId);
    }

    try {
      const response = await eventApi.get(`/${eventId}`);
      return response.data.data; // Extract the data from the nested structure
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch event details');
    }
  },

  // Create new event
  createEvent: async (eventData) => {
    try {
      const response = await eventApi.post('/', eventData);
      return response.data.data || response.data; // Extract the data from the nested structure if it exists
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create event');
    }
  },

  // Update event
  updateEvent: async (eventId, eventData) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for update');
    }

    try {
      const response = await eventApi.put(`/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update event');
    }
  },

  // Delete event
  deleteEvent: async (eventId) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for deletion');
    }

    try {
      const response = await eventApi.delete(`/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete event');
    }
  },

  // Join event
  joinEvent: async (eventId) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for joining');
    }

    try {
      const response = await eventApi.post(`/${eventId}/join`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to join event');
    }
  },

  // Pay for event registration
  payForEvent: async (participationId, amount) => {
    if (!participationId) throw new Error('Invalid participation ID');
    try {
      const response = await eventApi.post(`/participation/${participationId}/pay`, { amount });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Payment failed');
    }
  },

  // Cancel registration
  cancelRegistration: async (eventId) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for cancellation');
    }

    try {
      const response = await eventApi.delete(`/${eventId}/register`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel registration');
    }
  },

  // Get registered participants
  getEventParticipants: async (eventId) => {
    if (!eventId || eventId === 'undefined' || eventId === 'null') {
      throw new Error('Invalid event ID for fetching participants');
    }

    try {
      const response = await eventApi.get(`/${eventId}/participants`);
      return response.data.data || []; // Extract the data from the nested structure
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch participants');
    }
  },

  // Team Management
  createTeam: async (teamData) => {
    try {
      const response = await eventApi.post('/teams', teamData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create team');
    }
  },

  getTeamsForEvent: async (eventId) => {
    try {
      const response = await eventApi.get(`/${eventId}/teams`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch teams');
    }
  },

  requestJoinTeam: async (teamId) => {
    try {
      const response = await eventApi.post(`/teams/${teamId}/request`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to request join');
    }
  },

  approveJoinRequest: async (teamId, targetUserId) => {
    try {
      const response = await eventApi.post(`/teams/${teamId}/approve/${targetUserId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve request');
    }
  },

  // Submissions
  submitProject: async (submissionData) => {
    try {
      const response = await eventApi.post('/submissions', submissionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to submit project');
    }
  },

  getEventSubmissions: async (eventId) => {
    try {
      const response = await eventApi.get(`/${eventId}/submissions`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch submissions');
    }
  },

  scoreSubmission: async (eventId, submissionId, scoreData) => {
    try {
      const response = await eventApi.post(`/${eventId}/submissions/${submissionId}/score`, scoreData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to score submission');
    }
  }
};

export default eventService;