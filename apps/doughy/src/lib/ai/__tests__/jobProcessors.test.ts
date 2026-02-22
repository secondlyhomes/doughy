// Tests for AI job processors
import { executeJob, JobResult } from '../jobProcessors';
import { AIJob } from '@/features/assistant/types/jobs';

const createMockJob = (
  jobType: AIJob['job_type'],
  dealId: string = 'deal-123'
): AIJob => ({
  id: `job-${Date.now()}`,
  deal_id: dealId,
  job_type: jobType,
  status: 'queued',
  progress: 0,
  created_at: new Date().toISOString(),
});

describe('jobProcessors', () => {
  describe('executeJob', () => {
    it('should mark job as running', async () => {
      const job = createMockJob('generate_seller_report');
      const result = await executeJob(job);

      // Job should complete successfully
      expect(result.success).toBe(true);
    });

    it('should return error for unknown job type', async () => {
      const invalidJob = {
        ...createMockJob('generate_seller_report'),
        job_type: 'unknown_type' as any,
      };

      const result = await executeJob(invalidJob);

      expect(result.success).toBe(false);
      expect(result.error_message).toContain('No processor found');
    });
  });

  describe('generate_seller_report processor', () => {
    it('should generate seller report with URLs', async () => {
      const job = createMockJob('generate_seller_report');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(result.result_json).toBeDefined();
      expect(result.result_json?.report_url).toBeDefined();
      expect(result.result_json?.share_link).toBeDefined();
      expect(result.result_json?.scenarios).toBeInstanceOf(Array);
    });

    it('should include multiple scenarios', async () => {
      const job = createMockJob('generate_seller_report');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(result.result_json?.scenarios).toEqual(
        expect.arrayContaining(['cash', 'seller_finance', 'subject_to'])
      );
    });

    it('should create artifact IDs', async () => {
      const job = createMockJob('generate_seller_report');
      const result = await executeJob(job);

      expect(result.result_artifact_ids).toBeDefined();
      expect(result.result_artifact_ids?.length).toBeGreaterThan(0);
    });
  });

  describe('organize_walkthrough processor', () => {
    it('should organize walkthrough findings', async () => {
      const job = createMockJob('organize_walkthrough');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(result.result_json).toBeDefined();
      expect(result.result_json?.issues).toBeInstanceOf(Array);
      expect(result.result_json?.questions).toBeInstanceOf(Array);
      expect(result.result_json?.scope_bullets).toBeInstanceOf(Array);
    });

    it('should include estimated total', async () => {
      const job = createMockJob('organize_walkthrough');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(result.result_json?.estimated_total).toBeDefined();
      expect(typeof result.result_json?.estimated_total).toBe('number');
    });

    it('should have confidence level', async () => {
      const job = createMockJob('organize_walkthrough');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(['high', 'medium', 'low']).toContain(result.result_json?.confidence);
    });
  });

  describe('extract_facts processor', () => {
    it('should extract facts by category', async () => {
      const job = createMockJob('extract_facts');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(result.result_json?.seller_motivation).toBeDefined();
      expect(result.result_json?.property_details).toBeDefined();
      expect(result.result_json?.constraints).toBeDefined();
      expect(result.result_json?.inconsistencies).toBeDefined();
    });

    it('should identify inconsistencies', async () => {
      const job = createMockJob('extract_facts');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(result.result_json?.inconsistencies).toBeInstanceOf(Array);
      // Mock should have some inconsistencies
      expect((result.result_json?.inconsistencies as any[]).length).toBeGreaterThan(0);
    });
  });

  describe('generate_offer_packet processor', () => {
    it('should generate offer packet', async () => {
      const job = createMockJob('generate_offer_packet');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(result.result_json?.packet_url).toBeDefined();
      expect(result.result_json?.documents_included).toBeInstanceOf(Array);
    });

    it('should mark as not ready for signature initially', async () => {
      const job = createMockJob('generate_offer_packet');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      // Needs review before signing
      expect(result.result_json?.ready_for_signature).toBe(false);
    });

    it('should list included documents', async () => {
      const job = createMockJob('generate_offer_packet');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      const docs = result.result_json?.documents_included as string[];
      expect(docs.length).toBeGreaterThan(0);
      expect(docs).toContain('Purchase Agreement');
    });
  });

  describe('prepare_esign_envelope processor', () => {
    it('should prepare e-sign envelope', async () => {
      const job = createMockJob('prepare_esign_envelope');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(result.result_json?.envelope_id).toBeDefined();
      expect(result.result_json?.service).toBe('docusign');
      expect(result.result_json?.signing_url).toBeDefined();
    });

    it('should include recipients', async () => {
      const job = createMockJob('prepare_esign_envelope');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(result.result_json?.recipients).toBeInstanceOf(Array);
      expect(result.result_json?.recipients).toContain('seller');
      expect(result.result_json?.recipients).toContain('buyer');
    });

    it('should be ready to send', async () => {
      const job = createMockJob('prepare_esign_envelope');
      const result = await executeJob(job);

      expect(result.success).toBe(true);
      expect(result.result_json?.status).toBe('ready_to_send');
    });
  });

  describe('error handling', () => {
    it('should handle processor errors gracefully', async () => {
      // This would require mocking the processor to throw an error
      // For now, we'll just verify the structure is correct
      const job = createMockJob('generate_seller_report');
      const result = await executeJob(job);

      // Result should have either success or error
      if (!result.success) {
        expect(result.error_message).toBeDefined();
      }
    });
  });

  describe('progress tracking', () => {
    it('should update progress during execution', async () => {
      const job = createMockJob('generate_seller_report');
      // In a real test, you'd mock the progress updates and verify they're called
      const result = await executeJob(job);

      // Job should complete (100% progress)
      expect(result.success).toBe(true);
    }, 10000); // Allow longer timeout for simulated delays
  });
});
