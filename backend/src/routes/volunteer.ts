import { Router, Response } from 'express';
import Volunteer from '../models/Volunteer';
import User from '../models/User';
import { isDemoMode } from '../config/db';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';

const router = Router();

// In-Memory Database for Demo Mode
export const mockVolunteers: any[] = [
  {
    id: 'mock-vol-1',
    user: { id: 'mock-citizen-id', name: 'Jane Doe', email: 'citizen@disasterguard.ai' },
    skills: ['First Aid', 'Food Prep'],
    status: 'Available',
    contactPhone: '+1 555-0199',
    currentTask: 'Awaiting deployment',
    joinedAt: new Date(Date.now() - 24 * 3600000)
  }
];

// GET ALL VOLUNTEERS (RESPONDER / ADMIN)
router.get('/', authenticateToken, authorizeRoles('Responder', 'Admin'), async (req: AuthRequest, res: Response) => {
  try {
    if (isDemoMode) {
      return res.json(mockVolunteers);
    }

    const volunteers = await Volunteer.find().populate('user', 'name email skills');
    res.json(volunteers);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// REGISTER TO VOLUNTEER
router.post('/register', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { skills, contactPhone } = req.body;
  if (!skills || !contactPhone || !Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({ message: 'Skills and contact phone are required.' });
  }

  try {
    if (isDemoMode) {
      const exists = mockVolunteers.some(v => v.user.id === req.user?.id);
      if (exists) return res.status(400).json({ message: 'You are already registered as a volunteer.' });

      const newVol = {
        id: `vol-${Date.now()}`,
        user: { id: req.user?.id, name: 'CurrentUser', email: req.user?.email },
        skills,
        status: 'Available' as const,
        contactPhone,
        currentTask: 'Registered. Standing by for instructions.',
        joinedAt: new Date()
      };
      mockVolunteers.push(newVol);
      return res.status(201).json(newVol);
    }

    const volunteerExists = await Volunteer.findOne({ user: req.user?.id });
    if (volunteerExists) {
      return res.status(400).json({ message: 'You are already registered as a volunteer.' });
    }

    const volunteer = new Volunteer({
      user: req.user?.id,
      skills,
      contactPhone,
      status: 'Available'
    });

    await volunteer.save();
    
    // update user skills as well
    await User.findByIdAndUpdate(req.user?.id, { $addToSet: { skills: { $each: skills } } });
    
    const populated = await volunteer.populate('user', 'name email');
    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE VOLUNTEER TASK / STATUS (RESPONDER / ADMIN)
router.put('/update-task', authenticateToken, authorizeRoles('Responder', 'Admin'), async (req: AuthRequest, res: Response) => {
  const { volunteerId, currentTask, status, assignedLocation } = req.body;
  if (!volunteerId) {
    return res.status(400).json({ message: 'Volunteer ID is required.' });
  }

  try {
    if (isDemoMode) {
      const idx = mockVolunteers.findIndex(v => v.id === volunteerId || v._id === volunteerId);
      if (idx === -1) return res.status(404).json({ message: 'Volunteer not found.' });

      if (currentTask !== undefined) mockVolunteers[idx].currentTask = currentTask;
      if (status) mockVolunteers[idx].status = status;
      if (assignedLocation) mockVolunteers[idx].assignedLocation = assignedLocation;

      const updated = mockVolunteers[idx];
      // Broadcast volunteer status change
      const io = req.app.get('io');
      if (io) io.emit('volunteer-updated', updated);

      return res.json(updated);
    }

    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) return res.status(404).json({ message: 'Volunteer record not found.' });

    if (currentTask !== undefined) volunteer.currentTask = currentTask;
    if (status) volunteer.status = status;
    if (assignedLocation) volunteer.assignedLocation = assignedLocation;

    await volunteer.save();
    const populated = await volunteer.populate('user', 'name email');
    
    // Broadcast volunteer status change
    const io = req.app.get('io');
    if (io) io.emit('volunteer-updated', populated);

    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET CURRENT USER VOLUNTEER STATUS
router.get('/my-status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (isDemoMode) {
      const myVol = mockVolunteers.find(v => v.user.id === req.user?.id);
      if (!myVol) return res.status(404).json({ message: 'Not registered as a volunteer.' });
      return res.json(myVol);
    }

    const volunteer = await Volunteer.findOne({ user: req.user?.id }).populate('user', 'name email');
    if (!volunteer) {
      return res.status(404).json({ message: 'Not registered as a volunteer.' });
    }
    res.json(volunteer);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
