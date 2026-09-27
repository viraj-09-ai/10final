const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(verifyToken); // every visitor route requires a logged-in user

router.get('/me', checkRole(['Visitor']), visitorController.getMyVisitorProfile);
router.get('/', checkRole(['Admin', 'Security', 'Employee']), visitorController.getVisitors);
router.get('/:id', checkRole(['Admin', 'Security', 'Employee']), visitorController.getVisitorById);
router.post('/', checkRole(['Admin', 'Security', 'Employee']), upload.single('photo'), visitorController.createVisitor);
router.patch('/:id', checkRole(['Admin', 'Security', 'Employee']), upload.single('photo'), visitorController.updateVisitor);
router.delete('/:id', checkRole(['Admin']), visitorController.deleteVisitor);

module.exports = router;
