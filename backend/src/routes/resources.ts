import { Router, Response } from 'express';
import Resource from '../models/Resource';
import { isDemoMode } from '../config/db';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';
import { generateInitialSeeds } from '../services/disasterData';

const router = Router();
const seeds = generateInitialSeeds();

// In-Memory Database for Demo Mode
export const mockResources: any[] = [...seeds.resources];

// GET ALL RESOURCES
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (isDemoMode) {
      return res.json(mockResources);
    }

    let dbResources = await Resource.find();
    if (dbResources.length === 0) {
      console.log('🌱 Seeding initial emergency resources to Database...');
      dbResources = await Resource.insertMany(seeds.resources) as any;
    }
    res.json(dbResources);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE NEW RESOURCE (RESPONDER / ADMIN ONLY)
router.post('/', authenticateToken, authorizeRoles('Responder', 'Admin'), async (req: AuthRequest, res: Response) => {
  const { name, type, capacity, location, contactPhone, status } = req.body;
  if (!name || !type || !capacity || !location) {
    return res.status(400).json({ message: 'Missing required resource fields.' });
  }

  try {
    const resourceBody = {
      name,
      type,
      capacity,
      location,
      contactPhone,
      status: status || 'Operational',
      lastUpdated: new Date()
    };

    if (isDemoMode) {
      const newResource = { ...resourceBody, id: `resource-${Date.now()}` };
      mockResources.push(newResource);
      return res.status(201).json(newResource);
    }

    const resource = new Resource(resourceBody);
    await resource.save();
    res.status(201).json(resource);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE RESOURCE CAPACITY OR STATUS
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { availableCapacity, status } = req.body;

  try {
    if (isDemoMode) {
      const idx = mockResources.findIndex(r => r.id === id || r._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Resource not found.' });

      if (availableCapacity !== undefined) {
        mockResources[idx].capacity.available = availableCapacity;
      }
      if (status) {
        mockResources[idx].status = status;
      }
      mockResources[idx].lastUpdated = new Date();
      
      const updated = mockResources[idx];
      // Broadcast update via socket
      const io = req.app.get('io');
      if (io) io.emit('resource-updated', updated);

      return res.json(updated);
    }

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: 'Resource not found.' });

    if (availableCapacity !== undefined) {
      resource.capacity.available = availableCapacity;
    }
    if (status) {
      resource.status = status;
    }
    resource.lastUpdated = new Date();

    await resource.save();
    
    // Broadcast update via socket
    const io = req.app.get('io');
    if (io) io.emit('resource-updated', resource);

    res.json(resource);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
