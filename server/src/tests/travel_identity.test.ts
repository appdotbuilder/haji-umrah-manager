import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { travelIdentityTable } from '../db/schema';
import { type UpdateTravelIdentityInput } from '../schema';
import { getTravelIdentity, updateTravelIdentity } from '../handlers/travel_identity';
import { eq } from 'drizzle-orm';

describe('Travel Identity Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('getTravelIdentity', () => {
    it('should return null when no travel identity exists', async () => {
      const result = await getTravelIdentity();
      expect(result).toBeNull();
    });

    it('should return travel identity when it exists', async () => {
      // Create a travel identity record directly in the database
      await db.insert(travelIdentityTable)
        .values({
          travel_name: 'Test Travel Agency',
          logo_url: 'https://example.com/logo.png',
          address: '123 Test Street',
          email: 'test@travel.com',
          phone: '+1-555-0123',
          theme: 'blue'
        })
        .execute();

      const result = await getTravelIdentity();

      expect(result).not.toBeNull();
      expect(result!.travel_name).toBe('Test Travel Agency');
      expect(result!.logo_url).toBe('https://example.com/logo.png');
      expect(result!.address).toBe('123 Test Street');
      expect(result!.email).toBe('test@travel.com');
      expect(result!.phone).toBe('+1-555-0123');
      expect(result!.theme).toBe('blue');
      expect(result!.id).toBeDefined();
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });

    it('should return the first record when multiple exist', async () => {
      // Create multiple travel identity records
      await db.insert(travelIdentityTable)
        .values([
          {
            travel_name: 'First Agency',
            address: '123 First Street',
            email: 'first@travel.com',
            phone: '+1-555-0001',
            theme: 'purple'
          },
          {
            travel_name: 'Second Agency',
            address: '456 Second Street',
            email: 'second@travel.com',
            phone: '+1-555-0002',
            theme: 'green'
          }
        ])
        .execute();

      const result = await getTravelIdentity();

      expect(result).not.toBeNull();
      expect(result!.travel_name).toBe('First Agency');
    });
  });

  describe('updateTravelIdentity', () => {
    it('should create new travel identity when none exists', async () => {
      const input: UpdateTravelIdentityInput = {
        travel_name: 'New Travel Agency',
        logo_url: 'https://example.com/new-logo.png',
        address: '789 New Street',
        email: 'new@travel.com',
        phone: '+1-555-0789',
        theme: 'green'
      };

      const result = await updateTravelIdentity(input);

      expect(result.travel_name).toBe('New Travel Agency');
      expect(result.logo_url).toBe('https://example.com/new-logo.png');
      expect(result.address).toBe('789 New Street');
      expect(result.email).toBe('new@travel.com');
      expect(result.phone).toBe('+1-555-0789');
      expect(result.theme).toBe('green');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);

      // Verify it was saved to database
      const saved = await db.select()
        .from(travelIdentityTable)
        .where(eq(travelIdentityTable.id, result.id))
        .execute();

      expect(saved).toHaveLength(1);
      expect(saved[0].travel_name).toBe('New Travel Agency');
    });

    it('should create travel identity with default values when input is empty', async () => {
      const input: UpdateTravelIdentityInput = {};

      const result = await updateTravelIdentity(input);

      expect(result.travel_name).toBe('Default Travel Agency');
      expect(result.logo_url).toBeNull();
      expect(result.address).toBe('Default Address');
      expect(result.email).toBe('contact@travelagency.com');
      expect(result.phone).toBe('+1-000-000-0000');
      expect(result.theme).toBe('purple');
    });

    it('should update existing travel identity with all fields', async () => {
      // Create initial travel identity
      const initial = await db.insert(travelIdentityTable)
        .values({
          travel_name: 'Original Agency',
          logo_url: null,
          address: 'Original Address',
          email: 'original@travel.com',
          phone: '+1-555-0000',
          theme: 'purple'
        })
        .returning()
        .execute();

      const originalId = initial[0].id;
      const originalCreatedAt = initial[0].created_at;

      const input: UpdateTravelIdentityInput = {
        travel_name: 'Updated Agency',
        logo_url: 'https://example.com/updated-logo.png',
        address: 'Updated Address',
        email: 'updated@travel.com',
        phone: '+1-555-9999',
        theme: 'blue'
      };

      const result = await updateTravelIdentity(input);

      expect(result.id).toBe(originalId);
      expect(result.travel_name).toBe('Updated Agency');
      expect(result.logo_url).toBe('https://example.com/updated-logo.png');
      expect(result.address).toBe('Updated Address');
      expect(result.email).toBe('updated@travel.com');
      expect(result.phone).toBe('+1-555-9999');
      expect(result.theme).toBe('blue');
      expect(result.created_at).toEqual(originalCreatedAt);
      expect(result.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
    });

    it('should update only specified fields and preserve others', async () => {
      // Create initial travel identity
      await db.insert(travelIdentityTable)
        .values({
          travel_name: 'Original Agency',
          logo_url: 'https://example.com/original-logo.png',
          address: 'Original Address',
          email: 'original@travel.com',
          phone: '+1-555-0000',
          theme: 'purple'
        })
        .execute();

      const input: UpdateTravelIdentityInput = {
        travel_name: 'Partially Updated Agency',
        theme: 'green'
      };

      const result = await updateTravelIdentity(input);

      expect(result.travel_name).toBe('Partially Updated Agency');
      expect(result.logo_url).toBe('https://example.com/original-logo.png'); // Preserved
      expect(result.address).toBe('Original Address'); // Preserved
      expect(result.email).toBe('original@travel.com'); // Preserved
      expect(result.phone).toBe('+1-555-0000'); // Preserved
      expect(result.theme).toBe('green'); // Updated
    });

    it('should handle null logo_url explicitly', async () => {
      // Create initial travel identity with logo
      await db.insert(travelIdentityTable)
        .values({
          travel_name: 'Agency with Logo',
          logo_url: 'https://example.com/logo.png',
          address: 'Test Address',
          email: 'test@travel.com',
          phone: '+1-555-0000',
          theme: 'purple'
        })
        .execute();

      const input: UpdateTravelIdentityInput = {
        logo_url: null
      };

      const result = await updateTravelIdentity(input);

      expect(result.logo_url).toBeNull();
      expect(result.travel_name).toBe('Agency with Logo'); // Preserved
    });

    it('should handle all theme options', async () => {
      const themes = ['purple', 'green', 'blue'] as const;

      for (const theme of themes) {
        // Reset for each iteration
        await resetDB();
        await createDB();

        const input: UpdateTravelIdentityInput = {
          travel_name: `Agency with ${theme} theme`,
          theme: theme
        };

        const result = await updateTravelIdentity(input);

        expect(result.theme).toBe(theme);
        expect(result.travel_name).toBe(`Agency with ${theme} theme`);
      }
    });

    it('should update database record correctly', async () => {
      const input: UpdateTravelIdentityInput = {
        travel_name: 'Database Test Agency',
        address: '456 Database Street',
        email: 'db@travel.com',
        phone: '+1-555-1234',
        theme: 'blue'
      };

      const result = await updateTravelIdentity(input);

      // Query database directly to verify update
      const dbRecord = await db.select()
        .from(travelIdentityTable)
        .where(eq(travelIdentityTable.id, result.id))
        .execute();

      expect(dbRecord).toHaveLength(1);
      expect(dbRecord[0].travel_name).toBe('Database Test Agency');
      expect(dbRecord[0].address).toBe('456 Database Street');
      expect(dbRecord[0].email).toBe('db@travel.com');
      expect(dbRecord[0].phone).toBe('+1-555-1234');
      expect(dbRecord[0].theme).toBe('blue');
      expect(dbRecord[0].updated_at).toBeInstanceOf(Date);
    });
  });
});