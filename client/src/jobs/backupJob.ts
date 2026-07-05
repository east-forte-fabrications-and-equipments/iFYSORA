import cron from 'node-cron';
import { CloudBackupService } from '../services/cloudBackupService.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export function scheduleBackupJobs() {
  // Run every day at 2 AM
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running scheduled auto-backup');
    
    try {
      const cloudBackupService = CloudBackupService.getInstance();
      
      // Get all users with auto-backup enabled
      const users = await prisma.user.findMany({
        where: {
          cloudProviders: {
            path: '$.autoBackup',
            equals: true,
          },
        },
        include: {
          cloudProviders: true,
        },
      });
      
      for (const user of users) {
        try {
          await cloudBackupService.autoBackupUserMeasurements(user.id, {
            autoBackup: true,
            frequency: user.backupFrequency || 'weekly',
            providers: user.cloudProviders,
          });
        } catch (error) {
          logger.error(`Auto-backup failed for user ${user.id}:`, error);
        }
      }
      
      logger.info('Auto-backup completed successfully');
      
    } catch (error) {
      logger.error('Auto-backup job failed:', error);
    }
  });
}
