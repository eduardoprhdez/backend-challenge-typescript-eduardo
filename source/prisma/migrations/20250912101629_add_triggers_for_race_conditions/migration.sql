-- Trigger to prevent overlapping bookings on INSERT
CREATE TRIGGER prevent_booking_overlap_insert
BEFORE INSERT ON "Booking"
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN EXISTS (
            -- Check for past booking that extends into new booking (pastBooking overlap)
            SELECT 1 FROM "Booking" 
            WHERE "guestName" = NEW."guestName"
              AND "checkInDate" <= NEW."checkInDate"
              AND DATE("checkInDate", '+' || "numberOfNights" || ' days') > NEW."checkInDate"
        ) THEN RAISE(ABORT, 'Guest already has a booking during these dates')
    END;
    
    SELECT CASE
        WHEN EXISTS (
            -- Check for future booking that starts before new booking ends (futureBooking overlap)
            SELECT 1 FROM "Booking" 
            WHERE "guestName" = NEW."guestName"
              AND "checkInDate" > NEW."checkInDate"
              AND "checkInDate" < DATE(NEW."checkInDate", '+' || NEW."numberOfNights" || ' days')
        ) THEN RAISE(ABORT, 'Guest already has a booking during these dates')
    END;
    
    SELECT CASE
        WHEN EXISTS (
            -- Check for past booking that extends into new booking
            SELECT 1 FROM "Booking"
            WHERE "unitID" = NEW."unitID"
              AND "checkInDate" <= NEW."checkInDate"
              AND DATE("checkInDate", '+' || "numberOfNights" || ' days') > NEW."checkInDate"
        ) THEN RAISE(ABORT, 'The unit is already booked for one or more of the selected nights')
    END;
    
    SELECT CASE
        WHEN EXISTS (
            -- Check for future booking that starts before new booking ends
            SELECT 1 FROM "Booking"
            WHERE "unitID" = NEW."unitID"
              AND "checkInDate" > NEW."checkInDate"
              AND "checkInDate" < DATE(NEW."checkInDate", '+' || NEW."numberOfNights" || ' days')
        ) THEN RAISE(ABORT, 'The unit is already booked for one or more of the selected nights')
    END;
END;

CREATE TRIGGER prevent_booking_overlap_update
BEFORE UPDATE ON "Booking"
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM "Booking" 
            WHERE "guestName" = NEW."guestName"
              AND "id" != NEW."id"
              AND "checkInDate" <= NEW."checkInDate"
              AND DATE("checkInDate", '+' || "numberOfNights" || ' days') > NEW."checkInDate"
        ) THEN RAISE(ABORT, 'Guest already has a booking during these dates')
    END;
    
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM "Booking" 
            WHERE "guestName" = NEW."guestName"
              AND "id" != NEW."id"
              AND "checkInDate" > NEW."checkInDate"
              AND "checkInDate" < DATE(NEW."checkInDate", '+' || NEW."numberOfNights" || ' days')
        ) THEN RAISE(ABORT, 'Guest already has a booking during these dates')
    END;
    
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM "Booking"
            WHERE "unitID" = NEW."unitID"
              AND "id" != NEW."id"
              AND "checkInDate" <= NEW."checkInDate"
              AND DATE("checkInDate", '+' || "numberOfNights" || ' days') > NEW."checkInDate"
        ) THEN RAISE(ABORT, 'The unit is already booked for one or more of the selected nights')
    END;
    
    SELECT CASE
        WHEN EXISTS (
            SELECT 1 FROM "Booking"
            WHERE "unitID" = NEW."unitID"
              AND "id" != NEW."id"
              AND "checkInDate" > NEW."checkInDate"
              AND "checkInDate" < DATE(NEW."checkInDate", '+' || NEW."numberOfNights" || ' days')
        ) THEN RAISE(ABORT, 'The unit is already booked for one or more of the selected nights')
    END;
END;
