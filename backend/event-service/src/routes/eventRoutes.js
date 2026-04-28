const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const parseGatewayHeaders = require('../middleware/parseGatewayHeaders');

const teamController = require('../controllers/teamController');

// Apply middleware to parse Gateway headers for all routes
router.use(parseGatewayHeaders);

// Event Routes
router.post('/', eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/stats/organizer', eventController.getOrganizerStats);
router.get('/stats/admin', eventController.getAdminEventStats);
router.get('/my-registrations', eventController.getMyRegistrations);
router.post('/:eventId/join', eventController.joinEvent);
router.post('/participation/:participationId/pay', eventController.handlePayment);
router.get('/:eventId', eventController.getEventById);
router.put('/:eventId', eventController.updateEvent);
router.delete('/:eventId', eventController.deleteEvent);
router.delete('/:eventId/register', eventController.cancelRegistration);
router.get('/:eventId/participants', eventController.getEventParticipants);

// Team Routes
router.post('/teams', teamController.createTeam);
router.get('/:eventId/teams', teamController.getTeamsForEvent);
router.post('/teams/:teamId/request', teamController.requestJoin);
router.post('/teams/:teamId/approve/:targetUserId', teamController.approveJoin);

const submissionController = require('../controllers/submissionController');
router.post('/submissions', submissionController.createSubmission);
router.get('/:eventId/submissions', submissionController.getSubmissionsForEvent);
router.post('/:eventId/submissions/:submissionId/score', submissionController.scoreSubmission);

module.exports = router;
