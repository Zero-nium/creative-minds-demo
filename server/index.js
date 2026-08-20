const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database('data.db');

app.use(cors());
app.use(express.json());

// Initialize SQLite Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS channels (
    channel_id TEXT PRIMARY KEY,
    title TEXT,
    sub_count INTEGER,
    total_views INTEGER,
    last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT,
    title TEXT,
    thumbnail_url TEXT,
    published_at DATETIME,
    duration_sec INTEGER,
    view_count INTEGER,
    like_count INTEGER,
    comment_count INTEGER,
    engagement_rate REAL,
    snapshot_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS comment_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT,
    category TEXT,
    summary TEXT,
    supporting_count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS aggregate_trends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT,
    summary TEXT,
    engagement_impact TEXT,
    snapshot_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// API: Ingest Payload from Bob
app.post('/api/ingest', (req, res) => {
  const { channel, videos, comment_trends, aggregate_trends } = req.body;

  const insertTransaction = db.transaction(() => {
    if (channel) {
      db.prepare(`
        INSERT OR REPLACE INTO channels (channel_id, title, sub_count, total_views)
        VALUES (?, ?, ?, ?)
      `).run(channel.channel_id, channel.title, channel.sub_count, channel.total_views);
    }

    if (videos && Array.isArray(videos)) {
      const stmt = db.prepare(`
        INSERT INTO videos (video_id, title, thumbnail_url, published_at, duration_sec, view_count, like_count, comment_count, engagement_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      videos.forEach(v => stmt.run(v.video_id, v.title, v.thumbnail_url, v.published_at, v.duration_sec, v.view_count, v.like_count, v.comment_count, v.engagement_rate));
    }

    if (comment_trends && Array.isArray(comment_trends)) {
      const stmt = db.prepare(`
        INSERT INTO comment_trends (video_id, category, summary, supporting_count)
        VALUES (?, ?, ?, ?)
      `);
      comment_trends.forEach(t => stmt.run(t.video_id, t.category, t.summary, t.supporting_count));
    }

    if (aggregate_trends && Array.isArray(aggregate_trends)) {
      const stmt = db.prepare(`
        INSERT INTO aggregate_trends (topic, summary, engagement_impact)
        VALUES (?, ?, ?)
      `);
      aggregate_trends.forEach(a => stmt.run(a.topic, a.summary, a.engagement_impact));
    }
  });

  try {
    insertTransaction();
    res.json({ status: 'success', message: 'Data ingested successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// API: Fetch Dashboard Data
app.get('/api/dashboard', (req, res) => {
  const channel = db.prepare('SELECT * FROM channels ORDER BY last_synced_at DESC LIMIT 1').get() || {};
  const videos = db.prepare('SELECT * FROM videos ORDER BY snapshot_at DESC LIMIT 10').all();
  const aggregateTrends = db.prepare('SELECT * FROM aggregate_trends ORDER BY snapshot_at DESC LIMIT 5').all();
  const commentTrends = db.prepare('SELECT * FROM comment_trends ORDER BY created_at DESC LIMIT 20').all();

  res.json({ channel, videos, aggregateTrends, commentTrends });
});

// Serve Static Frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
