const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const dbFile = path.join(dataDir, "db.json");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database file
function initDb() {
  if (!fs.existsSync(dbFile)) {
    const initialData = {
      users: [],
      invoices: [],
      payments: [],
      nextUserId: 1,
      nextInvoiceId: 1,
      nextPaymentId: 1
    };
    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2));
    console.log("✅ Database initialized");
  }
}

// Read database
function readDb() {
  if (!fs.existsSync(dbFile)) {
    initDb();
  }
  const data = fs.readFileSync(dbFile, "utf8");
  return JSON.parse(data);
}

// Write database
function writeDb(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// Query helpers
function findUser(email) {
  const db = readDb();
  return db.users.find(u => u.email === email);
}

function createUser(userData) {
  const db = readDb();
  const userId = db.nextUserId++;
  const user = {
    id: userId,
    ...userData,
    created_at: Date.now()
  };
  db.users.push(user);
  writeDb(db);
  return user;
}

function getUserById(id) {
  const db = readDb();
  return db.users.find(u => u.id === id);
}

function createInvoice(invoiceData) {
  const db = readDb();
  const invoiceId = db.nextInvoiceId++;
  const invoice = {
    id: invoiceId,
    ...invoiceData,
    created_at: Date.now(),
    updated_at: Date.now()
  };
  db.invoices.push(invoice);
  writeDb(db);
  return invoice;
}

function getUserInvoices(userId) {
  const db = readDb();
  return db.invoices
    .filter(inv => inv.user_id === userId)
    .sort((a, b) => b.created_at - a.created_at);
}

// Initialize on load
initDb();

module.exports = {
  findUser,
  createUser,
  getUserById,
  createInvoice,
  getUserInvoices
};
