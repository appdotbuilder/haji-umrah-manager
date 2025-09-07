import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  pilgrimsTable, 
  packagesTable, 
  packageTypesTable,
  packageBookingsTable 
} from '../db/schema';
import { 
  getSalesTrends,
  getPackageDistribution,
  getUnpaidPilgrims,
  getDashboardStats
} from '../handlers/dashboard';
import type { DateRangeFilter } from '../schema';

describe('Dashboard Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test data
  async function createTestData() {
    // Create a user
    const [user] = await db.insert(usersTable)
      .values({
        username: 'testadmin',
        email: 'admin@test.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    // Create package types
    const [umrahType, hajiType] = await db.insert(packageTypesTable)
      .values([
        { type_name: 'Umrah Premium', description: 'Premium Umrah package' },
        { type_name: 'Haji Standard', description: 'Standard Haji package' }
      ])
      .returning()
      .execute();

    // Create pilgrims  
    const pilgrimsData = [
      {
        full_name: 'Ahmed Hassan',
        email: 'ahmed@test.com',
        phone: '+1234567890',
        passport_number: 'A1234567',
        passport_expiry: '2025-12-31',
        date_of_birth: '1980-01-15',
        address: '123 Main St',
        emergency_contact_name: 'Sara Hassan',
        emergency_contact_phone: '+1234567891'
      },
      {
        full_name: 'Fatima Ali',
        email: 'fatima@test.com',
        phone: '+1234567892',
        passport_number: 'B2345678',
        passport_expiry: '2026-06-30',
        date_of_birth: '1985-03-20',
        address: '456 Oak Ave',
        emergency_contact_name: 'Omar Ali',
        emergency_contact_phone: '+1234567893'
      },
      {
        full_name: 'Mohammad Khan',
        email: 'mohammad@test.com',
        phone: '+1234567894',
        passport_number: 'C3456789',
        passport_expiry: '2025-09-15',
        date_of_birth: '1975-07-10',
        address: '789 Pine St',
        emergency_contact_name: 'Aisha Khan',
        emergency_contact_phone: '+1234567895'
      }
    ];

    const pilgrimsResult = await db.insert(pilgrimsTable)
      .values(pilgrimsData)
      .returning()
      .execute();
    
    const [pilgrim1, pilgrim2, pilgrim3] = pilgrimsResult;

    // Create packages
    const packagesData = [
      {
        package_name: 'Premium Umrah 2024',
        package_type: 'umrah' as const,
        package_type_id: umrahType.id,
        description: 'Premium Umrah package with 5-star hotels',
        duration_days: 14,
        base_price: '5000.00',
        max_participants: 40,
        departure_date: '2024-03-15',
        return_date: '2024-03-29',
        itinerary: 'Makkah - Madinah'
      },
      {
        package_name: 'Standard Haji 2024',
        package_type: 'haji' as const,
        package_type_id: hajiType.id,
        description: 'Standard Haji package',
        duration_days: 30,
        base_price: '8000.00',
        max_participants: 20,
        departure_date: '2024-06-15',
        return_date: '2024-07-15',
        itinerary: 'Makkah - Madinah - Arafat'
      }
    ];

    const packagesResult = await db.insert(packagesTable)
      .values(packagesData)
      .returning()
      .execute();
    
    const [umrahPackage, hajiPackage] = packagesResult;

    return {
      user,
      pilgrims: [pilgrim1, pilgrim2, pilgrim3],
      packages: [umrahPackage, hajiPackage]
    };
  }

  describe('getSalesTrends', () => {
    it('should return sales trends grouped by month', async () => {
      const { pilgrims, packages } = await createTestData();

      // Create bookings in different months
      await db.insert(packageBookingsTable)
        .values([
          {
            package_id: packages[0].id,
            pilgrim_id: pilgrims[0].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-01-15'),
            total_amount: '5000.00',
            paid_amount: '5000.00',
            remaining_amount: '0.00',
            payment_status: 'completed',
            special_requests: null
          },
          {
            package_id: packages[1].id,
            pilgrim_id: pilgrims[1].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-01-20'),
            total_amount: '8000.00',
            paid_amount: '4000.00',
            remaining_amount: '4000.00',
            payment_status: 'partial',
            special_requests: null
          },
          {
            package_id: packages[0].id,
            pilgrim_id: pilgrims[2].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-02-10'),
            total_amount: '5000.00',
            paid_amount: '2500.00',
            remaining_amount: '2500.00',
            payment_status: 'partial',
            special_requests: null
          }
        ])
        .execute();

      const filter: DateRangeFilter = {};
      const result = await getSalesTrends(filter);

      expect(result).toHaveLength(2);
      
      // Check January data
      const jan = result.find(r => r.period === '2024-01');
      expect(jan).toBeDefined();
      expect(jan!.total_sales).toBe(13000); // 5000 + 8000
      expect(jan!.package_count).toBe(2); // Both packages
      expect(jan!.pilgrim_count).toBe(2); // Two different pilgrims
      
      // Check February data
      const feb = result.find(r => r.period === '2024-02');
      expect(feb).toBeDefined();
      expect(feb!.total_sales).toBe(5000);
      expect(feb!.package_count).toBe(1);
      expect(feb!.pilgrim_count).toBe(1);
    });

    it('should filter sales trends by date range', async () => {
      const { pilgrims, packages } = await createTestData();

      await db.insert(packageBookingsTable)
        .values([
          {
            package_id: packages[0].id,
            pilgrim_id: pilgrims[0].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-01-15'),
            total_amount: '5000.00',
            paid_amount: '5000.00',
            remaining_amount: '0.00',
            payment_status: 'completed',
            special_requests: null
          },
          {
            package_id: packages[1].id,
            pilgrim_id: pilgrims[1].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-03-15'),
            total_amount: '8000.00',
            paid_amount: '8000.00',
            remaining_amount: '0.00',
            payment_status: 'completed',
            special_requests: null
          }
        ])
        .execute();

      // Filter to only include January and February
      const filter: DateRangeFilter = {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-02-28')
      };

      const result = await getSalesTrends(filter);

      expect(result).toHaveLength(1);
      expect(result[0].period).toBe('2024-01');
      expect(result[0].total_sales).toBe(5000);
    });

    it('should return empty array when no bookings exist', async () => {
      await createTestData();

      const filter: DateRangeFilter = {};
      const result = await getSalesTrends(filter);

      expect(result).toHaveLength(0);
    });
  });

  describe('getPackageDistribution', () => {
    it('should return package distribution with correct percentages', async () => {
      const { pilgrims, packages } = await createTestData();

      // Create 3 Umrah bookings and 1 Haji booking
      await db.insert(packageBookingsTable)
        .values([
          {
            package_id: packages[0].id, // Umrah
            pilgrim_id: pilgrims[0].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-01-15'),
            total_amount: '5000.00',
            paid_amount: '5000.00',
            remaining_amount: '0.00',
            payment_status: 'completed',
            special_requests: null
          },
          {
            package_id: packages[0].id, // Umrah
            pilgrim_id: pilgrims[1].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-01-20'),
            total_amount: '5000.00',
            paid_amount: '2500.00',
            remaining_amount: '2500.00',
            payment_status: 'partial',
            special_requests: null
          },
          {
            package_id: packages[0].id, // Umrah
            pilgrim_id: pilgrims[2].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-02-10'),
            total_amount: '5000.00',
            paid_amount: '0.00',
            remaining_amount: '5000.00',
            payment_status: 'pending',
            special_requests: null
          },
          {
            package_id: packages[1].id, // Haji
            pilgrim_id: pilgrims[0].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-02-15'),
            total_amount: '8000.00',
            paid_amount: '4000.00',
            remaining_amount: '4000.00',
            payment_status: 'partial',
            special_requests: null
          }
        ])
        .execute();

      const result = await getPackageDistribution();

      expect(result).toHaveLength(2);
      
      const umrah = result.find(r => r.package_type === 'Umrah');
      expect(umrah).toBeDefined();
      expect(umrah!.count).toBe(3);
      expect(umrah!.percentage).toBe(75.0); // 3/4 * 100
      
      const haji = result.find(r => r.package_type === 'Haji');
      expect(haji).toBeDefined();
      expect(haji!.count).toBe(1);
      expect(haji!.percentage).toBe(25.0); // 1/4 * 100
    });

    it('should return empty array when no bookings exist', async () => {
      await createTestData();

      const result = await getPackageDistribution();

      expect(result).toHaveLength(0);
    });
  });

  describe('getUnpaidPilgrims', () => {
    it('should return only pilgrims with outstanding payments', async () => {
      const { pilgrims, packages } = await createTestData();

      await db.insert(packageBookingsTable)
        .values([
          {
            package_id: packages[0].id,
            pilgrim_id: pilgrims[0].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-01-15'),
            total_amount: '5000.00',
            paid_amount: '5000.00',
            remaining_amount: '0.00', // Fully paid
            payment_status: 'completed',
            special_requests: null
          },
          {
            package_id: packages[1].id,
            pilgrim_id: pilgrims[1].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-01-20'),
            total_amount: '8000.00',
            paid_amount: '4000.00',
            remaining_amount: '4000.00', // Partially paid
            payment_status: 'partial',
            special_requests: null
          },
          {
            package_id: packages[0].id,
            pilgrim_id: pilgrims[2].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-02-10'),
            total_amount: '5000.00',
            paid_amount: '0.00',
            remaining_amount: '5000.00', // Not paid
            payment_status: 'pending',
            special_requests: null
          }
        ])
        .execute();

      const result = await getUnpaidPilgrims();

      // Should return only 2 unpaid pilgrims (excluding the fully paid one)
      expect(result).toHaveLength(2);
      
      // Check pilgrim data structure
      const unpaidPilgrim = result.find(p => p.pilgrim_name === 'Fatima Ali');
      expect(unpaidPilgrim).toBeDefined();
      expect(unpaidPilgrim!.total_amount).toBe(8000);
      expect(unpaidPilgrim!.paid_amount).toBe(4000);
      expect(unpaidPilgrim!.remaining_amount).toBe(4000);
      expect(unpaidPilgrim!.package_name).toBe('Standard Haji 2024');
      expect(typeof unpaidPilgrim!.days_overdue).toBe('number');
      expect(unpaidPilgrim!.days_overdue).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array when all payments are complete', async () => {
      const { pilgrims, packages } = await createTestData();

      await db.insert(packageBookingsTable)
        .values([
          {
            package_id: packages[0].id,
            pilgrim_id: pilgrims[0].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-01-15'),
            total_amount: '5000.00',
            paid_amount: '5000.00',
            remaining_amount: '0.00',
            payment_status: 'completed',
            special_requests: null
          }
        ])
        .execute();

      const result = await getUnpaidPilgrims();

      expect(result).toHaveLength(0);
    });
  });

  describe('getDashboardStats', () => {
    it('should return correct dashboard statistics', async () => {
      const { pilgrims, packages } = await createTestData();

      await db.insert(packageBookingsTable)
        .values([
          {
            package_id: packages[0].id,
            pilgrim_id: pilgrims[0].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-01-15'),
            total_amount: '5000.00',
            paid_amount: '5000.00',
            remaining_amount: '0.00',
            payment_status: 'completed',
            special_requests: null
          },
          {
            package_id: packages[1].id,
            pilgrim_id: pilgrims[1].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-01-20'),
            total_amount: '8000.00',
            paid_amount: '4000.00',
            remaining_amount: '4000.00',
            payment_status: 'partial',
            special_requests: null
          },
          {
            package_id: packages[0].id,
            pilgrim_id: pilgrims[2].id,
            marketing_partner_id: null,
            booking_date: new Date('2024-02-10'),
            total_amount: '5000.00',
            paid_amount: '0.00',
            remaining_amount: '5000.00',
            payment_status: 'pending',
            special_requests: null
          },
          {
            package_id: packages[1].id,
            pilgrim_id: pilgrims[0].id, // Same pilgrim with another booking
            marketing_partner_id: null,
            booking_date: new Date('2024-02-15'),
            total_amount: '8000.00',
            paid_amount: '8000.00',
            remaining_amount: '0.00',
            payment_status: 'completed',
            special_requests: null
          }
        ])
        .execute();

      const result = await getDashboardStats();

      expect(result.totalRevenue).toBe(17000); // 5000 + 4000 + 0 + 8000
      expect(result.totalBookings).toBe(4);
      expect(result.totalPilgrims).toBe(3); // Unique pilgrims count
      expect(result.pendingPayments).toBe(2); // Two bookings with remaining amount > 0
    });

    it('should return zero values when no bookings exist', async () => {
      await createTestData();

      const result = await getDashboardStats();

      expect(result.totalRevenue).toBe(0);
      expect(result.totalBookings).toBe(0);
      expect(result.totalPilgrims).toBe(0);
      expect(result.pendingPayments).toBe(0);
    });
  });
});