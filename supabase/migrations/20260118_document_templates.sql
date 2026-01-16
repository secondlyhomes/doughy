-- Migration: Create Document Templates Table
-- Description: Store GPT-4 prompt templates for document generation
-- Phase: Sprint 3 - AI & Automation

-- ============================================================================
-- CREATE DOCUMENT TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS re_document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK(template_type IN (
    'offer_letter',
    'purchase_agreement',
    'seller_report',
    'subject_to_addendum',
    'seller_financing_agreement',
    'lease_option_agreement',
    'assignment_contract',
    'disclosure_form',
    'property_analysis',
    'marketing_letter',
    'other'
  )),
  template_content TEXT NOT NULL, -- GPT-4 prompt template with {{placeholders}}
  variables JSONB NOT NULL DEFAULT '[]', -- List of required variables
  description TEXT, -- Template description for users
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE, -- True for built-in templates (can't be deleted)
  created_by UUID REFERENCES auth.users(id), -- NULL for system templates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying by type
CREATE INDEX idx_doc_templates_type ON re_document_templates(template_type);

-- Index for active templates
CREATE INDEX idx_doc_templates_active
  ON re_document_templates(template_type, created_at DESC)
  WHERE is_active = TRUE;

-- Index for user-created templates
CREATE INDEX idx_doc_templates_user
  ON re_document_templates(created_by)
  WHERE created_by IS NOT NULL;

-- GIN index for searching variables
CREATE INDEX idx_doc_templates_variables_gin
  ON re_document_templates USING GIN(variables);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE re_document_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active templates
CREATE POLICY "Authenticated users can view active templates"
  ON re_document_templates FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    is_active = TRUE
  );

-- Users can create their own custom templates
CREATE POLICY "Users can create their own templates"
  ON re_document_templates FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid() AND
    is_system = FALSE
  );

-- Users can update their own custom templates
CREATE POLICY "Users can update their own templates"
  ON re_document_templates FOR UPDATE
  USING (
    created_by = auth.uid() AND
    is_system = FALSE
  );

-- Users can delete their own custom templates
CREATE POLICY "Users can delete their own templates"
  ON re_document_templates FOR DELETE
  USING (
    created_by = auth.uid() AND
    is_system = FALSE
  );

-- Admins can manage all templates including system ones
CREATE POLICY "Admins can manage all templates"
  ON re_document_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE re_document_templates IS 'GPT-4 prompt templates for generating real estate documents';
COMMENT ON COLUMN re_document_templates.template_content IS 'GPT-4 prompt with {{variable}} placeholders (e.g., "Dear {{seller_name}},...")';
COMMENT ON COLUMN re_document_templates.variables IS 'JSONB array of required variable names: ["seller_name", "address", "price"]';
COMMENT ON COLUMN re_document_templates.is_system IS 'TRUE for built-in templates that cannot be deleted by users';
COMMENT ON COLUMN re_document_templates.created_by IS 'User who created this template (NULL for system templates)';

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_doc_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_doc_templates_updated_at
  BEFORE UPDATE ON re_document_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_doc_templates_updated_at();

-- ============================================================================
-- SEED DEFAULT TEMPLATES
-- ============================================================================

-- Standard Cash Offer Letter
INSERT INTO re_document_templates (
  template_name,
  template_type,
  template_content,
  variables,
  description,
  is_system
) VALUES (
  'Standard Cash Offer Letter',
  'offer_letter',
  'Dear {{seller_name}},

I am writing to submit a cash offer to purchase the property located at {{address}}.

After careful evaluation of the property and current market conditions, I am prepared to offer {{offer_price}} for the property, with the following terms:

- Purchase Price: {{offer_price}}
- Closing Date: {{closing_date}}
- Earnest Money Deposit: {{earnest_money}}
- Inspection Period: {{inspection_days}} days
- All Cash Purchase (No Financing Contingency)

This offer is based on the property being sold in its current "as-is" condition. I am prepared to close quickly and can provide proof of funds upon request.

Please review this offer and let me know if you have any questions or would like to discuss the terms.

Best regards,
{{buyer_name}}
{{buyer_contact}}',
  '["seller_name", "address", "offer_price", "closing_date", "earnest_money", "inspection_days", "buyer_name", "buyer_contact"]',
  'Standard cash offer letter template for wholesale/fix-and-flip deals',
  TRUE
),
(
  'Seller Financing Offer Letter',
  'offer_letter',
  'Dear {{seller_name}},

I am interested in purchasing your property at {{address}} with seller financing terms that benefit both of us.

Proposed Terms:
- Purchase Price: {{purchase_price}}
- Down Payment: {{down_payment}} ({{down_payment_percentage}}%)
- Seller Financing Amount: {{financed_amount}}
- Interest Rate: {{interest_rate}}% annually
- Monthly Payment: {{monthly_payment}}
- Term: {{term_years}} years
- Balloon Payment: {{balloon_payment}} (if applicable)

This arrangement allows you to receive {{down_payment}} immediately, followed by consistent monthly income of {{monthly_payment}} for {{term_years}} years. You''ll also benefit from the interest income, totaling approximately {{total_interest}} over the life of the loan.

I am a serious buyer with a proven track record and can provide references upon request.

Let''s discuss how we can structure this deal to meet both of our needs.

Sincerely,
{{buyer_name}}
{{buyer_contact}}',
  '["seller_name", "address", "purchase_price", "down_payment", "down_payment_percentage", "financed_amount", "interest_rate", "monthly_payment", "term_years", "balloon_payment", "total_interest", "buyer_name", "buyer_contact"]',
  'Seller financing offer letter with detailed payment structure',
  TRUE
),
(
  'Property Analysis Report',
  'property_analysis',
  '# Property Analysis Report

**Property Address:** {{address}}
**Analysis Date:** {{analysis_date}}
**Prepared By:** {{analyst_name}}

## Property Details
- Bedrooms: {{bedrooms}}
- Bathrooms: {{bathrooms}}
- Square Feet: {{square_feet}}
- Lot Size: {{lot_size}}
- Year Built: {{year_built}}

## Financial Analysis

### Purchase Analysis
- Purchase Price: {{purchase_price}}
- Repair Estimate: {{repair_estimate}}
- After Repair Value (ARV): {{arv}}
- Maximum Allowable Offer (MAO): {{mao}}

### Deal Metrics
- Profit Margin: {{profit_margin}}
- ROI: {{roi}}%
- Cash-on-Cash Return: {{cash_on_cash}}%

### Comparable Sales
{{comps_summary}}

### Repair Breakdown
{{repair_breakdown}}

## Recommendation
{{recommendation}}

---
*This analysis is based on current market conditions and available data. Actual results may vary.*',
  '["address", "analysis_date", "analyst_name", "bedrooms", "bathrooms", "square_feet", "lot_size", "year_built", "purchase_price", "repair_estimate", "arv", "mao", "profit_margin", "roi", "cash_on_cash", "comps_summary", "repair_breakdown", "recommendation"]',
  'Comprehensive property analysis report with financial metrics',
  TRUE
);

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created document templates table with 3 default templates',
  jsonb_build_object(
    'migration', '20260118_document_templates',
    'table', 're_document_templates',
    'indexes', 4,
    'rls_policies', 5,
    'default_templates', 3,
    'template_types', ARRAY[
      'offer_letter', 'purchase_agreement', 'seller_report',
      'subject_to_addendum', 'seller_financing_agreement',
      'lease_option_agreement', 'assignment_contract',
      'disclosure_form', 'property_analysis', 'marketing_letter', 'other'
    ]
  )
);
