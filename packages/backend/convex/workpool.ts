import { Workpool } from 'convex-helpers/server/workpool';
import { internal } from './_generated/api';

export const scraperPool = new Workpool(internal.actions.scrapeCompany.scrapeAndUpdateLead, {
  maxParallelism: 3, // Run up to 3 scrapes concurrently
});
