import { BookingInput, ValidationResult, Booking } from '../types/booking';
import * as bookingRepository from '../repositories/booking.repository';

export async function validateNewBooking(booking: BookingInput): Promise<ValidationResult> {
    const [guestOverlapCheck, unitAvailabilityCheck] = await Promise.all([
        validateGuestOverlap(booking),
        validateUnitAvailability(booking)
    ]);

    if (!guestOverlapCheck.isValid) return guestOverlapCheck;
    if (!unitAvailabilityCheck.isValid) return unitAvailabilityCheck;

    return { isValid: true, errorMessage: "" };
}

export async function validateBookingExtension(existingBooking: any, additionalNights: number): Promise<ValidationResult> {
    const checkoutValidation = validateNotPastCheckout(existingBooking);
    if (!checkoutValidation.isValid) {
        return checkoutValidation;
    }

    const extendedBooking: Booking = {
        guestName: existingBooking.guestName,
        unitID: existingBooking.unitID,
        checkInDate: existingBooking.checkInDate,
        numberOfNights: existingBooking.numberOfNights + additionalNights,
    };

    const availabilityCheck = await validateUnitAvailability(extendedBooking, existingBooking.id);
    return availabilityCheck;
}

async function validateGuestOverlap(booking: BookingInput): Promise<ValidationResult> {
    const overlapping = await bookingRepository.checkBookingConflict({
        type: 'guest',
        guestName: booking.guestName,
        checkInDate: booking.checkInDate,
        numberOfNights: booking.numberOfNights
    });

    if (overlapping) {
        return { isValid: false, errorMessage: "Guest already has a booking during these dates" };
    }
    return { isValid: true, errorMessage: "" };
}

async function validateUnitAvailability(booking: Booking, excludeBookingId?: number): Promise<ValidationResult> {
    const overlapping = await bookingRepository.checkBookingConflict({
        type: 'unit',
        unitID: booking.unitID,
        checkInDate: booking.checkInDate,
        numberOfNights: booking.numberOfNights,
        excludeBookingId
    });

    if (overlapping) {
        return { isValid: false, errorMessage: "The unit is already booked for one or more of the selected nights" };
    }
    return { isValid: true, errorMessage: "" };
}

function validateNotPastCheckout(existingBooking: Booking): ValidationResult {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkOutDate = new Date(existingBooking.checkInDate);
    checkOutDate.setDate(checkOutDate.getDate() + existingBooking.numberOfNights);
    checkOutDate.setHours(0, 0, 0, 0);

    if (today > checkOutDate) {
        return { isValid: false, errorMessage: "Cannot extend booking after checkout date" };
    }
    return { isValid: true, errorMessage: "" };
}