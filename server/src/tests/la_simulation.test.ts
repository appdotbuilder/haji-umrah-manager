import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { laSimulationsTable, usersTable } from '../db/schema';
import { type CreateLASimulationInput } from '../schema';
import { 
  createLASimulation, 
  getLASimulations, 
  getLASimulationById, 
  getLASimulationsByUser 
} from '../handlers/la_simulation';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateLASimulationInput = {
  simulation_name: 'Test Umrah Package',
  package_type: 'umrah',
  duration_days: 14,
  number_of_pilgrims: 50,
  accommodation_cost: 25000,
  transportation_cost: 15000,
  meal_cost: 8000,
  guide_cost: 3000,
  miscellaneous_cost: 2000,
  profit_margin: 20
};

describe('LA Simulation Handlers', () => {
  let testUserId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'admin'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  describe('createLASimulation', () => {
    it('should create a simulation with correct calculations', async () => {
      const result = await createLASimulation(testInput, testUserId);

      // Verify basic fields
      expect(result.simulation_name).toBe('Test Umrah Package');
      expect(result.package_type).toBe('umrah');
      expect(result.duration_days).toBe(14);
      expect(result.number_of_pilgrims).toBe(50);
      expect(result.created_by).toBe(testUserId);

      // Verify cost inputs (should be numbers)
      expect(typeof result.accommodation_cost).toBe('number');
      expect(result.accommodation_cost).toBe(25000);
      expect(result.transportation_cost).toBe(15000);
      expect(result.meal_cost).toBe(8000);
      expect(result.guide_cost).toBe(3000);
      expect(result.miscellaneous_cost).toBe(2000);

      // Verify calculated values
      const expectedTotalCost = 25000 + 15000 + 8000 + 3000 + 2000; // 53000
      const expectedCostPerPilgrim = expectedTotalCost / 50; // 1060
      const expectedProfitAmount = (expectedCostPerPilgrim * 20) / 100; // 212
      const expectedSellingPrice = expectedCostPerPilgrim + expectedProfitAmount; // 1272

      expect(result.total_cost).toBe(expectedTotalCost);
      expect(result.cost_per_pilgrim).toBe(expectedCostPerPilgrim);
      expect(result.profit_margin).toBe(20);
      expect(result.selling_price_per_pilgrim).toBe(expectedSellingPrice);

      // Verify metadata
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save simulation to database correctly', async () => {
      const result = await createLASimulation(testInput, testUserId);

      const simulations = await db.select()
        .from(laSimulationsTable)
        .where(eq(laSimulationsTable.id, result.id))
        .execute();

      expect(simulations).toHaveLength(1);
      const saved = simulations[0];

      expect(saved.simulation_name).toBe('Test Umrah Package');
      expect(saved.package_type).toBe('umrah');
      expect(saved.created_by).toBe(testUserId);
      
      // Verify numeric fields are stored correctly (as strings in DB)
      expect(parseFloat(saved.accommodation_cost)).toBe(25000);
      expect(parseFloat(saved.total_cost)).toBe(53000);
      expect(parseFloat(saved.cost_per_pilgrim)).toBe(1060);
      expect(parseFloat(saved.selling_price_per_pilgrim)).toBe(1272);
    });

    it('should handle haji package type', async () => {
      const hajiInput: CreateLASimulationInput = {
        ...testInput,
        simulation_name: 'Test Haji Package',
        package_type: 'haji',
        duration_days: 30
      };

      const result = await createLASimulation(hajiInput, testUserId);

      expect(result.simulation_name).toBe('Test Haji Package');
      expect(result.package_type).toBe('haji');
      expect(result.duration_days).toBe(30);
    });

    it('should handle different profit margins', async () => {
      const highProfitInput: CreateLASimulationInput = {
        ...testInput,
        profit_margin: 35
      };

      const result = await createLASimulation(highProfitInput, testUserId);

      const expectedCostPerPilgrim = 53000 / 50; // 1060
      const expectedProfitAmount = (expectedCostPerPilgrim * 35) / 100; // 371
      const expectedSellingPrice = expectedCostPerPilgrim + expectedProfitAmount; // 1431

      expect(result.profit_margin).toBe(35);
      expect(result.selling_price_per_pilgrim).toBe(expectedSellingPrice);
    });
  });

  describe('getLASimulations', () => {
    it('should return empty array when no simulations exist', async () => {
      const result = await getLASimulations();
      expect(result).toEqual([]);
    });

    it('should return all simulations with correct numeric conversions', async () => {
      // Create multiple simulations
      await createLASimulation(testInput, testUserId);
      await createLASimulation({
        ...testInput,
        simulation_name: 'Second Simulation'
      }, testUserId);

      const result = await getLASimulations();

      expect(result).toHaveLength(2);
      
      result.forEach(simulation => {
        expect(typeof simulation.accommodation_cost).toBe('number');
        expect(typeof simulation.total_cost).toBe('number');
        expect(typeof simulation.cost_per_pilgrim).toBe('number');
        expect(typeof simulation.selling_price_per_pilgrim).toBe('number');
        expect(simulation.created_at).toBeInstanceOf(Date);
      });

      expect(result[0].simulation_name).toBe('Test Umrah Package');
      expect(result[1].simulation_name).toBe('Second Simulation');
    });
  });

  describe('getLASimulationById', () => {
    it('should return null for non-existent simulation', async () => {
      const result = await getLASimulationById(999);
      expect(result).toBeNull();
    });

    it('should return simulation by ID with correct data', async () => {
      const created = await createLASimulation(testInput, testUserId);
      const result = await getLASimulationById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.simulation_name).toBe('Test Umrah Package');
      expect(result!.package_type).toBe('umrah');
      expect(result!.created_by).toBe(testUserId);
      
      // Verify numeric conversions
      expect(typeof result!.accommodation_cost).toBe('number');
      expect(result!.accommodation_cost).toBe(25000);
      expect(result!.total_cost).toBe(53000);
      expect(result!.cost_per_pilgrim).toBe(1060);
    });
  });

  describe('getLASimulationsByUser', () => {
    it('should return empty array for user with no simulations', async () => {
      const result = await getLASimulationsByUser(testUserId);
      expect(result).toEqual([]);
    });

    it('should return only simulations for specified user', async () => {
      // Create another user
      const user2Result = await db.insert(usersTable)
        .values({
          username: 'testuser2',
          email: 'test2@example.com',
          password_hash: 'hashed_password2',
          role: 'admin'
        })
        .returning()
        .execute();
      const user2Id = user2Result[0].id;

      // Create simulations for both users
      await createLASimulation(testInput, testUserId);
      await createLASimulation({
        ...testInput,
        simulation_name: 'User 1 Second Sim'
      }, testUserId);
      await createLASimulation({
        ...testInput,
        simulation_name: 'User 2 Simulation'
      }, user2Id);

      const user1Simulations = await getLASimulationsByUser(testUserId);
      const user2Simulations = await getLASimulationsByUser(user2Id);

      expect(user1Simulations).toHaveLength(2);
      expect(user2Simulations).toHaveLength(1);

      // Verify user 1 simulations
      user1Simulations.forEach(sim => {
        expect(sim.created_by).toBe(testUserId);
        expect(typeof sim.accommodation_cost).toBe('number');
      });

      // Verify user 2 simulation
      expect(user2Simulations[0].created_by).toBe(user2Id);
      expect(user2Simulations[0].simulation_name).toBe('User 2 Simulation');
    });
  });
});