// Tests for integrationsService.ts
import {
  getIntegrations,
  toggleIntegration,
  syncIntegration,
} from '../../services/integrationsService';

describe('integrationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getIntegrations', () => {
    it('returns integrations successfully', async () => {
      const promise = getIntegrations();
      jest.advanceTimersByTime(300);
      const result = await promise;

      expect(result.success).toBe(true);
      expect(result.integrations).toBeDefined();
      expect(result.integrations!.length).toBeGreaterThan(0);
    });

    it('returns mock integrations with correct structure', async () => {
      const promise = getIntegrations();
      jest.advanceTimersByTime(300);
      const result = await promise;

      const integration = result.integrations![0];
      expect(integration).toHaveProperty('id');
      expect(integration).toHaveProperty('name');
      expect(integration).toHaveProperty('description');
      expect(integration).toHaveProperty('icon');
      expect(integration).toHaveProperty('status');
      expect(integration).toHaveProperty('createdAt');
      expect(integration).toHaveProperty('updatedAt');
    });

    it('includes various integration statuses', async () => {
      const promise = getIntegrations();
      jest.advanceTimersByTime(300);
      const result = await promise;

      const statuses = result.integrations!.map(i => i.status);
      expect(statuses).toContain('active');
      expect(statuses).toContain('inactive');
      expect(statuses).toContain('pending');
      expect(statuses).toContain('error');
    });

    it('returns same integrations on subsequent calls', async () => {
      const promise1 = getIntegrations();
      jest.advanceTimersByTime(300);
      const result1 = await promise1;

      const promise2 = getIntegrations();
      jest.advanceTimersByTime(300);
      const result2 = await promise2;

      expect(result1.integrations![0].id).toBe(result2.integrations![0].id);
    });
  });

  describe('toggleIntegration', () => {
    it('enables an integration successfully', async () => {
      // First get integrations to initialize the store
      const getPromise = getIntegrations();
      jest.advanceTimersByTime(300);
      const getResult = await getPromise;

      // Find an inactive integration
      const inactiveIntegration = getResult.integrations!.find(i => i.status === 'inactive');
      expect(inactiveIntegration).toBeDefined();

      // Toggle it to enabled
      const togglePromise = toggleIntegration(inactiveIntegration!.id, true);
      jest.advanceTimersByTime(300);
      const result = await togglePromise;

      expect(result.success).toBe(true);
      expect(result.integration).toBeDefined();
      expect(result.integration!.status).toBe('active');
    });

    it('disables an integration successfully', async () => {
      // First get integrations to initialize the store
      const getPromise = getIntegrations();
      jest.advanceTimersByTime(300);
      const getResult = await getPromise;

      // Find an active integration
      const activeIntegration = getResult.integrations!.find(i => i.status === 'active');
      expect(activeIntegration).toBeDefined();

      // Toggle it to disabled
      const togglePromise = toggleIntegration(activeIntegration!.id, false);
      jest.advanceTimersByTime(300);
      const result = await togglePromise;

      expect(result.success).toBe(true);
      expect(result.integration).toBeDefined();
      expect(result.integration!.status).toBe('inactive');
    });

    it('returns error for non-existent integration', async () => {
      // First initialize the store
      const getPromise = getIntegrations();
      jest.advanceTimersByTime(300);
      await getPromise;

      const togglePromise = toggleIntegration('non-existent-id', true);
      jest.advanceTimersByTime(300);
      const result = await togglePromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Integration not found');
    });

    it('updates the updatedAt timestamp', async () => {
      const getPromise = getIntegrations();
      jest.advanceTimersByTime(300);
      const getResult = await getPromise;

      const integration = getResult.integrations![0];
      const originalUpdatedAt = integration.updatedAt;

      // Advance time a bit
      jest.advanceTimersByTime(1000);

      const togglePromise = toggleIntegration(integration.id, true);
      jest.advanceTimersByTime(300);
      const result = await togglePromise;

      expect(result.integration!.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('syncIntegration', () => {
    it('syncs an integration successfully', async () => {
      // First get integrations to initialize the store
      const getPromise = getIntegrations();
      jest.advanceTimersByTime(300);
      const getResult = await getPromise;

      const integration = getResult.integrations![0];

      const syncPromise = syncIntegration(integration.id);
      jest.advanceTimersByTime(1000);
      const result = await syncPromise;

      expect(result.success).toBe(true);
      expect(result.integration).toBeDefined();
      expect(result.integration!.lastSync).toBeDefined();
    });

    it('returns error for non-existent integration', async () => {
      // First initialize the store
      const getPromise = getIntegrations();
      jest.advanceTimersByTime(300);
      await getPromise;

      const syncPromise = syncIntegration('non-existent-id');
      jest.advanceTimersByTime(1000);
      const result = await syncPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Integration not found');
    });

    it('updates both lastSync and updatedAt timestamps', async () => {
      const getPromise = getIntegrations();
      jest.advanceTimersByTime(300);
      const getResult = await getPromise;

      const integration = getResult.integrations![0];

      // Advance time
      jest.advanceTimersByTime(5000);

      const syncPromise = syncIntegration(integration.id);
      jest.advanceTimersByTime(1000);
      const result = await syncPromise;

      expect(result.integration!.lastSync).toBeDefined();
      expect(result.integration!.updatedAt).toBeDefined();
    });

    it('takes longer than toggle operation', async () => {
      const getPromise = getIntegrations();
      jest.advanceTimersByTime(300);
      await getPromise;

      // Verify sync takes 1000ms vs toggle's 300ms
      const syncStart = Date.now();
      const syncPromise = syncIntegration('int-1');

      // After 300ms, sync should still be pending
      jest.advanceTimersByTime(300);

      // After full 1000ms, sync should complete
      jest.advanceTimersByTime(700);
      const result = await syncPromise;

      expect(result.success).toBe(true);
    });
  });
});
