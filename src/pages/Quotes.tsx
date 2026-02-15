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

function parseRow(row: Record<string, unknown>): ServiceQuote {
  return {
    id: String(row.id ?? ""),
    provider: String(row.service_name ?? ""),
    serviceType: String(row.service_type_name ?? ""),
    category: String(row.category ?? "standard") as ServiceQuote["category"],
    pricing: {
      basePrice: Number(row.optimized_customer_cost ?? 0),
      fuelSurcharge: Number(row.fuel_surcharge ?? 0),
      vat: Number(row.vat ?? 0),
    },
    totalPrice: Number(row.total ?? 0),
    pickupDate: String(row.pickup_date ?? ""),
    estimatedDelivery: String(row.delivery_date ?? ""),
    oldBasePrice: Number(row.customer_cost ?? 0),
    increasedProfit: Number(row.increased_profit ?? 0),
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

const Quotes = () => {
  const location = useLocation();
  const searchCriteria = location.state as SearchCriteria | null;
  const [quotes, setQuotes] = useState<ServiceQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuotes() {
      try {
        // Build API URL with query parameters if search criteria is available
        let apiUrl: string = API_ENDPOINTS.QUOTES;
        if (searchCriteria) {
          const params = new URLSearchParams({
            fromCountry: searchCriteria.fromCountry,
            fromCity: searchCriteria.fromCity,
            fromPostCode: searchCriteria.fromPostCode,
            toCountry: searchCriteria.toCountry,
            toCity: searchCriteria.toCity,
            toPostCode: searchCriteria.toPostCode,
            weight: searchCriteria.weight.toString(),
            width: searchCriteria.width.toString(),
            length: searchCriteria.length.toString(),
            height: searchCriteria.height.toString(),
          });
          apiUrl = `${API_ENDPOINTS.QUOTES}?${params.toString()}`;
        }

        // Call API endpoint to fetch quotes
        const res = await fetch(apiUrl, {
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
        let quotesArray: Record<string, unknown>[];
        if (Array.isArray(responseData)) {
          quotesArray = responseData;
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          quotesArray = responseData.data;
        } else if ('quotes' in responseData && Array.isArray(responseData.quotes)) {
          quotesArray = responseData.quotes;
        } else {
          throw new Error("Invalid API response format");
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
  }, [searchCriteria]);

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
              <h2 className="mb-4 text-lg font-semibold text-primary">Search Criteria</h2>
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
