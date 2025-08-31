export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role;
      if (!userRole) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
      }
      next();
    } catch (err) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

export default { requireRole };

