-- Add view to be able to compute in the db teh checkout days
DROP VIEW IF EXISTS BookingWithCheckOut;

CREATE VIEW BookingWithCheckOut AS
SELECT
  id,
  unitID,
  guestName,
  checkInDate,
  DATETIME(checkInDate/1000, 'unixepoch', '+' || numberOfNights || ' days') AS checkOutDate
FROM Booking;