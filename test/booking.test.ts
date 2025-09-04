import axios, { AxiosError } from 'axios';
import { startServer, stopServer } from '../source/server';
import { PrismaClient } from '@prisma/client';

const GUEST_A_UNIT_1 = {
    unitID: '1',
    guestName: 'GuestA',
    checkInDate: new Date().toISOString().split('T')[0],
    numberOfNights: 5,
};

const GUEST_A_UNIT_2 = {
    unitID: '2',
    guestName: 'GuestA',
    checkInDate: new Date().toISOString().split('T')[0],
    numberOfNights: 5,
};

const GUEST_B_UNIT_1 = {
    unitID: '1',
    guestName: 'GuestB',
    checkInDate: new Date().toISOString().split('T')[0],
    numberOfNights: 5,
};

const prisma = new PrismaClient();

beforeEach(async () => {

    // Clear any test setup or state before each test
    await prisma.booking.deleteMany();
});

beforeAll(async () => {
    await startServer();
});

afterAll(async () => {
    await prisma.booking.deleteMany();
    await prisma.$disconnect();
    await stopServer();
});

describe('Booking API', () => {

    describe('Create Booking', () => {

        test('Create fresh booking', async () => {
            const response = await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_1);

            expect(response.status).toBe(200);
            expect(response.data.guestName).toBe(GUEST_A_UNIT_1.guestName);
            expect(response.data.unitID).toBe(GUEST_A_UNIT_1.unitID);
            expect(response.data.numberOfNights).toBe(GUEST_A_UNIT_1.numberOfNights);
        });

        test('Same guest same unit booking', async () => {
            // Create first booking
            const response1 = await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_1);
            expect(response1.status).toBe(200);
            expect(response1.data.guestName).toBe(GUEST_A_UNIT_1.guestName);
            expect(response1.data.unitID).toBe(GUEST_A_UNIT_1.unitID);

            // Guests want to book the same unit again
            let error: any;
            try {
                await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_1);
            } catch (e) {
                error = e;
            }

            expect(error).toBeInstanceOf(AxiosError);
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual('Guest already has a booking during these dates');
        });

        test('Same guest different unit booking', async () => {
            // Create first booking
            const response1 = await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_1);
            expect(response1.status).toBe(200);
            expect(response1.data.guestName).toBe(GUEST_A_UNIT_1.guestName);
            expect(response1.data.unitID).toBe(GUEST_A_UNIT_1.unitID);

            // Guest wants to book another unit
            let error: any;
            try {
                await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_2);
            } catch (e) {
                error = e;
            }

            expect(error).toBeInstanceOf(AxiosError);
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual('Guest already has a booking during these dates');
        });

        test('Different guest same unit booking', async () => {
            // Create first booking
            const response1 = await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_1);
            expect(response1.status).toBe(200);
            expect(response1.data.guestName).toBe(GUEST_A_UNIT_1.guestName);
            expect(response1.data.unitID).toBe(GUEST_A_UNIT_1.unitID);

            // GuestB trying to book a unit that is already occupied
            let error: any;
            try {
                await axios.post('http://localhost:8000/api/v1/booking', GUEST_B_UNIT_1);
            } catch (e) {
                error = e;
            }

            expect(error).toBeInstanceOf(AxiosError);
            expect(error.response.status).toBe(400);
            expect(error.response.data).toEqual('The unit is already booked for one or more of the selected nights');
        });

        test('Different guest same unit booking different date', async () => {
            // Create first booking
            const response1 = await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_1);
            expect(response1.status).toBe(200);
            expect(response1.data.guestName).toBe(GUEST_A_UNIT_1.guestName);

            // GuestB trying to book a unit that overlaps with existing booking
            let error: any;
            try {
                await axios.post('http://localhost:8000/api/v1/booking', {
                    unitID: '1',
                    guestName: 'GuestB',
                    checkInDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    numberOfNights: 5
                });
            } catch (e) {
                error = e;
            }

            expect(error).toBeInstanceOf(AxiosError);
            expect(error.response.status).toBe(400);
            expect(error.response.data).toBe('The unit is already booked for one or more of the selected nights');
        });
    });

    describe('Extend Booking', () => {

        test('Successfully extend booking', async () => {
            // Create initial booking
            const createResponse = await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_1);
            expect(createResponse.status).toBe(200);
            const bookingId = createResponse.data.id;

            // Extend the booking
            const extendResponse = await axios.post(`http://localhost:8000/api/v1/booking/${bookingId}/extend`, {
                additionalNights: 3
            });

            expect(extendResponse.status).toBe(200);
            expect(extendResponse.data.id).toBe(bookingId);
            expect(extendResponse.data.numberOfNights).toBe(8); // 5 + 3
            expect(extendResponse.data.guestName).toBe(GUEST_A_UNIT_1.guestName);
            expect(extendResponse.data.unitID).toBe(GUEST_A_UNIT_1.unitID);
        });

        test('Extend booking with conflict', async () => {
            // Create first booking (today for 5 nights)
            const booking1Response = await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_1);
            expect(booking1Response.status).toBe(200);
            const booking1Id = booking1Response.data.id;

            // Create second booking (6 days from now for 3 nights) 
            const futureDate = new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000);
            const booking2Response = await axios.post('http://localhost:8000/api/v1/booking', {
                unitID: '1',
                guestName: 'GuestB',
                checkInDate: futureDate.toISOString().split('T')[0],
                numberOfNights: 3
            });
            expect(booking2Response.status).toBe(200);

            // Try to extend first booking (would conflict with second booking)
            let error: any;
            try {
                await axios.post(`http://localhost:8000/api/v1/booking/${booking1Id}/extend`, {
                    additionalNights: 5 // Would extend from day 5 to day 10, conflicting with booking2
                });
            } catch (e) {
                error = e;
            }

            expect(error).toBeInstanceOf(AxiosError);
            expect(error.response.status).toBe(400);
            expect(error.response.data).toBe('The unit is already booked for one or more of the selected nights');
        });

        test('Extend non existent booking', async () => {
            let error: any;
            try {
                await axios.post('http://localhost:8000/api/v1/booking/999/extend', {
                    additionalNights: 2
                });
            } catch (e) {
                error = e;
            }

            expect(error).toBeInstanceOf(AxiosError);
            expect(error.response.status).toBe(404);
            expect(error.response.data).toBe('Booking not found');
        });

        test('Cannot extend booking after checkout date', async () => {
            // Create a booking for today (this will pass validation)
            const createResponse = await axios.post('http://localhost:8000/api/v1/booking', GUEST_A_UNIT_1);
            expect(createResponse.status).toBe(200);
            const bookingId = createResponse.data.id;

            // Manually update the booking in the database to be in the past
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    checkInDate: twoDaysAgo,
                    numberOfNights: 1 // This booking ended yesterday
                }
            });

            // Try to extend the expired booking
            let error: any;
            try {
                await axios.post(`http://localhost:8000/api/v1/booking/${bookingId}/extend`, {
                    additionalNights: 2
                });
            } catch (e) {
                error = e;
            }

            expect(error).toBeInstanceOf(AxiosError);
            expect(error.response.status).toBe(400);
            expect(error.response.data).toBe('Cannot extend booking after checkout date');
        });
    });
});
