/**
 * Notification Templates
 *
 * Pre-configured notification templates for common use cases
 */

import type { NotificationPayload, SendNotificationRequest } from './types';

// ============================================================================
// User Engagement Templates
// ============================================================================

export function welcomeNotification(userId: string): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Welcome! 👋',
      body: 'Thanks for joining. Let\'s get started!',
      data: {
        type: 'welcome',
        deepLink: {
          screen: 'Onboarding',
        },
      },
      badge: 1,
      sound: true,
    },
  };
}

export function reEngagementNotification(
  userId: string,
  daysSinceLastActive: number
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'We Miss You!',
      body: `You haven't visited in ${daysSinceLastActive} days. Come see what's new!`,
      data: {
        type: 're-engagement',
        deepLink: {
          screen: 'Home',
        },
      },
      priority: 'normal',
    },
  };
}

// ============================================================================
// Social Templates
// ============================================================================

export function newMessageNotification(
  userId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: `New message from ${senderName}`,
      body: messagePreview,
      categoryId: 'message',
      data: {
        type: 'message',
        conversationId,
        deepLink: {
          screen: 'Conversation',
          params: { id: conversationId },
        },
      },
      badge: 1,
      sound: 'message.wav',
    },
  };
}

export function newFollowerNotification(
  userId: string,
  followerName: string,
  followerId: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'New Follower',
      body: `${followerName} started following you`,
      categoryId: 'social',
      data: {
        type: 'new-follower',
        followerId,
        deepLink: {
          screen: 'Profile',
          params: { userId: followerId },
        },
      },
      badge: 1,
    },
  };
}

export function commentNotification(
  userId: string,
  commenterName: string,
  postId: string,
  commentPreview: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: `${commenterName} commented on your post`,
      body: commentPreview,
      categoryId: 'social',
      data: {
        type: 'comment',
        postId,
        deepLink: {
          screen: 'Post',
          params: { id: postId },
        },
      },
      badge: 1,
    },
  };
}

export function likeNotification(
  userId: string,
  likerName: string,
  postId: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'New Like',
      body: `${likerName} liked your post`,
      data: {
        type: 'like',
        postId,
        deepLink: {
          screen: 'Post',
          params: { id: postId },
        },
      },
      badge: 1,
      priority: 'normal',
    },
  };
}

// ============================================================================
// Task/Productivity Templates
// ============================================================================

export function taskAssignedNotification(
  userId: string,
  taskTitle: string,
  taskId: string,
  assignedBy: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Task Assigned',
      subtitle: `By ${assignedBy}`,
      body: taskTitle,
      categoryId: 'task',
      data: {
        type: 'task-assigned',
        taskId,
        deepLink: {
          screen: 'TaskDetail',
          params: { id: taskId },
        },
      },
      badge: 1,
      priority: 'high',
    },
  };
}

export function taskDueNotification(
  userId: string,
  taskTitle: string,
  taskId: string,
  dueIn: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Task Due Soon',
      body: `"${taskTitle}" is due ${dueIn}`,
      categoryId: 'task',
      data: {
        type: 'task-due',
        taskId,
        deepLink: {
          screen: 'TaskDetail',
          params: { id: taskId },
        },
      },
      badge: 1,
      priority: 'high',
      sound: true,
    },
  };
}

export function taskCompletedNotification(
  userId: string,
  taskTitle: string,
  taskId: string,
  completedBy: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Task Completed',
      body: `${completedBy} completed "${taskTitle}"`,
      data: {
        type: 'task-completed',
        taskId,
        deepLink: {
          screen: 'TaskDetail',
          params: { id: taskId },
        },
      },
    },
  };
}

export function reminderNotification(
  userId: string,
  reminderTitle: string,
  reminderId: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Reminder',
      body: reminderTitle,
      categoryId: 'reminder',
      data: {
        type: 'reminder',
        reminderId,
      },
      sound: true,
      priority: 'high',
    },
  };
}

// ============================================================================
// System Templates
// ============================================================================

export function systemMaintenanceNotification(
  userId: string,
  maintenanceTime: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Scheduled Maintenance',
      body: `The app will be unavailable on ${maintenanceTime}`,
      data: {
        type: 'system-maintenance',
      },
      priority: 'high',
    },
  };
}

export function systemUpdateNotification(
  userId: string,
  version: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Update Available',
      body: `Version ${version} is now available with new features`,
      data: {
        type: 'system-update',
        version,
      },
    },
  };
}

export function securityAlertNotification(
  userId: string,
  alertMessage: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Security Alert',
      body: alertMessage,
      data: {
        type: 'security-alert',
        deepLink: {
          screen: 'Security',
        },
      },
      priority: 'high',
      sound: true,
    },
  };
}

// ============================================================================
// E-commerce Templates
// ============================================================================

export function orderConfirmedNotification(
  userId: string,
  orderId: string,
  orderTotal: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Order Confirmed',
      body: `Your order #${orderId} (${orderTotal}) has been confirmed`,
      data: {
        type: 'order-confirmed',
        orderId,
        deepLink: {
          screen: 'OrderDetail',
          params: { id: orderId },
        },
      },
      badge: 1,
    },
  };
}

export function orderShippedNotification(
  userId: string,
  orderId: string,
  trackingNumber: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Order Shipped',
      body: `Your order #${orderId} has been shipped`,
      data: {
        type: 'order-shipped',
        orderId,
        trackingNumber,
        deepLink: {
          screen: 'OrderTracking',
          params: { id: orderId },
        },
      },
      badge: 1,
    },
  };
}

export function orderDeliveredNotification(
  userId: string,
  orderId: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Order Delivered',
      body: `Your order #${orderId} has been delivered`,
      data: {
        type: 'order-delivered',
        orderId,
        deepLink: {
          screen: 'OrderDetail',
          params: { id: orderId },
        },
      },
      badge: 1,
    },
  };
}

export function priceDropNotification(
  userId: string,
  productName: string,
  productId: string,
  oldPrice: string,
  newPrice: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Price Drop!',
      body: `${productName} is now ${newPrice} (was ${oldPrice})`,
      data: {
        type: 'price-drop',
        productId,
        deepLink: {
          screen: 'Product',
          params: { id: productId },
        },
      },
      badge: 1,
    },
  };
}

// ============================================================================
// Payment Templates
// ============================================================================

export function paymentSuccessNotification(
  userId: string,
  amount: string,
  transactionId: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Payment Successful',
      body: `Your payment of ${amount} was processed successfully`,
      data: {
        type: 'payment-success',
        transactionId,
        deepLink: {
          screen: 'TransactionDetail',
          params: { id: transactionId },
        },
      },
      badge: 1,
    },
  };
}

export function paymentFailedNotification(
  userId: string,
  amount: string,
  reason: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Payment Failed',
      body: `Your payment of ${amount} failed: ${reason}`,
      data: {
        type: 'payment-failed',
        deepLink: {
          screen: 'PaymentMethods',
        },
      },
      priority: 'high',
      sound: true,
    },
  };
}

export function subscriptionExpiringNotification(
  userId: string,
  daysUntilExpiry: number
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Subscription Expiring',
      body: `Your subscription will expire in ${daysUntilExpiry} days`,
      data: {
        type: 'subscription-expiring',
        deepLink: {
          screen: 'Subscription',
        },
      },
      priority: 'high',
    },
  };
}

// ============================================================================
// Event Templates
// ============================================================================

export function eventReminderNotification(
  userId: string,
  eventTitle: string,
  eventId: string,
  startsIn: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Event Reminder',
      body: `"${eventTitle}" starts ${startsIn}`,
      data: {
        type: 'event-reminder',
        eventId,
        deepLink: {
          screen: 'EventDetail',
          params: { id: eventId },
        },
      },
      priority: 'high',
      sound: true,
    },
  };
}

export function eventCancelledNotification(
  userId: string,
  eventTitle: string,
  eventId: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Event Cancelled',
      body: `"${eventTitle}" has been cancelled`,
      data: {
        type: 'event-cancelled',
        eventId,
      },
      priority: 'high',
    },
  };
}

// ============================================================================
// Achievement Templates
// ============================================================================

export function achievementUnlockedNotification(
  userId: string,
  achievementTitle: string,
  achievementId: string
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: 'Achievement Unlocked! 🏆',
      body: achievementTitle,
      data: {
        type: 'achievement',
        achievementId,
        deepLink: {
          screen: 'Achievements',
        },
      },
      badge: 1,
      sound: 'achievement.wav',
    },
  };
}

export function streakNotification(
  userId: string,
  streakCount: number
): SendNotificationRequest {
  return {
    userId,
    notification: {
      title: `${streakCount} Day Streak! 🔥`,
      body: 'Keep up the great work!',
      data: {
        type: 'streak',
        streakCount,
      },
      badge: 1,
    },
  };
}

// ============================================================================
// Helper: Send Template
// ============================================================================

/**
 * Send a notification using a template
 */
export async function sendTemplateNotification(
  template: SendNotificationRequest
): Promise<void> {
  const { sendNotification } = await import('./notificationService');
  await sendNotification(template);
}
