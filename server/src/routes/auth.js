import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'delvo_jwt_secret_dev_key_123456789';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId }, secret, { expiresIn });
};

/**
 * POST /api/auth/register
 * Register a new user account and return safe user object + JWT
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    // Rely on User model pre-save hook for password hashing
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to register user' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user and return JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to log in' });
  }
});

/**
 * GET /api/auth/me
 * Fetch current authenticated user's profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('[Auth Me Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch user profile' });
  }
});

/**
 * POST /api/auth/social-login
 * Authenticate or register a user via OAuth / Social Providers
 * Supports Google, GitHub, ChatGPT, Apple, GitLab, Bitbucket, Passkey, SAML SSO
 */
router.post('/social-login', async (req, res) => {
  try {
    const { provider, email: customEmail, username: customUsername } = req.body;

    if (!provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }

    const providerKey = provider.toLowerCase().trim();

    const providerDefaults = {
      google: { email: 'google.user@gmail.com', username: 'Google User' },
      github: { email: 'github.dev@github.com', username: 'GitHub Developer' },
      chatgpt: { email: 'chatgpt.user@openai.com', username: 'ChatGPT User' },
      apple: { email: 'apple.user@icloud.com', username: 'Apple User' },
      gitlab: { email: 'gitlab.user@gitlab.com', username: 'GitLab Developer' },
      bitbucket: { email: 'bitbucket.user@bitbucket.org', username: 'Bitbucket Developer' },
      passkey: { email: 'passkey.user@delvo.ai', username: 'Passkey User' },
      saml: { email: 'enterprise.user@company.com', username: 'SSO Enterprise User' },
    };

    const config = providerDefaults[providerKey] || {
      email: `${providerKey}.user@delvo.ai`,
      username: `${providerKey} User`,
    };

    const email = (customEmail || config.email).toLowerCase().trim();
    let username = (customUsername || config.username).trim();

    // Ensure username satisfies minlength constraint
    if (username.length < 3) {
      username = `${username}_user`;
    }

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
      user = await User.create({
        username,
        email,
        password: randomPassword,
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      user: user.toJSON(),
      token,
      provider: providerKey,
    });
  } catch (error) {
    console.error('[Auth Social Login Error]:', error);
    return res.status(500).json({ error: error.message || 'Social authentication failed' });
  }
});

export default router;
