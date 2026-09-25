const express = require('express');
const { body } = require('express-validator');
const Notification = require('../model/notification');
const SupportTicket = require('../model/supportTicket');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const logger = require('../config/logger');

const notificationsRouter = express.Router();

// ─── GET /api/notifications — in-app notification list ────────────────────────
notificationsRouter.get('/api/notifications', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { userId: req.user };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user, isRead: false }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
notificationsRouter.patch('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user }, { isRead: true });
    res.json({ message: 'Notification marked as read.' });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── PATCH /api/notifications/read-all ────────────────────────────────────────
notificationsRouter.patch('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

// ─── Support tickets ──────────────────────────────────────────────────────────
notificationsRouter.post(
  '/api/support/tickets',
  auth,
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('category').optional().isIn(['order', 'payment', 'product', 'account', 'return', 'other']),
  ],
  validate,
  async (req, res) => {
    try {
      const ticket = new SupportTicket({
        userId: req.user,
        subject: req.body.subject,
        message: req.body.message,
        category: req.body.category || 'other',
        orderId: req.body.orderId || null,
      });

      await ticket.save();
      logger.info('Support ticket created', { ticketId: ticket._id, userId: req.user });
      res.status(201).json(ticket);
    } catch (e) {
      logger.error('Support ticket creation error', { error: e.message });
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to create support ticket.' } });
    }
  }
);

notificationsRouter.get('/api/support/tickets', auth, async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (e) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: e.message } });
  }
});

module.exports = notificationsRouter;
