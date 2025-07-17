import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Protect routes
const protect = async (req, res, next) => {
  try {
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Headers:', req.headers.authorization);
    
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    console.log('Token found, verifying...');
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { id: decoded.id });
    
    // Get user from token
    const user = await User.findById(decoded.id).populate('diagnosticCenterId');
    console.log('User found:', { 
      id: user?._id, 
      role: user?.role, 
      isActive: user?.isActive,
      diagnosticCenterId: user?.diagnosticCenterId 
    });
    
    if (!user || !user.isActive) {
      console.log('User not found or inactive');
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not found or inactive.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    console.log('Auth middleware successful, proceeding...');
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Access denied. Invalid token.'
    });
  }
};

// Authorize roles
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('Authorization check - Required roles:', roles);
    console.log('Authorization check - User role:', req.user?.role);
    console.log('Authorization check - User ID:', req.user?.id);
    
    if (!roles.includes(req.user.role)) {
      console.log('Authorization failed - Role not in allowed roles');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }
    console.log('Authorization successful');
    next();
  };
};

// Check specific permission
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Missing permission: ${permission}`
      });
    }
    next();
  };
};

export { protect, authorize, checkPermission };
