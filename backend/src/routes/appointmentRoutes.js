const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', appointmentController.getAppointments); // scoped by role inside controller
router.post('/invite', checkRole(['Employee', 'Admin']), appointmentController.inviteVisitor);
router.post('/pre-register', checkRole(['Visitor']), appointmentController.preRegister);
router.patch('/:id/approve', checkRole(['Employee', 'Admin']), appointmentController.approveAppointment);

module.exports = router;
