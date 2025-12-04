require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'; // Use env var in prod

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

// Debug endpoint to see what n8n is sending
app.all('/api/debug', (req, res) => {
  res.json({
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
    rawBody: req.rawBody
  });
});

// Simple test endpoint - always returns OK
app.all('/api/test', (req, res) => {
  console.log('TEST endpoint called:', req.method, req.url);
  res.json({
    success: true,
    message: 'Test OK',
    received: {
      method: req.method,
      body: req.body,
      query: req.query
    }
  });
});

// Vendor Registration Endpoint
// Middleware to log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.post('/api/vendors/register', async (req, res) => {
  const { name, phone, pix_key, password } = req.body;

  if (!supabase) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('vendors')
      .insert([{ name, phone, pix_key, password: hashedPassword, has_own_delivery: false }])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Vendor registered successfully', data });
  } catch (err) {
    console.error('Error registering vendor:', err);
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/vendors/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' });

  try {
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !vendor) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    // Note: If existing vendors don't have passwords, this might fail or need handling.
    // For now, we assume new flow.
    if (!vendor.password) {
      return res.status(401).json({ error: 'Please reset your password or contact admin.' });
    }

    const match = await bcrypt.compare(password, vendor.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate Token
    const token = jwt.sign({ id: vendor.id, phone: vendor.phone, role: 'vendor' }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: 'Login successful', token, vendor: { id: vendor.id, name: vendor.name, phone: vendor.phone } });

  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: err.message });
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

// Vendor Check Endpoint (for n8n) - Flexible version
app.all('/api/vendors/check', async (req, res) => {
  // Accept phone from ANYWHERE: body, query, or params
  const phone = req.body?.phone || req.query?.phone || req.params?.phone;

  console.log('=== VENDOR CHECK REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Params:', JSON.stringify(req.params));
  console.log('Body:', JSON.stringify(req.body));
  console.log('Query:', JSON.stringify(req.query));
  console.log('Extracted Phone:', phone);
  console.log('===========================');

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  if (!phone) {
    console.log('ERROR: No phone provided in request');
    return res.status(400).json({
      error: 'Phone is required',
      debug: {
        method: req.method,
        url: req.url,
        body: req.body,
        query: req.query,
        params: req.params
      }
    });
  }

  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      console.log('Vendor not found:', phone);
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (data.status !== 'approved') {
      console.log('Vendor not approved:', phone);
      return res.status(403).json({ error: 'Vendor not approved' });
    }

    console.log('Vendor found:', data.name);
    res.json({ message: 'Vendor found', name: data.name, id: data.id });
  } catch (err) {
    console.error('Error checking vendor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Middleware for Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Get Vendor Orders
app.get('/api/vendors/:id/orders', authenticateToken, async (req, res) => {
  const { id } = req.params;

  // Security check: Ensure requesting user matches the ID or is admin (if we had roles)
  if (req.user.id !== id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized access to these orders' });
  }

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    // We need to join orders -> listings -> skus -> vendors
    // But Supabase JS syntax for deep nested joins can be tricky.
    // Let's try to select orders where listing's sku's vendor_id is id.

    // Alternative: Fetch listings for vendor first, then orders for those listings.
    // Or use the deep select syntax:
    const { data, error } = await supabase
      .from('orders')
      .select('*, listings!inner(skus!inner(vendor_id))')
      .eq('listings.skus.vendor_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error('Error fetching vendor orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- LISTINGS & STOCK MANAGEMENT ---

// Get Categories
app.get('/api/categories', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  const { data, error } = await supabase.from('categories').select('*');
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Create Product (SKU)
app.post('/api/products', authenticateToken, async (req, res) => {
  const { name, description, category_id, price } = req.body;
  const vendor_id = req.user.id; // From token

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    const { data, error } = await supabase
      .from('skus')
      .insert([{
        vendor_id,
        name,
        description,
        category_id,
        price: Math.round(price * 100), // Store in cents
        type: 'fornada' // Default type
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Produto cadastrado!', data });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update Product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, category_id, price } = req.body;

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    // Verify ownership
    const { data: existing, error: findError } = await supabase
      .from('skus')
      .select('vendor_id')
      .eq('id', id)
      .single();

    if (findError || !existing) return res.status(404).json({ error: 'Produto não encontrado' });
    if (existing.vendor_id !== req.user.id && req.user.role !== 'admin') return res.sendStatus(403);

    const { data, error } = await supabase
      .from('skus')
      .update({
        name,
        description,
        category_id,
        price: Math.round(price * 100)
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Produto atualizado!', data });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get Vendor Products
app.get('/api/vendors/:id/products', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id && req.user.role !== 'admin') return res.sendStatus(403);

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  const { data, error } = await supabase
    .from('skus')
    .select('*, categories(name)')
    .eq('vendor_id', id)
    .order('name');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Create Listing (Lançar Rodada) - Updated
app.post('/api/listings', authenticateToken, async (req, res) => {
  const { sku_id, qty, ttl_minutes = 30 } = req.body;
  // Note: We don't need price here anymore if it comes from SKU, 
  // BUT the user might want to override price for a specific listing?
  // For now, let's assume price is fixed in SKU or passed to update SKU?
  // The user said "informando o produto", implying selecting an existing one.
  // Let's assume we use the SKU's price.

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    // Verify SKU belongs to vendor
    const { data: sku, error: skuError } = await supabase
      .from('skus')
      .select('*')
      .eq('id', sku_id)
      .eq('vendor_id', req.user.id)
      .single();

    if (skuError || !sku) return res.status(404).json({ error: 'Produto não encontrado ou não pertence a você.' });

    // Calculate TTL
    const ttl = new Date(Date.now() + ttl_minutes * 60000).toISOString();

    // Create Listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert([{
        sku_id: sku.id,
        qty,
        ttl
      }])
      .select();

    if (listingError) throw listingError;

    res.status(201).json({ message: 'Rodada lançada!', data: listing });

  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get Vendor Listings (History)
app.get('/api/vendors/:id/listings', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id && req.user.role !== 'admin') return res.sendStatus(403);

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  const { data, error } = await supabase
    .from('listings')
    .select('*, skus(name, price)')
    .eq('skus.vendor_id', id) // This might fail if we can't filter by joined table directly in simple select
    // Supabase requires !inner for filtering on joined tables
    .select('*, skus!inner(name, price, vendor_id)')
    .eq('skus.vendor_id', id)
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Cancel Listing
app.patch('/api/listings/:id/cancel', authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    // Verify ownership via SKU
    const { data: listing, error: findError } = await supabase
      .from('listings')
      .select('*, skus(vendor_id)')
      .eq('id', id)
      .single();

    if (findError || !listing) return res.status(404).json({ error: 'Rodada não encontrada' });
    if (listing.skus.vendor_id !== req.user.id && req.user.role !== 'admin') return res.sendStatus(403);

    // Cancel by setting TTL to now (expired) and qty to 0
    const { data, error } = await supabase
      .from('listings')
      .update({
        qty: 0,
        ttl: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Rodada cancelada!', data });
  } catch (err) {
    console.error('Error cancelling listing:', err);
    res.status(400).json({ error: err.message });
  }
});

// Decrement Stock (Venda Balcão)
app.post('/api/listings/decrement', async (req, res) => {
  const { vendor_id, amount = 1 } = req.body;
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    // Find active listing for vendor
    const { data: listings, error: findError } = await supabase
      .from('listings')
      .select('*, skus!inner(*)')
      .eq('skus.vendor_id', vendor_id)
      .gt('qty', 0)
      .gt('ttl', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (findError) throw findError;
    if (!listings || listings.length === 0) {
      return res.status(404).json({ error: 'Nenhuma rodada ativa encontrada.' });
    }

    const listing = listings[0];
    const newQty = listing.qty - amount;

    if (newQty < 0) {
      return res.status(400).json({ error: 'Estoque insuficiente.' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('listings')
      .update({ qty: newQty })
      .eq('id', listing.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ message: 'Estoque atualizado', new_qty: updated.qty });

  } catch (err) {
    console.error('Error decrementing stock:', err);
    res.status(400).json({ error: err.message });
  }
});

// List Active Listings (Catalog)
app.get('/api/listings', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*, skus(*, vendors(*))')
      .gt('qty', 0)
      .gt('ttl', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data for frontend
    const catalog = data.map(l => ({
      id: l.id,
      product: l.skus.name,
      price: l.skus.price / 100,
      qty: l.qty,
      ttl: l.ttl,
      vendor: l.skus.vendors.name,
      vendor_phone: l.skus.vendors.phone,
      vendor_location: l.skus.vendors.location
    }));

    res.json(catalog);
  } catch (err) {
    console.error('Error fetching listings:', err);
    res.status(400).json({ error: err.message });
  }
});

const Pix = require('./utils/pix');

// ... (existing code)

// Create Order & Generate Pix
app.post('/api/orders', async (req, res) => {
  const { customer_phone, listing_id, qty } = req.body;
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    // 1. Fetch Listing & Vendor Details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*, skus(*, vendors(*))')
      .eq('id', listing_id)
      .single();

    if (listingError || !listing) return res.status(404).json({ error: 'Oferta não encontrada ou expirada.' });

    // 2. Validate Stock
    if (listing.qty < qty) {
      return res.status(400).json({ error: `Estoque insuficiente. Restam apenas ${listing.qty}.` });
    }

    // 3. Calculate Total
    const priceCents = listing.skus.price;
    const totalCents = priceCents * qty;
    const feeCents = Math.round(totalCents * 0.15); // 15% fee example

    // 4. Create Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_phone,
        listing_id,
        qty,
        total_cents: totalCents,
        fee_cents: feeCents,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 5. Generate Pix Code
    const vendor = listing.skus.vendors;
    // Use vendor's Pix key if available, otherwise platform's (simplified for now using vendor's)
    // Note: In a real marketplace, you might split payments or receive in platform's account first.
    // Here we use the vendor's key directly for simplicity, or a placeholder if missing.
    const pixKey = vendor.pix_key || 'test@pix.com';
    const pix = new Pix(
      pixKey,
      vendor.name.substring(0, 25), // Merchant Name (max 25 chars)
      'Cidade', // Merchant City (should be dynamic)
      totalCents / 100,
      order.id.replace(/-/g, '') // TxId (must be alphanumeric)
    );
    const payload = pix.getPayload();

    res.status(201).json({
      message: 'Pedido criado!',
      order_id: order.id,
      pix_code: payload,
      total: totalCents / 100
    });

  } catch (err) {
    console.error('Error creating order:', err);
    res.status(400).json({ error: err.message });
  }
});

// --- DRIVER / DELIVERY PARTNER ENDPOINTS ---

// Register Driver
app.post('/api/drivers/register', async (req, res) => {
  const { name, phone, cnh, pix_key, password } = req.body;

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  if (!password) return res.status(400).json({ error: 'Password is required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('delivery_partners')
      .insert([{
        name,
        phone,
        cnh,
        pix_key,
        password: hashedPassword,
        status: 'offline'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Entregador cadastrado!', data });
  } catch (err) {
    console.error('Error registering driver:', err);
    res.status(400).json({ error: err.message });
  }
});

// Login Driver
app.post('/api/drivers/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' });

  try {
    const { data: driver, error } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !driver) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!driver.password) {
      return res.status(401).json({ error: 'Senha não configurada.' });
    }

    const match = await bcrypt.compare(password, driver.password);
    if (!match) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: driver.id, phone: driver.phone, role: 'driver' }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: 'Login realizado', token, driver: { id: driver.id, name: driver.name, status: driver.status } });

  } catch (err) {
    console.error('Error logging in driver:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create Delivery Request (Vendor or System)
app.post('/api/deliveries', authenticateToken, async (req, res) => {
  const { order_id, pickup_addr, delivery_addr, delivery_fee, partner_fee } = req.body;

  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    const { data, error } = await supabase
      .from('deliveries')
      .insert([{
        order_id,
        pickup_addr,
        delivery_addr,
        delivery_fee,
        partner_fee,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ message: 'Solicitação de entrega criada', data });
  } catch (err) {
    console.error('Error creating delivery:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get Available Deliveries
app.get('/api/deliveries/available', authenticateToken, async (req, res) => {
  if (req.user.role !== 'driver' && req.user.role !== 'admin') return res.sendStatus(403);
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*, orders(total_cents, customer_phone, listings(skus(name, vendors(name, phone, location))))')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching available deliveries:', err);
    res.status(400).json({ error: err.message });
  }
});

// Accept Delivery
app.post('/api/deliveries/:id/accept', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const driver_id = req.user.id;

  if (req.user.role !== 'driver') return res.sendStatus(403);
  if (!supabase) return res.status(500).json({ error: 'Database not configured' });

  try {
    const { data, error } = await supabase
      .rpc('try_lock_delivery', { p_delivery_id: id, p_partner_id: driver_id });

    if (error) throw error;

    // If successful, it returns vendor_phone. If empty, it failed.
    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Entrega não disponível ou já aceita.' });
    }

    res.json({ message: 'Entrega aceita!', vendor_phone: data[0].vendor_phone });
  } catch (err) {
    console.error('Error accepting delivery:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update Delivery Status
app.patch('/api/deliveries/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const driver_id = req.user.id;

  if (req.user.role !== 'driver') return res.sendStatus(403);
  if (!['picked_up', 'delivered'].includes(status)) return res.status(400).json({ error: 'Status inválido' });

  try {
    const updateData = { status };
    if (status === 'picked_up') updateData.picked_up_at = new Date().toISOString();
    if (status === 'delivered') updateData.delivered_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', id)
      .eq('partner_id', driver_id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: `Status atualizado para ${status}`, data });
  } catch (err) {
    console.error('Error updating delivery status:', err);
    res.status(400).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
