require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

// Only create client if credentials are present
const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

app.get('/', (req, res) => {
  res.json({
    message: 'ZaptFood API is running',
    supabase_status: supabase ? 'configured' : 'missing_credentials'
  });
});

// Vendor Registration Endpoint
app.post('/api/vendors/register', async (req, res) => {
  const { name, phone, pix_key } = req.body;

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    const { data, error } = await supabase
      .from('vendors')
      .insert([{ name, phone, pix_key, has_own_delivery: false }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Vendor registered successfully', data });
  } catch (err) {
    console.error('Error registering vendor:', err);
    res.status(400).json({ error: err.message });
  }
});

// Admin: List Pending Vendors (Mocking "pending" as we don't have a status column yet, or assuming all new are pending)
// Ideally we should add a 'status' column to vendors. For now, let's list all.
app.get('/api/admin/vendors', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Admin: Approve Vendor
app.post('/api/admin/vendors/:id/approve', async (req, res) => {
  const { id } = req.params;
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  const { data, error } = await supabase
    .from('vendors')
    .update({ status: 'approved' })
    .eq('id', id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Vendor approved', data });
});

// Vendor Check Endpoint (for n8n)
app.post('/api/vendors/check', async (req, res) => {
  const { phone } = req.body;
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Vendor not found' });
  }

  if (data.status !== 'approved') {
    return res.status(403).json({ error: 'Vendor not approved' });
  }

  res.json({ message: 'Vendor found', name: data.name, id: data.id });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
