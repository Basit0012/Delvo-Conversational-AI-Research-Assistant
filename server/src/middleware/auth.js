import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 * Validates 'Authorization: Bearer <token>' header and attaches req.userId
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Unauthorized: Invalid authorization format. Expected Bearer <token>' });
    }

    const token = parts[1];
    const secret = process.env.JWT_SECRET || 'delvo_jwt_secret_dev_key_123456789';

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      }

      req.userId = decoded.userId;
      next();
    });
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Authentication failed' });
  }
};

export default authenticateToken;
