const { EventEmitter } = require("events");
const db = require("./db");

class SQLiteSessionStore extends EventEmitter {
  constructor() {
    super();
    this.initTable();
  }

  initTable() {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          sid TEXT PRIMARY KEY,
          sess TEXT NOT NULL,
          expire INTEGER NOT NULL
        )
      `);
      console.log("✓ Sessions table initialized");
    } catch (err) {
      console.error("✗ Failed to create sessions table:", err);
    }
  }

  get(sid, callback) {
    try {
      console.log("📖 Loading session:", sid);
      const row = db.prepare("SELECT sess FROM sessions WHERE sid = ? AND expire > ?").get(
        sid,
        Math.floor(Date.now() / 1000)
      );

      if (row && row.sess) {
        try {
          const sess = JSON.parse(row.sess);
          console.log("✓ Session loaded:", sid, sess.user ? "with user" : "guest");
          callback(null, sess);
        } catch (err) {
          console.error("✗ Session parse error:", err, row);
          callback(null, null);
        }
      } else {
        console.log("✗ Session not found or expired:", sid);
        callback(null, null);
      }
    } catch (err) {
      console.error("✗ Session get error:", err.message);
      callback(null, null);
    }
  }

  set(sid, sess, callback) {
    try {
      console.log("💾 Saving session:", sid);
      const expire = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
      const sessStr = JSON.stringify(sess);

      try {
        const existing = db.prepare("SELECT sid FROM sessions WHERE sid = ?").get(sid);

        if (existing) {
          console.log("  → Updating existing session");
          db.prepare("UPDATE sessions SET sess = ?, expire = ? WHERE sid = ?").run(
            sessStr,
            expire,
            sid
          );
        } else {
          console.log("  → Creating new session");
          db.prepare("INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?)").run(
            sid,
            sessStr,
            expire
          );
        }

        console.log("✓ Session saved:", sid, sess.user ? `(user: ${sess.user.email})` : "(guest)");
        if (callback) callback(null);
      } catch (dbErr) {
        console.error("✗ Database error during session save:", dbErr.message);
        if (callback) callback(dbErr);
      }
    } catch (err) {
      console.error("✗ Session set error:", err.message);
      if (callback) callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      console.log("🗑️  Destroying session:", sid);
      db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
      console.log("✓ Session destroyed");
      if (callback) callback(null);
    } catch (err) {
      console.error("✗ Session destroy error:", err);
      if (callback) callback(err);
    }
  }

  clear(callback) {
    try {
      console.log("🧹 Clearing all sessions");
      db.exec("DELETE FROM sessions");
      console.log("✓ All sessions cleared");
      if (callback) callback(null);
    } catch (err) {
      console.error("✗ Session clear error:", err);
      if (callback) callback(err);
    }
  }
}

module.exports = SQLiteSessionStore;
