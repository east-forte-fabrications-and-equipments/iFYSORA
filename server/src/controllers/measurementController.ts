import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { GeminiService } from '../services/geminiService.js';
import { SyncService } from '../services/syncService.js';
import { AuditService } from '../services/auditService.js';
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
      
      // Check subscription limits (simplified)
      if (user.subscriptionStatus !== 'ACTIVE' && user.verificationLevel < 2) {
        // Allow limited measurements for free users
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
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          timestamp: new Date(),
          userHeightCm,
          bodyShape: analysis.bodyShape,
          confidenceScores: analysis.confidenceScores,
          calibrationData: analysis.calibrationData,
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
        // Don't fail the request, just log the error
      }
      
      // Audit log
      await this.auditService.log({
        userId,
        action: 'MEASUREMENT_CREATED',
        resource: 'measurement',
        resourceId: measurement.id,
        newValues: { measurementId: measurement.id },
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
  
  async getMeasurements(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { limit = 50, offset = 0 } = req.query;
      
      const measurements = await prisma.measurement.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
        select: {
          id: true,
          sessionId: true,
          timestamp: true,
          bodyShape: true,
          data: true,
          confidenceScores: true,
          userHeightCm: true,
          syncedToFysora: true,
        },
      });
      
      const total = await prisma.measurement.count({ where: { userId } });
      
      return res.json({
        measurements,
        pagination: {
          total,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
      
    } catch (error) {
      logger.error('Get measurements error:', error);
      return res.status(500).json({
        error: 'Failed to fetch measurements',
      });
    }
  }
  
  async getMeasurement(req: Request, res: Response) {
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
      
      return res.json(measurement);
      
    } catch (error) {
      logger.error('Get measurement error:', error);
      return res.status(500).json({
        error: 'Failed to fetch measurement',
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
      
      await prisma.measurement.delete({
        where: { id },
      });
      
      await this.auditService.log({
        userId,
        action: 'MEASUREMENT_DELETED',
        resource: 'measurement',
        resourceId: id,
        oldValues: { measurementId: id },
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
      });
    }
  }
}
