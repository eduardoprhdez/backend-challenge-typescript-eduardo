import { Prisma } from '@prisma/client';
import prisma from '../prisma';
import { BookingInput, BookingWithCheckOut } from '../types/booking';

export async function findOverlappingBookings(
    guestName?: string, 
    unitID?: string, 
    checkInDate?: Date, 
    numberOfNights?: number,
    excludeBookingId?: number
): Promise<BookingWithCheckOut[]> {
    const conditions: Prisma.Sql[] = [];
    
    if (guestName) {
        conditions.push(Prisma.sql`guestName = ${guestName}`);
    }

    if (unitID) {
        conditions.push(Prisma.sql`unitID = ${unitID}`);
    }

    if (excludeBookingId) {
        conditions.push(Prisma.sql`id != ${excludeBookingId}`);
    }

    if (checkInDate && numberOfNights) {
        const checkOutDate = new Date(checkInDate);
        checkOutDate.setDate(checkOutDate.getDate() + numberOfNights);

        conditions.push(Prisma.sql`checkInDate < ${checkOutDate.toISOString()}`);
        conditions.push(Prisma.sql`checkOutDate > ${checkInDate.toISOString()}`);
    }

    let query = Prisma.sql`SELECT * FROM BookingWithCheckOut`;
    
    if (conditions.length > 0) {
        query = Prisma.sql`${query} WHERE ${Prisma.join(conditions, ' AND ')}`;
    }
    
    const results = await prisma.$queryRaw<BookingWithCheckOut[]>(query);
    
    return results.map(booking => ({
        ...booking,
        checkInDate: new Date(booking.checkInDate),
        checkOutDate: new Date(booking.checkOutDate)
    }));
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