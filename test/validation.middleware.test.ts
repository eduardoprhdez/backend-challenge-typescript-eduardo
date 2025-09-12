import { Request, Response } from 'express';
import { validateCreateBooking, validateExtendBooking } from '../source/middleware/validation.middleware';

describe('Validation Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: jest.Mock;

    // Helper functions for dynamic dates
    function getFutureDate(daysFromNow: number = 1): string {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toISOString().split('T')[0];
    }

    beforeEach(() => {
        mockReq = {};
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
    });

    describe('validateCreateBooking', () => {
        test('Valid booking data passes validation', () => {
            mockReq.body = {
                guestName: 'TestGuest',
                unitID: '1',
                checkInDate: getFutureDate(1), // Use tomorrow instead of hardcoded date
                numberOfNights: 3
            };

            validateCreateBooking(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('Invalid numberOfNights zero', () => {
            mockReq.body = {
                guestName: 'TestGuest',
                unitID: '1',
                checkInDate: getFutureDate(1), // Use tomorrow instead of hardcoded date
                numberOfNights: 0
            };

            validateCreateBooking(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Validation failed',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'numberOfNights',
                        message: 'Number of nights must be at least 1'
                    })
                ])
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('Invalid checkInDate in the past', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            mockReq.body = {
                guestName: 'TestGuest',
                unitID: '1',
                checkInDate: yesterday.toISOString().split('T')[0],
                numberOfNights: 3
            };

            validateCreateBooking(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('validateExtendBooking', () => {
        test('Valid extension data passes validation', () => {
            mockReq.body = { additionalNights: 3 };

            validateExtendBooking(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        test('Invalid additionalNights zero', () => {
            mockReq.body = { additionalNights: 0 };

            validateExtendBooking(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Validation failed',
                details: expect.arrayContaining([
                    expect.objectContaining({
                        field: 'additionalNights',
                        message: 'Additional nights must be at least 1'
                    })
                ])
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('Missing additionalNights', () => {
            mockReq.body = {};

            validateExtendBooking(mockReq as Request, mockRes as Response, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});