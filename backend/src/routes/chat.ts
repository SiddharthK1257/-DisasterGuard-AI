import { Router, Response } from 'express';
import Chat from '../models/Chat';
import { isDemoMode } from '../config/db';
import { getAgentResponse } from '../services/gemini';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// In-Memory Chat Storage for Demo Mode
export const mockChats: Record<string, any[]> = {};

// SEND MESSAGE TO AGENT
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { message, agentName, history } = req.body;
  const userId = req.user?.id;

  if (!message || !agentName) {
    return res.status(400).json({ message: 'Message and Agent Name are required.' });
  }

  try {
    // 1. Call Gemini multi-agent system
    const aiResponse = await getAgentResponse(agentName, message, history || []);

    const userMsg = { sender: 'User' as const, message, timestamp: new Date() };
    const aiMsg = { 
      sender: 'AI' as const, 
      agentName, 
      message: aiResponse.text, 
      timestamp: new Date() 
    };

    // 2. Save dialogue history
    if (isDemoMode) {
      if (!userId) return res.status(400).json({ message: 'User unauthorized' });
      if (!mockChats[userId]) mockChats[userId] = [];
      
      mockChats[userId].push(userMsg, aiMsg);
      return res.json({
        response: aiResponse.text,
        messages: mockChats[userId],
        isDemoMode: aiResponse.isMock
      });
    }

    // MongoDB Mode
    let chat = await Chat.findOne({ user: userId });
    if (!chat) {
      chat = new Chat({ user: userId, messages: [] });
    }

    chat.messages.push(userMsg);
    chat.messages.push(aiMsg);
    chat.updatedAt = new Date();
    await chat.save();

    res.json({
      response: aiResponse.text,
      messages: chat.messages,
      isDemoMode: aiResponse.isMock
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET HISTORY
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    if (isDemoMode) {
      if (!userId) return res.status(400).json({ message: 'User unauthorized' });
      const history = mockChats[userId] || [];
      return res.json(history);
    }

    const chat = await Chat.findOne({ user: userId });
    if (!chat) {
      return res.json([]);
    }
    res.json(chat.messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
