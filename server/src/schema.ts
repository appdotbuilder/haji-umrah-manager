import { z } from 'zod';

// Enum definitions
export const userRoleEnum = z.enum(['admin', 'owner']);
export const packageTypeEnum = z.enum(['umrah', 'haji']);
export const transactionStatusEnum = z.enum(['pending', 'partial', 'completed', 'cancelled']);
export const themeEnum = z.enum(['purple', 'green', 'blue']);
export const transactionTypeEnum = z.enum(['debit', 'credit']);
export const pilgramStatusEnum = z.enum(['registered', 'confirmed', 'departed', 'completed', 'cancelled']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleEnum,
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Login input schema
export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Create user input schema
export const createUserInputSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleEnum
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Travel identity schema
export const travelIdentitySchema = z.object({
  id: z.number(),
  travel_name: z.string(),
  logo_url: z.string().nullable(),
  address: z.string(),
  email: z.string().email(),
  phone: z.string(),
  theme: themeEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type TravelIdentity = z.infer<typeof travelIdentitySchema>;

// Update travel identity input schema
export const updateTravelIdentityInputSchema = z.object({
  travel_name: z.string().optional(),
  logo_url: z.string().nullable().optional(),
  address: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  theme: themeEnum.optional()
});

export type UpdateTravelIdentityInput = z.infer<typeof updateTravelIdentityInputSchema>;

// Pilgrim schema
export const pilgrimSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string(),
  passport_number: z.string(),
  passport_expiry: z.coerce.date(),
  date_of_birth: z.coerce.date(),
  address: z.string(),
  emergency_contact_name: z.string(),
  emergency_contact_phone: z.string(),
  status: pilgramStatusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Pilgrim = z.infer<typeof pilgrimSchema>;

// Create pilgrim input schema
export const createPilgrimInputSchema = z.object({
  full_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string(),
  passport_number: z.string(),
  passport_expiry: z.coerce.date(),
  date_of_birth: z.coerce.date(),
  address: z.string(),
  emergency_contact_name: z.string(),
  emergency_contact_phone: z.string()
});

export type CreatePilgrimInput = z.infer<typeof createPilgrimInputSchema>;

// Marketing partner schema
export const marketingPartnerSchema = z.object({
  id: z.number(),
  name: z.string(),
  contact_person: z.string(),
  email: z.string().email(),
  phone: z.string(),
  commission_rate: z.number(),
  address: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MarketingPartner = z.infer<typeof marketingPartnerSchema>;

// Create marketing partner input schema
export const createMarketingPartnerInputSchema = z.object({
  name: z.string(),
  contact_person: z.string(),
  email: z.string().email(),
  phone: z.string(),
  commission_rate: z.number(),
  address: z.string()
});

export type CreateMarketingPartnerInput = z.infer<typeof createMarketingPartnerInputSchema>;

// Supplier schema
export const supplierSchema = z.object({
  id: z.number(),
  name: z.string(),
  contact_person: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  supplier_type: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Supplier = z.infer<typeof supplierSchema>;

// Create supplier input schema
export const createSupplierInputSchema = z.object({
  name: z.string(),
  contact_person: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  supplier_type: z.string()
});

export type CreateSupplierInput = z.infer<typeof createSupplierInputSchema>;

// Bank schema
export const bankSchema = z.object({
  id: z.number(),
  bank_name: z.string(),
  account_number: z.string(),
  account_holder_name: z.string(),
  branch: z.string(),
  swift_code: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Bank = z.infer<typeof bankSchema>;

// Create bank input schema
export const createBankInputSchema = z.object({
  bank_name: z.string(),
  account_number: z.string(),
  account_holder_name: z.string(),
  branch: z.string(),
  swift_code: z.string().nullable()
});

export type CreateBankInput = z.infer<typeof createBankInputSchema>;

// Airline schema
export const airlineSchema = z.object({
  id: z.number(),
  airline_name: z.string(),
  airline_code: z.string(),
  contact_info: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Airline = z.infer<typeof airlineSchema>;

// Create airline input schema
export const createAirlineInputSchema = z.object({
  airline_name: z.string(),
  airline_code: z.string(),
  contact_info: z.string().nullable()
});

export type CreateAirlineInput = z.infer<typeof createAirlineInputSchema>;

// Facility schema
export const facilitySchema = z.object({
  id: z.number(),
  facility_name: z.string(),
  facility_type: z.string(),
  location: z.string(),
  capacity: z.number().int(),
  cost_per_person: z.number(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Facility = z.infer<typeof facilitySchema>;

// Create facility input schema
export const createFacilityInputSchema = z.object({
  facility_name: z.string(),
  facility_type: z.string(),
  location: z.string(),
  capacity: z.number().int(),
  cost_per_person: z.number(),
  description: z.string().nullable()
});

export type CreateFacilityInput = z.infer<typeof createFacilityInputSchema>;

// Visit city schema
export const visitCitySchema = z.object({
  id: z.number(),
  city_name: z.string(),
  country: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type VisitCity = z.infer<typeof visitCitySchema>;

// Create visit city input schema
export const createVisitCityInputSchema = z.object({
  city_name: z.string(),
  country: z.string(),
  description: z.string().nullable()
});

export type CreateVisitCityInput = z.infer<typeof createVisitCityInputSchema>;

// Package type schema
export const packageTypeSchema = z.object({
  id: z.number(),
  type_name: z.string(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PackageType = z.infer<typeof packageTypeSchema>;

// Create package type input schema
export const createPackageTypeInputSchema = z.object({
  type_name: z.string(),
  description: z.string().nullable()
});

export type CreatePackageTypeInput = z.infer<typeof createPackageTypeInputSchema>;

// Package schema
export const packageSchema = z.object({
  id: z.number(),
  package_name: z.string(),
  package_type: packageTypeEnum,
  package_type_id: z.number(),
  description: z.string().nullable(),
  duration_days: z.number().int(),
  base_price: z.number(),
  max_participants: z.number().int(),
  departure_date: z.coerce.date(),
  return_date: z.coerce.date(),
  itinerary: z.string().nullable(),
  inclusions: z.string().nullable(),
  exclusions: z.string().nullable(),
  terms_conditions: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Package = z.infer<typeof packageSchema>;

// Create package input schema
export const createPackageInputSchema = z.object({
  package_name: z.string(),
  package_type: packageTypeEnum,
  package_type_id: z.number(),
  description: z.string().nullable(),
  duration_days: z.number().int(),
  base_price: z.number(),
  max_participants: z.number().int(),
  departure_date: z.coerce.date(),
  return_date: z.coerce.date(),
  itinerary: z.string().nullable(),
  inclusions: z.string().nullable(),
  exclusions: z.string().nullable(),
  terms_conditions: z.string().nullable()
});

export type CreatePackageInput = z.infer<typeof createPackageInputSchema>;

// Package booking schema
export const packageBookingSchema = z.object({
  id: z.number(),
  package_id: z.number(),
  pilgrim_id: z.number(),
  marketing_partner_id: z.number().nullable(),
  booking_date: z.coerce.date(),
  total_amount: z.number(),
  paid_amount: z.number(),
  remaining_amount: z.number(),
  payment_status: transactionStatusEnum,
  booking_status: pilgramStatusEnum,
  special_requests: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PackageBooking = z.infer<typeof packageBookingSchema>;

// Create package booking input schema
export const createPackageBookingInputSchema = z.object({
  package_id: z.number(),
  pilgrim_id: z.number(),
  marketing_partner_id: z.number().nullable(),
  total_amount: z.number(),
  paid_amount: z.number().optional(),
  special_requests: z.string().nullable()
});

export type CreatePackageBookingInput = z.infer<typeof createPackageBookingInputSchema>;

// Chart of accounts schema
export const chartOfAccountsSchema = z.object({
  id: z.number(),
  account_code: z.string(),
  account_name: z.string(),
  account_type: z.string(),
  parent_account_id: z.number().nullable(),
  balance: z.number(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ChartOfAccounts = z.infer<typeof chartOfAccountsSchema>;

// Create account input schema
export const createAccountInputSchema = z.object({
  account_code: z.string(),
  account_name: z.string(),
  account_type: z.string(),
  parent_account_id: z.number().nullable()
});

export type CreateAccountInput = z.infer<typeof createAccountInputSchema>;

// Financial transaction schema
export const financialTransactionSchema = z.object({
  id: z.number(),
  transaction_date: z.coerce.date(),
  transaction_reference: z.string(),
  description: z.string(),
  total_amount: z.number(),
  created_by: z.number(),
  package_booking_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FinancialTransaction = z.infer<typeof financialTransactionSchema>;

// Transaction entry schema
export const transactionEntrySchema = z.object({
  id: z.number(),
  transaction_id: z.number(),
  account_id: z.number(),
  debit_amount: z.number(),
  credit_amount: z.number(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type TransactionEntry = z.infer<typeof transactionEntrySchema>;

// Create transaction input schema
export const createTransactionInputSchema = z.object({
  transaction_reference: z.string(),
  description: z.string(),
  package_booking_id: z.number().nullable(),
  entries: z.array(z.object({
    account_id: z.number(),
    debit_amount: z.number(),
    credit_amount: z.number(),
    description: z.string().nullable()
  }))
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Inventory item schema
export const inventoryItemSchema = z.object({
  id: z.number(),
  item_name: z.string(),
  item_code: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  unit_cost: z.number(),
  selling_price: z.number(),
  current_stock: z.number().int(),
  minimum_stock: z.number().int(),
  supplier_id: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;

// Create inventory item input schema
export const createInventoryItemInputSchema = z.object({
  item_name: z.string(),
  item_code: z.string(),
  category: z.string(),
  description: z.string().nullable(),
  unit_cost: z.number(),
  selling_price: z.number(),
  current_stock: z.number().int(),
  minimum_stock: z.number().int(),
  supplier_id: z.number().nullable()
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemInputSchema>;

// LA simulation schema
export const laSimulationSchema = z.object({
  id: z.number(),
  simulation_name: z.string(),
  package_type: packageTypeEnum,
  duration_days: z.number().int(),
  number_of_pilgrims: z.number().int(),
  accommodation_cost: z.number(),
  transportation_cost: z.number(),
  meal_cost: z.number(),
  guide_cost: z.number(),
  miscellaneous_cost: z.number(),
  total_cost: z.number(),
  cost_per_pilgrim: z.number(),
  profit_margin: z.number(),
  selling_price_per_pilgrim: z.number(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type LASimulation = z.infer<typeof laSimulationSchema>;

// Create LA simulation input schema
export const createLASimulationInputSchema = z.object({
  simulation_name: z.string(),
  package_type: packageTypeEnum,
  duration_days: z.number().int(),
  number_of_pilgrims: z.number().int(),
  accommodation_cost: z.number(),
  transportation_cost: z.number(),
  meal_cost: z.number(),
  guide_cost: z.number(),
  miscellaneous_cost: z.number(),
  profit_margin: z.number()
});

export type CreateLASimulationInput = z.infer<typeof createLASimulationInputSchema>;

// Dashboard analytics schemas
export const salesTrendSchema = z.object({
  period: z.string(),
  total_sales: z.number(),
  package_count: z.number(),
  pilgrim_count: z.number()
});

export type SalesTrend = z.infer<typeof salesTrendSchema>;

export const packageDistributionSchema = z.object({
  package_type: z.string(),
  count: z.number(),
  percentage: z.number()
});

export type PackageDistribution = z.infer<typeof packageDistributionSchema>;

export const unpaidPilgrimSchema = z.object({
  pilgrim_id: z.number(),
  pilgrim_name: z.string(),
  package_name: z.string(),
  total_amount: z.number(),
  paid_amount: z.number(),
  remaining_amount: z.number(),
  booking_date: z.coerce.date(),
  days_overdue: z.number().int()
});

export type UnpaidPilgrim = z.infer<typeof unpaidPilgrimSchema>;

// Filter schemas
export const dateRangeFilterSchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type DateRangeFilter = z.infer<typeof dateRangeFilterSchema>;

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
});

export type Pagination = z.infer<typeof paginationSchema>;

// Financial report schemas
export const journalEntrySchema = z.object({
  transaction_id: z.number(),
  transaction_date: z.coerce.date(),
  transaction_reference: z.string(),
  account_name: z.string(),
  account_code: z.string(),
  debit_amount: z.number(),
  credit_amount: z.number(),
  description: z.string()
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;

export const trialBalanceEntrySchema = z.object({
  account_code: z.string(),
  account_name: z.string(),
  account_type: z.string(),
  debit_balance: z.number(),
  credit_balance: z.number()
});

export type TrialBalanceEntry = z.infer<typeof trialBalanceEntrySchema>;