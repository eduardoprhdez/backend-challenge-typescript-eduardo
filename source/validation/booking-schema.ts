export interface ValidationError {
    field: string;
    message: string;
}

export interface SchemaValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

// Schema definitions
export interface CreateBookingSchema {
    guestName: string;
    unitID: string;
    checkInDate: string; // ISO date string from API
    numberOfNights: number;
}

export interface ExtendBookingSchema {
    additionalNights: number;
}

// Validation functions
export function validateCreateBookingSchema(data: any): SchemaValidationResult {
    const errors: ValidationError[] = [];

    // Check if data exists
    if (!data || typeof data !== 'object') {
        return { isValid: false, errors: [{ field: 'body', message: 'Request body is required' }] };
    }

    // Validate guestName
    if (!data.guestName) {
        errors.push({ field: 'guestName', message: 'Guest name is required' });
    } else if (typeof data.guestName !== 'string') {
        errors.push({ field: 'guestName', message: 'Guest name must be a string' });
    } else if (data.guestName.trim().length === 0) {
        errors.push({ field: 'guestName', message: 'Guest name cannot be empty' });
    } else if (data.guestName.length > 100) {
        errors.push({ field: 'guestName', message: 'Guest name cannot exceed 100 characters' });
    }

    // Validate unitID
    if (!data.unitID) {
        errors.push({ field: 'unitID', message: 'Unit ID is required' });
    } else if (typeof data.unitID !== 'string') {
        errors.push({ field: 'unitID', message: 'Unit ID must be a string' });
    } else if (data.unitID.trim().length === 0) {
        errors.push({ field: 'unitID', message: 'Unit ID cannot be empty' });
    }

    // Validate checkInDate
    if (!data.checkInDate) {
        errors.push({ field: 'checkInDate', message: 'Check-in date is required' });
    } else if (typeof data.checkInDate !== 'string') {
        errors.push({ field: 'checkInDate', message: 'Check-in date must be a string' });
    } else {
        const dateResult = validateDateString(data.checkInDate);
        if (!dateResult.isValid) {
            errors.push({ field: 'checkInDate', message: dateResult.message });
        }
    }

    // Validate numberOfNights
    if (data.numberOfNights === undefined || data.numberOfNights === null) {
        errors.push({ field: 'numberOfNights', message: 'Number of nights is required' });
    } else if (typeof data.numberOfNights !== 'number') {
        errors.push({ field: 'numberOfNights', message: 'Number of nights must be a number' });
    } else if (!Number.isInteger(data.numberOfNights)) {
        errors.push({ field: 'numberOfNights', message: 'Number of nights must be an integer' });
    } else if (data.numberOfNights < 1) {
        errors.push({ field: 'numberOfNights', message: 'Number of nights must be at least 1' });
    } else if (data.numberOfNights > 365) {
        errors.push({ field: 'numberOfNights', message: 'Number of nights cannot exceed 365' });
    }

    // Check for unexpected fields
    const allowedFields = ['guestName', 'unitID', 'checkInDate', 'numberOfNights'];
    const unexpectedFields = Object.keys(data).filter(key => !allowedFields.includes(key));
    unexpectedFields.forEach(field => {
        errors.push({ field, message: `Unexpected field: ${field}` });
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function validateExtendBookingSchema(data: any): SchemaValidationResult {
    const errors: ValidationError[] = [];

    // Check if data exists
    if (!data || typeof data !== 'object') {
        return { isValid: false, errors: [{ field: 'body', message: 'Request body is required' }] };
    }

    // Validate additionalNights
    if (data.additionalNights === undefined || data.additionalNights === null) {
        errors.push({ field: 'additionalNights', message: 'Additional nights is required' });
    } else if (typeof data.additionalNights !== 'number') {
        errors.push({ field: 'additionalNights', message: 'Additional nights must be a number' });
    } else if (!Number.isInteger(data.additionalNights)) {
        errors.push({ field: 'additionalNights', message: 'Additional nights must be an integer' });
    } else if (data.additionalNights < 1) {
        errors.push({ field: 'additionalNights', message: 'Additional nights must be at least 1' });
    } else if (data.additionalNights > 365) {
        errors.push({ field: 'additionalNights', message: 'Additional nights cannot exceed 365' });
    }

    // Check for unexpected fields
    const allowedFields = ['additionalNights'];
    const unexpectedFields = Object.keys(data).filter(key => !allowedFields.includes(key));
    unexpectedFields.forEach(field => {
        errors.push({ field, message: `Unexpected field: ${field}` });
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

function validateDateString(dateStr: string): { isValid: boolean; message: string } {
    // Check basic format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
        return { isValid: false, message: 'Check-in date must be in YYYY-MM-DD format' };
    }

    // Parse and validate it's a real date
    const date = new Date(dateStr + 'T00:00:00.000Z'); // Force UTC to avoid timezone issues
    if (isNaN(date.getTime())) {
        return { isValid: false, message: 'Check-in date is not a valid date' };
    }

    // Check if the parsed date matches the input (catches invalid dates like 2023-02-30)
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const reconstructed = `${year}-${month}-${day}`;

    if (reconstructed !== dateStr) {
        return { isValid: false, message: 'Check-in date is not a valid calendar date' };
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(date);
    checkInDate.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
        return { isValid: false, message: 'Check-in date cannot be in the past' };
    }

    return { isValid: true, message: '' };
}