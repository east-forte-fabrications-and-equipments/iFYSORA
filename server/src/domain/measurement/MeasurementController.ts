import { Request, Response } from 'express';
import { MeasurementService } from './MeasurementService.js';
import { logger } from '../../utils/logger.js';

export class MeasurementController {
  private service: MeasurementService;

  constructor() {
    this.service = new MeasurementService();
  }

  async analyze(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const result = await this.service.analyze(req.body, userId);

      return res.json({
        success: true,
        measurement: result,
      });
    } catch (error) {
      logger.error('Measurement analysis error:', error);

      if (error.message?.includes('limit reached')) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: error.message,
        });
      }

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }

      return res.status(500).json({
        error: 'Failed to analyze measurements',
        details: error.message,
      });
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { limit = 50, offset = 0, includePortraits = false } = req.query;

      const measurements = await prisma.measurement.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string, 10),
        skip: parseInt(offset as string, 10),
        include: includePortraits === 'true' ? {
          portrait: {
            select: {
              id: true,
              thumbnailUrl: true,
              clientName: true,
              isVerified: true,
            },
          },
        } : undefined,
      });

      const total = await prisma.measurement.count({
        where: { userId },
      });

      return res.json({
        measurements,
        pagination: {
          total,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
        },
      });
    } catch (error) {
      logger.error('Get history error:', error);
      return res.status(500).json({
        error: 'Failed to get measurement history',
      });
    }
  }
}
