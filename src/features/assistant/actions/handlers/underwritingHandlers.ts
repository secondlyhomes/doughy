// src/features/assistant/actions/handlers/underwritingHandlers.ts
// Underwriting, offer generation, negotiation, and closing handlers

import {
  ActionHandlerInput,
  ActionHandlerResult,
  buildAssumptionUpdatePatchSet,
} from '../catalog';
import type { HandlerContext } from './index';

/**
 * Update Assumption Handler
 * Changes an underwriting assumption with rationale
 */
export async function handleUpdateAssumption(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;
  const { params } = input;

  const field = params?.field as string;
  const newValue = params?.newValue as number;
  const oldValue = params?.oldValue as number;
  const rationale = params?.rationale as string;

  if (!field || newValue === undefined) {
    return {
      success: false,
      error: 'Field and new value are required',
    };
  }

  const patchSet = buildAssumptionUpdatePatchSet(
    deal.id,
    field,
    oldValue || 0,
    newValue,
    rationale || `Updating ${field} to ${newValue}`,
    params?.sourceEventId as string | undefined
  );

  return { success: true, patchSet };
}

/**
 * Generate Seller Report Handler (Long-running job)
 * Creates transparent options report for the seller
 */
export async function handleGenerateSellerReport(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal, property } = context;

  // Validate we have enough data
  if (!property?.arv || !property?.purchase_price) {
    return {
      success: false,
      error: 'Cannot generate seller report: missing ARV or purchase price',
    };
  }

  return {
    success: true,
    jobInput: {
      deal_id: deal.id,
      job_type: 'generate_seller_report',
      input_json: {
        deal_id: deal.id,
        property_id: property.id,
        include_options: ['cash', 'creative', 'list'],
        arv: property.arv,
        repair_cost: property.repair_cost,
        purchase_price: property.purchase_price,
      },
    },
  };
}

/**
 * Generate Offer Packet Handler (Long-running job)
 * Creates offer document with terms and disclosures
 */
export async function handleGenerateOfferPacket(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal, property } = context;
  const { params } = input;

  const offerType = params?.offerType as string || 'cash';
  const offerAmount = params?.offerAmount as number || property?.purchase_price;

  if (!offerAmount) {
    return {
      success: false,
      error: 'Cannot generate offer packet: no offer amount specified',
    };
  }

  return {
    success: true,
    jobInput: {
      deal_id: deal.id,
      job_type: 'generate_offer_packet',
      input_json: {
        deal_id: deal.id,
        offer_type: offerType,
        offer_amount: offerAmount,
        include_disclosures: true,
      },
    },
  };
}

/**
 * Draft Counter Text Handler (Stub - requires AI)
 * Drafts negotiation response text
 */
export async function handleDraftCounterText(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;
  const { params } = input;

  const counterAmount = params?.counterAmount as number;
  const tone = params?.tone as string || 'professional';

  // TODO: Call AI endpoint to generate counter text
  // For now, return a template
  const template = `Thank you for your offer on the property. After careful consideration, we would like to counter at $${counterAmount?.toLocaleString() || '[AMOUNT]'}.

This price reflects [RATIONALE].

We remain committed to finding a solution that works for both parties and look forward to your response.`;

  return {
    success: true,
    content: template,
  };
}

/**
 * Prepare E-Sign Envelope Handler (Long-running job)
 * Sets up DocuSign envelope with field mapping
 */
export async function handlePrepareEsignEnvelope(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;
  const { params } = input;

  const documentType = params?.documentType as string || 'purchase_agreement';

  return {
    success: true,
    jobInput: {
      deal_id: deal.id,
      job_type: 'prepare_esign_envelope',
      input_json: {
        deal_id: deal.id,
        document_type: documentType,
      },
    },
  };
}
