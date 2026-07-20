import { Router, Response } from 'express';
import Alert from '../models/Alert';
import Report from '../models/Report';
import { isDemoMode } from '../config/db';
import { authenticateToken, authorizeRoles, AuthRequest } from '../middleware/auth';
import { 
  fetchUSGSEarthquakes, 
  fetchNASAEonet, 
  generateInitialSeeds,
  ExtractedAlert 
} from '../services/disasterData';

const router = Router();
const seeds = generateInitialSeeds();

// In-Memory Database for Demo Mode
export const mockAlerts: any[] = [...seeds.alerts];
export const mockReports: any[] = [
  {
    id: 'mock-report-1',
    user: 'mock-citizen-id',
    title: 'Flooding in basement and street',
    description: 'The street drains are overflowing and water is starting to enter ground floors. Need drainage clearance.',
    type: 'Flooding',
    severity: 'High',
    location: { lat: 37.7580, lng: -122.4350, address: 'Mission District, SF' },
    status: 'Pending',
    createdAt: new Date(Date.now() - 30 * 60000), // 30 mins ago
    updatedAt: new Date(Date.now() - 30 * 60000)
  },
  {
    id: 'mock-report-2',
    user: 'mock-responder-id',
    title: 'Downed Power Lines on Main St',
    description: 'A large tree branch has fallen over power lines causing sparks and blockages. Power is out in adjacent blocks.',
    type: 'Blockage',
    severity: 'Critical',
    location: { lat: 37.7715, lng: -122.4220, address: 'Hayes Valley, SF' },
    status: 'Verified',
    createdAt: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    updatedAt: new Date(Date.now() - 1.5 * 3600000)
  }
];

// Helper to broadcast WebSocket alerts
const broadcastNewAlert = (req: any, alertData: any) => {
  const io = req.app.get('io');
  if (io) {
    io.emit('new-alert', alertData);
    console.log('📢 Broadcasted active alert via WebSockets:', alertData.title);
  }
};

// Helper to broadcast incident reports
const broadcastNewReport = (req: any, reportData: any) => {
  const io = req.app.get('io');
  if (io) {
    io.emit('new-report', reportData);
    console.log('📢 Broadcasted citizen report via WebSockets:', reportData.title);
  }
};

// GET ALL ALERTS (WITH SYNC PARAMETER)
router.get('/', async (req: AuthRequest, res: Response) => {
  const sync = req.query.sync === 'true';

  try {
    if (sync) {
      console.log('🔄 Syncing live disaster feeds from USGS and NASA EONET...');
      const usgsAlerts = await fetchUSGSEarthquakes();
      const nasaAlerts = await fetchNASAEonet();
      const syncedAlerts = [...usgsAlerts, ...nasaAlerts];

      if (isDemoMode) {
        // In-memory merging
        syncedAlerts.forEach((alert) => {
          const exists = mockAlerts.some(
            (a) => a.title === alert.title && Math.abs(a.location.lat - alert.location.lat) < 0.01
          );
          if (!exists) {
            const extendedAlert = { ...alert, id: `synced-${Date.now()}-${Math.random().toString(36).substr(2, 4)}` };
            mockAlerts.unshift(extendedAlert);
            broadcastNewAlert(req, extendedAlert);
          }
        });
        return res.json(mockAlerts);
      } else {
        // MongoDB mode: Save unique synced alerts
        for (const alert of syncedAlerts) {
          const exists = await Alert.findOne({ 
            title: alert.title,
            'location.lat': alert.location.lat,
            'location.lng': alert.location.lng
          });
          if (!exists) {
            const newAlert = new Alert(alert);
            await newAlert.save();
            broadcastNewAlert(req, newAlert);
          }
        }
      }
    }

    if (isDemoMode) {
      return res.json(mockAlerts);
    }

    // If DB is empty, seed it
    let dbAlerts = await Alert.find().sort({ timestamp: -1 });
    if (dbAlerts.length === 0) {
      console.log('🌱 Database empty, seeding initial disaster alerts...');
      dbAlerts = await Alert.insertMany(seeds.alerts);
    }
    res.json(dbAlerts);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE MANUAL ALERT (RESPONDER / ADMIN ONLY)
router.post('/', authenticateToken, authorizeRoles('Responder', 'Admin'), async (req: AuthRequest, res: Response) => {
  const { title, type, severity, description, location, source, details } = req.body;
  if (!title || !type || !severity || !description || !location) {
    return res.status(400).json({ message: 'Missing required alert parameters.' });
  }

  try {
    const alertBody = {
      title,
      type,
      severity,
      description,
      location,
      source: source || 'Local Authority',
      isActive: true,
      timestamp: new Date(),
      details: details || {}
    };

    if (isDemoMode) {
      const newAlert = { ...alertBody, id: `manual-${Date.now()}` };
      mockAlerts.unshift(newAlert);
      broadcastNewAlert(req, newAlert);
      return res.status(201).json(newAlert);
    }

    const alert = new Alert(alertBody);
    await alert.save();
    broadcastNewAlert(req, alert);
    res.status(201).json(alert);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE ALERT STATUS
router.put('/:id', authenticateToken, authorizeRoles('Responder', 'Admin'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { isActive, severity, description } = req.body;

  try {
    if (isDemoMode) {
      const alertIndex = mockAlerts.findIndex(a => a.id === id || a._id === id);
      if (alertIndex === -1) return res.status(404).json({ message: 'Alert not found.' });

      mockAlerts[alertIndex] = {
        ...mockAlerts[alertIndex],
        ...(isActive !== undefined && { isActive }),
        ...(severity && { severity }),
        ...(description && { description })
      };
      
      const updated = mockAlerts[alertIndex];
      // Broadcast update
      const io = req.app.get('io');
      if (io) io.emit('alert-updated', updated);

      return res.json(updated);
    }

    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ message: 'Alert not found.' });

    if (isActive !== undefined) alert.isActive = isActive;
    if (severity) alert.severity = severity;
    if (description) alert.description = description;

    await alert.save();
    // Broadcast update
    const io = req.app.get('io');
    if (io) io.emit('alert-updated', alert);

    res.json(alert);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// SUBMIT CITIZEN REPORT
router.post('/report', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { title, description, type, severity, location } = req.body;
  if (!title || !description || !type || !severity || !location) {
    return res.status(400).json({ message: 'Missing required report fields.' });
  }

  try {
    const reportBody = {
      user: req.user?.id,
      title,
      description,
      type,
      severity,
      location,
      status: 'Pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isDemoMode) {
      const newReport = { 
        ...reportBody, 
        id: `report-${Date.now()}`,
        userName: req.user?.email || 'Anonymous Citizen'
      };
      mockReports.unshift(newReport);
      broadcastNewReport(req, newReport);
      return res.status(201).json(newReport);
    }

    const report = new Report(reportBody);
    await report.save();
    
    // Populate username for WebSocket emit
    const populated = await report.populate('user', 'name email');
    broadcastNewReport(req, populated);
    
    res.status(201).json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET CITIZEN REPORTS
router.get('/reports', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (isDemoMode) {
      return res.json(mockReports);
    }

    const reports = await Report.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// VERIFY OR RESOLVE CITIZEN REPORT
router.put('/report/:id', authenticateToken, authorizeRoles('Responder', 'Admin'), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // Verified, Resolved, Rejected

  if (!status || !['Verified', 'Resolved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid report status value.' });
  }

  try {
    if (isDemoMode) {
      const idx = mockReports.findIndex(r => r.id === id || r._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Report not found.' });

      mockReports[idx].status = status;
      mockReports[idx].updatedAt = new Date();
      const updatedReport = mockReports[idx];

      // If status is "Verified", automatically spin up an Active Alert
      if (status === 'Verified') {
        const correspondingAlert = {
          id: `manual-from-report-${Date.now()}`,
          title: `Verified: ${updatedReport.title}`,
          type: updatedReport.type === 'Flooding' ? 'Flood' : 
                updatedReport.type === 'Fire' ? 'Wildfire' : 
                updatedReport.type === 'Structural Damage' ? 'Landslide' : 
                updatedReport.type === 'Blockage' ? 'Other' : 'Other',
          severity: updatedReport.severity === 'Low' ? 'Info' :
                    updatedReport.severity === 'Medium' ? 'Warning' : 'Critical',
          description: updatedReport.description,
          location: updatedReport.location,
          source: 'Local Authority',
          isActive: true,
          timestamp: new Date(),
          details: { reportId: updatedReport.id }
        };
        mockAlerts.unshift(correspondingAlert);
        broadcastNewAlert(req, correspondingAlert);
      }

      return res.json(updatedReport);
    }

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    report.status = status;
    report.updatedAt = new Date();
    await report.save();

    if (status === 'Verified') {
      const typeMapping: Record<string, any> = {
        'Flooding': 'Flood',
        'Fire': 'Wildfire',
        'Structural Damage': 'Landslide',
        'Blockage': 'Other',
        'Medical Emergency': 'Other',
        'Other': 'Other'
      };

      const severityMapping: Record<string, any> = {
        'Low': 'Info',
        'Medium': 'Warning',
        'High': 'Critical',
        'Critical': 'Critical'
      };

      const correspondingAlert = new Alert({
        title: `Verified: ${report.title}`,
        type: typeMapping[report.type] || 'Other',
        severity: severityMapping[report.severity] || 'Warning',
        description: report.description,
        location: report.location,
        source: 'Local Authority',
        isActive: true,
        details: { reportId: report._id }
      });
      await correspondingAlert.save();
      broadcastNewAlert(req, correspondingAlert);
    }

    const populated = await report.populate('user', 'name email');
    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
