import { Request, Response } from 'express';
import { PortraitService } from '../services/portraitService.js';
import { storageService } from '../services/storageService.js';
import { logger } from '../utils/logger.js';

export class PortraitController {
  private portraitService: PortraitService;
  
  constructor() {
    this.portraitService = PortraitService.getInstance();
  }
  
  async uploadPortrait(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { 
        image, 
        uploadMethod = 'UPLOAD',
        clientName,
        clientEmail,
        clientPhone,
        clientNotes,
        setAsActive = false,
      } = req.body;
      
      if (!image) {
        return res.status(400).json({
          error: 'Image is required',
        });
      }
      
      const result = await this.portraitService.uploadPortrait(
        userId,
        image,
        uploadMethod,
        {
          clientName,
          clientEmail,
          clientPhone,
          clientNotes,
          setAsActive,
        }
      );
      
      return res.json({
        success: true,
        portrait: result,
      });
      
    } catch (error) {
      logger.error('Upload portrait error:', error);
      return res.status(500).json({
        error: 'Failed to upload portrait',
        details: error.message,
      });
    }
  }
  
  async getPortraits(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      
      const portraits = await this.portraitService.getClientPortraits(userId);
      
      return res.json({
        portraits,
      });
      
    } catch (error) {
      logger.error('Get portraits error:', error);
      return res.status(500).json({
        error: 'Failed to get portraits',
        details: error.message,
      });
    }
  }
  
  async getPortrait(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      
      const portrait = await this.portraitService.getPortrait(id);
      
      // Verify ownership
      if (portrait.userId !== userId) {
        return res.status(403).json({
          error: 'Access denied',
        });
      }
      
      return res.json({
        portrait,
      });
      
    } catch (error) {
      logger.error('Get portrait error:', error);
      return res.status(500).json({
        error: 'Failed to get portrait',
        details: error.message,
      });
    }
  }
  
  async deletePortrait(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      
      await this.portraitService.deletePortrait(userId, id);
      
      return res.json({
        success: true,
        message: 'Portrait deleted successfully',
      });
      
    } catch (error) {
      logger.error('Delete portrait error:', error);
      return res.status(500).json({
        error: 'Failed to delete portrait',
        details: error.message,
      });
    }
  }
  
  async setActivePortrait(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      
      // Verify ownership
      const portrait = await this.portraitService.getPortrait(id);
      if (portrait.userId !== userId) {
        return res.status(403).json({
          error: 'Access denied',
        });
      }
      
      await this.portraitService.setActivePortrait(userId, id);
      
      return res.json({
        success: true,
        message: 'Active portrait updated',
      });
      
    } catch (error) {
      logger.error('Set active portrait error:', error);
      return res.status(500).json({
        error: 'Failed to set active portrait',
        details: error.message,
      });
    }
  }
                      }
