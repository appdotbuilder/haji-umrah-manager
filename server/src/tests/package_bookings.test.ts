import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  packageBookingsTable, 
  packagesTable, 
  pilgrimsTable, 
  packageTypesTable, 
  marketingPartnersTable 
} from '../db/schema';
import { type CreatePackageBookingInput } from '../schema';
import { 
  createPackageBooking, 
  getPackageBookings, 
  getPackageBookingById, 
  updateBookingPayment 
} from '../handlers/package_bookings';
import { eq } from 'drizzle-orm';

describe('Package Bookings Handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPackageId: number;
  let testPilgrimId: number;
  let testMarketingPartnerId: number;

  beforeEach(async () => {
    // Create package type first
    const packageTypeValues = {
      type_name: 'Test Package Type',
      description: 'Test description'
    };
    const [packageType] = await db.insert(packageTypesTable).values(packageTypeValues).returning();

    // Create package
    const packageValues = {
      package_name: 'Test Package',
      package_type: 'umrah' as const,
      package_type_id: packageType.id,
      description: 'Test package description',
      duration_days: 15,
      base_price: '5000.00',
      max_participants: 50,
      departure_date: '2024-06-01',
      return_date: '2024-06-15',
      itinerary: 'Test itinerary',
      inclusions: 'Test inclusions',
      exclusions: 'Test exclusions',
      terms_conditions: 'Test terms'
    };
    const [packageRecord] = await db.insert(packagesTable).values(packageValues).returning();
    testPackageId = packageRecord.id;

    // Create pilgrim
    const pilgrimValues = {
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      passport_number: 'P123456789',
      passport_expiry: '2030-12-31',
      date_of_birth: '1980-01-01',
      address: '123 Test Street',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '+1234567891',
      status: 'registered' as const
    };
    const [pilgrim] = await db.insert(pilgrimsTable).values(pilgrimValues).returning();
    testPilgrimId = pilgrim.id;

    // Create marketing partner
    const marketingPartnerValues = {
      name: 'Test Marketing Partner',
      contact_person: 'Partner Contact',
      email: 'partner@example.com',
      phone: '+1234567892',
      commission_rate: '10.50',
      address: '456 Partner Street'
    };
    const [marketingPartner] = await db.insert(marketingPartnersTable).values(marketingPartnerValues).returning();
    testMarketingPartnerId = marketingPartner.id;
  });

  describe('createPackageBooking', () => {
    it('should create a package booking with no payment', async () => {
      const input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: null,
        total_amount: 1000,
        special_requests: 'No special requests'
      };

      const result = await createPackageBooking(input);

      expect(result.package_id).toBe(testPackageId);
      expect(result.pilgrim_id).toBe(testPilgrimId);
      expect(result.marketing_partner_id).toBe(null);
      expect(result.total_amount).toBe(1000);
      expect(result.paid_amount).toBe(0);
      expect(result.remaining_amount).toBe(1000);
      expect(result.payment_status).toBe('pending');
      expect(result.booking_status).toBe('registered');
      expect(result.special_requests).toBe('No special requests');
      expect(result.id).toBeDefined();
      expect(result.booking_date).toBeInstanceOf(Date);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a package booking with partial payment', async () => {
      const input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: testMarketingPartnerId,
        total_amount: 1000,
        paid_amount: 300,
        special_requests: null
      };

      const result = await createPackageBooking(input);

      expect(result.total_amount).toBe(1000);
      expect(result.paid_amount).toBe(300);
      expect(result.remaining_amount).toBe(700);
      expect(result.payment_status).toBe('partial');
      expect(result.marketing_partner_id).toBe(testMarketingPartnerId);
    });

    it('should create a package booking with full payment', async () => {
      const input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: null,
        total_amount: 1000,
        paid_amount: 1000,
        special_requests: null
      };

      const result = await createPackageBooking(input);

      expect(result.total_amount).toBe(1000);
      expect(result.paid_amount).toBe(1000);
      expect(result.remaining_amount).toBe(0);
      expect(result.payment_status).toBe('completed');
    });

    it('should save booking to database', async () => {
      const input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: null,
        total_amount: 1500,
        paid_amount: 500,
        special_requests: 'Vegetarian meals'
      };

      const result = await createPackageBooking(input);

      const bookings = await db.select()
        .from(packageBookingsTable)
        .where(eq(packageBookingsTable.id, result.id))
        .execute();

      expect(bookings).toHaveLength(1);
      expect(bookings[0].package_id).toBe(testPackageId);
      expect(bookings[0].pilgrim_id).toBe(testPilgrimId);
      expect(parseFloat(bookings[0].total_amount)).toBe(1500);
      expect(parseFloat(bookings[0].paid_amount)).toBe(500);
      expect(parseFloat(bookings[0].remaining_amount)).toBe(1000);
      expect(bookings[0].payment_status).toBe('partial');
      expect(bookings[0].special_requests).toBe('Vegetarian meals');
    });

    it('should throw error for non-existent package', async () => {
      const input: CreatePackageBookingInput = {
        package_id: 99999,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: null,
        total_amount: 1000,
        special_requests: null
      };

      expect(createPackageBooking(input)).rejects.toThrow(/Package with ID 99999 does not exist/i);
    });

    it('should throw error for non-existent pilgrim', async () => {
      const input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: 99999,
        marketing_partner_id: null,
        total_amount: 1000,
        special_requests: null
      };

      expect(createPackageBooking(input)).rejects.toThrow(/Pilgrim with ID 99999 does not exist/i);
    });
  });

  describe('getPackageBookings', () => {
    it('should return empty array when no bookings exist', async () => {
      const result = await getPackageBookings();
      expect(result).toEqual([]);
    });

    it('should return all package bookings with converted numeric fields', async () => {
      // Create test bookings
      const booking1Input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: null,
        total_amount: 1000,
        paid_amount: 300,
        special_requests: 'First booking'
      };

      const booking2Input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: testMarketingPartnerId,
        total_amount: 1500,
        paid_amount: 1500,
        special_requests: 'Second booking'
      };

      await createPackageBooking(booking1Input);
      await createPackageBooking(booking2Input);

      const result = await getPackageBookings();

      expect(result).toHaveLength(2);
      
      // Check first booking
      const firstBooking = result.find(b => b.special_requests === 'First booking');
      expect(firstBooking).toBeDefined();
      expect(typeof firstBooking!.total_amount).toBe('number');
      expect(typeof firstBooking!.paid_amount).toBe('number');
      expect(typeof firstBooking!.remaining_amount).toBe('number');
      expect(firstBooking!.total_amount).toBe(1000);
      expect(firstBooking!.paid_amount).toBe(300);
      expect(firstBooking!.remaining_amount).toBe(700);
      expect(firstBooking!.payment_status).toBe('partial');

      // Check second booking
      const secondBooking = result.find(b => b.special_requests === 'Second booking');
      expect(secondBooking).toBeDefined();
      expect(secondBooking!.total_amount).toBe(1500);
      expect(secondBooking!.paid_amount).toBe(1500);
      expect(secondBooking!.remaining_amount).toBe(0);
      expect(secondBooking!.payment_status).toBe('completed');
      expect(secondBooking!.marketing_partner_id).toBe(testMarketingPartnerId);
    });
  });

  describe('getPackageBookingById', () => {
    it('should return null for non-existent booking', async () => {
      const result = await getPackageBookingById(99999);
      expect(result).toBe(null);
    });

    it('should return specific booking with converted numeric fields', async () => {
      const input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: testMarketingPartnerId,
        total_amount: 2000,
        paid_amount: 800,
        special_requests: 'Test booking for retrieval'
      };

      const created = await createPackageBooking(input);
      const result = await getPackageBookingById(created.id);

      expect(result).not.toBe(null);
      expect(result!.id).toBe(created.id);
      expect(result!.package_id).toBe(testPackageId);
      expect(result!.pilgrim_id).toBe(testPilgrimId);
      expect(result!.marketing_partner_id).toBe(testMarketingPartnerId);
      expect(typeof result!.total_amount).toBe('number');
      expect(typeof result!.paid_amount).toBe('number');
      expect(typeof result!.remaining_amount).toBe('number');
      expect(result!.total_amount).toBe(2000);
      expect(result!.paid_amount).toBe(800);
      expect(result!.remaining_amount).toBe(1200);
      expect(result!.payment_status).toBe('partial');
      expect(result!.special_requests).toBe('Test booking for retrieval');
    });
  });

  describe('updateBookingPayment', () => {
    it('should throw error for non-existent booking', async () => {
      expect(updateBookingPayment(99999, 500)).rejects.toThrow(/Package booking with ID 99999 does not exist/i);
    });

    it('should update payment and change status from pending to partial', async () => {
      const input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: null,
        total_amount: 1000,
        special_requests: null
      };

      const created = await createPackageBooking(input);
      expect(created.payment_status).toBe('pending');
      expect(created.paid_amount).toBe(0);

      const updated = await updateBookingPayment(created.id, 400);

      expect(updated.id).toBe(created.id);
      expect(updated.total_amount).toBe(1000);
      expect(updated.paid_amount).toBe(400);
      expect(updated.remaining_amount).toBe(600);
      expect(updated.payment_status).toBe('partial');
    });

    it('should update payment and change status from partial to completed', async () => {
      const input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: null,
        total_amount: 1000,
        paid_amount: 300,
        special_requests: null
      };

      const created = await createPackageBooking(input);
      expect(created.payment_status).toBe('partial');
      expect(created.paid_amount).toBe(300);

      const updated = await updateBookingPayment(created.id, 700);

      expect(updated.paid_amount).toBe(1000);
      expect(updated.remaining_amount).toBe(0);
      expect(updated.payment_status).toBe('completed');
    });

    it('should update database record correctly', async () => {
      const input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: null,
        total_amount: 1500,
        paid_amount: 200,
        special_requests: null
      };

      const created = await createPackageBooking(input);
      await updateBookingPayment(created.id, 800);

      const fromDb = await db.select()
        .from(packageBookingsTable)
        .where(eq(packageBookingsTable.id, created.id))
        .limit(1)
        .execute();

      expect(fromDb).toHaveLength(1);
      expect(parseFloat(fromDb[0].paid_amount)).toBe(1000);
      expect(parseFloat(fromDb[0].remaining_amount)).toBe(500);
      expect(fromDb[0].payment_status).toBe('partial');
      expect(fromDb[0].updated_at).toBeInstanceOf(Date);
    });

    it('should handle multiple payments correctly', async () => {
      const input: CreatePackageBookingInput = {
        package_id: testPackageId,
        pilgrim_id: testPilgrimId,
        marketing_partner_id: null,
        total_amount: 2000,
        special_requests: null
      };

      const created = await createPackageBooking(input);
      
      // First payment
      const afterFirst = await updateBookingPayment(created.id, 500);
      expect(afterFirst.paid_amount).toBe(500);
      expect(afterFirst.remaining_amount).toBe(1500);
      expect(afterFirst.payment_status).toBe('partial');

      // Second payment
      const afterSecond = await updateBookingPayment(created.id, 800);
      expect(afterSecond.paid_amount).toBe(1300);
      expect(afterSecond.remaining_amount).toBe(700);
      expect(afterSecond.payment_status).toBe('partial');

      // Final payment
      const final = await updateBookingPayment(created.id, 700);
      expect(final.paid_amount).toBe(2000);
      expect(final.remaining_amount).toBe(0);
      expect(final.payment_status).toBe('completed');
    });
  });
});