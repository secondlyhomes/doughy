/**
 * Handoff.tsx
 *
 * iOS Handoff (Continuity) Integration
 *
 * Handoff lets users start an activity on one device and continue
 * on another Apple device seamlessly.
 *
 * Features:
 * - Continue activities across devices
 * - Universal Links integration
 * - iCloud sync
 * - Automatic device detection
 *
 * Requirements:
 * - iOS 8+
 * - Same Apple ID on all devices
 * - Handoff enabled in Settings
 * - Associated Domains capability
 *
 * Related docs:
 * - .examples/platform/ios/README.md
 *
 * Native module setup (iOS):
 *
 * Create HandoffModule.swift:
 *
 * ```swift
 * import Foundation
 * import React
 *
 * @objc(HandoffModule)
 * class HandoffModule: NSObject {
 *   var currentActivity: NSUserActivity?
 *
 *   @objc
 *   func startActivity(_ options: NSDictionary,
 *                     resolver resolve: @escaping RCTPromiseResolveBlock,
 *                     rejecter reject: @escaping RCTPromiseRejectBlock) {
 *
 *     guard let activityType = options["activityType"] as? String,
 *           let title = options["title"] as? String else {
 *       reject("INVALID_PARAMS", "Missing required parameters", nil)
 *       return
 *     }
 *
 *     let activity = NSUserActivity(activityType: activityType)
 *     activity.title = title
 *     activity.userInfo = options["userInfo"] as? [String: Any]
 *     activity.isEligibleForHandoff = true
 *     activity.isEligibleForSearch = true
 *
 *     if let urlString = options["webpageURL"] as? String,
 *        let url = URL(string: urlString) {
 *       activity.webpageURL = url
 *     }
 *
 *     activity.becomeCurrent()
 *     self.currentActivity = activity
 *
 *     resolve(true)
 *   }
 *
 *   @objc
 *   func stopActivity(_ resolve: @escaping RCTPromiseResolveBlock,
 *                    rejecter reject: @escaping RCTPromiseRejectBlock) {
 *     currentActivity?.invalidate()
 *     currentActivity = nil
 *     resolve(true)
 *   }
 *
 *   @objc
 *   static func requiresMainQueueSetup() -> Bool {
 *     return true
 *   }
 * }
 * ```
 *
 * AppDelegate.swift:
 *
 * ```swift
 * func application(_ application: UIApplication,
 *                  continue userActivity: NSUserActivity,
 *                  restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
 *
 *   if userActivity.activityType.starts(with: "com.yourapp.") {
 *     // Notify React Native
 *     NotificationCenter.default.post(
 *       name: NSNotification.Name("HandoffReceived"),
 *       object: nil,
 *       userInfo: [
 *         "activityType": userActivity.activityType,
 *         "userInfo": userActivity.userInfo ?? [:]
 *       ]
 *     )
 *     return true
 *   }
 *
 *   return false
 * }
 * ```
 */

// Re-export everything for convenience when importing from this file
export { HandoffActivityType } from './types';
export type {
  HandoffActivity,
  Task,
  UseHandoffReturn,
  TaskDetailWithHandoffProps,
} from './types';
export { HandoffManager } from './HandoffManager';
export { useHandoff } from './hooks/useHandoff';
export { TaskDetailWithHandoff } from './components/TaskDetailWithHandoff';
export { styles } from './styles';
