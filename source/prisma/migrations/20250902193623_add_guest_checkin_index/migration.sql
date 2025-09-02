-- Composite index for guestName and checkInDate
CREATE INDEX "idx_booking_guest_checkin" ON "Booking"("guestName", "checkInDate");