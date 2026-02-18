-- =============================================
-- DATABASE ENCRYPTION SCHEMA
-- =============================================
-- Database-level encryption for sensitive data
-- using PostgreSQL pgcrypto extension
--
-- Encryption Methods:
-- 1. Column-level encryption (PGP)
-- 2. Transparent Data Encryption (TDE)
-- 3. Application-level encryption
--
-- Compliance: HIPAA, GDPR, PCI-DSS
-- =============================================

-- Enable encryption extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- ENCRYPTION KEYS TABLE
-- =============================================
-- Store encryption key metadata (NOT the keys themselves!)

CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  key_id TEXT UNIQUE NOT NULL, -- Key identifier
  key_type TEXT NOT NULL, -- 'master', 'data', 'field'
  algorithm TEXT NOT NULL DEFAULT 'aes-256-gcm',
  version INTEGER DEFAULT 1,

  -- Key rotation
  created_at TIMESTAMPTZ DEFAULT now(),
  rotated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'rotating', 'retired'

  -- Metadata
  purpose TEXT, -- 'phi_encryption', 'pii_encryption', etc.
  metadata JSONB DEFAULT '{}',

  CONSTRAINT valid_key_type CHECK (
    key_type IN ('master', 'data', 'field', 'backup')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('active', 'rotating', 'retired', 'compromised')
  )
);

CREATE INDEX idx_encryption_keys_org ON encryption_keys(organization_id);
CREATE INDEX idx_encryption_keys_status ON encryption_keys(status) WHERE status = 'active';

COMMENT ON TABLE encryption_keys IS 'Metadata for encryption keys (not the keys themselves)';

-- =============================================
-- EXAMPLE: USERS TABLE WITH ENCRYPTED COLUMNS
-- =============================================

CREATE TABLE IF NOT EXISTS users_with_encryption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Non-encrypted fields
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Encrypted fields (stored as BYTEA)
  ssn_encrypted BYTEA, -- Social Security Number
  phone_encrypted BYTEA, -- Phone number
  address_encrypted BYTEA, -- Home address
  medical_record_encrypted BYTEA, -- Medical record number (HIPAA)
  credit_card_encrypted BYTEA, -- Payment info (PCI-DSS)

  -- Encryption metadata
  encryption_key_version INTEGER DEFAULT 1,
  encrypted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_enc_org ON users_with_encryption(organization_id);

COMMENT ON TABLE users_with_encryption IS 'Users with field-level encryption for sensitive data';
COMMENT ON COLUMN users_with_encryption.ssn_encrypted IS 'Encrypted SSN using pgp_sym_encrypt';

-- =============================================
-- ENCRYPTION FUNCTIONS
-- =============================================

-- Encrypt data using symmetric encryption
CREATE OR REPLACE FUNCTION encrypt_data(
  plaintext TEXT,
  encryption_key TEXT
)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(plaintext, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION encrypt_data IS 'Encrypt plaintext using PGP symmetric encryption';

-- Decrypt data using symmetric encryption
CREATE OR REPLACE FUNCTION decrypt_data(
  ciphertext BYTEA,
  encryption_key TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(ciphertext, encryption_key);
EXCEPTION
  WHEN OTHERS THEN
    -- Log decryption failure
    RAISE WARNING 'Decryption failed: %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION decrypt_data IS 'Decrypt ciphertext using PGP symmetric encryption';

-- Encrypt field with automatic key retrieval
CREATE OR REPLACE FUNCTION encrypt_field(
  plaintext TEXT,
  field_name TEXT,
  org_id UUID
)
RETURNS BYTEA AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  -- Get encryption key from secure configuration
  -- In production, retrieve from key management service
  encryption_key := current_setting('app.encryption_key', true);

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found';
  END IF;

  RETURN encrypt_data(plaintext, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrypt field with automatic key retrieval
CREATE OR REPLACE FUNCTION decrypt_field(
  ciphertext BYTEA,
  field_name TEXT,
  org_id UUID
)
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT;
BEGIN
  encryption_key := current_setting('app.encryption_key', true);

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found';
  END IF;

  RETURN decrypt_data(ciphertext, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SECURE VIEWS FOR DECRYPTION
-- =============================================

-- View that automatically decrypts sensitive fields
-- Only accessible by authorized users
CREATE OR REPLACE VIEW users_decrypted AS
SELECT
  id,
  organization_id,
  email,
  -- Decrypt sensitive fields (requires encryption key in session)
  decrypt_field(ssn_encrypted, 'ssn', organization_id) AS ssn,
  decrypt_field(phone_encrypted, 'phone', organization_id) AS phone,
  decrypt_field(address_encrypted, 'address', organization_id) AS address,
  created_at,
  encryption_key_version
FROM users_with_encryption
WHERE
  -- Only show to users with decryption permission
  has_permission(auth.uid(), organization_id, 'data:decrypt');

COMMENT ON VIEW users_decrypted IS 'Decrypted view of users table (authorized access only)';

-- =============================================
-- ENCRYPTION TRIGGERS
-- =============================================

-- Automatically encrypt fields on insert/update
CREATE OR REPLACE FUNCTION auto_encrypt_user_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only encrypt if plaintext is provided via temporary columns
  -- (These temporary columns don't exist in actual table)

  IF NEW.ssn_encrypted IS NULL AND current_setting('app.temp.ssn', true) IS NOT NULL THEN
    NEW.ssn_encrypted := encrypt_field(
      current_setting('app.temp.ssn'),
      'ssn',
      NEW.organization_id
    );
  END IF;

  IF NEW.phone_encrypted IS NULL AND current_setting('app.temp.phone', true) IS NOT NULL THEN
    NEW.phone_encrypted := encrypt_field(
      current_setting('app.temp.phone'),
      'phone',
      NEW.organization_id
    );
  END IF;

  NEW.encrypted_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger
-- CREATE TRIGGER encrypt_user_data_trigger
--   BEFORE INSERT OR UPDATE ON users_with_encryption
--   FOR EACH ROW EXECUTE FUNCTION auto_encrypt_user_fields();

-- =============================================
-- KEY ROTATION FUNCTIONS
-- =============================================

-- Re-encrypt data with new key
CREATE OR REPLACE FUNCTION reencrypt_column(
  table_name TEXT,
  column_name TEXT,
  old_key TEXT,
  new_key TEXT
)
RETURNS INTEGER AS $$
DECLARE
  row_count INTEGER := 0;
  sql TEXT;
BEGIN
  -- Build dynamic SQL to re-encrypt column
  sql := format(
    'UPDATE %I SET %I = pgp_sym_encrypt(pgp_sym_decrypt(%I, $1), $2)',
    table_name,
    column_name,
    column_name
  );

  EXECUTE sql USING old_key, new_key;

  GET DIAGNOSTICS row_count = ROW_COUNT;

  RETURN row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION reencrypt_column IS 'Re-encrypt a column with new encryption key';

-- Rotate encryption keys for organization
CREATE OR REPLACE FUNCTION rotate_organization_keys(org_id UUID)
RETURNS void AS $$
DECLARE
  old_key TEXT;
  new_key TEXT;
BEGIN
  -- Get old key (from secure config)
  old_key := current_setting('app.encryption_key', true);

  -- Generate new key (in production, use KMS)
  new_key := encode(gen_random_bytes(32), 'hex');

  -- Re-encrypt all sensitive columns
  PERFORM reencrypt_column('users_with_encryption', 'ssn_encrypted', old_key, new_key);
  PERFORM reencrypt_column('users_with_encryption', 'phone_encrypted', old_key, new_key);
  PERFORM reencrypt_column('users_with_encryption', 'address_encrypted', old_key, new_key);

  -- Update encryption key version
  UPDATE users_with_encryption
  SET encryption_key_version = encryption_key_version + 1
  WHERE organization_id = org_id;

  -- Log key rotation
  INSERT INTO encryption_keys (
    organization_id,
    key_id,
    key_type,
    version,
    status,
    purpose
  ) VALUES (
    org_id,
    'key_' || new_key,
    'data',
    (SELECT COALESCE(MAX(version), 0) + 1 FROM encryption_keys WHERE organization_id = org_id),
    'active',
    'Rotated encryption key'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION rotate_organization_keys IS 'Rotate encryption keys for an organization';

-- =============================================
-- AUDIT LOGGING FOR ENCRYPTION OPERATIONS
-- =============================================

-- Log encryption key access
CREATE OR REPLACE FUNCTION log_key_access(
  key_id TEXT,
  operation TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    action_category,
    resource_type,
    resource_id,
    severity,
    metadata
  ) VALUES (
    auth.uid(),
    operation,
    'security',
    'encryption_keys',
    key_id,
    'warning',
    jsonb_build_object(
      'timestamp', now(),
      'operation', operation
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_with_encryption ENABLE ROW LEVEL SECURITY;

-- Only security admins can view encryption key metadata
CREATE POLICY "encryption_keys_select_policy"
  ON encryption_keys FOR SELECT
  USING (
    has_permission(auth.uid(), organization_id, 'security:admin')
  );

-- Users can only see their own encrypted data
CREATE POLICY "users_encrypted_select_policy"
  ON users_with_encryption FOR SELECT
  USING (
    id = auth.uid()
    OR has_permission(auth.uid(), organization_id, 'users:read')
  );

-- =============================================
-- EXAMPLE USAGE
-- =============================================

/*
-- 1. Set encryption key in session
SET app.encryption_key = 'your-secure-encryption-key';

-- 2. Insert user with encrypted fields
SET app.temp.ssn = '123-45-6789';
SET app.temp.phone = '+1-555-0100';

INSERT INTO users_with_encryption (organization_id, email)
VALUES ('org-uuid', 'user@example.com');

-- 3. Query decrypted data (requires permission)
SELECT * FROM users_decrypted WHERE id = 'user-uuid';

-- 4. Rotate keys
SELECT rotate_organization_keys('org-uuid');
*/

-- =============================================
-- TRANSPARENT DATA ENCRYPTION (TDE) NOTES
-- =============================================

/*
For production deployments, consider enabling TDE at the database level:

1. PostgreSQL TDE:
   - Use encrypted tablespaces
   - Configure pg_tde extension
   - Enable SSL/TLS for connections

2. Supabase Configuration:
   - Data encrypted at rest by default
   - SSL/TLS for all connections
   - Encrypted backups

3. Key Management:
   - Use AWS KMS, GCP KMS, or Azure Key Vault
   - Implement key rotation policies
   - Separate key storage from data

4. Compliance:
   - HIPAA: Encryption required for PHI
   - GDPR: Encryption recommended for personal data
   - PCI-DSS: Encryption required for cardholder data
*/

-- =============================================
-- MAINTENANCE
-- =============================================

-- Check encryption status
CREATE OR REPLACE VIEW encryption_status AS
SELECT
  table_name,
  column_name,
  data_type,
  CASE
    WHEN data_type = 'bytea' THEN 'Encrypted'
    ELSE 'Plaintext'
  END AS encryption_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users_with_encryption')
ORDER BY table_name, ordinal_position;

-- =============================================
-- END OF SCHEMA
-- =============================================
