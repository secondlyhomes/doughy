// src/features/deals/data/mockOffers.ts
// Mock offer data for development and testing

import { DealOffer, OfferTerms, DealStrategy, DEAL_STRATEGY_CONFIG } from '../types';

/**
 * Sample cash offer terms
 */
export const mockCashOfferTerms: OfferTerms = {
  purchase_price: 165000,
  earnest_money: 5000,
  closing_date: '2024-03-15',
  contingencies: ['Inspection', 'Clear title'],
  proof_of_funds: true,
};

/**
 * Sample seller finance offer terms
 */
export const mockSellerFinanceOfferTerms: OfferTerms = {
  purchase_price: 185000,
  earnest_money: 10000,
  closing_date: '2024-03-30',
  contingencies: ['Clear title'],
  down_payment: 25000,
  interest_rate: 6.5,
  term_years: 20,
  monthly_payment: 1195,
  balloon_payment: 100000,
  balloon_due_years: 5,
};

/**
 * Sample subject-to offer terms
 */
export const mockSubjectToOfferTerms: OfferTerms = {
  purchase_price: 175000,
  earnest_money: 3000,
  closing_date: '2024-03-20',
  contingencies: ['Loan assumption approval', 'Clear title'],
  existing_loan_balance: 142000,
  existing_monthly_payment: 985,
  existing_interest_rate: 4.25,
  catch_up_amount: 8500,
};

/**
 * Mock offers for a deal
 */
export const mockOffers: DealOffer[] = [
  {
    id: 'offer-1',
    deal_id: 'deal-1',
    offer_type: 'cash',
    offer_amount: 165000,
    terms_json: mockCashOfferTerms,
    status: 'draft',
    created_at: '2024-01-20T10:00:00Z',
  },
  {
    id: 'offer-2',
    deal_id: 'deal-1',
    offer_type: 'seller_finance',
    offer_amount: 185000,
    terms_json: mockSellerFinanceOfferTerms,
    status: 'sent',
    created_at: '2024-01-21T14:30:00Z',
  },
  {
    id: 'offer-3',
    deal_id: 'deal-2',
    offer_type: 'subject_to',
    offer_amount: 175000,
    terms_json: mockSubjectToOfferTerms,
    status: 'countered',
    created_at: '2024-01-22T09:15:00Z',
  },
];

/**
 * Default offer terms by strategy type
 */
export const defaultOfferTerms: Record<DealStrategy, Partial<OfferTerms>> = {
  cash: {
    earnest_money: 5000,
    contingencies: ['Inspection', 'Clear title'],
    proof_of_funds: true,
  },
  seller_finance: {
    earnest_money: 10000,
    contingencies: ['Clear title'],
    interest_rate: 6.0,
    term_years: 20,
    balloon_due_years: 5,
  },
  subject_to: {
    earnest_money: 3000,
    contingencies: ['Loan assumption approval', 'Clear title'],
  },
};

/**
 * Offer script templates by strategy
 */
export const offerScriptTemplates: Record<DealStrategy, string> = {
  cash: `Hi [SELLER_NAME],

Thank you for taking the time to speak with me about your property at [PROPERTY_ADDRESS].

Based on our conversation and my analysis of the property, I'd like to present you with a cash offer:

**OFFER AMOUNT: $[PURCHASE_PRICE]**

Here are the key terms:
- All cash, no financing contingency
- Close in [DAYS_TO_CLOSE] days or on your timeline
- $[EARNEST_MONEY] earnest money deposit
- Property sold as-is
- We cover all standard closing costs

This is a firm offer, and we have proof of funds available upon request.

What questions do you have about this offer?`,

  seller_finance: `Hi [SELLER_NAME],

Thank you for discussing your property at [PROPERTY_ADDRESS] with me.

I understand you mentioned you'd be open to carrying the note. Here's what I'm proposing:

**PURCHASE PRICE: $[PURCHASE_PRICE]**

Terms:
- Down payment: $[DOWN_PAYMENT]
- Interest rate: [INTEREST_RATE]%
- Monthly payment: $[MONTHLY_PAYMENT]
- Term: [TERM_YEARS] years
- Balloon payment of $[BALLOON_PAYMENT] due in [BALLOON_YEARS] years

Benefits to you:
- Steady monthly income
- Higher total return than a cash sale
- Secured by the property
- Tax benefits from installment sale

Would you like to review these terms in detail?`,

  subject_to: `Hi [SELLER_NAME],

After our conversation about [PROPERTY_ADDRESS], I believe I can help with your situation.

I'm proposing to take over your existing mortgage payments:

**YOUR RELIEF:**
- No more monthly payments
- We catch up any arrears ($[CATCH_UP_AMOUNT])
- Your credit is protected
- Quick closing

**HOW IT WORKS:**
- We take title subject to your existing loan
- We make all future payments directly to your lender
- You're off the hook for the property

Current loan details I'll be taking over:
- Remaining balance: $[LOAN_BALANCE]
- Monthly payment: $[MONTHLY_PAYMENT]
- Interest rate: [INTEREST_RATE]%

This gets you out from under the property while protecting your credit. Does this sound like something that would help your situation?`,
};

/**
 * Follow-up email templates by strategy
 */
export const offerEmailTemplates: Record<DealStrategy, string> = {
  cash: `Subject: Cash Offer for [PROPERTY_ADDRESS]

Dear [SELLER_NAME],

Thank you for considering our offer on your property. As discussed, I'm sending this follow-up with the details of our cash offer.

Property: [PROPERTY_ADDRESS]
Offer Amount: $[PURCHASE_PRICE]
Earnest Money: $[EARNEST_MONEY]
Estimated Closing: [CLOSING_DATE]

We're prepared to close quickly and can work around your schedule. Please review the attached offer documents and let me know if you have any questions.

I look forward to working with you.

Best regards,
[YOUR_NAME]
[YOUR_PHONE]`,

  seller_finance: `Subject: Seller Financing Proposal for [PROPERTY_ADDRESS]

Dear [SELLER_NAME],

Thank you for our productive conversation about seller financing. Here's a summary of the terms we discussed:

Property: [PROPERTY_ADDRESS]
Purchase Price: $[PURCHASE_PRICE]
Down Payment: $[DOWN_PAYMENT]
Interest Rate: [INTEREST_RATE]%
Monthly Payment: $[MONTHLY_PAYMENT]
Term: [TERM_YEARS] years

This arrangement provides you with consistent monthly income secured by your property. I've attached more detailed information about how seller financing works and its benefits.

Please let me know when you'd like to discuss further.

Best regards,
[YOUR_NAME]
[YOUR_PHONE]`,

  subject_to: `Subject: Solution for Your Property at [PROPERTY_ADDRESS]

Dear [SELLER_NAME],

Following our conversation about your situation with [PROPERTY_ADDRESS], I wanted to summarize how we can help.

Our Proposal:
- Take over your monthly mortgage payments immediately
- Catch up any payment arrears
- Handle all closing costs
- Close within 2-3 weeks

Your Benefits:
- Immediate relief from monthly payments
- Credit protection
- No out-of-pocket costs
- Quick resolution

I understand this is a significant decision. Please don't hesitate to call me with any questions.

Best regards,
[YOUR_NAME]
[YOUR_PHONE]`,
};

/**
 * Get empty offer terms for a strategy
 */
export const getEmptyOfferTerms = (strategy: DealStrategy): OfferTerms => {
  const thirtyDaysOut = new Date();
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

  return {
    ...defaultOfferTerms[strategy],
    closing_date: thirtyDaysOut.toISOString().split('T')[0],
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format percentage for display
 */
export const formatPercent = (value: number | undefined): string => {
  if (value === undefined) return '0%';
  return `${value.toFixed(2)}%`;
};
