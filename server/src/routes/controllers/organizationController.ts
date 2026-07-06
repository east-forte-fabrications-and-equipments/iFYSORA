import { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { SyncService } from '../services/syncService.js';
import { AuditService } from '../services/auditService.js';
import { logger } from '../utils/logger.js';

export class OrganizationController {
  private syncService: SyncService;
  private auditService: AuditService;

  constructor() {
    this.syncService = new SyncService();
    this.auditService = AuditService.getInstance();
  }

  async createOrganization(req: Request, res: Response) {
    try {
      const { name, description, type, registrationNumber, contactEmail, contactPhone, address } = req.body;
      const userId = (req as any).user.id;

      // Check if user already has an organization
      const existing = await prisma.organizationMember.findFirst({
        where: {
          userId,
          role: 'OWNER',
        },
      });

      if (existing) {
        return res.status(400).json({
          error: 'User already owns an organization',
        });
      }

      // Create organization
      const organization = await prisma.organization.create({
        data: {
          name,
          description,
          type,
          registrationNumber,
          contactEmail,
          contactPhone,
          address,
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // Sync with FYSORA FASHN
      try {
        const synced = await this.syncService.syncOrganization(organization);
        await prisma.organization.update({
          where: { id: organization.id },
          data: { fysoraOrgId: synced.id },
        });
      } catch (syncError) {
        logger.error('Failed to sync organization to FYSORA FASHN:', syncError);
      }

      // Audit log
      await this.auditService.log({
        userId,
        action: 'ORGANIZATION_CREATED',
        resource: 'organization',
        resourceId: organization.id,
        newValues: { name, type },
        source: 'ifysora',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.status(201).json({
        success: true,
        organization,
      });

    } catch (error) {
      logger.error('Create organization error:', error);
      return res.status(500).json({
        error: 'Failed to create organization',
        details: error.message,
      });
    }
  }

  async getOrganizations(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const organizations = await prisma.organization.findMany({
        where: {
          members: {
            some: {
              userId,
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json({
        organizations,
      });

    } catch (error) {
      logger.error('Get organizations error:', error);
      return res.status(500).json({
        error: 'Failed to fetch organizations',
      });
    }
  }

  async addMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, role = 'MEMBER' } = req.body;
      const userId = (req as any).user.id;

      // Check if user is owner or admin of organization
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: id,
          userId,
          role: {
            in: ['OWNER', 'ADMIN'],
          },
        },
      });

      if (!membership) {
        return res.status(403).json({
          error: 'You do not have permission to add members to this organization',
        });
      }

      // Find user by email
      const userToAdd = await prisma.user.findUnique({
        where: { email },
      });

      if (!userToAdd) {
        return res.status(404).json({
          error: 'User not found',
        });
      }

      // Add member
      const member = await prisma.organizationMember.create({
        data: {
          userId: userToAdd.id,
          organizationId: id,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      // Audit log
      await this.auditService.log({
        userId,
        action: 'ORGANIZATION_MEMBER_ADDED',
        resource: 'organization',
        resourceId: id,
        newValues: { memberId: userToAdd.id, role },
        source: 'ifysora',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.json({
        success: true,
        member,
      });

    } catch (error) {
      logger.error('Add member error:', error);
      return res.status(500).json({
        error: 'Failed to add member',
        details: error.message,
      });
    }
  }

  async removeMember(req: Request, res: Response) {
    try {
      const { id, memberId } = req.params;
      const userId = (req as any).user.id;

      // Check if user is owner or admin
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: id,
          userId,
          role: {
            in: ['OWNER', 'ADMIN'],
          },
        },
      });

      if (!membership) {
        return res.status(403).json({
          error: 'You do not have permission to remove members from this organization',
        });
      }

      // Cannot remove the last owner
      const ownerCount = await prisma.organizationMember.count({
        where: {
          organizationId: id,
          role: 'OWNER',
        },
      });

      if (ownerCount === 1) {
        const memberToRemove = await prisma.organizationMember.findFirst({
          where: {
            id: memberId,
            role: 'OWNER',
          },
        });

        if (memberToRemove) {
          return res.status(400).json({
            error: 'Cannot remove the last owner. Transfer ownership first.',
          });
        }
      }

      await prisma.organizationMember.delete({
        where: { id: memberId },
      });

      // Audit log
      await this.auditService.log({
        userId,
        action: 'ORGANIZATION_MEMBER_REMOVED',
        resource: 'organization',
        resourceId: id,
        oldValues: { memberId },
        source: 'ifysora',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      return res.json({
        success: true,
        message: 'Member removed successfully',
      });

    } catch (error) {
      logger.error('Remove member error:', error);
      return res.status(500).json({
        error: 'Failed to remove member',
        details: error.message,
      });
    }
  }
}
