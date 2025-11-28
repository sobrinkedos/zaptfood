CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT,
  me_i TEXT,
  pix_key TEXT,
  has_own_delivery BOOLEAN DEFAULT FALSE,
  location GEOGRAPHY(POINT, 4326),
  max_skus INT CHECK (max_skus <= 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id INT REFERENCES categories(id),
  price INT NOT NULL,
  weight_kg NUMERIC(4,2) DEFAULT 0,
  type TEXT CHECK (type IN ('fornada','estoque')),
  UNIQUE (vendor_id, name)
);

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID REFERENCES skus(id) ON DELETE CASCADE,
  qty INT CHECK (qty >= 0),
  ttl TIMESTAMPTZ NOT NULL,
  geohash TEXT,
  location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  fav_cat_id INT REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  listing_id UUID REFERENCES listings(id),
  qty INT CHECK (qty > 0),
  total_cents INT NOT NULL,
  fee_cents INT NOT NULL,
  status TEXT CHECK (status IN ('pending','paid','cancelled','delivered')),
  paid_at TIMESTAMPTZ,
  code4digits CHAR(4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_adjusts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  delta INT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cnh TEXT NOT NULL,
  pix_key TEXT NOT NULL,
  status TEXT CHECK (status IN ('offline','online','busy')),
  location GEOGRAPHY(POINT, 4326),
  radius_km INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES delivery_partners(id),
  status TEXT CHECK (status IN ('pending','accepted','picked_up','delivered','cancelled')),
  pickup_addr TEXT NOT NULL,
  delivery_addr TEXT NOT NULL,
  delivery_fee INT NOT NULL,
  partner_fee INT NOT NULL,
  pickup_code CHAR(4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION decrement_stock(listing_id UUID, delta INT)
RETURNS VOID AS $$
BEGIN
  UPDATE listings
  SET qty = qty - delta
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION try_lock_delivery(p_delivery_id UUID, p_partner_id UUID)
RETURNS TABLE(vendor_phone TEXT) AS $$
BEGIN
  UPDATE deliveries
  SET partner_id = p_partner_id, status = 'accepted', accepted_at = NOW()
  WHERE id = p_delivery_id AND partner_id IS NULL;

  RETURN QUERY
  SELECT v.phone
  FROM vendors v
  JOIN skus s ON s.vendor_id = v.id
  JOIN listings l ON l.sku_id = s.id
  JOIN orders o ON o.listing_id = l.id
  JOIN deliveries d ON d.order_id = o.id
  WHERE d.id = p_delivery_id;
END;
$$ LANGUAGE plpgsql;