const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Login Controller
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please enter username and password' });
    }

    const configuredUsername = process.env.ADMIN_USERNAME;
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (!configuredUsername || !configuredPassword) {
      return res.status(500).json({ message: 'Admin credentials are not configured in .env' });
    }

    // Case-insensitive username check (optional) aur exact password check
    const isUsernameMatch = username.trim().toLowerCase() === configuredUsername.trim().toLowerCase();
    const isPasswordMatch = password === configuredPassword;

    if (!isUsernameMatch || !isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = generateToken(configuredUsername, 'admin');

    return res.status(200).json({
      success: true,
      token,
      user: {
        username: configuredUsername,
        role: 'admin',
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};