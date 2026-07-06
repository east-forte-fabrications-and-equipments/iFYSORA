import { EventBus, Event } from '../EventBus.js';
import { SyncService } from '../../../services/syncService.js';
import { prisma } from '../../../config/database.js';
import { logger } from '../../../utils/logger.js';

export class SyncHandler {
  private syncService: SyncService;
  private eventBus: EventBus;

  constructor() {
    this.syncService = new SyncService();
    this.eventBus = EventBus.getInstance();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    this.eventBus.subscribe('measurement.created', this.handleMeasurementCreated.bind(this));
    this.eventBus.subscribe('measurement.updated', this.handleMeasurementUpdated.bind(this));
    this.eventBus.subscribe('measurement.deleted', this.handleMeasurementDeleted.bind(this));
    this.eventBus.subscribe('portrait.created', this.handlePortraitCreated.bind(this));
  }

  async handleMeasurementCreated(event: Event): Promise<void> {
    try {
      const { measurementId, userId } = event.payload;
      
      const measurement = await prisma.measurement.findUnique({
        where: { id: measurementId },
        include: { user: true },
      });

      if (!measurement) {
        throw new Error(`Measurement ${measurementId} not found`);
      }

      // Retry with exponential backoff
      const syncResult = await this.syncWithRetry(measurement);

      await prisma.measurement.update({
        where: { id: measurementId },
        data: {
          syncedToFysora: true,
          fysoraMeasurementId: syncResult.id,
          syncedAt: new Date(),
        },
      });

      logger.info(`Measurement ${measurementId} synced successfully`);
    } catch (error) {
      logger.error('Failed to sync measurement:', error);
      // Event will be retried via failed-events stream
      throw error;
    }
  }

  private async syncWithRetry(measurement: any, retries = 3): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.syncService.syncMeasurement(measurement.user, measurement);
        return result;
      } catch (error) {
        lastError = error;
        logger.warn(`Sync attempt ${attempt} failed for measurement ${measurement.id}`);
        
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Sync failed after all retries');
  }

  async handleMeasurementUpdated(event: Event): Promise<void> {
    // Similar to created but with update logic
    logger.info(`Measurement updated: ${event.payload.measurementId}`);
  }

  async handleMeasurementDeleted(event: Event): Promise<void> {
    // Notify FYSORA FASHN about deletion
    logger.info(`Measurement deleted: ${event.payload.measurementId}`);
  }

  async handlePortraitCreated(event: Event): Promise<void> {
    // Notify FYSORA FASHN about portrait creation
    logger.info(`Portrait created for user: ${event.payload.userId}`);
  }
}
