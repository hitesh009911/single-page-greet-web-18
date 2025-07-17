import express from 'express';
import multer from 'multer';
import {
  getDiagnosticCenterDashboard,
  getCenterStaff,
  addCenterStaff,
  getCenterAppointments,
  getCenterTests,
  addCenterTest,
  updateCenterTest,
  deleteCenterTest,
  uploadTestResults
} from '../controllers/diagnosticCenterAdminController.js';
import { protect, authorize } from '../middleware/auth.js';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, and PNG files are allowed'));
    }
  }
});

const router = express.Router();

// All routes require diagnostic center admin authentication
router.use(protect);
router.use(authorize('diagnostic_center_admin'));

// Dashboard route
router.get('/dashboard', getDiagnosticCenterDashboard);

// Staff management routes
router.get('/staff', getCenterStaff);
router.post('/staff', addCenterStaff);

// Appointments and tests routes
router.get('/appointments', getCenterAppointments);
router.get('/tests', getCenterTests);
router.post('/tests', addCenterTest);
router.put('/tests/:id', updateCenterTest);
router.delete('/tests/:id', deleteCenterTest);

// Test results upload route
router.post('/upload-results', upload.single('file'), uploadTestResults);

export default router;