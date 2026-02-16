export interface QuoteBreakdown {
  basePrice: number;
  fuelSurcharge: number;
  vat: number;
}

export interface ServiceQuote {
  id: string;
  provider: string;
  serviceType: string;
  category: "standard" | "express" | "dropoff";
  pricing: QuoteBreakdown;
  totalPrice: number;
  pickupDate: string;
  estimatedDelivery: string;
  oldBasePrice: number;
  increasedProfit: number;
  oldFuelSurcharge: number;
  oldVat: number;
  oldTotal: number;
}

// Expected schema keys for admin monitoring
export const EXPECTED_QUOTE_KEYS: (keyof ServiceQuote)[] = [
  "id", "provider", "serviceType", "category",
  "pricing", "totalPrice", "pickupDate", "estimatedDelivery",
  "oldBasePrice", "increasedProfit", "oldFuelSurcharge", "oldVat", "oldTotal",
];

export const EXPECTED_PRICING_KEYS: (keyof QuoteBreakdown)[] = [
  "basePrice", "fuelSurcharge", "vat",
];

export const mockQuotes: ServiceQuote[] = [
  // Standard
  {
    id: "std-1",
    provider: "DHL",
    serviceType: "Ground",
    category: "standard",
    pricing: { basePrice: 8.50, fuelSurcharge: 1.20, vat: 1.94 },
    totalPrice: 11.64,
    pickupDate: "2026-02-12",
    estimatedDelivery: "2026-02-17",
    oldBasePrice: 7.00,
    increasedProfit: 1.50,
    oldFuelSurcharge: 1.00,
    oldVat: 1.60,
    oldTotal: 9.60,
  },
  {
    id: "std-2",
    provider: "FedEx",
    serviceType: "Home Delivery",
    category: "standard",
    pricing: { basePrice: 9.00, fuelSurcharge: 1.50, vat: 2.10 },
    totalPrice: 12.60,
    pickupDate: "2026-02-12",
    estimatedDelivery: "2026-02-18",
    oldBasePrice: 7.50,
    increasedProfit: 1.50,
    oldFuelSurcharge: 1.20,
    oldVat: 1.75,
    oldTotal: 10.45,
  },
  {
    id: "std-3",
    provider: "UPS",
    serviceType: "Ground",
    category: "standard",
    pricing: { basePrice: 7.80, fuelSurcharge: 1.10, vat: 1.78 },
    totalPrice: 10.68,
    pickupDate: "2026-02-12",
    estimatedDelivery: "2026-02-19",
    oldBasePrice: 6.50,
    increasedProfit: 1.30,
    oldFuelSurcharge: 0.90,
    oldVat: 1.48,
    oldTotal: 8.88,
  },
  // Express
  {
    id: "exp-1",
    provider: "DHL",
    serviceType: "Overnight",
    category: "express",
    pricing: { basePrice: 22.00, fuelSurcharge: 3.50, vat: 5.10 },
    totalPrice: 30.60,
    pickupDate: "2026-02-11",
    estimatedDelivery: "2026-02-12",
    oldBasePrice: 18.00,
    increasedProfit: 4.00,
    oldFuelSurcharge: 2.80,
    oldVat: 4.18,
    oldTotal: 24.98,
  },
  {
    id: "exp-2",
    provider: "FedEx",
    serviceType: "Priority",
    category: "express",
    pricing: { basePrice: 25.00, fuelSurcharge: 4.00, vat: 5.80 },
    totalPrice: 34.80,
    pickupDate: "2026-02-11",
    estimatedDelivery: "2026-02-12",
    oldBasePrice: 20.00,
    increasedProfit: 5.00,
    oldFuelSurcharge: 3.20,
    oldVat: 4.64,
    oldTotal: 27.84,
  },
  {
    id: "exp-3",
    provider: "UPS",
    serviceType: "Next Day Air",
    category: "express",
    pricing: { basePrice: 24.00, fuelSurcharge: 3.80, vat: 5.56 },
    totalPrice: 33.36,
    pickupDate: "2026-02-11",
    estimatedDelivery: "2026-02-12",
    oldBasePrice: 19.50,
    increasedProfit: 4.50,
    oldFuelSurcharge: 3.04,
    oldVat: 4.51,
    oldTotal: 27.05,
  },
  // Drop Off
  {
    id: "drop-1",
    provider: "DHL",
    serviceType: "ServicePoint",
    category: "dropoff",
    pricing: { basePrice: 5.50, fuelSurcharge: 0.80, vat: 1.26 },
    totalPrice: 7.56,
    pickupDate: "2026-02-12",
    estimatedDelivery: "2026-02-16",
    oldBasePrice: 4.50,
    increasedProfit: 1.00,
    oldFuelSurcharge: 0.64,
    oldVat: 1.03,
    oldTotal: 6.17,
  },
  {
    id: "drop-2",
    provider: "UPS",
    serviceType: "Access Point",
    category: "dropoff",
    pricing: { basePrice: 6.00, fuelSurcharge: 0.90, vat: 1.38 },
    totalPrice: 8.28,
    pickupDate: "2026-02-12",
    estimatedDelivery: "2026-02-17",
    oldBasePrice: 5.00,
    increasedProfit: 1.00,
    oldFuelSurcharge: 0.72,
    oldVat: 1.15,
    oldTotal: 6.87,
  },
  {
    id: "drop-3",
    provider: "FedEx",
    serviceType: "Drop Box",
    category: "dropoff",
    pricing: { basePrice: 5.80, fuelSurcharge: 0.85, vat: 1.33 },
    totalPrice: 7.98,
    pickupDate: "2026-02-12",
    estimatedDelivery: "2026-02-16",
    oldBasePrice: 4.80,
    increasedProfit: 1.00,
    oldFuelSurcharge: 0.68,
    oldVat: 1.10,
    oldTotal: 6.58,
  },
];
