import express from 'express';
import * as controller from '../controllers/bookings';
import { validateCreateBooking, validateExtendBooking, validateBookingId } from '../middleware/validation.middleware';

const router = express.Router();

router.get('/', controller.healthCheck);
router.post('/api/v1/booking/', validateCreateBooking, controller.createBooking);
router.post('/api/v1/booking/:id/extend', validateBookingId, validateExtendBooking, controller.extendBooking);

export = router;
