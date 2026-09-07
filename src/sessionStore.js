const { EventEmitter } = require("events");
const db = require("./db");

class SQLiteSessionStore extends EventEmitter {
  constructor() {
    super();
    this.ensureTable();
  }

  ensureTable() {
    try {
      db.prepare("SELECT 1 FROM sessions LIMIT 1").get();
    } catch (e) {
      db.exec("CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, sess TEXT NOT NULL, expire INTEGER NOT NULL)");
    }
  }

  get(sid, callback) {
    setImmediate(() => {
      try {
        const row = db.prepare("SELECT sess FROM sessions WHERE sid = ? AND expire > ?").get(
          sid,
          Math.floor(Date.now() / 1000)
        );

        if (row?.sess) {
          try {
            const sess = JSON.parse(row.sess);
            callback(null, sess);
          } catch (err) {
            callback(null, null);
          }
        } else {
          callback(null, null);
        }
      } catch (err) {
        callback(null, null);
      }
    });
  }

  set(sid, sess, callback) {
    setImmediate(() => {
      try {
        const expire = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
        const sessStr = JSON.stringify(sess);

        try {
          const existing = db.prepare("SELECT sid FROM sessions WHERE sid = ?").get(sid);
          if (existing) {
            db.prepare("UPDATE sessions SET sess = ?, expire = ? WHERE sid = ?").run(sessStr, expire, sid);
          } else {
            db.prepare("INSERT INTO sessions (sid, sess, expire) VALUES (?, ?, ?)").run(sid, sessStr, expire);
          }
          callback(null);
        } catch (dbErr) {
          callback(dbErr);
        }
      } catch (err) {
        callback(err);
      }
    });
  }

  destroy(sid, callback) {
    setImmediate(() => {
      try {
        db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
        callback(null);
      } catch (err) {
        callback(err);
      }
    });
  }

  clear(callback) {
    setImmediate(() => {
      try {
        db.exec("DELETE FROM sessions");
        callback(null);
      } catch (err) {
        callback(err);
      }
    });
  }
}

module.exports = SQLiteSessionStore;
