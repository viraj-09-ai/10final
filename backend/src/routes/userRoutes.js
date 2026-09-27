// Admin-only staff management
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/employees', userController.listEmployees); // any authenticated role (Visitor needs this for the pre-register host dropdown)
router.get('/', checkRole(['Admin']), userController.listUsers);
router.post('/', checkRole(['Admin']), userController.createUser);
router.patch('/:id', checkRole(['Admin']), userController.updateUser);
router.delete('/:id', checkRole(['Admin']), userController.deleteUser);

module.exports = router;
