const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials - SUPABASE_URL and SUPABASE_KEY required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findUser(email) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  } catch (err) {
    console.error("Error finding user:", err);
    throw err;
  }
}

async function createUser(userData) {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error creating user:", err);
    throw err;
  }
}

async function getUserById(id) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  } catch (err) {
    console.error("Error getting user:", err);
    throw err;
  }
}

async function createInvoice(invoiceData) {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .insert([invoiceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error creating invoice:", err);
    throw err;
  }
}

async function getUserInvoices(userId) {
  try {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error getting invoices:", err);
    throw err;
  }
}

// Test connection
async function testConnection() {
  try {
    const { error } = await supabase.auth.getSession();
    if (!error) {
      console.log("✅ Supabase connected");
      return true;
    }
  } catch (err) {
    console.error("Connection test failed:", err);
  }
  return false;
}

module.exports = {
  supabase,
  findUser,
  createUser,
  getUserById,
  createInvoice,
  getUserInvoices,
  testConnection
};
