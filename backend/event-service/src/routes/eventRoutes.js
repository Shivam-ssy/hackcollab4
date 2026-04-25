const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const parseGatewayHeaders = require('../middleware/parseGatewayHeaders');

// Apply middleware to parse Gateway headers for all routes
router.use(parseGatewayHeaders);

router.post('/', eventController.createEvent);
router.get('/', eventController.getEvents);
router.post('/:eventId/join', eventController.joinEvent);
router.post('/participation/:participationId/pay', eventController.handlePayment);

module.exports = router;
