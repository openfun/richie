// This configuration file can be overridden with settings.dev.ts file.
// `$ cp settings.local.dist.ts settings.local.ts`, then change what's needed
// in local environment in settings.local.ts.
import { DevDemoUser } from 'api/lms/dummy';

// disable react query cache
// export const REACT_QUERY_SETTINGS = {
//   staleTimes: {
//     session: 0,
//     sessionItems: 0,
//   },
// };

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
