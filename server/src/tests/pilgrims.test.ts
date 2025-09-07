import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pilgrimsTable } from '../db/schema';
import { type CreatePilgrimInput } from '../schema';
import { 
  createPilgrim, 
  getPilgrims, 
  getPilgrimById, 
  updatePilgrim 
} from '../handlers/pilgrims';
import { eq } from 'drizzle-orm';

// Test input data
const testPilgrimInput: CreatePilgrimInput = {
  full_name: 'Ahmed Ali Hassan',
  email: 'ahmed.ali@example.com',
  phone: '+966-555-123456',
  passport_number: 'A1234567',
  passport_expiry: new Date('2028-12-31'),
  date_of_birth: new Date('1985-06-15'),
  address: '123 King Fahd Road, Riyadh, Saudi Arabia',
  emergency_contact_name: 'Fatima Hassan',
  emergency_contact_phone: '+966-555-987654'
};

const testPilgrimInput2: CreatePilgrimInput = {
  full_name: 'Omar Mohammed Abdullah',
  email: null,
  phone: '+966-555-246810',
  passport_number: 'B7654321',
  passport_expiry: new Date('2027-08-20'),
  date_of_birth: new Date('1978-03-22'),
  address: '456 Prince Sultan Street, Jeddah, Saudi Arabia',
  emergency_contact_name: 'Khadija Abdullah',
  emergency_contact_phone: '+966-555-135792'
};

describe('Pilgrims Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createPilgrim', () => {
    it('should create a pilgrim with all fields', async () => {
      const result = await createPilgrim(testPilgrimInput);

      // Verify all fields are correctly saved
      expect(result.full_name).toEqual('Ahmed Ali Hassan');
      expect(result.email).toEqual('ahmed.ali@example.com');
      expect(result.phone).toEqual('+966-555-123456');
      expect(result.passport_number).toEqual('A1234567');
      expect(result.passport_expiry).toEqual(new Date('2028-12-31'));
      expect(result.date_of_birth).toEqual(new Date('1985-06-15'));
      expect(result.address).toEqual('123 King Fahd Road, Riyadh, Saudi Arabia');
      expect(result.emergency_contact_name).toEqual('Fatima Hassan');
      expect(result.emergency_contact_phone).toEqual('+966-555-987654');
      expect(result.status).toEqual('registered');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create a pilgrim with null email', async () => {
      const result = await createPilgrim(testPilgrimInput2);

      expect(result.full_name).toEqual('Omar Mohammed Abdullah');
      expect(result.email).toBeNull();
      expect(result.phone).toEqual('+966-555-246810');
      expect(result.passport_number).toEqual('B7654321');
      expect(result.status).toEqual('registered');
      expect(result.id).toBeDefined();
    });

    it('should save pilgrim to database correctly', async () => {
      const result = await createPilgrim(testPilgrimInput);

      const pilgrims = await db.select()
        .from(pilgrimsTable)
        .where(eq(pilgrimsTable.id, result.id))
        .execute();

      expect(pilgrims).toHaveLength(1);
      expect(pilgrims[0].full_name).toEqual('Ahmed Ali Hassan');
      expect(pilgrims[0].passport_number).toEqual('A1234567');
      expect(pilgrims[0].status).toEqual('registered');
      expect(pilgrims[0].created_at).toBeInstanceOf(Date);
    });

    it('should reject duplicate passport numbers', async () => {
      const uniqueInput = {
        ...testPilgrimInput,
        passport_number: 'UNIQUE001'
      };
      
      await createPilgrim(uniqueInput);

      const duplicateInput = {
        ...testPilgrimInput2,
        passport_number: 'UNIQUE001', // Same as first pilgrim
        full_name: 'Different Name'
      };

      await expect(createPilgrim(duplicateInput)).rejects.toThrow(/duplicate key value/i);
    });
  });

  describe('getPilgrims', () => {
    it('should return empty array when no pilgrims exist', async () => {
      const result = await getPilgrims();
      expect(result).toEqual([]);
    });

    it('should return all pilgrims', async () => {
      await createPilgrim(testPilgrimInput);
      await createPilgrim(testPilgrimInput2);

      const result = await getPilgrims();

      expect(result).toHaveLength(2);
      expect(result[0].full_name).toEqual('Ahmed Ali Hassan');
      expect(result[1].full_name).toEqual('Omar Mohammed Abdullah');
      expect(result[0].status).toEqual('registered');
      expect(result[1].status).toEqual('registered');
    });

    it('should return pilgrims with correct date types', async () => {
      await createPilgrim(testPilgrimInput);

      const result = await getPilgrims();

      expect(result[0].passport_expiry).toBeInstanceOf(Date);
      expect(result[0].date_of_birth).toBeInstanceOf(Date);
      expect(result[0].created_at).toBeInstanceOf(Date);
      expect(result[0].updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getPilgrimById', () => {
    it('should return null for non-existent pilgrim', async () => {
      const result = await getPilgrimById(999);
      expect(result).toBeNull();
    });

    it('should return pilgrim by ID', async () => {
      const created = await createPilgrim(testPilgrimInput);

      const result = await getPilgrimById(created.id);

      expect(result).toBeDefined();
      expect(result!.id).toEqual(created.id);
      expect(result!.full_name).toEqual('Ahmed Ali Hassan');
      expect(result!.passport_number).toEqual('A1234567');
      expect(result!.status).toEqual('registered');
    });

    it('should return pilgrim with correct date types', async () => {
      const created = await createPilgrim(testPilgrimInput);

      const result = await getPilgrimById(created.id);

      expect(result!.passport_expiry).toBeInstanceOf(Date);
      expect(result!.date_of_birth).toBeInstanceOf(Date);
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('updatePilgrim', () => {
    it('should update pilgrim fields', async () => {
      const created = await createPilgrim(testPilgrimInput);

      const updateInput = {
        full_name: 'Ahmed Ali Hassan Al-Rashid',
        phone: '+966-555-999888',
        address: '789 Updated Street, Mecca, Saudi Arabia'
      };

      const result = await updatePilgrim(created.id, updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.full_name).toEqual('Ahmed Ali Hassan Al-Rashid');
      expect(result.phone).toEqual('+966-555-999888');
      expect(result.address).toEqual('789 Updated Street, Mecca, Saudi Arabia');
      // Unchanged fields should remain the same
      expect(result.email).toEqual('ahmed.ali@example.com');
      expect(result.passport_number).toEqual('A1234567');
      expect(result.status).toEqual('registered');
    });

    it('should update updated_at timestamp', async () => {
      const created = await createPilgrim(testPilgrimInput);
      const originalUpdatedAt = created.updated_at;

      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = await updatePilgrim(created.id, {
        phone: '+966-555-111222'
      });

      expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should persist updates to database', async () => {
      const created = await createPilgrim(testPilgrimInput);

      await updatePilgrim(created.id, {
        full_name: 'Updated Name',
        email: 'updated@example.com'
      });

      const pilgrim = await db.select()
        .from(pilgrimsTable)
        .where(eq(pilgrimsTable.id, created.id))
        .execute();

      expect(pilgrim[0].full_name).toEqual('Updated Name');
      expect(pilgrim[0].email).toEqual('updated@example.com');
      expect(pilgrim[0].updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should throw error for non-existent pilgrim', async () => {
      await expect(updatePilgrim(999, { full_name: 'Test' }))
        .rejects.toThrow(/Pilgrim with ID 999 not found/i);
    });

    it('should handle partial updates correctly', async () => {
      const created = await createPilgrim(testPilgrimInput);

      const result = await updatePilgrim(created.id, {
        emergency_contact_phone: '+966-555-000000'
      });

      // Only emergency contact phone should be updated
      expect(result.emergency_contact_phone).toEqual('+966-555-000000');
      // All other fields should remain unchanged
      expect(result.full_name).toEqual('Ahmed Ali Hassan');
      expect(result.email).toEqual('ahmed.ali@example.com');
      expect(result.phone).toEqual('+966-555-123456');
      expect(result.emergency_contact_name).toEqual('Fatima Hassan');
    });

    it('should allow setting email to null', async () => {
      const created = await createPilgrim(testPilgrimInput);

      const result = await updatePilgrim(created.id, {
        email: null
      });

      expect(result.email).toBeNull();
      expect(result.full_name).toEqual('Ahmed Ali Hassan'); // Other fields unchanged
    });
  });
});