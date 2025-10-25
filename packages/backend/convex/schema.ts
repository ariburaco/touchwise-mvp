import { defineSchema } from 'convex/server';
import { userSettings } from './schemas/userSettings.schema';
import { users } from './schemas/user.schema';
import { notifications } from './schemas/notifications.schema';
import { activityLogs } from './schemas/activityLogs.schema';
import { subscriptions } from './schemas/subscriptions.schema';
import { orders } from './schemas/orders.schema';
import { usageMeters } from './schemas/usageMeters.schema';
import { usageRules } from './schemas/usageRules.schema';
import { usageCredits } from './schemas/usageCredits.schema';
import { usageTracking } from './schemas/usageTracking.schema';
import { usageEvents } from './schemas/usageEvents.schema';
import { companies } from './schemas/companies.schema';
import { leads } from './schemas/leads.schema';
import { chatLinks } from './schemas/chatLinks.schema';
import { chatSessions } from './schemas/chatSessions.schema';
import { chatMessages } from './schemas/chatMessages.schema';

export default defineSchema({
  users,
  userSettings,
  notifications,
  activityLogs,
  subscriptions,
  orders,
  usageMeters,
  usageRules,
  usageCredits,
  usageTracking,
  usageEvents,
  companies,
  leads,
  chatLinks,
  chatSessions,
  chatMessages,
});
