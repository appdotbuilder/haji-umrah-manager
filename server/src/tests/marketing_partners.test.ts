import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { marketingPartnersTable } from '../db/schema';
import { type CreateMarketingPartnerInput } from '../schema';
import { 
  createMarketingPartner, 
  getMarketingPartners, 
  getMarketingPartnerById, 
  updateMarketingPartner 
} from '../handlers/marketing_partners';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateMarketingPartnerInput = {
  name: 'Test Marketing Partner',
  contact_person: 'John Doe',
  email: 'john.doe@testpartner.com',
  phone: '+1-555-0123',
  commission_rate: 15.5,
  address: '123 Marketing St, Business City, BC 12345'
};

const secondTestInput: CreateMarketingPartnerInput = {
  name: 'Second Marketing Partner',
  contact_person: 'Jane Smith',
  email: 'jane.smith@secondpartner.com',
  phone: '+1-555-0456',
  commission_rate: 10.25,
  address: '456 Partner Ave, Sales Town, ST 67890'
};

describe('Marketing Partners Handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createMarketingPartner', () => {
    it('should create a marketing partner', async () => {
      const result = await createMarketingPartner(testInput);

      // Basic field validation
      expect(result.name).toEqual('Test Marketing Partner');
      expect(result.contact_person).toEqual('John Doe');
      expect(result.email).toEqual('john.doe@testpartner.com');
      expect(result.phone).toEqual('+1-555-0123');
      expect(result.commission_rate).toEqual(15.5);
      expect(typeof result.commission_rate).toEqual('number');
      expect(result.address).toEqual('123 Marketing St, Business City, BC 12345');
      expect(result.is_active).toEqual(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save marketing partner to database', async () => {
      const result = await createMarketingPartner(testInput);

      // Verify data was saved correctly in database
      const partners = await db.select()
        .from(marketingPartnersTable)
        .where(eq(marketingPartnersTable.id, result.id))
        .execute();

      expect(partners).toHaveLength(1);
      expect(partners[0].name).toEqual('Test Marketing Partner');
      expect(partners[0].contact_person).toEqual('John Doe');
      expect(partners[0].email).toEqual('john.doe@testpartner.com');
      expect(partners[0].phone).toEqual('+1-555-0123');
      expect(parseFloat(partners[0].commission_rate)).toEqual(15.5);
      expect(partners[0].address).toEqual('123 Marketing St, Business City, BC 12345');
      expect(partners[0].is_active).toEqual(true);
      expect(partners[0].created_at).toBeInstanceOf(Date);
      expect(partners[0].updated_at).toBeInstanceOf(Date);
    });

    it('should handle decimal commission rates correctly', async () => {
      const decimalInput: CreateMarketingPartnerInput = {
        ...testInput,
        commission_rate: 7.75
      };

      const result = await createMarketingPartner(decimalInput);

      expect(result.commission_rate).toEqual(7.75);
      expect(typeof result.commission_rate).toEqual('number');

      // Verify in database
      const partners = await db.select()
        .from(marketingPartnersTable)
        .where(eq(marketingPartnersTable.id, result.id))
        .execute();

      expect(parseFloat(partners[0].commission_rate)).toEqual(7.75);
    });
  });

  describe('getMarketingPartners', () => {
    it('should return empty array when no partners exist', async () => {
      const result = await getMarketingPartners();

      expect(result).toEqual([]);
    });

    it('should return all marketing partners', async () => {
      // Create test data
      await createMarketingPartner(testInput);
      await createMarketingPartner(secondTestInput);

      const result = await getMarketingPartners();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Test Marketing Partner');
      expect(result[0].commission_rate).toEqual(15.5);
      expect(typeof result[0].commission_rate).toEqual('number');
      expect(result[1].name).toEqual('Second Marketing Partner');
      expect(result[1].commission_rate).toEqual(10.25);
      expect(typeof result[1].commission_rate).toEqual('number');
    });

    it('should include all required fields', async () => {
      await createMarketingPartner(testInput);

      const result = await getMarketingPartners();

      expect(result).toHaveLength(1);
      const partner = result[0];
      expect(partner.id).toBeDefined();
      expect(partner.name).toBeDefined();
      expect(partner.contact_person).toBeDefined();
      expect(partner.email).toBeDefined();
      expect(partner.phone).toBeDefined();
      expect(partner.commission_rate).toBeDefined();
      expect(partner.address).toBeDefined();
      expect(partner.is_active).toBeDefined();
      expect(partner.created_at).toBeInstanceOf(Date);
      expect(partner.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getMarketingPartnerById', () => {
    it('should return null when partner does not exist', async () => {
      const result = await getMarketingPartnerById(999);

      expect(result).toBeNull();
    });

    it('should return marketing partner when it exists', async () => {
      const created = await createMarketingPartner(testInput);

      const result = await getMarketingPartnerById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Test Marketing Partner');
      expect(result!.contact_person).toEqual('John Doe');
      expect(result!.email).toEqual('john.doe@testpartner.com');
      expect(result!.phone).toEqual('+1-555-0123');
      expect(result!.commission_rate).toEqual(15.5);
      expect(typeof result!.commission_rate).toEqual('number');
      expect(result!.address).toEqual('123 Marketing St, Business City, BC 12345');
      expect(result!.is_active).toEqual(true);
    });

    it('should return correct partner when multiple exist', async () => {
      const first = await createMarketingPartner(testInput);
      const second = await createMarketingPartner(secondTestInput);

      const result = await getMarketingPartnerById(second.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(second.id);
      expect(result!.name).toEqual('Second Marketing Partner');
      expect(result!.contact_person).toEqual('Jane Smith');
    });
  });

  describe('updateMarketingPartner', () => {
    it('should update marketing partner fields', async () => {
      const created = await createMarketingPartner(testInput);

      const updateInput = {
        name: 'Updated Partner Name',
        commission_rate: 20.0
      };

      const result = await updateMarketingPartner(created.id, updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated Partner Name');
      expect(result.contact_person).toEqual('John Doe'); // Unchanged
      expect(result.commission_rate).toEqual(20.0);
      expect(typeof result.commission_rate).toEqual('number');
      expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
    });

    it('should update only provided fields', async () => {
      const created = await createMarketingPartner(testInput);

      const updateInput = {
        email: 'updated@newdomain.com'
      };

      const result = await updateMarketingPartner(created.id, updateInput);

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Test Marketing Partner'); // Unchanged
      expect(result.contact_person).toEqual('John Doe'); // Unchanged
      expect(result.email).toEqual('updated@newdomain.com'); // Changed
      expect(result.phone).toEqual('+1-555-0123'); // Unchanged
      expect(result.commission_rate).toEqual(15.5); // Unchanged
      expect(result.address).toEqual('123 Marketing St, Business City, BC 12345'); // Unchanged
    });

    it('should save changes to database', async () => {
      const created = await createMarketingPartner(testInput);

      const updateInput = {
        name: 'Database Updated Name',
        commission_rate: 12.75
      };

      await updateMarketingPartner(created.id, updateInput);

      // Verify changes in database
      const partners = await db.select()
        .from(marketingPartnersTable)
        .where(eq(marketingPartnersTable.id, created.id))
        .execute();

      expect(partners).toHaveLength(1);
      expect(partners[0].name).toEqual('Database Updated Name');
      expect(parseFloat(partners[0].commission_rate)).toEqual(12.75);
    });

    it('should throw error when partner does not exist', async () => {
      const updateInput = {
        name: 'Non-existent Partner'
      };

      await expect(updateMarketingPartner(999, updateInput)).rejects.toThrow(/not found/i);
    });

    it('should handle all fields update', async () => {
      const created = await createMarketingPartner(testInput);

      const updateInput = {
        name: 'Completely Updated Partner',
        contact_person: 'New Contact Person',
        email: 'new.contact@updated.com',
        phone: '+1-555-9999',
        commission_rate: 25.5,
        address: '999 Updated Street, New City, NC 99999'
      };

      const result = await updateMarketingPartner(created.id, updateInput);

      expect(result.name).toEqual('Completely Updated Partner');
      expect(result.contact_person).toEqual('New Contact Person');
      expect(result.email).toEqual('new.contact@updated.com');
      expect(result.phone).toEqual('+1-555-9999');
      expect(result.commission_rate).toEqual(25.5);
      expect(typeof result.commission_rate).toEqual('number');
      expect(result.address).toEqual('999 Updated Street, New City, NC 99999');
    });
  });
});