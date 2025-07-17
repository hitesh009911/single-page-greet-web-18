import User from '../models/User.js';
import DiagnosticCenter from '../models/DiagnosticCenter.js';
import Appointment from '../models/Appointment.js';
import DiagnosticTest from '../models/DiagnosticTest.js';

// Get Dashboard Stats for Diagnostic Center Admin
const getDiagnosticCenterDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'diagnostic_center_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only diagnostic center admins can access this resource.'
      });
    }

    // Get the diagnostic center for this admin
    const diagnosticCenter = await DiagnosticCenter.findOne({ adminId: userId });
    
    if (!diagnosticCenter) {
      return res.status(404).json({
        success: false,
        message: 'No diagnostic center found for this admin'
      });
    }

    // Get total appointments for this center
    const totalAppointments = await Appointment.countDocuments({ 
      diagnosticCenterId: diagnosticCenter._id 
    });

    // Get total tests for this center
    const totalTests = await DiagnosticTest.countDocuments({ 
      diagnosticCenter: diagnosticCenter._id,
      isActive: true 
    });

    // Get recent appointments for this center
    const recentAppointments = await Appointment.find({ 
      diagnosticCenterId: diagnosticCenter._id 
    })
      .populate('patientId', 'name email phone')
      .populate('testId', 'name category price')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get appointment stats by status for this center
    const appointmentStats = await Appointment.aggregate([
      { $match: { diagnosticCenterId: diagnosticCenter._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAppointments = await Appointment.countDocuments({
      diagnosticCenterId: diagnosticCenter._id,
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    res.status(200).json({
      success: true,
      data: {
        diagnosticCenter: {
          _id: diagnosticCenter._id,
          name: diagnosticCenter.name,
          address: diagnosticCenter.address,
          phone: diagnosticCenter.phone,
          email: diagnosticCenter.email
        },
        stats: {
          totalAppointments,
          totalTests,
          todaysAppointments,
          recentAppointments,
          appointmentStats
        }
      }
    });
  } catch (error) {
    console.error('Get diagnostic center dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
};

// Get all testers/staff for the diagnostic center
const getCenterStaff = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'diagnostic_center_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const diagnosticCenter = await DiagnosticCenter.findOne({ adminId: userId });
    
    if (!diagnosticCenter) {
      return res.status(404).json({
        success: false,
        message: 'No diagnostic center found for this admin'
      });
    }

    // Get all staff members for this center
    const staff = await User.find({ 
      diagnosticCenterId: diagnosticCenter._id.toString(),
      role: { $in: ['diagnostic_center_admin', 'patient'] }
    }).select('-password');

    res.status(200).json({
      success: true,
      data: {
        staff,
        centerName: diagnosticCenter.name
      }
    });
  } catch (error) {
    console.error('Get center staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get center staff',
      error: error.message
    });
  }
};

// Add new tester/staff to diagnostic center
const addCenterStaff = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'diagnostic_center_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const diagnosticCenter = await DiagnosticCenter.findOne({ adminId: userId });
    
    if (!diagnosticCenter) {
      return res.status(404).json({
        success: false,
        message: 'No diagnostic center found for this admin'
      });
    }

    const { name, email, password, phone, role = 'patient' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new staff member
    const newStaff = await User.create({
      name,
      email,
      password,
      phone,
      role,
      diagnosticCenterId: diagnosticCenter._id.toString()
    });

    res.status(201).json({
      success: true,
      message: 'Staff member added successfully',
      data: {
        staff: {
          _id: newStaff._id,
          name: newStaff.name,
          email: newStaff.email,
          role: newStaff.role,
          phone: newStaff.phone
        }
      }
    });
  } catch (error) {
    console.error('Add center staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add staff member',
      error: error.message
    });
  }
};

// Get appointments for this diagnostic center
const getCenterAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'diagnostic_center_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const diagnosticCenter = await DiagnosticCenter.findOne({ adminId: userId });
    
    if (!diagnosticCenter) {
      return res.status(404).json({
        success: false,
        message: 'No diagnostic center found for this admin'
      });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    let query = { diagnosticCenterId: diagnosticCenter._id };
    
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phone')
      .populate('testId', 'name category price')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: -1 });

    const total = await Appointment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        appointments,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    console.error('Get center appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get appointments',
      error: error.message
    });
  }
};

// Get tests for this diagnostic center
const getCenterTests = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'diagnostic_center_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const diagnosticCenter = await DiagnosticCenter.findOne({ adminId: userId });
    
    if (!diagnosticCenter) {
      return res.status(404).json({
        success: false,
        message: 'No diagnostic center found for this admin'
      });
    }

    const tests = await DiagnosticTest.find({ 
      diagnosticCenter: diagnosticCenter._id,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: {
        tests,
        centerName: diagnosticCenter.name
      }
    });
  } catch (error) {
    console.error('Get center tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tests',
      error: error.message
    });
  }
};

// Add new test to diagnostic center
const addCenterTest = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user || user.role !== 'diagnostic_center_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only diagnostic center admins can add tests.'
      });
    }

    const diagnosticCenter = await DiagnosticCenter.findOne({ adminId: userId });
    
    if (!diagnosticCenter) {
      return res.status(404).json({
        success: false,
        message: 'No diagnostic center found for this admin'
      });
    }

    const {
      name,
      description,
      category,
      price,
      duration,
      preparationInstructions,
      requirements
    } = req.body;

    // Validate required fields
    if (!name || !category || !price || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, category, price, and duration'
      });
    }

    // Check if test with same name already exists for this center
    const existingTest = await DiagnosticTest.findOne({ 
      name: name.trim(),
      diagnosticCenter: diagnosticCenter._id,
      isActive: true
    });

    if (existingTest) {
      return res.status(400).json({
        success: false,
        message: 'A test with this name already exists in your center'
      });
    }

    // Create new test specifically for this diagnostic center
    // This ensures test is only visible and available for this center
    const newTest = await DiagnosticTest.create({
      name: name.trim(),
      description: description?.trim() || '',
      category,
      price: parseFloat(price),
      duration: parseInt(duration),
      preparationInstructions: preparationInstructions?.trim() || '',
      requirements: requirements || [],
      diagnosticCenter: diagnosticCenter._id, // This binds the test to the specific center
      isActive: true
    });

    // Populate the center information for response
    await newTest.populate('diagnosticCenter', 'name address');

    res.status(201).json({
      success: true,
      message: `Test "${newTest.name}" added successfully to ${diagnosticCenter.name}`,
      data: {
        test: newTest,
        centerInfo: {
          id: diagnosticCenter._id,
          name: diagnosticCenter.name
        }
      }
    });
  } catch (error) {
    console.error('Add center test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add test to your center',
      error: error.message
    });
  }
};

// Update Test (Diagnostic Center Admin)
const updateCenterTest = async (req, res) => {
  try {
    const userId = req.user.id;
    const testId = req.params.id;
    const updates = req.body;

    // Get the diagnostic center for this admin
    const diagnosticCenter = await DiagnosticCenter.findOne({ adminId: userId });
    
    if (!diagnosticCenter) {
      return res.status(404).json({
        success: false,
        message: 'No diagnostic center found for this admin'
      });
    }

    // Find the test and verify it belongs to this center
    const test = await DiagnosticTest.findOne({ 
      _id: testId, 
      diagnosticCenter: diagnosticCenter._id 
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or you do not have permission to update it'
      });
    }

    // Update the test
    const updatedTest = await DiagnosticTest.findByIdAndUpdate(
      testId,
      updates,
      { new: true, runValidators: true }
    ).populate('diagnosticCenter', 'name address');

    res.status(200).json({
      success: true,
      message: 'Test updated successfully',
      test: updatedTest
    });
  } catch (error) {
    console.error('Update center test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update test',
      error: error.message
    });
  }
};

// Delete Test (Diagnostic Center Admin)
const deleteCenterTest = async (req, res) => {
  try {
    console.log('Delete test request - User ID:', req.user.id);
    console.log('Delete test request - User role:', req.user.role);
    console.log('Delete test request - Test ID:', req.params.id);
    
    const userId = req.user.id;
    const testId = req.params.id;

    // Get the diagnostic center for this admin
    const diagnosticCenter = await DiagnosticCenter.findOne({ adminId: userId });
    
    if (!diagnosticCenter) {
      return res.status(404).json({
        success: false,
        message: 'No diagnostic center found for this admin'
      });
    }

    // Find the test and verify it belongs to this center
    const test = await DiagnosticTest.findOne({ 
      _id: testId, 
      diagnosticCenter: diagnosticCenter._id 
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found or you do not have permission to delete it'
      });
    }

    // Soft delete the test
    await DiagnosticTest.findByIdAndUpdate(
      testId,
      { isActive: false },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error('Delete center test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete test',
      error: error.message
    });
  }
};
// Upload test results
const uploadTestResults = async (req, res) => {
  try {
    console.log('=== UPLOAD TEST RESULTS ===');
    console.log('Upload test results - User ID:', req.user.id);
    console.log('Upload test results - User role:', req.user.role);
    console.log('Upload test results - Request body:', req.body);
    
    const { appointmentId, summary } = req.body;
    const file = req.file;

    if (!appointmentId) {
      console.log('Missing appointment ID');
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    if (!file) {
      console.log('Missing file');
      return res.status(400).json({
        success: false,
        message: 'File is required'
      });
    }

    console.log('Finding diagnostic center for admin:', req.user.id);
    // Find the diagnostic center for this admin
    const diagnosticCenter = await DiagnosticCenter.findOne({ adminId: req.user.id });
    console.log('Diagnostic center found:', diagnosticCenter ? { id: diagnosticCenter._id, name: diagnosticCenter.name } : 'None');
    
    if (!diagnosticCenter) {
      console.log('No diagnostic center found for this admin');
      return res.status(404).json({
        success: false,
        message: 'No diagnostic center found for this admin'
      });
    }

    console.log('Finding appointment:', appointmentId);
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('diagnosticCenterId')
      .populate('patientId')
      .populate('testId');

    console.log('Appointment found:', appointment ? { 
      id: appointment._id, 
      diagnosticCenterId: appointment.diagnosticCenterId?._id,
      status: appointment.status 
    } : 'None');

    if (!appointment) {
      console.log('Appointment not found');
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    console.log('Checking authorization...');
    console.log('Appointment diagnostic center:', appointment.diagnosticCenterId._id.toString());
    console.log('Admin diagnostic center:', diagnosticCenter._id.toString());

    // Check if the appointment belongs to this diagnostic center
    if (appointment.diagnosticCenterId._id.toString() !== diagnosticCenter._id.toString()) {
      console.log('Authorization failed - centers do not match');
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to upload results for this appointment'
      });
    }

    console.log('Authorization successful, uploading results...');
    // In a real application, you would upload the file to cloud storage
    // For now, we'll just store a mock URL
    const reportUrl = `/uploads/results/${appointmentId}_${file.originalname}`;

    // Update appointment with results
    appointment.results = {
      reportUrl,
      summary: summary || '',
      uploadedAt: new Date()
    };

    await appointment.save();
    console.log('Results uploaded successfully');

    res.status(200).json({
      success: true,
      message: 'Test results uploaded successfully',
      appointment
    });
  } catch (error) {
    console.error('Upload test results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload test results',
      error: error.message
    });
  }
};

export {
  getDiagnosticCenterDashboard,
  getCenterStaff,
  addCenterStaff,
  getCenterAppointments,
  getCenterTests,
  addCenterTest,
  updateCenterTest,
  deleteCenterTest,
  uploadTestResults
};