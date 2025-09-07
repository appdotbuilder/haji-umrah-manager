import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { visitCitiesTable } from '../db/schema';
import { type CreateVisitCityInput } from '../schema';
import { createVisitCity, getVisitCities, getVisitCityById } from '../handlers/visit_cities';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateVisitCityInput = {
  city_name: 'Mecca',
  country: 'Saudi Arabia',
  description: 'The holiest city in Islam, home to the Great Mosque and the Kaaba'
};

const testInputWithNullDescription: CreateVisitCityInput = {
  city_name: 'Medina',
  country: 'Saudi Arabia',
  description: null
};

describe('createVisitCity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a visit city with all fields', async () => {
    const result = await createVisitCity(testInput);

    // Basic field validation
    expect(result.city_name).toEqual('Mecca');
    expect(result.country).toEqual('Saudi Arabia');
    expect(result.description).toEqual('The holiest city in Islam, home to the Great Mosque and the Kaaba');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a visit city with null description', async () => {
    const result = await createVisitCity(testInputWithNullDescription);

    expect(result.city_name).toEqual('Medina');
    expect(result.country).toEqual('Saudi Arabia');
    expect(result.description).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
  });

  it('should save visit city to database', async () => {
    const result = await createVisitCity(testInput);

    const visitCities = await db.select()
      .from(visitCitiesTable)
      .where(eq(visitCitiesTable.id, result.id))
      .execute();

    expect(visitCities).toHaveLength(1);
    expect(visitCities[0].city_name).toEqual('Mecca');
    expect(visitCities[0].country).toEqual('Saudi Arabia');
    expect(visitCities[0].description).toEqual(testInput.description);
    expect(visitCities[0].is_active).toEqual(true);
    expect(visitCities[0].created_at).toBeInstanceOf(Date);
  });
});

describe('getVisitCities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no visit cities exist', async () => {
    const result = await getVisitCities();

    expect(result).toHaveLength(0);
  });

  it('should return all visit cities', async () => {
    // Create multiple visit cities
    await createVisitCity(testInput);
    await createVisitCity(testInputWithNullDescription);

    const result = await getVisitCities();

    expect(result).toHaveLength(2);
    
    // Verify the data
    const mecca = result.find(city => city.city_name === 'Mecca');
    const medina = result.find(city => city.city_name === 'Medina');
    
    expect(mecca).toBeDefined();
    expect(mecca!.country).toEqual('Saudi Arabia');
    expect(mecca!.description).toEqual(testInput.description);
    expect(mecca!.is_active).toEqual(true);
    
    expect(medina).toBeDefined();
    expect(medina!.country).toEqual('Saudi Arabia');
    expect(medina!.description).toBeNull();
    expect(medina!.is_active).toEqual(true);
  });
});

describe('getVisitCityById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when visit city does not exist', async () => {
    const result = await getVisitCityById(999);

    expect(result).toBeNull();
  });

  it('should return visit city when it exists', async () => {
    const created = await createVisitCity(testInput);

    const result = await getVisitCityById(created.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(created.id);
    expect(result!.city_name).toEqual('Mecca');
    expect(result!.country).toEqual('Saudi Arabia');
    expect(result!.description).toEqual(testInput.description);
    expect(result!.is_active).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return the correct visit city when multiple exist', async () => {
    const mecca = await createVisitCity(testInput);
    const medina = await createVisitCity(testInputWithNullDescription);

    const meccaResult = await getVisitCityById(mecca.id);
    const medinaResult = await getVisitCityById(medina.id);

    expect(meccaResult!.city_name).toEqual('Mecca');
    expect(meccaResult!.description).toEqual(testInput.description);
    
    expect(medinaResult!.city_name).toEqual('Medina');
    expect(medinaResult!.description).toBeNull();
  });
});