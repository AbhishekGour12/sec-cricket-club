import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useRealtimeStream } from '../hooks/useRealtimeStream';
import { useAnnouncementRealtime } from '../hooks/useAnnouncementRealtime';
import { useEventRealtime } from '../hooks/useEventRealtime';
import { useAuthStore } from '../store/authStore';
import { useApprovalStore } from '../store/approvalStore';

/**
 * Registers push + SSE realtime + polling fallback for approved members.
 */
export function PushNotificationBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const approvalStatus = useApprovalStore((s) => s.approvalStatus);
  const currentStatus = approvalStatus ?? user?.approval_status;
  const enabled = isAuthenticated && currentStatus === 'approved';

  usePushNotifications(enabled);
  useRealtimeStream(enabled);
  useAnnouncementRealtime(enabled);
  useEventRealtime(enabled);

  return null;
}

export default PushNotificationBootstrap;
