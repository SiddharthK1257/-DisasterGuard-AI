import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { isDemoMode } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretdisasterguardkey123!';

// Simple In-Memory User Store for Demo Mode
export const mockUsers = [
  {
    id: 'mock-admin-id',
    name: 'Disaster Guard Admin',
    email: 'admin@disasterguard.ai',
    passwordHash: bcrypt.hashSync('adminpassword123', 10),
    role: 'Admin' as const,
    skills: ['Incident Command', 'Crisis Communications'],
    createdAt: new Date()
  },
  {
    id: 'mock-responder-id',
    name: 'Chief Rescue Officer',
    email: 'responder@disasterguard.ai',
    passwordHash: bcrypt.hashSync('responderpassword123', 10),
    role: 'Responder' as const,
    skills: ['First Aid', 'Search and Rescue', 'Firefighting'],
    createdAt: new Date()
  },
  {
    id: 'mock-citizen-id',
    name: 'Jane Doe',
    email: 'citizen@disasterguard.ai',
    passwordHash: bcrypt.hashSync('citizenpassword123', 10),
    role: 'Citizen' as const,
    skills: ['First Aid'],
    createdAt: new Date()
  }
];

// REGISTER
router.post('/register', async (req: AuthRequest, res: Response) => {
  const { name, email, password, role, skills } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password.' });
  }

  const userRole = role && ['Citizen', 'Responder', 'Admin'].includes(role) ? role : 'Citizen';

  try {
    if (isDemoMode) {
      const exists = mockUsers.find(u => u.email === email.toLowerCase());
      if (exists) return res.status(400).json({ message: 'User already exists.' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        id: `mock-user-${Date.now()}`,
        name,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        role: userRole,
        skills: skills || [],
        createdAt: new Date()
      };
      mockUsers.push(newUser);
      
      const token = jwt.sign({ id: newUser.id, role: newUser.role, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, skills: newUser.skills }
      });
    }

    // MongoDB Mode
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      skills: skills || []
    });

    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, skills: user.skills }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
router.post('/login', async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password.' });
  }

  try {
    if (isDemoMode) {
      const user = mockUsers.find(u => u.email === email.toLowerCase());
      if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

      const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, skills: user.skills }
      });
    }

    // MongoDB Mode
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, skills: user.skills }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET ME
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (isDemoMode) {
      const user = mockUsers.find(u => u.id === req.user?.id);
      if (!user) return res.status(404).json({ message: 'User not found.' });
      return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, skills: user.skills });
    }

    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
