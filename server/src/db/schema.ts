import { serial, text, pgTable, timestamp, numeric, integer, boolean, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum definitions
export const userRoleEnum = pgEnum('user_role', ['admin', 'owner']);
export const packageTypeEnum = pgEnum('package_type', ['umrah', 'haji']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'partial', 'completed', 'cancelled']);
export const themeEnum = pgEnum('theme', ['purple', 'green', 'blue']);
export const pilgrimStatusEnum = pgEnum('pilgrim_status', ['registered', 'confirmed', 'departed', 'completed', 'cancelled']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Travel identity table
export const travelIdentityTable = pgTable('travel_identity', {
  id: serial('id').primaryKey(),
  travel_name: text('travel_name').notNull(),
  logo_url: text('logo_url'),
  address: text('address').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  theme: themeEnum('theme').notNull().default('purple'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Pilgrims table
export const pilgrimsTable = pgTable('pilgrims', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  passport_number: text('passport_number').notNull().unique(),
  passport_expiry: date('passport_expiry').notNull(),
  date_of_birth: date('date_of_birth').notNull(),
  address: text('address').notNull(),
  emergency_contact_name: text('emergency_contact_name').notNull(),
  emergency_contact_phone: text('emergency_contact_phone').notNull(),
  status: pilgrimStatusEnum('status').notNull().default('registered'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Marketing partners table
export const marketingPartnersTable = pgTable('marketing_partners', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  contact_person: text('contact_person').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  commission_rate: numeric('commission_rate', { precision: 5, scale: 2 }).notNull(),
  address: text('address').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Suppliers table
export const suppliersTable = pgTable('suppliers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  contact_person: text('contact_person').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  supplier_type: text('supplier_type').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Banks table
export const banksTable = pgTable('banks', {
  id: serial('id').primaryKey(),
  bank_name: text('bank_name').notNull(),
  account_number: text('account_number').notNull(),
  account_holder_name: text('account_holder_name').notNull(),
  branch: text('branch').notNull(),
  swift_code: text('swift_code'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Airlines table
export const airlinesTable = pgTable('airlines', {
  id: serial('id').primaryKey(),
  airline_name: text('airline_name').notNull(),
  airline_code: text('airline_code').notNull().unique(),
  contact_info: text('contact_info'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Facilities table
export const facilitiesTable = pgTable('facilities', {
  id: serial('id').primaryKey(),
  facility_name: text('facility_name').notNull(),
  facility_type: text('facility_type').notNull(),
  location: text('location').notNull(),
  capacity: integer('capacity').notNull(),
  cost_per_person: numeric('cost_per_person', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Visit cities table
export const visitCitiesTable = pgTable('visit_cities', {
  id: serial('id').primaryKey(),
  city_name: text('city_name').notNull(),
  country: text('country').notNull(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Package types table
export const packageTypesTable = pgTable('package_types', {
  id: serial('id').primaryKey(),
  type_name: text('type_name').notNull().unique(),
  description: text('description'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Packages table
export const packagesTable = pgTable('packages', {
  id: serial('id').primaryKey(),
  package_name: text('package_name').notNull(),
  package_type: packageTypeEnum('package_type').notNull(),
  package_type_id: integer('package_type_id').notNull(),
  description: text('description'),
  duration_days: integer('duration_days').notNull(),
  base_price: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  max_participants: integer('max_participants').notNull(),
  departure_date: date('departure_date').notNull(),
  return_date: date('return_date').notNull(),
  itinerary: text('itinerary'),
  inclusions: text('inclusions'),
  exclusions: text('exclusions'),
  terms_conditions: text('terms_conditions'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Package bookings table
export const packageBookingsTable = pgTable('package_bookings', {
  id: serial('id').primaryKey(),
  package_id: integer('package_id').notNull(),
  pilgrim_id: integer('pilgrim_id').notNull(),
  marketing_partner_id: integer('marketing_partner_id'),
  booking_date: timestamp('booking_date').defaultNow().notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  paid_amount: numeric('paid_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  remaining_amount: numeric('remaining_amount', { precision: 10, scale: 2 }).notNull(),
  payment_status: transactionStatusEnum('payment_status').notNull().default('pending'),
  booking_status: pilgrimStatusEnum('booking_status').notNull().default('registered'),
  special_requests: text('special_requests'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Chart of accounts table
export const chartOfAccountsTable = pgTable('chart_of_accounts', {
  id: serial('id').primaryKey(),
  account_code: text('account_code').notNull().unique(),
  account_name: text('account_name').notNull(),
  account_type: text('account_type').notNull(),
  parent_account_id: integer('parent_account_id'),
  balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Financial transactions table
export const financialTransactionsTable = pgTable('financial_transactions', {
  id: serial('id').primaryKey(),
  transaction_date: timestamp('transaction_date').notNull(),
  transaction_reference: text('transaction_reference').notNull().unique(),
  description: text('description').notNull(),
  total_amount: numeric('total_amount', { precision: 15, scale: 2 }).notNull(),
  created_by: integer('created_by').notNull(),
  package_booking_id: integer('package_booking_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Transaction entries table
export const transactionEntriesTable = pgTable('transaction_entries', {
  id: serial('id').primaryKey(),
  transaction_id: integer('transaction_id').notNull(),
  account_id: integer('account_id').notNull(),
  debit_amount: numeric('debit_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  credit_amount: numeric('credit_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Inventory items table
export const inventoryItemsTable = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  item_name: text('item_name').notNull(),
  item_code: text('item_code').notNull().unique(),
  category: text('category').notNull(),
  description: text('description'),
  unit_cost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull(),
  selling_price: numeric('selling_price', { precision: 10, scale: 2 }).notNull(),
  current_stock: integer('current_stock').notNull().default(0),
  minimum_stock: integer('minimum_stock').notNull().default(0),
  supplier_id: integer('supplier_id'),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// LA simulation table
export const laSimulationsTable = pgTable('la_simulations', {
  id: serial('id').primaryKey(),
  simulation_name: text('simulation_name').notNull(),
  package_type: packageTypeEnum('package_type').notNull(),
  duration_days: integer('duration_days').notNull(),
  number_of_pilgrims: integer('number_of_pilgrims').notNull(),
  accommodation_cost: numeric('accommodation_cost', { precision: 10, scale: 2 }).notNull(),
  transportation_cost: numeric('transportation_cost', { precision: 10, scale: 2 }).notNull(),
  meal_cost: numeric('meal_cost', { precision: 10, scale: 2 }).notNull(),
  guide_cost: numeric('guide_cost', { precision: 10, scale: 2 }).notNull(),
  miscellaneous_cost: numeric('miscellaneous_cost', { precision: 10, scale: 2 }).notNull(),
  total_cost: numeric('total_cost', { precision: 10, scale: 2 }).notNull(),
  cost_per_pilgrim: numeric('cost_per_pilgrim', { precision: 10, scale: 2 }).notNull(),
  profit_margin: numeric('profit_margin', { precision: 5, scale: 2 }).notNull(),
  selling_price_per_pilgrim: numeric('selling_price_per_pilgrim', { precision: 10, scale: 2 }).notNull(),
  created_by: integer('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  financialTransactions: many(financialTransactionsTable),
  laSimulations: many(laSimulationsTable)
}));

export const packageTypesRelations = relations(packageTypesTable, ({ many }) => ({
  packages: many(packagesTable)
}));

export const packagesRelations = relations(packagesTable, ({ one, many }) => ({
  packageType: one(packageTypesTable, {
    fields: [packagesTable.package_type_id],
    references: [packageTypesTable.id]
  }),
  bookings: many(packageBookingsTable)
}));

export const pilgrimsRelations = relations(pilgrimsTable, ({ many }) => ({
  bookings: many(packageBookingsTable)
}));

export const marketingPartnersRelations = relations(marketingPartnersTable, ({ many }) => ({
  bookings: many(packageBookingsTable)
}));

export const packageBookingsRelations = relations(packageBookingsTable, ({ one, many }) => ({
  package: one(packagesTable, {
    fields: [packageBookingsTable.package_id],
    references: [packagesTable.id]
  }),
  pilgrim: one(pilgrimsTable, {
    fields: [packageBookingsTable.pilgrim_id],
    references: [pilgrimsTable.id]
  }),
  marketingPartner: one(marketingPartnersTable, {
    fields: [packageBookingsTable.marketing_partner_id],
    references: [marketingPartnersTable.id]
  }),
  financialTransactions: many(financialTransactionsTable)
}));

export const chartOfAccountsRelations = relations(chartOfAccountsTable, ({ one, many }) => ({
  parentAccount: one(chartOfAccountsTable, {
    fields: [chartOfAccountsTable.parent_account_id],
    references: [chartOfAccountsTable.id]
  }),
  childAccounts: many(chartOfAccountsTable),
  transactionEntries: many(transactionEntriesTable)
}));

export const financialTransactionsRelations = relations(financialTransactionsTable, ({ one, many }) => ({
  createdBy: one(usersTable, {
    fields: [financialTransactionsTable.created_by],
    references: [usersTable.id]
  }),
  packageBooking: one(packageBookingsTable, {
    fields: [financialTransactionsTable.package_booking_id],
    references: [packageBookingsTable.id]
  }),
  entries: many(transactionEntriesTable)
}));

export const transactionEntriesRelations = relations(transactionEntriesTable, ({ one }) => ({
  transaction: one(financialTransactionsTable, {
    fields: [transactionEntriesTable.transaction_id],
    references: [financialTransactionsTable.id]
  }),
  account: one(chartOfAccountsTable, {
    fields: [transactionEntriesTable.account_id],
    references: [chartOfAccountsTable.id]
  })
}));

export const inventoryItemsRelations = relations(inventoryItemsTable, ({ one }) => ({
  supplier: one(suppliersTable, {
    fields: [inventoryItemsTable.supplier_id],
    references: [suppliersTable.id]
  })
}));

export const laSimulationsRelations = relations(laSimulationsTable, ({ one }) => ({
  createdBy: one(usersTable, {
    fields: [laSimulationsTable.created_by],
    references: [usersTable.id]
  })
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  travelIdentity: travelIdentityTable,
  pilgrims: pilgrimsTable,
  marketingPartners: marketingPartnersTable,
  suppliers: suppliersTable,
  banks: banksTable,
  airlines: airlinesTable,
  facilities: facilitiesTable,
  visitCities: visitCitiesTable,
  packageTypes: packageTypesTable,
  packages: packagesTable,
  packageBookings: packageBookingsTable,
  chartOfAccounts: chartOfAccountsTable,
  financialTransactions: financialTransactionsTable,
  transactionEntries: transactionEntriesTable,
  inventoryItems: inventoryItemsTable,
  laSimulations: laSimulationsTable
};