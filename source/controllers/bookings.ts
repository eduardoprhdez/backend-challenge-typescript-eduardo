import { Request, Response, NextFunction } from 'express';
import * as bookingService from '../services/booking.service';

export const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: "OK" });
}

export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await bookingService.createNewBooking(req.body);
        return res.status(200).json(result.data);
    } catch (error: any) {
        return res.status(400).json(error.message);
    }
}

export const extendBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bookingId = Number(req.params.id);
        const { additionalNights } = req.body;
        
        const result = await bookingService.extendExistingBooking(bookingId, additionalNights);
        return res.status(200).json(result.data);
    } catch (error: any) {
        if (error.message === 'Booking not found') {
            return res.status(404).json(error.message);
        }
        return res.status(400).json(error.message);
    }
}

export default { healthCheck, createBooking, extendBooking };