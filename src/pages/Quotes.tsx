import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
// import * as XLSX from "xlsx"; // Kept for future CSV support if needed
import Navbar from "@/components/Navbar";
import QuoteCard from "@/components/QuoteCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  EXPECTED_QUOTE_KEYS,
  EXPECTED_PRICING_KEYS,
  type ServiceQuote,
} from "@/data/mockQuotes";
import { toast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";

const categories = [
  { key: "standard" as const, label: "Economy and Standard" },
  { key: "express" as const, label: "Express & Timed" },
  { key: "dropoff" as const, label: "Drop Off" },
];

/** Extract just the date part (e.g., "Thu, 12 Feb 2026") from date strings */
function extractDateOnly(dateString: string): string {
  if (!dateString) return "";
  
  // Remove HTML tags
  let cleaned = dateString.replace(/<[^>]*>/g, "");
  
  // Split by newlines or <br> tags and get the first part
  const parts = cleaned.split(/\n|<br\s*\/?>/i).map(p => p.trim()).filter(Boolean);
  
  // Find the first part that matches date format (e.g., "Thu, 12 Feb 2026" or "Mon, 09 Feb 2026")
  const dateMatch = parts.find(part => /^[A-Za-z]{3},\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}/.test(part));
  
  return dateMatch || parts[0] || dateString;
}

function parseRow(row: Record<string, unknown>): ServiceQuote {
  // Handle API response format - API returns customer_cost which maps to optimized_customer_cost
  // Support both formats: new API format (customer_cost) and old format (optimized_customer_cost)
  const optimizedCost = Number(row.optimized_customer_cost ?? row.customer_cost ?? 0);
  const fuelSurcharge = Number(row.fuel_surcharge ?? 0);
  const vat = Number(row.vat ?? 0);
  
  // Calculate total: total = optimized_customer_cost + fuel_surcharge + vat
  const total = Number(row.total ?? (optimizedCost + fuelSurcharge + vat));
  
  // Generate ID if not present (use quote_reference or create one)
  const id = String(row.id ?? row.quote_reference ?? `${row.service_name}-${row.service_type_name}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Map old base price: API may return admin_cost or franchise_cost as the base
  // Use admin_cost as old_base_price if available, otherwise franchise_cost
  const oldBasePrice = Number(row.old_base_price ?? row.customer_cost ?? row.admin_cost ?? row.franchise_cost ?? 0);
  
  // Calculate increased profit: difference between optimized cost and old base price
  const increasedProfit = Number(row.increased_profit ?? (optimizedCost - oldBasePrice));

  // Extract clean date strings (only "Thu, 12 Feb 2026" format)
  const pickupDateRaw = String(row.pickup_date ?? "");
  const deliveryDateRaw = String(row.delivery_date ?? "");

  return {
    id: id,
    provider: String(row.service_name ?? ""),
    serviceType: String(row.service_type_name ?? ""),
    category: String(row.category ?? "standard") as ServiceQuote["category"],
    pricing: {
      basePrice: optimizedCost,
      fuelSurcharge: fuelSurcharge,
      vat: vat,
    },
    totalPrice: total,
    pickupDate: extractDateOnly(pickupDateRaw),
    estimatedDelivery: extractDateOnly(deliveryDateRaw),
    oldBasePrice: oldBasePrice,
    increasedProfit: increasedProfit,
  };
}

function validateSchema(quotes: ServiceQuote[]) {
  for (const q of quotes) {
    const keys = Object.keys(q) as (keyof ServiceQuote)[];
    const missing = EXPECTED_QUOTE_KEYS.filter((k) => !keys.includes(k));
    if (missing.length) return `Missing keys: ${missing.join(", ")}`;

    const pKeys = Object.keys(q.pricing) as (keyof typeof q.pricing)[];
    const pMissing = EXPECTED_PRICING_KEYS.filter((k) => !pKeys.includes(k));
    if (pMissing.length) return `Missing pricing keys: ${pMissing.join(", ")}`;
  }
  return null;
}

type SearchCriteria = {
  fromCountry: string;
  fromCity: string;
  fromPostCode: string;
  toCountry: string;
  toCity: string;
  toPostCode: string;
  weight: number;
  width: number;
  length: number;
  height: number;
};

type NavigationState = {
  searchCriteria?: SearchCriteria;
  quotesResponse?: unknown;
};

const Quotes = () => {
  const location = useLocation();
  const navigationState = location.state as NavigationState | null;
  const searchCriteria = navigationState?.searchCriteria || null;
  const [quotes, setQuotes] = useState<ServiceQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuotes() {
      try {
        let quotesArray: Record<string, unknown>[] = [];

        // If quotes were already fetched from Index page, use them
        if (navigationState?.quotesResponse) {
          const responseData = navigationState.quotesResponse;
          
          // Handle both array response and object with data property
          if (Array.isArray(responseData)) {
            quotesArray = responseData;
          } else if (typeof responseData === 'object' && responseData !== null) {
            const data = responseData as { data?: unknown[]; quotes?: unknown[] };
            if (Array.isArray(data.data)) {
              quotesArray = data.data as Record<string, unknown>[];
            } else if (Array.isArray(data.quotes)) {
              quotesArray = data.quotes as Record<string, unknown>[];
            } else {
              throw new Error("Invalid API response format");
            }
          } else {
            throw new Error("Invalid API response format");
          }
        } else {
          // Fallback: Call API endpoint if quotes weren't passed from Index page
          const res = await fetch(API_ENDPOINTS.QUOTES, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }

          const responseData = await res.json() as Record<string, unknown>[] | { data?: Record<string, unknown>[]; quotes?: Record<string, unknown>[] };
          
          // Handle both array response and object with data property
          if (Array.isArray(responseData)) {
            quotesArray = responseData;
          } else if ('data' in responseData && Array.isArray(responseData.data)) {
            quotesArray = responseData.data;
          } else if ('quotes' in responseData && Array.isArray(responseData.quotes)) {
            quotesArray = responseData.quotes;
          } else {
            throw new Error("Invalid API response format");
          }
        }

        const parsed = quotesArray.map(parseRow);

        const err = validateSchema(parsed);
        if (err) {
          toast({
            title: "⚠️ Admin: Schema Deviation Detected",
            description: err,
            variant: "destructive",
          });
        }

        setQuotes(parsed);
      } catch (e) {
        console.error("Failed to load quotes from API", e);
        toast({
          title: "Error loading quotes",
          description: e instanceof Error ? e.message : "Could not fetch quotes from the API. Please check your API endpoint configuration.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadQuotes();
  }, [navigationState]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              Shipping Quotes
            </h1>
            <p className="text-sm text-muted-foreground">
              Compare services and choose the best option
            </p>
          </div>
        </div>

        {searchCriteria && (
          <Card className="mb-8 border-border/50">
            <CardContent className="pt-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* From Address */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    From Address
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Country:</span> {searchCriteria.fromCountry}</p>
                    <p><span className="font-medium">City:</span> {searchCriteria.fromCity}</p>
                    <p><span className="font-medium">Post Code:</span> {searchCriteria.fromPostCode}</p>
                  </div>
                </div>

                {/* To Address */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    To Address
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Country:</span> {searchCriteria.toCountry}</p>
                    <p><span className="font-medium">City:</span> {searchCriteria.toCity}</p>
                    <p><span className="font-medium">Post Code:</span> {searchCriteria.toPostCode}</p>
                  </div>
                </div>

                {/* Parcel Dimensions */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Parcel Dimensions
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Weight:</span> {searchCriteria.weight} kg</p>
                    <p><span className="font-medium">Width:</span> {searchCriteria.width} cm</p>
                    <p><span className="font-medium">Length:</span> {searchCriteria.length} cm</p>
                    <p><span className="font-medium">Height:</span> {searchCriteria.height} cm</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground">Loading quotes…</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {categories.map((cat) => (
              <section key={cat.key}>
                <h2 className="mb-4 border-b-2 border-secondary pb-2 text-lg font-bold uppercase tracking-wider text-primary">
                  {cat.label}
                </h2>
                <div className="space-y-4">
                  {quotes
                    .filter((q) => q.category === cat.key)
                    .map((q) => (
                      <QuoteCard key={q.id} quote={q} />
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Quotes;
