import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  loginInputSchema,
  createUserInputSchema,
  updateTravelIdentityInputSchema,
  createPilgrimInputSchema,
  createMarketingPartnerInputSchema,
  createSupplierInputSchema,
  createBankInputSchema,
  createAirlineInputSchema,
  createFacilityInputSchema,
  createVisitCityInputSchema,
  createPackageTypeInputSchema,
  createPackageInputSchema,
  createPackageBookingInputSchema,
  createAccountInputSchema,
  createTransactionInputSchema,
  createInventoryItemInputSchema,
  createLASimulationInputSchema,
  dateRangeFilterSchema,
  paginationSchema
} from './schema';

// Import handlers
import { login, createUser, getUsers } from './handlers/auth';
import { getTravelIdentity, updateTravelIdentity } from './handlers/travel_identity';
import { createPilgrim, getPilgrims, getPilgrimById, updatePilgrim } from './handlers/pilgrims';
import { createMarketingPartner, getMarketingPartners, getMarketingPartnerById, updateMarketingPartner } from './handlers/marketing_partners';
import { createSupplier, getSuppliers, getSupplierById } from './handlers/suppliers';
import { createBank, getBanks, getBankById } from './handlers/banks';
import { createAirline, getAirlines, getAirlineById } from './handlers/airlines';
import { createFacility, getFacilities, getFacilityById } from './handlers/facilities';
import { createVisitCity, getVisitCities, getVisitCityById } from './handlers/visit_cities';
import { createPackageType, getPackageTypes, getPackageTypeById } from './handlers/package_types';
import { createPackage, getPackages, getUmrahPackages, getHajiPackages, getPackageById } from './handlers/packages';
import { createPackageBooking, getPackageBookings, getPackageBookingById, updateBookingPayment } from './handlers/package_bookings';
import { createAccount, getChartOfAccounts, getAccountById, updateAccountBalance } from './handlers/chart_of_accounts';
import { createFinancialTransaction, getFinancialTransactions, getTransactionById, getTransactionEntries } from './handlers/financial_transactions';
import { createInventoryItem, getInventoryItems, getInventoryItemById, getLowStockItems, getInventorySummary } from './handlers/inventory';
import { createLASimulation, getLASimulations, getLASimulationById, getLASimulationsByUser } from './handlers/la_simulation';
import { getSalesTrends, getPackageDistribution, getUnpaidPilgrims, getDashboardStats } from './handlers/dashboard';
import { 
  getJournalReport, 
  getGeneralLedger, 
  getTrialBalance, 
  getIncomeStatement, 
  getBalanceSheet, 
  getCashFlow, 
  getTicketSalesReport 
} from './handlers/financial_reports';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  auth: router({
    login: publicProcedure
      .input(loginInputSchema)
      .mutation(({ input }) => login(input)),
    createUser: publicProcedure
      .input(createUserInputSchema)
      .mutation(({ input }) => createUser(input)),
    getUsers: publicProcedure
      .query(() => getUsers()),
  }),

  // Travel Identity / Settings
  travelIdentity: router({
    get: publicProcedure
      .query(() => getTravelIdentity()),
    update: publicProcedure
      .input(updateTravelIdentityInputSchema)
      .mutation(({ input }) => updateTravelIdentity(input)),
  }),

  // Dashboard
  dashboard: router({
    stats: publicProcedure
      .query(() => getDashboardStats()),
    salesTrends: publicProcedure
      .input(dateRangeFilterSchema)
      .query(({ input }) => getSalesTrends(input)),
    packageDistribution: publicProcedure
      .query(() => getPackageDistribution()),
    unpaidPilgrims: publicProcedure
      .query(() => getUnpaidPilgrims()),
  }),

  // Master Data - Pilgrims
  pilgrims: router({
    create: publicProcedure
      .input(createPilgrimInputSchema)
      .mutation(({ input }) => createPilgrim(input)),
    getAll: publicProcedure
      .query(() => getPilgrims()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getPilgrimById(input.id)),
    update: publicProcedure
      .input(z.object({ id: z.number() }).merge(createPilgrimInputSchema.partial()))
      .mutation(({ input }) => updatePilgrim(input.id, input)),
  }),

  // Master Data - Marketing Partners
  marketingPartners: router({
    create: publicProcedure
      .input(createMarketingPartnerInputSchema)
      .mutation(({ input }) => createMarketingPartner(input)),
    getAll: publicProcedure
      .query(() => getMarketingPartners()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getMarketingPartnerById(input.id)),
    update: publicProcedure
      .input(z.object({ id: z.number() }).merge(createMarketingPartnerInputSchema.partial()))
      .mutation(({ input }) => updateMarketingPartner(input.id, input)),
  }),

  // Master Data - Suppliers
  suppliers: router({
    create: publicProcedure
      .input(createSupplierInputSchema)
      .mutation(({ input }) => createSupplier(input)),
    getAll: publicProcedure
      .query(() => getSuppliers()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getSupplierById(input.id)),
  }),

  // Master Data - Banks
  banks: router({
    create: publicProcedure
      .input(createBankInputSchema)
      .mutation(({ input }) => createBank(input)),
    getAll: publicProcedure
      .query(() => getBanks()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getBankById(input.id)),
  }),

  // Master Data - Airlines
  airlines: router({
    create: publicProcedure
      .input(createAirlineInputSchema)
      .mutation(({ input }) => createAirline(input)),
    getAll: publicProcedure
      .query(() => getAirlines()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getAirlineById(input.id)),
  }),

  // Master Data - Facilities
  facilities: router({
    create: publicProcedure
      .input(createFacilityInputSchema)
      .mutation(({ input }) => createFacility(input)),
    getAll: publicProcedure
      .query(() => getFacilities()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getFacilityById(input.id)),
  }),

  // Master Data - Visit Cities
  visitCities: router({
    create: publicProcedure
      .input(createVisitCityInputSchema)
      .mutation(({ input }) => createVisitCity(input)),
    getAll: publicProcedure
      .query(() => getVisitCities()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getVisitCityById(input.id)),
  }),

  // Package Management - Package Types
  packageTypes: router({
    create: publicProcedure
      .input(createPackageTypeInputSchema)
      .mutation(({ input }) => createPackageType(input)),
    getAll: publicProcedure
      .query(() => getPackageTypes()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getPackageTypeById(input.id)),
  }),

  // Package Management - Packages
  packages: router({
    create: publicProcedure
      .input(createPackageInputSchema)
      .mutation(({ input }) => createPackage(input)),
    getAll: publicProcedure
      .query(() => getPackages()),
    getUmrah: publicProcedure
      .query(() => getUmrahPackages()),
    getHaji: publicProcedure
      .query(() => getHajiPackages()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getPackageById(input.id)),
  }),

  // Package Bookings
  packageBookings: router({
    create: publicProcedure
      .input(createPackageBookingInputSchema)
      .mutation(({ input }) => createPackageBooking(input)),
    getAll: publicProcedure
      .query(() => getPackageBookings()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getPackageBookingById(input.id)),
    updatePayment: publicProcedure
      .input(z.object({ id: z.number(), paymentAmount: z.number() }))
      .mutation(({ input }) => updateBookingPayment(input.id, input.paymentAmount)),
  }),

  // Accounting - Chart of Accounts
  chartOfAccounts: router({
    create: publicProcedure
      .input(createAccountInputSchema)
      .mutation(({ input }) => createAccount(input)),
    getAll: publicProcedure
      .query(() => getChartOfAccounts()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getAccountById(input.id)),
    updateBalance: publicProcedure
      .input(z.object({ id: z.number(), balance: z.number() }))
      .mutation(({ input }) => updateAccountBalance(input.id, input.balance)),
  }),

  // Accounting - Financial Transactions
  financialTransactions: router({
    create: publicProcedure
      .input(createTransactionInputSchema.extend({ userId: z.number() }))
      .mutation(({ input }) => createFinancialTransaction(input, input.userId)),
    getAll: publicProcedure
      .query(() => getFinancialTransactions()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getTransactionById(input.id)),
    getEntries: publicProcedure
      .input(z.object({ transactionId: z.number() }))
      .query(({ input }) => getTransactionEntries(input.transactionId)),
  }),

  // Inventory Management
  inventory: router({
    create: publicProcedure
      .input(createInventoryItemInputSchema)
      .mutation(({ input }) => createInventoryItem(input)),
    getAll: publicProcedure
      .query(() => getInventoryItems()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getInventoryItemById(input.id)),
    getLowStock: publicProcedure
      .query(() => getLowStockItems()),
    getSummary: publicProcedure
      .query(() => getInventorySummary()),
  }),

  // LA Simulation
  laSimulation: router({
    create: publicProcedure
      .input(createLASimulationInputSchema.extend({ userId: z.number() }))
      .mutation(({ input }) => createLASimulation(input, input.userId)),
    getAll: publicProcedure
      .query(() => getLASimulations()),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getLASimulationById(input.id)),
    getByUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(({ input }) => getLASimulationsByUser(input.userId)),
  }),

  // Financial Reports
  financialReports: router({
    journal: publicProcedure
      .input(dateRangeFilterSchema)
      .query(({ input }) => getJournalReport(input)),
    generalLedger: publicProcedure
      .input(z.object({ accountId: z.number() }).merge(dateRangeFilterSchema))
      .query(({ input }) => getGeneralLedger(input.accountId, input)),
    trialBalance: publicProcedure
      .input(dateRangeFilterSchema)
      .query(({ input }) => getTrialBalance(input)),
    incomeStatement: publicProcedure
      .input(dateRangeFilterSchema)
      .query(({ input }) => getIncomeStatement(input)),
    balanceSheet: publicProcedure
      .input(z.object({ asOfDate: z.coerce.date() }))
      .query(({ input }) => getBalanceSheet(input.asOfDate)),
    cashFlow: publicProcedure
      .input(dateRangeFilterSchema)
      .query(({ input }) => getCashFlow(input)),
    ticketSales: publicProcedure
      .input(dateRangeFilterSchema)
      .query(({ input }) => getTicketSalesReport(input)),
  }),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Haji & Umrah Travel Management TRPC server listening at port: ${port}`);
}

start();