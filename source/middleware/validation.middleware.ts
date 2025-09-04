import { Request, Response, NextFunction } from 'express';
import { validateCreateBookingSchema, validateExtendBookingSchema } from '../validation/booking-schema';

export function validateCreateBooking(req: Request, res: Response, next: NextFunction) {
    const validation = validateCreateBookingSchema(req.body);
    
    if (!validation.isValid) {
        return res.status(400).json({
            error: 'Validation failed',
            details: validation.errors
        });
    }
    
    req.body = {
        ...req.body,
        checkInDate: new Date(req.body.checkInDate) // Convert here once
    };
    
    next();
}

export function validateExtendBooking(req: Request, res: Response, next: NextFunction) {
    const validation = validateExtendBookingSchema(req.body);
    
    if (!validation.isValid) {
        return res.status(400).json({
            error: 'Validation failed',
            details: validation.errors
        });
    }
    
    next();
}

export function validateBookingId(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({
            error: 'Validation failed',
            details: [{ field: 'id', message: 'Booking ID is required' }]
        });
    }
    
    const bookingId = Number(id);
    if (isNaN(bookingId) || !Number.isInteger(bookingId) || bookingId < 1) {
        return res.status(400).json({
            error: 'Validation failed',
            details: [{ field: 'id', message: 'Booking ID must be a positive integer' }]
        });
    }
    
    next();
}