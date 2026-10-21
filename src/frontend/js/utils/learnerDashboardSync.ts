/**
 * Cross-tab sync for the learner dashboard ("Mes cours").
 * sessionStorage is per-tab, so React Query persistence cannot notify the other tab.
 */
export const LEARNER_DASHBOARD_SYNC_CHANNEL = 'richie-learner-dashboard-sync';

export const notifyLearnerDashboardChanged = () => {
  if (typeof BroadcastChannel === 'undefined') {
    return;
  }
  const channel = new BroadcastChannel(LEARNER_DASHBOARD_SYNC_CHANNEL);
  channel.postMessage({ type: 'enrollments-changed' });
  channel.close();
};
