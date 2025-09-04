import { BookingInput, BookingResult } from '../types/booking';
import * as bookingRepository from '../repositories/booking.repository';
import * as validationService from './booking-validation.service';

export async function createNewBooking(bookingData: BookingInput): Promise<BookingResult> {
    const validationResult = await validationService.validateNewBooking(bookingData);
    if (!validationResult.isValid) {
        throw new Error(validationResult.errorMessage);
    }

    const booking = await bookingRepository.createBooking(bookingData);
    return { success: true, data: booking };
}

export async function extendExistingBooking(bookingId: number, additionalNights: number): Promise<BookingResult> {
    const existingBooking = await bookingRepository.findBookingById(bookingId);
    if (!existingBooking) {
        throw new Error('Booking not found');
    }

    const validationResult = await validationService.validateBookingExtension(existingBooking, additionalNights);
    if (!validationResult.isValid) {
        throw new Error(validationResult.errorMessage);
    }

    const updatedBooking = await bookingRepository.updateBookingNights(
        bookingId, 
        existingBooking.numberOfNights + additionalNights
    );
    
    return { success: true, data: updatedBooking };
}