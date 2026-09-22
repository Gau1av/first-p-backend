const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // 1. Verify Username
  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    const configuredPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const configuredPassword = process.env.ADMIN_PASSWORD;
    if (!configuredPasswordHash && !configuredPassword) {
      return res.status(500).json({ message: 'Admin password is not configured' });
    }

    // Prefer a bcrypt hash in production, while allowing the existing local
    // ADMIN_PASSWORD setting to keep the current deployment working.
    const isMatch = configuredPasswordHash
      ? await bcrypt.compare(password, configuredPasswordHash)
      : password === configuredPassword;

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Issue JWT Token
    const token = jwt.sign(
      { username: process.env.ADMIN_USERNAME, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { username: process.env.ADMIN_USERNAME, role: 'admin' },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;