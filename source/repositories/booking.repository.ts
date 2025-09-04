import { Prisma } from '@prisma/client';
import prisma from '../prisma';
import { BookingInput } from '../types/booking';

type ConflictCheckOptions = {
    checkInDate: Date;
    numberOfNights: number;
    excludeBookingId?: number;
} & (
    | { type: 'guest'; guestName: string }
    | { type: 'unit'; unitID: string }
);

export async function checkBookingConflict(options: ConflictCheckOptions): Promise<boolean> {
    const checkOutDate = new Date(options.checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + options.numberOfNights);

    const where: any = {};
    
    if (options.type === 'guest') {
        where.guestName = options.guestName;
    } else if (options.type === 'unit') {
        where.unitID = options.unitID;
    }

    if (options.excludeBookingId) {
        where.id = { not: options.excludeBookingId };
    }

    const [pastBooking, futureBooking] = await Promise.all([
        prisma.booking.findFirst({
            where: {
                ...where,
                checkInDate: { lte: options.checkInDate }
            },
            orderBy: { checkInDate: 'desc' }
        }),
        
        prisma.booking.findFirst({
            where: {
                ...where,
                checkInDate: { gt: options.checkInDate }
            },
            orderBy: { checkInDate: 'asc' }
        })
    ]);

    if (pastBooking) {
        const pastCheckOut = new Date(pastBooking.checkInDate);
        pastCheckOut.setDate(pastCheckOut.getDate() + pastBooking.numberOfNights);
        if (pastCheckOut > options.checkInDate) {
            return true;
        }
    }

    if (futureBooking) {
        if (futureBooking.checkInDate < checkOutDate) {
            return true;
        }
    }

    return false;
}

export async function createBooking(bookingData: BookingInput) {
    return await prisma.booking.create({
        data: {
            guestName: bookingData.guestName,
            unitID: bookingData.unitID,
            checkInDate: bookingData.checkInDate,
            numberOfNights: bookingData.numberOfNights
        }
    });
}

export async function findBookingById(id: number) {
    return await prisma.booking.findUnique({
        where: { id }
    });
}

export async function updateBookingNights(id: number, numberOfNights: number) {
    return await prisma.booking.update({
        where: { id },
        data: { numberOfNights }
    });
}