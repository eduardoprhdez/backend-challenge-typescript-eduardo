export interface BookingInput {
    guestName: string;
    unitID: string;
    checkInDate: Date;
    numberOfNights: number;
}

export interface Booking extends BookingInput {
    id?: number;
}

export type BookingWithCheckOut = Omit<Booking, 'numberOfNights'> & {
    checkOutDate: Date;
};

export interface ValidationResult {
    isValid: boolean;
    errorMessage: string;
}

export interface BookingResult {
    success: boolean;
    data?: any;
}