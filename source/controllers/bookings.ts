import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma'

interface Booking {
    guestName: string;
    unitID: string;
    checkInDate: Date;
    numberOfNights: number;
}

const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: "OK"
    })
}

const createBooking = async (req: Request, res: Response, next: NextFunction) => {
    const booking: Booking = req.body;

    let outcome = await isBookingPossible(booking);
    if (!outcome.result) {
        return res.status(400).json(outcome.reason);
    }

    let bookingResult = await prisma.booking.create({
        data: {
             guestName: booking.guestName,
             unitID: booking.unitID,
             checkInDate: new Date(booking.checkInDate),
             numberOfNights: booking.numberOfNights
       }
    })

    return res.status(200).json(bookingResult);
}

type bookingOutcome = {result:boolean, reason:string};

async function checkBookingOverlap(
  guestName?: string, 
  unitID?: string, 
  excludeUnitID?: string,
  checkInDate?: Date, 
  numberOfNights?: number
): Promise<any[]> {
  let whereConditions = [];
  let params = [];

  if (guestName) {
    whereConditions.push("guestName = ?");
    params.push(guestName);
  }

  if (unitID) {
    whereConditions.push("unitID = ?");
    params.push(unitID);
  }

  if (excludeUnitID) {
    whereConditions.push("unitID != ?");
    params.push(excludeUnitID);
  }

  if (checkInDate && numberOfNights) {
    const  checkOutDate = new Date(checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + numberOfNights);

    whereConditions.push("checkInDate < ?");
    whereConditions.push("checkOutDate > ?");
    params.push(checkOutDate.toISOString());
    params.push(new Date(checkInDate).toISOString());
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  
  return await prisma.$queryRawUnsafe(
    `SELECT * FROM BookingWithCheckOut ${whereClause}`,
    ...params
  );
}

async function isBookingPossible(booking: Booking): Promise<bookingOutcome> {
    // check 1 : The Same guest cannot book the same unit multiple times
    let sameGuestSameUnit = await checkBookingOverlap(
      booking.guestName, 
      booking.unitID, 
      undefined,
      booking.checkInDate, 
      booking.numberOfNights
    );

    if (sameGuestSameUnit.length > 0) {
        return {result: false, reason: "The given guest name cannot book the same unit multiple times"};
    }

    // check 2 : the same guest cannot be in multiple units at the same time
    let sameGuestAlreadyBooked = await checkBookingOverlap(
      booking.guestName, 
      undefined, 
      booking.unitID,
      booking.checkInDate, 
      booking.numberOfNights
    );
    if (sameGuestAlreadyBooked.length > 0) {
        return {result: false, reason: "The same guest cannot be in multiple units at the same time"};
    }

    // check 3 : Unit is available for the selected nights
    let overlappingBookings = await checkBookingOverlap(
      undefined, 
      booking.unitID, 
      undefined,
      booking.checkInDate, 
      booking.numberOfNights
    );

    if (overlappingBookings.length > 0) {
        return {result: false, reason: "For the given check-in date and number of nights, the unit is already occupied"};
    }

    return {result: true, reason: "OK"};
}

export default { healthCheck, createBooking }
