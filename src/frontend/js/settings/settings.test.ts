// This configuration file is used for testing.
// Mostly useful to test our test tools.
import { DevDemoUser } from 'api/lms/dummy';

/**
 * Available users:
 *  * admin
 *  * user0
 *  * user1
 *  * user2
 *  * user3
 *  * user4
 *  * organization_owner
 *  * student_user
 */
export const CURRENT_JOANIE_DEV_DEMO_USER: DevDemoUser = 'admin';

export const CONTRACT_SETTINGS = {
  // Interval in ms to poll the related order when a signature has succeeded.
  pollInterval: 150,
  // Number of retries
  pollLimit: 45,
  // Simulated sign request delay
  dummySignatureSignTimeout: 100,
};

export const PAYMENT_SETTINGS = {
  // Interval in ms to poll the related order when a payment has succeeded.
  pollInterval: 150,
};
