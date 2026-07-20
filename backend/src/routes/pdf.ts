import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import Alert from '../models/Alert';
import Resource from '../models/Resource';
import Volunteer from '../models/Volunteer';
import Report from '../models/Report';
import { isDemoMode } from '../config/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { mockAlerts } from './alerts';
import { mockResources } from './resources';
import { mockVolunteers } from './volunteer';
import { mockReports } from './alerts';

const router = Router();

router.get('/situation-report', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    let alerts = [];
    let resources = [];
    let volunteers = [];
    let reports = [];

    // Fetch data based on mode
    if (isDemoMode) {
      alerts = mockAlerts;
      resources = mockResources;
      volunteers = mockVolunteers;
      reports = mockReports;
    } else {
      alerts = await Alert.find();
      resources = await Resource.find();
      volunteers = await Volunteer.find().populate('user', 'name');
      reports = await Report.find().populate('user', 'name');
    }

    // Initialize PDF Document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=disasterguard_situation_report.pdf');
    
    // Pipe PDF directly to response
    doc.pipe(res);

    // Title Block
    doc.rect(0, 0, 612, 100).fill('#0f172a'); // dark slate
    
    doc.fillColor('#38bdf8').fontSize(26).text('DISASTERGUARD AI', 50, 25, { bold: true } as any);
    doc.fillColor('#94a3b8').fontSize(10).text('Emergency Situation Assessment & Coordination Briefing', 50, 60);
    doc.fillColor('#ffffff').fontSize(8).text(`Generated: ${new Date().toLocaleString()}`, 450, 45);

    // Divider Line
    doc.moveDown(5);
    doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 110).lineTo(562, 110).stroke();

    // Summary Section
    doc.fillColor('#0f172a').fontSize(16).text('1. Executive Incident Summary', 50, 130, { underline: true });
    
    const activeCount = alerts.filter(a => a.isActive).length;
    const criticalCount = alerts.filter(a => a.severity === 'Critical' && a.isActive).length;
    const shelterCap = resources
      .filter(r => r.type === 'Shelter')
      .reduce((acc, curr) => acc + (curr.capacity?.available || 0), 0);

    doc.fontSize(11).fillColor('#334155');
    doc.text(`Active Disasters Currently Tracked: ${activeCount}`);
    doc.text(`Critical Danger Threat Sectors: ${criticalCount}`);
    doc.text(`Available Emergency Shelter Bed Space: ${shelterCap} spots`);
    doc.text(`Registered Volunteer Responders on Call: ${volunteers.length}`);

    // Section 2: Active Alerts Table
    doc.moveDown(2);
    doc.fillColor('#0f172a').fontSize(16).text('2. Active Alerts & Hazards Log', 50, doc.y, { underline: true });
    doc.moveDown(0.5);

    alerts.slice(0, 8).forEach((alert, index) => {
      const y = doc.y;
      if (y > 700) doc.addPage();
      
      const badgeColor = alert.severity === 'Critical' ? '#ef4444' : 
                          alert.severity === 'Warning' ? '#f59e0b' : '#3b82f6';
      
      doc.rect(50, doc.y, 8, 35).fill(badgeColor); // Severity color tag
      doc.fillColor('#1e293b').fontSize(11).text(`${index + 1}. ${alert.title}`, 65, doc.y - 35, { bold: true } as any);
      doc.fontSize(9).fillColor('#64748b').text(`Type: ${alert.type} | Severity: ${alert.severity} | Source: ${alert.source}`, 65);
      doc.fillColor('#334155').text(`Details: ${alert.description}`, 65);
      doc.moveDown(1);
    });

    // Section 3: Critical Resources Check
    const currentY = doc.y;
    if (currentY > 600) doc.addPage();
    
    doc.moveDown(1);
    doc.fillColor('#0f172a').fontSize(16).text('3. Facility Capacities & Resource Stockpile', 50, doc.y, { underline: true });
    doc.moveDown(0.5);

    resources.forEach((resItem) => {
      if (doc.y > 700) doc.addPage();
      
      const capPercent = resItem.capacity.total > 0 ? 
        Math.round((resItem.capacity.available / resItem.capacity.total) * 100) : 0;
        
      doc.fillColor('#1e293b').fontSize(10).text(`${resItem.name} (${resItem.type})`, 50, doc.y, { bold: true } as any);
      doc.fontSize(9).fillColor('#475569');
      doc.text(`Status: ${resItem.status} | Available: ${resItem.capacity.available}/${resItem.capacity.total} ${resItem.capacity.unit} (${capPercent}% free)`);
      doc.moveDown(0.5);
    });

    // Section 4: Citizen Emergency Submissions
    if (doc.y > 600) doc.addPage();
    doc.moveDown(1.5);
    doc.fillColor('#0f172a').fontSize(16).text('4. Community Incident Reports', 50, doc.y, { underline: true });
    doc.moveDown(0.5);

    reports.slice(0, 5).forEach((rep) => {
      if (doc.y > 700) doc.addPage();
      
      doc.fillColor('#1e293b').fontSize(10).text(`[${rep.status}] ${rep.title} - ${rep.type}`, 50, doc.y, { bold: true } as any);
      doc.fontSize(9).fillColor('#475569');
      doc.text(`Severity: ${rep.severity} | Location: ${rep.location.address || 'Report Coordinates'}`);
      doc.text(`Description: ${rep.description}`);
      doc.moveDown(0.5);
    });

    // Footer Page Numbering (Cap check)
    let pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      doc.strokeColor('#cbd5e1').lineWidth(0.5).moveTo(50, 750).lineTo(562, 750).stroke();
      doc.fillColor('#94a3b8').fontSize(8).text(
        `DisasterGuard AI Incident Command - Page ${i + 1} of ${pages.count} - Secure Document`,
        50,
        760,
        { align: 'center', width: 512 }
      );
    }

    // Finalize PDF
    doc.end();
  } catch (error: any) {
    console.error('🔴 PDF Generation Failed:', error);
    res.status(500).json({ message: 'Failed to generate incident PDF report.' });
  }
});

export default router;
