const express = require('express');

// Try to load sanitize-html once for server-side sanitization. If it's not
// available, `sanitizeHtml` will be null and we fall back to storing raw HTML
// but warn in logs. Loading once avoids repeated require() calls.
let sanitizeHtml = null;
try {
    sanitizeHtml = require('sanitize-html');
} catch (e) {
    console.warn('sanitize-html not installed; server-side HTML sanitization disabled.');
}

// Optional markdown->HTML converter for syncing markdown Notes into Topic articles (which are rendered as HTML).
let marked = null;
try {
    marked = require('marked');
} catch (e) {
    // optional
}

function markdownToHtml(inputMarkdown) {
    if (!inputMarkdown) return '';
    if (!marked) return String(inputMarkdown);
    try {
        return marked.parse(String(inputMarkdown), { mangle: false, headerIds: false });
    } catch (e) {
        console.warn('marked.parse failed:', e.message);
        return String(inputMarkdown);
    }
}

// Helper for temporary debug logging. Enable by setting environment
// variable DEBUG_ADMIN=1 when starting the server.
function adminDebug(...args) {
    if (process.env.DEBUG_ADMIN === '1') {
        try {
            console.debug('[ADMIN-DEBUG]', ...args);
        } catch (e) {
            // Defensive: never allow logging to throw and crash request handlers
            console.error('[ADMIN-DEBUG] logging failed', e && e.message);
        }
    }
}

// Centralized sanitization helper with a conservative allowlist. Use this to
// sanitize user/author HTML before saving to the DB. Iframes are allowed only
// for common embedders (YouTube/Vimeo) via `allowedIframeHostnames`.
function cleanHtml(inputHtml) {
    if (!sanitizeHtml || !inputHtml) return inputHtml;
    try {
        // Tighten rules: disallow iframes entirely, strip javascript: hrefs,
        // and rewrite external image URLs to go through our proxy endpoint so
        // clients don't directly load remote images (avoids mixed content/leakage).
        const options = {
            // Start from defaults but ensure iframe is NOT allowed
            allowedTags: (sanitizeHtml.defaults.allowedTags || []).concat(['h1','h2','h3','h4','h5','h6','img','figure','figcaption','table','thead','tbody','tr','th','td','pre','code','blockquote','ul','ol','li','p','a','strong','em']),
            allowedAttributes: Object.assign({}, sanitizeHtml.defaults.allowedAttributes, {
                a: (sanitizeHtml.defaults.allowedAttributes.a || []).concat(['href','name','target','rel']),
                img: ['src','alt','width','height','loading']
            }),
            // Only allow safe URL schemes for links — remove javascript: scheme
            allowedSchemes: ['http','https','mailto','tel'],
            // Transform tags for additional safety: ensure img[src] is same-origin or rewritten to proxy
            transformTags: {
                'img': function(tagName, attribs) {
                    const src = attribs.src || '';
                    // Treat relative or same-origin (starting with '/') as allowed
                    if (src.startsWith('/')) {
                        return { tagName: 'img', attribs: { src: src, alt: attribs.alt || '' } };
                    }
                    // If src already points to our proxy, keep it
                    if (src.startsWith('/api/admin/util/proxy')) {
                        return { tagName: 'img', attribs: { src: src, alt: attribs.alt || '' } };
                    }
                    // Otherwise rewrite to proxy endpoint so backend fetches and serves it
                    try {
                        const encoded = encodeURIComponent(src);
                        return { tagName: 'img', attribs: { src: '/api/admin/util/proxy?url=' + encoded, alt: attribs.alt || '' } };
                    } catch (e) {
                        // On any error, drop the src to avoid loading remote content
                        return { tagName: 'img', attribs: { alt: attribs.alt || '' } };
                    }
                }
            },
            // Disallow iframes by not including iframe in allowedTags and not providing
            // allowed iframe hostnames. This prevents arbitrary embedded frames.
        };
        return sanitizeHtml(inputHtml, options);
    } catch (e) {
        console.warn('sanitize-html failed during cleanHtml:', e.message);
        return inputHtml;
    }
}

function normalizeTopicPayload(body) {
    if (!body || typeof body !== 'object') return body;

    // Back-compat: if clients still send topic-level notes/videoURL/quizId,
    // convert them into a single article entry.
    const hasLegacy = !!(body.notes || body.videoURL || body.quizId);
    const hasArticles = Array.isArray(body.articles);

    if (hasLegacy && !hasArticles) {
        const heading = typeof body.title === 'string' ? body.title : '';
        const content = typeof body.notes === 'string' ? body.notes : '';
        const videoURL = typeof body.videoURL === 'string' ? body.videoURL : '';
        const quizId = body.quizId || null;

        body.articles = [
            {
                heading,
                content,
                videoURL,
                quizId,
                order: 0,
            },
        ];
    }

    // Topic schema no longer supports these fields
    if (Object.prototype.hasOwnProperty.call(body, 'notes')) delete body.notes;
    if (Object.prototype.hasOwnProperty.call(body, 'videoURL')) delete body.videoURL;
    if (Object.prototype.hasOwnProperty.call(body, 'quizId')) delete body.quizId;

    return body;
}

// Factory that creates a CRUD router for a given Mongoose model
// Usage: const router = createCrudRoutes(Model, 'resourceName', populatePaths);
module.exports.createCrudRoutes = function(model, routeName, populatePaths = []) {
    const router = express.Router();

    // List
    router.get('/', async (req, res) => {
        try {
            // Support optional pagination to avoid returning huge payloads
            const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10) || 1) : null;
            const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit, 10) || 20) : null;
            const snippet = req.query.snippet === 'true' || req.query.snippet === '1';
            if (page && limit) {
                const skip = (page - 1) * limit;
                const total = await model.countDocuments();
                const docs = await model.find().populate(populatePaths).sort({ order: 1, createdAt: 1, title: 1 }).skip(skip).limit(limit).lean();
                // add snippet field if requested
                const items = docs.map(d => {
                    if (snippet && d.content) {
                        return { ...d, snippet: (typeof d.content === 'string' ? d.content.slice(0, 300) : '') };
                    }
                    return d;
                });
                return res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
            }
            // Fallback: return full list for callers that expect it
            const items = await model.find().populate(populatePaths).sort({ order: 1, createdAt: 1, title: 1 });
            res.json(items);
        } catch (err) {
            console.error(err.stack || err.message);
            if (err.name === 'ValidationError') {
                return res.status(400).json({ msg: 'Validation Error', errors: err.errors });
            }
            res.status(500).json({ msg: 'Server Error' });
        }
    });

    // Get by id
    router.get('/:id', async (req, res) => {
        try {
            const item = await model.findById(req.params.id);
            if (!item) return res.status(404).json({ msg: 'Item not found' });
            res.json(item);
        } catch (err) {
            console.error(err.stack || err.message);
            if (err.name === 'ValidationError') {
                return res.status(400).json({ msg: 'Validation Error', errors: err.errors });
            }
            res.status(500).json({ msg: 'Server Error' });
        }
    });

    // For notes: list versions
    if (routeName === 'notes') {
        router.get('/:id/versions', async (req, res) => {
            try {
                const item = await model.findById(req.params.id).select('versions');
                if (!item) return res.status(404).json({ msg: 'Note not found' });
                res.json(item.versions || []);
            } catch (err) {
                console.error(err.stack || err.message);
                res.status(500).json({ msg: 'Server Error' });
            }
        });

        // Delete a single version by index
        router.delete('/:id/versions/:versionIndex', async (req, res) => {
            try {
                const versionIndex = parseInt(req.params.versionIndex, 10);
                if (Number.isNaN(versionIndex)) return res.status(400).json({ msg: 'Invalid version index' });
                const item = await model.findById(req.params.id);
                if (!item) return res.status(404).json({ msg: 'Note not found' });
                if (!Array.isArray(item.versions) || versionIndex < 0 || versionIndex >= item.versions.length) {
                    return res.status(400).json({ msg: 'Version not found' });
                }
                // remove the version at index and save
                item.versions.splice(versionIndex, 1);
                await item.save();
                res.json({ msg: 'Version deleted' });
            } catch (err) {
                console.error(err.stack || err.message);
                res.status(500).json({ msg: 'Server Error' });
            }
        });

        // Delete all versions for a note
        router.delete('/:id/versions', async (req, res) => {
            try {
                const item = await model.findById(req.params.id);
                if (!item) return res.status(404).json({ msg: 'Note not found' });
                item.versions = [];
                await item.save();
                res.json({ msg: 'All versions cleared' });
            } catch (err) {
                console.error(err.stack || err.message);
                res.status(500).json({ msg: 'Server Error' });
            }
        });

        // Revert to a version (body: { versionIndex })
        router.post('/:id/revert', async (req, res) => {
            try {
                const { versionIndex } = req.body;
                const item = await model.findById(req.params.id);
                if (!item) return res.status(404).json({ msg: 'Note not found' });
                const v = item.versions && item.versions[versionIndex];
                if (!v) return res.status(400).json({ msg: 'Version not found' });
                // push current state into versions before revert
                item.versions.push({ title: item.title, subject: item.subject, content: item.content, format: item.format || 'html', imageUrl: item.imageUrl, createdAt: new Date(), createdBy: req.user ? req.user._id : null });
                item.title = v.title;
                item.subject = v.subject;
                item.content = v.content;
                item.format = (v.format === 'markdown' || v.format === 'html') ? v.format : (item.format || 'html');
                item.imageUrl = v.imageUrl;
                item.updatedAt = new Date();
                await item.save();
                // If attached to a topic, update topic notes
                if (item.topicId) {
                    try {
                        const Topic = require('../models/Topic');
                        const topic = await Topic.findById(item.topicId);
                        if (topic) {
                            const syncedHtml = (item.format === 'markdown') ? cleanHtml(markdownToHtml(item.content || '')) : (item.content || '');
                            const nextArticles = Array.isArray(topic.articles) ? [...topic.articles] : [];
                            if (nextArticles.length === 0) {
                                nextArticles.push({ heading: item.title || '', content: syncedHtml, order: 0 });
                            } else {
                                nextArticles[0] = { ...nextArticles[0].toObject?.() || nextArticles[0], content: syncedHtml };
                                if (!nextArticles[0].heading) nextArticles[0].heading = item.title || '';
                            }
                            topic.articles = nextArticles;
                            topic.updatedAt = new Date();
                            await topic.save();
                        }
                    } catch (e) {
                        console.warn('Could not attach reverted note to topic:', e.message);
                    }
                }
                res.json(item);
            } catch (err) {
                console.error(err.message);
                res.status(500).json({ msg: 'Server Error' });
            }
        });
    }

    // Create
    router.post('/', async (req, res) => {
        try {
            // Temporary debug: log incoming create requests when DEBUG_ADMIN=1
            const createBodyKeys = (req && req.body && typeof req.body === 'object') ? Object.keys(req.body) : [];
            adminDebug('CREATE', { routeName, user: req.user ? req.user._id : null, bodyKeys: createBodyKeys });

            if (routeName === 'topics') {
                req.body = normalizeTopicPayload(req.body);
            }

            if (routeName === 'topics' && Array.isArray(req.body.articles)) {
                req.body.articles = req.body.articles.map((a, idx) => {
                    const next = Object.assign({}, a);
                    // heading should be plain text
                    if (typeof next.heading === 'string' && next.heading) {
                        const cleaned = cleanHtml(next.heading);
                        next.heading = String(cleaned).replace(/<[^>]*>/g, '').trim();
                    }
                    if (typeof next.content === 'string' && next.content) {
                        const before = (next.content || '').length;
                        next.content = cleanHtml(next.content);
                        adminDebug('CREATE sanitized article content length', { idx, before, after: (next.content || '').length });
                    }
                    return next;
                });
            }
            if (routeName === 'notes') {
                // Notes can be HTML (Quill) or Markdown.
                const nextFormat = (req.body && req.body.format) ? String(req.body.format).toLowerCase() : 'html';
                req.body.format = (nextFormat === 'markdown' || nextFormat === 'html') ? nextFormat : 'html';

                if (req.body.content && req.body.format === 'html') {
                    const before = (req.body.content || '').length;
                    req.body.content = cleanHtml(req.body.content);
                    adminDebug('CREATE sanitized content length', { before, after: (req.body.content || '').length });
                }
            }

            // Validate required fields for notes to provide clearer errors.
            // Draft saving is not supported: title is required for all saves.
            if (routeName === 'notes') {
                if (!req.body.title || String(req.body.title).trim().length === 0) {
                    return res.status(400).json({ msg: 'Validation Error', errors: { title: { message: 'Path `title` is required.' } } });
                }
                // Ignore any client-provided draft flag
                if (Object.prototype.hasOwnProperty.call(req.body, 'isDraft')) {
                    delete req.body.isDraft;
                }
            }

            const newItem = new model(req.body);
            const item = await newItem.save();

            // Special handling for modules/topics linking
            if (routeName === 'modules' && item.courseId) {
                try {
                    const Course = require('../models/Course');
                    await Course.findByIdAndUpdate(item.courseId, { $push: { modules: item._id } });
                } catch (e) {
                    console.warn('Could not link module to course:', e.message);
                }
            } else if (routeName === 'topics' && item.moduleId) {
                try {
                    const Module = require('../models/Module');
                    await Module.findByIdAndUpdate(item.moduleId, { $push: { topics: item._id } });
                } catch (e) {
                    console.warn('Could not link topic to module:', e.message);
                }
            }

            // If a note is created with a topicId, update that Topic's notes field
            if (routeName === 'notes' && item.topicId) {
                try {
                    const Topic = require('../models/Topic');
                    const topic = await Topic.findById(item.topicId);
                    if (topic) {
                        const syncedHtml = (item.format === 'markdown') ? cleanHtml(markdownToHtml(item.content || '')) : (item.content || '');
                        const nextArticles = Array.isArray(topic.articles) ? [...topic.articles] : [];
                        if (nextArticles.length === 0) {
                            nextArticles.push({ heading: item.title || '', content: syncedHtml, order: 0 });
                        } else {
                            nextArticles[0] = { ...nextArticles[0].toObject?.() || nextArticles[0], content: syncedHtml };
                            if (!nextArticles[0].heading) nextArticles[0].heading = item.title || '';
                        }
                        topic.articles = nextArticles;
                        topic.updatedAt = new Date();
                        await topic.save();
                    }
                } catch (e) {
                    console.warn('Could not attach note to topic:', e.message);
                }
            }

            res.status(201).json(item);
        } catch (err) {
            console.error(err.stack || err.message);
            if (err && err.name === 'ValidationError') {
                return res.status(400).json({ msg: 'Validation Error', errors: err.errors });
            }
            // When debugging, surface the error message/stack to the client for faster iteration.
            if (process.env.DEBUG_ADMIN === '1') {
                return res.status(500).json({ msg: 'Server Error', error: err.message, stack: err.stack });
            }
            res.status(500).json({ msg: 'Server Error' });
        }
    });

    // Update (atomic where possible to avoid optimistic concurrency errors)
    router.put('/:id', async (req, res) => {
        try {
            // Fetch current document snapshot (lean for performance)
            const updateBodyKeys = (req && req.body && typeof req.body === 'object') ? Object.keys(req.body) : [];
            adminDebug('UPDATE start', { routeName, id: req.params.id, user: req.user ? req.user._id : null, bodyKeys: updateBodyKeys });
            const current = await model.findById(req.params.id).lean();
            if (!current) return res.status(404).json({ msg: 'Item not found' });

            if (routeName === 'topics') {
                req.body = normalizeTopicPayload(req.body);
            }

            if (routeName === 'topics' && Array.isArray(req.body.articles)) {
                req.body.articles = req.body.articles.map((a, idx) => {
                    const next = Object.assign({}, a);
                    if (typeof next.heading === 'string' && next.heading) {
                        const cleaned = cleanHtml(next.heading);
                        next.heading = String(cleaned).replace(/<[^>]*>/g, '').trim();
                    }
                    if (typeof next.content === 'string' && next.content) {
                        const before = (next.content || '').length;
                        next.content = cleanHtml(next.content);
                        adminDebug('UPDATE sanitized article content length', { idx, before, after: (next.content || '').length });
                    }
                    return next;
                });
            }
            if (routeName === 'notes') {
                const nextFormat = (req.body && req.body.format) ? String(req.body.format).toLowerCase() : (current.format || 'html');
                req.body.format = (nextFormat === 'markdown' || nextFormat === 'html') ? nextFormat : 'html';

                if (req.body.content && req.body.format === 'html') {
                    const before = (req.body.content || '').length;
                    req.body.content = cleanHtml(req.body.content);
                    adminDebug('UPDATE sanitized content length', { before, after: (req.body.content || '').length });
                }
            }

            // Prepare atomic update payload
            const updates = Object.assign({}, req.body);
            // Prevent clients from sending `versions` in the update payload which
            // would conflict with the atomic $push we perform below.
            if (Object.prototype.hasOwnProperty.call(updates, 'versions')) {
                delete updates.versions;
            }
            if (routeName === 'notes') {
                // Draft saving is not supported: ignore any client-provided draft flag.
                if (Object.prototype.hasOwnProperty.call(req.body, 'isDraft')) {
                    delete req.body.isDraft;
                }
                updates.updatedAt = new Date();

                let updated;
                // create prev snapshot using the current document
                const prevSnapshot = {
                    title: current.title,
                    subject: current.subject,
                    content: current.content,
                    format: current.format || 'html',
                    imageUrl: current.imageUrl,
                    createdAt: new Date(),
                    createdBy: req.user ? req.user._id : null
                };

                // Use findByIdAndUpdate with $push + $each + $slice to keep versions trimmed atomically
                updated = await model.findByIdAndUpdate(req.params.id, {
                    $push: { versions: { $each: [prevSnapshot], $slice: -20 } },
                    $set: updates
                }, { new: true });

                if (!updated) return res.status(404).json({ msg: 'Item not found after update' });

                // If a note was updated and includes a topicId, update the Topic.notes as well
                if (updated.topicId) {
                    try {
                        const Topic = require('../models/Topic');
                        const topic = await Topic.findById(updated.topicId);
                        if (topic) {
                            const syncedHtml = (updated.format === 'markdown') ? cleanHtml(markdownToHtml(updated.content || '')) : (updated.content || '');
                            const nextArticles = Array.isArray(topic.articles) ? [...topic.articles] : [];
                            if (nextArticles.length === 0) {
                                nextArticles.push({ heading: updated.title || '', content: syncedHtml, order: 0 });
                            } else {
                                nextArticles[0] = { ...nextArticles[0].toObject?.() || nextArticles[0], content: syncedHtml };
                                if (!nextArticles[0].heading) nextArticles[0].heading = updated.title || '';
                            }
                            topic.articles = nextArticles;
                            topic.updatedAt = new Date();
                            await topic.save();
                        }
                    } catch (e) {
                        console.warn('Could not attach updated note to topic:', e.message);
                    }
                }

                return res.json(updated);
            }

            // Non-note resources: perform a simple atomic update
            const updated = await model.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
            if (!updated) return res.status(404).json({ msg: 'Item not found after update' });
            res.json(updated);
        } catch (err) {
            console.error(err.stack || err.message);
            if (process.env.DEBUG_ADMIN === '1') {
                return res.status(500).json({ msg: 'Server Error', error: err.message, stack: err.stack });
            }
            res.status(500).json({ msg: 'Server Error' });
        }
    });

    // Delete
    router.delete('/:id', async (req, res) => {
        try {
            const item = await model.findById(req.params.id);
            if (!item) return res.status(404).json({ msg: 'Item not found' });
            await model.deleteOne({ _id: req.params.id });
            res.json({ msg: 'Item removed' });
        } catch (err) {
            console.error(err.stack || err.message);
            res.status(500).json({ msg: 'Server Error' });
        }
    });

    return router;
};

// Also export a small helper router for admin-only utilities if needed
module.exports.adminUtilitiesRouter = function() {
    const router = express.Router();
    // Sanitize HTML utility for previewing content in admin UI
    router.post('/sanitize', async (req, res) => {
        try {
            const { html } = req.body || {};
            if (!html) return res.status(400).json({ msg: 'Missing html' });
            // Use centralized cleaner so admin UI preview matches saved HTML
            const cleaned = cleanHtml(html);
            return res.json({ html: cleaned });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ msg: 'Server Error' });
        }
    });
    // Create an explicit snapshot/version of a note (admin utility)
    router.post('/notes/:id/snapshot', async (req, res) => {
        try {
            const { label, reason } = req.body || {};
            const Note = require('../models/Note');
            const item = await Note.findById(req.params.id);
            if (!item) return res.status(404).json({ msg: 'Note not found' });
            item.versions = item.versions || [];
            const snapshot = {
                title: item.title,
                subject: item.subject,
                content: item.content,
                format: item.format || 'html',
                imageUrl: item.imageUrl,
                label: label || null,
                reason: reason || null,
                createdAt: new Date(),
                createdBy: req.user ? req.user._id : null
            };
            item.versions.push(snapshot);
            if (item.versions.length > 50) item.versions = item.versions.slice(-50);
            await item.save();
            const index = item.versions.length - 1;
            return res.json({ ok: true, versionsCount: item.versions.length, snapshotIndex: index, snapshot: item.versions[index] });
        } catch (err) {
            console.error('Snapshot error:', err.message);
            res.status(500).json({ msg: 'Server Error' });
        }
    });
    // Simple proxy for external assets (images/attachments) to allow setting cache headers and avoid exposing remote URLs directly.
    // Usage: GET /api/admin/util/proxy?url=<encoded-url>
    router.get('/proxy', async (req, res) => {
        try {
            const { url } = req.query || {};
            if (!url) return res.status(400).json({ msg: 'Missing url' });
            // Basic allowlist check could be added here in production
            const fetched = await fetch(url);
            if (!fetched.ok) return res.status(502).json({ msg: 'Upstream fetch failed' });
            // Propagate content-type
            const contentType = fetched.headers.get('content-type');
            if (contentType) res.setHeader('Content-Type', contentType);
            // Cache for a long time and mark immutable — clients/CDNs should cache
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            // Stream the response body
            const body = await fetched.arrayBuffer();
            return res.status(200).send(Buffer.from(body));
        } catch (err) {
            console.error('Proxy error:', err.message);
            return res.status(500).json({ msg: 'Proxy error' });
        }
    });
    return router;
};