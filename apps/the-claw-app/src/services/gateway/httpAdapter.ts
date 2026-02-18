/**
 * HTTP Gateway Adapter (Stub)
 *
 * Future implementation for connecting to a real OpenClaw Gateway over HTTP.
 * All methods throw during the POC phase.
 */

import type { GatewayAdapter } from './types'

const POC_ERROR = 'HttpGatewayAdapter not implemented — this is a POC'

export class HttpGatewayAdapter implements GatewayAdapter {
  constructor(
    public readonly baseUrl: string,
    public readonly authToken: string,
  ) {}

  healthCheck(): Promise<never> { throw new Error(POC_ERROR) }
  getConfig(): Promise<never> { throw new Error(POC_ERROR) }
  updateConfig(): Promise<never> { throw new Error(POC_ERROR) }
  getPendingActions(): Promise<never> { throw new Error(POC_ERROR) }
  approveAction(): Promise<never> { throw new Error(POC_ERROR) }
  denyAction(): Promise<never> { throw new Error(POC_ERROR) }
  batchApproveActions(): Promise<never> { throw new Error(POC_ERROR) }
  getActivityHistory(): Promise<never> { throw new Error(POC_ERROR) }
  sendMessage(): Promise<never> { throw new Error(POC_ERROR) }
  getMessages(): Promise<never> { throw new Error(POC_ERROR) }
  getBriefing(): Promise<never> { throw new Error(POC_ERROR) }
  getConnections(): Promise<never> { throw new Error(POC_ERROR) }
  toggleConnectionPermission(): Promise<never> { throw new Error(POC_ERROR) }
  disconnectConnection(): Promise<never> { throw new Error(POC_ERROR) }
  getQueueItems(): Promise<never> { throw new Error(POC_ERROR) }
  cancelQueueItem(): Promise<never> { throw new Error(POC_ERROR) }
  approveQueueItem(): Promise<never> { throw new Error(POC_ERROR) }
  denyQueueItem(): Promise<never> { throw new Error(POC_ERROR) }
  getTrustConfig(): Promise<never> { throw new Error(POC_ERROR) }
  updateTrustConfig(): Promise<never> { throw new Error(POC_ERROR) }
  getMonthlyCost(): Promise<never> { throw new Error(POC_ERROR) }
  undoActivity(): Promise<never> { throw new Error(POC_ERROR) }
  getKillSwitchStatus(): Promise<never> { throw new Error(POC_ERROR) }
  activateKillSwitch(): Promise<never> { throw new Error(POC_ERROR) }
  deactivateKillSwitch(): Promise<never> { throw new Error(POC_ERROR) }
  getAgentProfiles(): Promise<never> { throw new Error(POC_ERROR) }
  toggleAgentProfile(): Promise<never> { throw new Error(POC_ERROR) }
}
