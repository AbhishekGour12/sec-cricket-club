import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useAnnouncementRealtime } from '../hooks/useAnnouncementRealtime';
import { useEventRealtime } from '../hooks/useEventRealtime';
import { useAuthStore } from '../store/authStore';
import { useApprovalStore } from '../store/approvalStore';

/**
 * Registers push + foreground sync for approved members.
 * Sync runs once on open / resume; push covers live updates while open.
 */
export function PushNotificationBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const approvalStatus = useApprovalStore((s) => s.approvalStatus);
  const enabled = isAuthenticated && approvalStatus === 'approved';

  usePushNotifications(enabled);
  useAnnouncementRealtime(enabled);
  useEventRealtime(enabled);

  return null;
}

export default PushNotificationBootstrap;
