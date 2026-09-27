const express = require('express');
const router = express.Router();
const passController = require('../controllers/passController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/logs', checkRole(['Admin', 'Security', 'Employee']), passController.getLogs);
router.get('/mine', checkRole(['Visitor']), passController.getMyPasses);
router.get('/', checkRole(['Admin', 'Security']), passController.getPasses);
router.get('/:id', passController.getPassById);
router.post('/issue', checkRole(['Admin', 'Security']), passController.issuePass);
router.post('/scan', checkRole(['Admin', 'Security']), passController.scanPass);

module.exports = router;
