const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ADMIN || SUPABASE_ANON,
);

async function testConnection() {
  console.log("🔄 Testing connection to Supabase...");

  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error("❌ Connection failed! Error details:", error.message);
    return;
  }

  console.log("✅ Successfully connected to Supabase!");
  console.log("Data sample received:", data);
}

testConnection();

module.exports = supabase;
