-- Composite index for unitId and checkInDate
CREATE INDEX "idx_booking_unitid_checkin" ON "Booking"("unitID", "checkInDate");