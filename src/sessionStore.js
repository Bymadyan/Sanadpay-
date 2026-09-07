const { EventEmitter } = require("events");
const db = require("./db");

class SQLiteSessionStore extends EventEmitter {
  constructor() {
    super();
    this.initTable();
  }

  initTable() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      )
    `);
  }

  get(sid, callback) {
    try {
      const row = db.prepare("SELECT sess FROM sessions WHERE sid = ? AND expire > ?").get(
        sid,
        Math.floor(Date.now() / 1000)
      );

      if (row && row.sess) {
        try {
          const sess = JSON.parse(row.sess);
          callback(null, sess);
        } catch (err) {
          console.error("Session parse error:", err, row);
          callback(null, null);
        }
      } else {
        callback(null, null);
      }
    } catch (err) {
      console.error("Session get error:", err);
      callback(null, null);
    }
  }

  set(sid, sess, callback) {
    try {
      const expire = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
      const sessStr = JSON.stringify(sess);

      const existing = db.prepare("SELECT sid FROM sessions WHERE sid = ?").get(sid);

      if (existing) {
        db.prepare("UPDATE sessions SET sess = ?, expire = ? WHERE sid = ?").run(
          sessStr,
          expire,
          sid
        );
      } else {
        db.prepare("INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?)").run(
          sid,
          sessStr,
          expire
        );
      }

      console.log("Session saved:", sid, sess.user ? "with user" : "guest");
      if (callback) callback(null);
    } catch (err) {
      console.error("Session set error:", err);
      if (callback) callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }

  clear(callback) {
    try {
      db.exec("DELETE FROM sessions");
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }
}

module.exports = SQLiteSessionStore;
