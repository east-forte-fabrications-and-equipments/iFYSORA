import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MeasurementService } from '../../../src/domain/measurement/MeasurementService.js';
import { prisma } from '../../../src/config/database.js';

// Mock dependencies
vi.mock('../../../src/config/database.js');
vi.mock('../../../src/services/geminiService.js');
vi.mock('../../../src/services/syncService.js');

describe('MeasurementService', () => {
  let service: MeasurementService;

  beforeEach(() => {
    service = new MeasurementService();
    vi.clearAllMocks();
  });

  describe('analyze', () => {
    const mockUserId = 'user-123';
    const mockParams = {
      frontImage: 'data:image/png;base64,fakeimage',
      sideImage: 'data:image/png;base64,fakeimage',
      userHeightCm: 175,
      clientName: 'Test Client',
    };

    it('should successfully analyze measurements', async () => {
      // Mock user lookup
      (prisma.user.findUnique as any).mockResolvedValue({
        id: mockUserId,
        subscriptionStatus: 'ACTIVE',
      });

      // Mock measurement creation
      (prisma.measurement.create as any).mockResolvedValue({
        id: 'measurement-123',
        sessionId: 'session-123',
        data: { 'Chest girth': 96.5 },
        bodyShape: 'Rectangle',
      });

      const result = await service.analyze(mockParams, mockUserId);

      expect(result).toBeDefined();
      expect(result.measurementId).toBe('measurement-123');
      expect(result.bodyShape).toBe('Rectangle');
    });

    it('should throw error when user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await expect(service.analyze(mockParams, mockUserId))
        .rejects
        .toThrow('User not found');
    });
  });
});
