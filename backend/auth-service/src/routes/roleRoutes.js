const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

router.post('/permissions', roleController.createPermission);
router.get('/permissions', roleController.getPermissions);
router.post('/', roleController.createRole);
router.post('/assign', roleController.assignRole);
router.get('/', roleController.getRoles);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;
