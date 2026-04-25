const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

router.post('/permissions', roleController.createPermission);
router.post('/', roleController.createRole);
router.post('/assign', roleController.assignRole);
router.get('/', roleController.getRoles);

module.exports = router;
