CREATE TABLE lenders (
  id SERIAL PRIMARY KEY,
  lender_name TEXT NOT NULL,
  website TEXT,
  contact_name TEXT,
  linkedin_profile TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  lender_type TEXT,
  cre_construction SMALLINT DEFAULT 0,
  cre_residential SMALLINT DEFAULT 0,
  cre_land SMALLINT DEFAULT 0,
  cre_office SMALLINT DEFAULT 0,
  cre_industrial SMALLINT DEFAULT 0,
  cre_hotel SMALLINT DEFAULT 0,
  cre_retail SMALLINT DEFAULT 0,
  cre_other SMALLINT DEFAULT 0,
  real_estate SMALLINT DEFAULT 0,
  aircraft SMALLINT DEFAULT 0,
  art SMALLINT DEFAULT 0,
  insurance_premium SMALLINT DEFAULT 0,
  yacht SMALLINT DEFAULT 0,
  sports SMALLINT DEFAULT 0,
  fund_lp SMALLINT DEFAULT 0,
  fund_nav SMALLINT DEFAULT 0,
  fund_gp SMALLINT DEFAULT 0,
  fund_mgmt_company SMALLINT DEFAULT 0,
  fund_scf SMALLINT DEFAULT 0,
  other_financing TEXT DEFAULT '0',
  senior SMALLINT DEFAULT 0,
  subordinated SMALLINT DEFAULT 0,
  recourse SMALLINT DEFAULT 0,
  non_recourse SMALLINT DEFAULT 0,
  based_in TEXT,
  geographic_coverage TEXT,
  lender_location TEXT,
  note TEXT
);

CREATE TABLE pipeline (
  id SERIAL PRIMARY KEY,
  lead_source TEXT,
  pipeline_status TEXT,
  client_name TEXT NOT NULL,
  wbc_product TEXT,
  wbc_sub_product TEXT,
  deal_stage TEXT,
  probability REAL,
  lead_rm TEXT,
  deal_team TEXT,
  deal_size REAL,
  total_est_revenue REAL,
  est_close_date TEXT,
  physical_location TEXT,
  client_type TEXT,
  company_name TEXT,
  sector TEXT,
  contact_name TEXT,
  fee_percentage REAL
);

ALTER TABLE lenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON lenders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON pipeline FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS changelog (
  id SERIAL PRIMARY KEY,
  user_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  entity_name TEXT,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES pipeline(id),
  folder TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON changelog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON documents FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS app_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager',
  status TEXT NOT NULL DEFAULT 'active',
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  last_login TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS deal_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES app_users(id),
  deal_id INTEGER NOT NULL REFERENCES pipeline(id),
  granted_by TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, deal_id)
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  user_name TEXT,
  user_role TEXT,
  event_type TEXT NOT NULL,
  page TEXT,
  entity_type TEXT,
  entity_id INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_variables (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS deal_folders (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES pipeline(id),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_lender_outreach (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES pipeline(id),
  lender_id INTEGER NOT NULL REFERENCES lenders(id),
  status TEXT NOT NULL DEFAULT 'pending',
  contacted_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deal_term_sheets (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER NOT NULL REFERENCES pipeline(id),
  lender_id INTEGER NOT NULL REFERENCES lenders(id),
  received_at TIMESTAMPTZ,
  loan_amount REAL,
  rate TEXT,
  ltv TEXT,
  term_years REAL,
  loan_type TEXT,
  recourse TEXT,
  conditions TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT,
  message TEXT NOT NULL,
  page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_lender_outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_term_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON deal_access FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON app_variables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON deal_folders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON deal_lender_outreach FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON deal_term_sheets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON feedback FOR ALL USING (true) WITH CHECK (true);
