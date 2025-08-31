import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    let token;

    // Check for token in cookie
    if (req.cookies?.token) {
      token = req.cookies.token;
    }
    // Check for token in Authorization header
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required',
        details: 'No valid token found'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (jwtError) {
      return res.status(401).json({ 
        message: 'Authentication failed',
        details: 'Invalid or expired token'
      });
    }
  } catch (err) {
    res.status(500).json({ 
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export { authMiddleware as authenticateToken };
export default authMiddleware; 