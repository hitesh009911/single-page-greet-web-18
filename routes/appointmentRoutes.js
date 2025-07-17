import express from 'express';
import {
  createAppointment,
  getUserAppointments,
  getCenterAppointments,
  updateAppointmentStatus,
  updateUserAppointment,
  deleteUserAppointment,
  getUserTestResults
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Patient routes
router.post('/', authorize('patient'), createAppointment);
router.get('/my-appointments', authorize('patient'), getUserAppointments);
router.get('/my-results', authorize('patient'), getUserTestResults);
router.put('/:id', authorize('patient'), updateUserAppointment);
router.delete('/:id', authorize('patient'), deleteUserAppointment);

// Center admin and admin routes
router.get('/center/:centerId?', authorize('admin', 'diagnostic_center_admin'), getCenterAppointments);
router.put('/:id/status', authorize('admin', 'diagnostic_center_admin'), updateAppointmentStatus);

export default router;
