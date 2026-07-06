import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class StorageService {
  private static instance: StorageService;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    // Start cleanup job
    this.startCleanupJob();
  }
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  async uploadImage(
    base64Image: string,
    userId: string,
    sessionId: string,
    type: 'front' | 'side'
  ): Promise<{ url: string; publicId: string }> {
    try {
      // Remove data URL prefix if present
      const imageData = base64Image.replace(/^data:image\/\w+;base64,/, '');
      
      const uploadResult = await cloudinary.uploader.upload(
        `data:image/png;base64,${imageData}`,
        {
          folder: `ifysora/users/${userId}/measurements/${sessionId}`,
          public_id: type,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' },
            { width: 1200, crop: 'limit' },
          ],
        }
      );
      
      logger.info(`Image uploaded: ${uploadResult.public_id}`);
      
      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
      
    } catch (error) {
      logger.error('Image upload failed:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }
  
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      logger.error(`Failed to delete image ${publicId}:`, error);
      return false;
    }
  }
  
  async deleteMeasurementImages(userId: string, sessionId: string): Promise<void> {
    try {
      const folder = `ifysora/users/${userId}/measurements/${sessionId}`;
      const result = await cloudinary.api.delete_resources_by_prefix(folder);
      logger.info(`Deleted images for folder: ${folder}`);
    } catch (error) {
      logger.error(`Failed to delete images for session ${sessionId}:`, error);
    }
  }
  
  private startCleanupJob() {
    // Clean up orphaned images every day
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupOrphanedImages();
      } catch (error) {
        logger.error('Cleanup job failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }
  
  private async cleanupOrphanedImages() {
    // Implementation to find and delete orphaned images
    // This would require tracking uploaded images in the database
    logger.info('Running image cleanup job...');
  }
  
  stopCleanupJob() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const storageService = StorageService.getInstance();
```

Update server/src/controllers/measurementController.ts

```typescript
import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { GeminiService } from '../services/geminiService.js';
import { SyncService } from '../services/syncService.js';
import { AuditService } from '../services/auditService.js';
import { storageService } from '../services/storageService.js';
import { logger } from '../utils/logger.js';

export class MeasurementController {
  private geminiService: GeminiService;
  private syncService: SyncService;
  private auditService: AuditService;
  
  constructor() {
    this.geminiService = GeminiService.getInstance();
    this.syncService = new SyncService();
    this.auditService = AuditService.getInstance();
  }
  
  async analyze(req: Request, res: Response) {
    try {
      const { frontImage, sideImage, userHeightCm, useDepthSensor = false } = req.body;
      const userId = (req as any).user.id;
      
      if (!frontImage || !sideImage) {
        return res.status(400).json({
          error: 'Both front and side images are required',
        });
      }
      
      if (!userHeightCm || userHeightCm < 50 || userHeightCm > 300) {
        return res.status(400).json({
          error: 'Valid height between 50-300 cm is required',
        });
      }
      
      // Check if user has exceeded their plan limits
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { measurements: true },
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check subscription limits
      if (user.subscriptionStatus !== 'ACTIVE' && user.verificationLevel < 2) {
        const monthlyCount = await prisma.measurement.count({
          where: {
            userId,
            timestamp: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            },
          },
        });
        
        if (monthlyCount >= 5) {
          return res.status(429).json({
            error: 'Monthly measurement limit reached. Please subscribe to continue.',
          });
        }
      }
      
      // Upload images to cloud storage
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      let frontImageUrl: string | null = null;
      let sideImageUrl: string | null = null;
      
      try {
        const frontUpload = await storageService.uploadImage(frontImage, userId, sessionId, 'front');
        frontImageUrl = frontUpload.url;
        
        const sideUpload = await storageService.uploadImage(sideImage, userId, sessionId, 'side');
        sideImageUrl = sideUpload.url;
      } catch (uploadError) {
        logger.error('Image upload failed:', uploadError);
        // Continue with analysis using base64 images directly
      }
      
      // Analyze using Gemini AI
      const analysis = await this.geminiService.analyzeMeasurements(
        frontImage,
        sideImage,
        userHeightCm,
        useDepthSensor
      );
      
      // Create measurement record
      const measurement = await prisma.measurement.create({
        data: {
          userId,
          data: analysis.measurements,
          sessionId,
          timestamp: new Date(),
          userHeightCm,
          bodyShape: analysis.bodyShape,
          confidenceScores: analysis.confidenceScores,
          calibrationData: {
            ...analysis.calibrationData,
            frontImageUrl,
            sideImageUrl,
          },
          poseFeedback: analysis.poseFeedback,
          clothingFeedback: analysis.clothingFeedback,
          aiModelUsed: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
          aiConfidence: Object.values(analysis.confidenceScores).reduce((a, b) => a + b, 0) / 
                        Object.keys(analysis.confidenceScores).length,
        },
      });
      
      // Sync with FYSORA FASHN
      try {
        const synced = await this.syncService.syncMeasurement(user, measurement);
        await prisma.measurement.update({
          where: { id: measurement.id },
          data: {
            syncedToFysora: true,
            fysoraMeasurementId: synced.id,
            syncedAt: new Date(),
          },
        });
      } catch (syncError) {
        logger.error('Failed to sync measurement to FYSORA FASHN:', syncError);
      }
      
      // Audit log
      await this.auditService.log({
        userId,
        action: 'MEASUREMENT_CREATED',
        resource: 'measurement',
        resourceId: measurement.id,
        newValues: { 
          measurementId: measurement.id,
          sessionId,
          hasImages: !!(frontImageUrl && sideImageUrl),
        },
        source: 'ifysora',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      return res.json({
        success: true,
        measurement: {
          id: measurement.id,
          sessionId: measurement.sessionId,
          timestamp: measurement.timestamp,
          bodyShape: measurement.bodyShape,
          measurements: measurement.data,
          confidenceScores: measurement.confidenceScores,
          calibrationData: measurement.calibrationData,
          poseFeedback: measurement.poseFeedback,
          clothingFeedback: measurement.clothingFeedback,
          images: {
            front: frontImageUrl,
            side: sideImageUrl,
          },
        },
      });
      
    } catch (error) {
      logger.error('Measurement analysis error:', error);
      return res.status(500).json({
        error: 'Failed to analyze measurements',
        details: error.message,
      });
    }
  }
  
  async deleteMeasurement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      
      const measurement = await prisma.measurement.findFirst({
        where: {
          id,
          userId,
        },
      });
      
      if (!measurement) {
        return res.status(404).json({
          error: 'Measurement not found',
        });
      }
      
      // Delete associated images
      try {
        await storageService.deleteMeasurementImages(userId, measurement.sessionId);
      } catch (imageError) {
        logger.error('Failed to delete measurement images:', imageError);
        // Continue with deletion even if images fail
      }
      
      await prisma.measurement.delete({
        where: { id },
      });
      
      await this.auditService.log({
        userId,
        action: 'MEASUREMENT_DELETED',
        resource: 'measurement',
        resourceId: id,
        oldValues: { 
          measurementId: id,
          sessionId: measurement.sessionId,
        },
        source: 'ifysora',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      
      return res.json({
        success: true,
        message: 'Measurement deleted successfully',
      });
      
    } catch (error) {
      logger.error('Delete measurement error:', error);
      return res.status(500).json({
        error: 'Failed to delete measurement',
        details: error.message,
      });
    }
  }
  }
