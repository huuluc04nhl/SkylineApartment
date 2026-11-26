-- Migration: building_devices & security_alerts tables with RLS enabled

CREATE TABLE IF NOT EXISTS public.building_devices (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(60) NOT NULL,
  location VARCHAR(150) NOT NULL,
  health_score INT NOT NULL DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  predict_date DATE,
  last_maintenance DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'Hoạt động tốt',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id VARCHAR(50) PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  location VARCHAR(150) NOT NULL,
  camera_id VARCHAR(50),
  snapshot_url TEXT,
  confidence NUMERIC(5, 2) DEFAULT 0.9,
  status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.building_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read building_devices" ON public.building_devices;
CREATE POLICY "Authenticated read building_devices" ON public.building_devices
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Staff manage building_devices" ON public.building_devices;
CREATE POLICY "Staff manage building_devices" ON public.building_devices
  FOR ALL TO authenticated
  USING (public.current_role() IN ('ADMIN', 'TECHNICIAN'))
  WITH CHECK (public.current_role() IN ('ADMIN', 'TECHNICIAN'));

DROP POLICY IF EXISTS "Staff read security_alerts" ON public.security_alerts;
CREATE POLICY "Staff read security_alerts" ON public.security_alerts
  FOR SELECT TO authenticated
  USING (public.current_role() IN ('ADMIN', 'TECHNICIAN', 'RECEPTIONIST'));

DROP POLICY IF EXISTS "Staff manage security_alerts" ON public.security_alerts;
CREATE POLICY "Staff manage security_alerts" ON public.security_alerts
  FOR ALL TO authenticated
  USING (public.current_role() IN ('ADMIN', 'TECHNICIAN'))
  WITH CHECK (public.current_role() IN ('ADMIN', 'TECHNICIAN'));
