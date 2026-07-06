import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid phone number'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase, lowercase, number, and special character'),
  body('displayName')
    .notEmpty()
    .withMessage('Display name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Display name must be between 2 and 100 characters'),
  body('role')
    .optional()
    .isIn(['TAILOR', 'DESIGNER', 'ORGANIZATION'])
    .withMessage('Invalid role. Must be TAILOR, DESIGNER, or ORGANIZATION'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }
    next();
  },
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }
    next();
  },
];

export const validateMeasurement = [
  body('frontImage')
    .notEmpty()
    .withMessage('Front image is required')
    .matches(/^data:image\/(png|jpeg|jpg);base64,/)
    .withMessage('Front image must be a base64 encoded image (PNG or JPEG)'),
  body('sideImage')
    .notEmpty()
    .withMessage('Side image is required')
    .matches(/^data:image\/(png|jpeg|jpg);base64,/)
    .withMessage('Side image must be a base64 encoded image (PNG or JPEG)'),
  body('userHeightCm')
    .isFloat({ min: 50, max: 300 })
    .withMessage('Height must be between 50 and 300 cm'),
  body('useDepthSensor')
    .optional()
    .isBoolean()
    .withMessage('useDepthSensor must be a boolean'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }
    next();
  },
];

export const validateOrganization = [
  body('name')
    .notEmpty()
    .withMessage('Organization name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('type')
    .isIn(['TAILOR', 'DESIGNER', 'BOUTIQUE', 'BRAND', 'OTHER'])
    .withMessage('Invalid organization type'),
  body('contactEmail')
    .optional()
    .isEmail()
    .withMessage('Invalid contact email'),
  body('contactPhone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Invalid contact phone'),
  body('registrationNumber')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Registration number must be between 2 and 50 characters'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }
    next();
  },
];
