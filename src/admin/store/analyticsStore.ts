import { create } from "zustand";
import type {
  TimeRange,
  ActiveUsersData, RegistrationsData, RevenueData, OrdersTimePoint,
  QualityData, FunnelStep, ErrorsData, MarketplaceData, SupplyDemandData,
  ActivityEvent, TopServicesData, RetentionData, LTVData, BusinessKPIsData,
} from "../lib/analyticsQueries";
import {
  getStartDate,
  queryActiveUsers, queryRegistrations, queryRevenue, queryOrdersOverTime,
  queryQuality, queryFunnel, queryErrors, queryMarketplace, querySupplyDemand,
  queryActivityFeed, queryTopServices, queryRetention, queryLTV, queryBusinessKPIs,
} from "../lib/analyticsQueries";

interface AnalyticsState {
  timeRange: TimeRange;
  isLoading: boolean;

  activeUsers:    ActiveUsersData | null;
  registrations:  RegistrationsData | null;
  revenue:        RevenueData | null;
  ordersOverTime: OrdersTimePoint[];
  quality:        QualityData | null;
  funnel:         FunnelStep[];
  errors:         ErrorsData | null;
  marketplace:    MarketplaceData | null;
  supplyDemand:   SupplyDemandData | null;
  activityFeed:   ActivityEvent[];
  topServices:    TopServicesData | null;
  retention:      RetentionData | null;
  ltv:            LTVData | null;
  businessKPIs:   BusinessKPIsData | null;

  setTimeRange: (range: TimeRange) => void;
  loadAll: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  timeRange: "30d",
  isLoading: false,

  activeUsers:    null,
  registrations:  null,
  revenue:        null,
  ordersOverTime: [],
  quality:        null,
  funnel:         [],
  errors:         null,
  marketplace:    null,
  supplyDemand:   null,
  activityFeed:   [],
  topServices:    null,
  retention:      null,
  ltv:            null,
  businessKPIs:   null,

  setTimeRange: (range) => {
    set({ timeRange: range });
    get().loadAll();
  },

  loadAll: async () => {
    set({ isLoading: true });
    const startDate = getStartDate(get().timeRange);

    const [
      activeUsers, registrations, revenue, ordersOverTime, quality,
      funnel, errors, marketplace, supplyDemand, activityFeed,
      topServices, retention, ltv, businessKPIs,
    ] = await Promise.all([
      queryActiveUsers(startDate).catch(() => null),
      queryRegistrations(startDate).catch(() => null),
      queryRevenue(startDate).catch(() => null),
      queryOrdersOverTime(startDate).catch(() => []),
      queryQuality(startDate).catch(() => null),
      queryFunnel(startDate).catch(() => []),
      queryErrors(startDate).catch(() => null),
      queryMarketplace(startDate).catch(() => null),
      querySupplyDemand().catch(() => null),
      queryActivityFeed().catch(() => []),
      queryTopServices(startDate).catch(() => null),
      queryRetention(startDate).catch(() => null),
      queryLTV().catch(() => null),
      queryBusinessKPIs(startDate, get().timeRange).catch(() => null),
    ]);

    set({
      isLoading: false,
      activeUsers:    activeUsers    ?? null,
      registrations:  registrations  ?? null,
      revenue:        revenue        ?? null,
      ordersOverTime: ordersOverTime ?? [],
      quality:        quality        ?? null,
      funnel:         funnel         ?? [],
      errors:         errors         ?? null,
      marketplace:    marketplace    ?? null,
      supplyDemand:   supplyDemand   ?? null,
      activityFeed:   activityFeed   ?? [],
      topServices:    topServices    ?? null,
      retention:      retention      ?? null,
      ltv:            ltv            ?? null,
      businessKPIs:   businessKPIs   ?? null,
    });
  },
}));
