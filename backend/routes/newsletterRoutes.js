const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isValidEmail = (email) => {
  // Simple, practical email check (good enough for newsletter signup)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

module.exports = function (app, authMiddleware, adminMiddleware) {
  const NewsletterSubscriber = require('../models/NewsletterSubscriber');

  // Public: subscribe
  app.post('/api/public/newsletter/subscribe', async (req, res) => {
    try {
      const email = normalizeEmail(req.body && req.body.email);
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ msg: 'Valid email is required' });
      }

      const existing = await NewsletterSubscriber.findOne({ email }).select('_id status');
      if (existing && existing.status === 'subscribed') {
        return res.json({ ok: true, status: 'subscribed', already: true });
      }

      const now = new Date();
      await NewsletterSubscriber.findOneAndUpdate(
        { email },
        {
          $set: {
            email,
            status: 'subscribed',
            subscribedAt: now,
            unsubscribedAt: null,
            source: (req.body && req.body.source) ? String(req.body.source).slice(0, 100) : 'footer',
            ip: req.ip,
            userAgent: req.get('user-agent') || null,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );

      res.json({ ok: true, status: 'subscribed', already: false });
    } catch (err) {
      // Handle duplicate key race gracefully
      if (err && err.code === 11000) {
        return res.json({ ok: true, status: 'subscribed', already: true });
      }
      console.error('Newsletter subscribe error:', err.stack || err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  });

  // Public: unsubscribe (simple email-based; you can swap to token-based later)
  app.post('/api/public/newsletter/unsubscribe', async (req, res) => {
    try {
      const email = normalizeEmail(req.body && req.body.email);
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ msg: 'Valid email is required' });
      }

      const now = new Date();
      const updated = await NewsletterSubscriber.findOneAndUpdate(
        { email },
        { $set: { status: 'unsubscribed', unsubscribedAt: now } },
        { new: true }
      ).select('_id status');

      // Return ok even if the email wasn't found (don’t leak subscriber existence)
      res.json({ ok: true, status: updated ? updated.status : 'unsubscribed' });
    } catch (err) {
      console.error('Newsletter unsubscribe error:', err.stack || err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  });

  // Admin: list subscribers (paged)
  app.get('/api/admin/newsletter/subscribers', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 25));
      const skip = (page - 1) * limit;

      const status = req.query.status ? String(req.query.status) : null;
      const search = req.query.search ? String(req.query.search).trim() : '';

      const filter = {};
      if (status === 'subscribed' || status === 'unsubscribed') filter.status = status;
      if (search) filter.email = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

      const [total, items] = await Promise.all([
        NewsletterSubscriber.countDocuments(filter),
        NewsletterSubscriber.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
    } catch (err) {
      console.error('Admin newsletter list error:', err.stack || err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  });

  // Admin: export CSV
  app.get('/api/admin/newsletter/subscribers/export', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const status = req.query.status ? String(req.query.status) : null;
      const filter = {};
      if (status === 'subscribed' || status === 'unsubscribed') filter.status = status;

      const items = await NewsletterSubscriber.find(filter)
        .sort({ createdAt: -1 })
        .select('email status subscribedAt unsubscribedAt createdAt')
        .lean();

      const header = ['email', 'status', 'subscribedAt', 'unsubscribedAt', 'createdAt'];
      const lines = [header.join(',')];
      for (const item of items) {
        lines.push(
          [
            escapeCsv(item.email),
            escapeCsv(item.status),
            escapeCsv(item.subscribedAt ? new Date(item.subscribedAt).toISOString() : ''),
            escapeCsv(item.unsubscribedAt ? new Date(item.unsubscribedAt).toISOString() : ''),
            escapeCsv(item.createdAt ? new Date(item.createdAt).toISOString() : ''),
          ].join(',')
        );
      }

      const date = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="newsletter-subscribers-${date}.csv"`);
      res.send(lines.join('\n'));
    } catch (err) {
      console.error('Admin newsletter export error:', err.stack || err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  });

  // Admin: delete subscriber
  app.delete('/api/admin/newsletter/subscribers/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const existing = await NewsletterSubscriber.findById(req.params.id).select('_id');
      if (!existing) return res.status(404).json({ msg: 'Subscriber not found' });
      await NewsletterSubscriber.deleteOne({ _id: req.params.id });
      res.json({ ok: true });
    } catch (err) {
      console.error('Admin newsletter delete error:', err.stack || err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  });
};
