import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, RotateCcw } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/config/api";
 
// Search criteria fields (read-only, from Index page)
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

// API response fields (editable)
type InputQuoteData = {
  id: number; // Unique identifier - not editable
  quote_reference: string;
  service_name: string;
  service_type_name: string;
  category: "standard" | "express" | "dropoff";
  customer_cost: string;
  franchise_cost: string;
  admin_cost: string;
  pickup_date: string;
  delivery_date: string;
  admin_markup: string;
  franchise_markup: string;
  fuel_surcharge: number;
  vat: number;
  fuel_franchise_cost?: number;
  fuel_admin_cost?: number;
  // Search criteria (read-only, displayed but not saved)
  searchCriteria?: SearchCriteria;
};
 
const Admin = () => {
  const [quotes, setQuotes] = useState<InputQuoteData[]>([]);
  const [backupQuotes, setBackupQuotes] = useState<InputQuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  // Default search criteria (can be updated if needed)
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    fromCountry: "GB",
    fromCity: "East Sussex",
    fromPostCode: "BN27 4BN",
    toCountry: "DE",
    toCity: "Karlsruhe",
    toPostCode: "76131",
    weight: 6,
    width: 35,
    length: 25,
    height: 25,
  });
 
  useEffect(() => {
    loadQuotesFromAPI();

  }, []);

  const loadQuotesFromAPI = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_QUOTES_DATA, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as InputQuoteData[];
      // Add search criteria to each quote if not present
      const quotesWithSearchCriteria = data.map(quote => ({
        ...quote,
        searchCriteria: quote.searchCriteria || searchCriteria,
      }));
      setQuotes(quotesWithSearchCriteria);
      setBackupQuotes(JSON.parse(JSON.stringify(quotesWithSearchCriteria))); // Deep copy for backup
      setHasChanges(false);
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
  };

  const resetFromBackup = async () => {
    if (confirm("Are you sure you want to reset? This will restore input.json from backup-input.json and discard all unsaved changes.")) {
      try {
        const response = await fetch(API_ENDPOINTS.RESET_INPUT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
 
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
 
        const result = await response.json();
       
        loadQuotesFromAPI();
 
        toast({
          title: "Reset Successful",
          description: result.message || "input.json has been restored from backup-input.json.",
        });
      } catch (error) {
        console.error("Failed to reset input.json", error);
        toast({
          title: "Error resetting file",
          description: error instanceof Error ? error.message : "Could not reset input.json. Make sure the server is running and backup-input.json exists.",
          variant: "destructive",
        });
      }
    }
  };
 
  // Helper function to calculate derived fields based on markups
  const calculateDerivedFields = (quote: InputQuoteData) => {
    const adminCost = parseFloat(String(quote.admin_cost)) || 0;
    const fuelAdminCost = quote.fuel_admin_cost ? parseFloat(String(quote.fuel_admin_cost)) : 0;
    const adminMarkup = parseFloat(String(quote.admin_markup)) || 0;
    const franchiseMarkup = parseFloat(String(quote.franchise_markup)) || 0;
    
    console.log('Input values:', { adminCost, fuelAdminCost, adminMarkup, franchiseMarkup });
    
    // Calculate franchise_cost and fuel_franchise_cost (admin_markup applied)
    const franchiseCost = adminCost * (1 + adminMarkup / 100);
    const fuelFranchiseCost = fuelAdminCost * (1 + adminMarkup / 100);
    
    // Calculate customer_cost and fuel_surcharge (both markups applied sequentially)
    const customerCost = adminCost * (1 + adminMarkup / 100) * (1 + franchiseMarkup / 100);
    const fuelSurcharge = fuelAdminCost * (1 + adminMarkup / 100) * (1 + franchiseMarkup / 100);
    
    const result = {
      franchise_cost: Math.round(franchiseCost * 100) / 100,
      fuel_franchise_cost: Math.round(fuelFranchiseCost * 100) / 100,
      customer_cost: Math.round(customerCost * 100) / 100,
      fuel_surcharge: Math.round(fuelSurcharge * 100) / 100,
    };
    
    console.log('Calculated results:', result);
    
    return result;
  };

  const updateQuote = (id: number, field: keyof InputQuoteData, value: string | number) => {
    console.log('updateQuote called:', { id, field, value });
    const updated = quotes.map(quote => {
      if (quote.id === id) {
        const updatedQuote = { ...quote, [field]: value };
        
        // If admin_markup or franchise_markup changed, recalculate derived fields
        if (field === 'admin_markup' || field === 'franchise_markup') {
          console.log('Markup changed, recalculating...');
          const derivedFields = calculateDerivedFields(updatedQuote);
          console.log('Calculated derived fields:', derivedFields);
          const result = {
            ...updatedQuote,
            franchise_cost: derivedFields.franchise_cost.toFixed(2),
            fuel_franchise_cost: derivedFields.fuel_franchise_cost,
            customer_cost: derivedFields.customer_cost.toFixed(2),
            fuel_surcharge: derivedFields.fuel_surcharge,
          };
          console.log('Updated quote:', result);
          return result;
        }
        
        return updatedQuote;
      }
      return quote;
    });
    console.log('Setting updated quotes:', updated);
    setQuotes(updated);
    setHasChanges(true);
  };
 
  const addQuote = () => {
    // Find the maximum ID and increment it
    const maxId = quotes.length > 0 ? Math.max(...quotes.map(q => q.id)) : 0;
    const newId = maxId + 1;
   
    const newQuote: InputQuoteData = {
      id: newId,
      quote_reference: `GB_DE_${new Date().toLocaleDateString('en-GB').replace(/\//g, '/')} ${new Date().toLocaleTimeString()}`,
      service_name: "",
      service_type_name: "",
      category: "standard",
      customer_cost: "0",
      franchise_cost: "0",
      admin_cost: "0",
      pickup_date: "",
      delivery_date: "",
      admin_markup: "0",
      franchise_markup: "0",
      fuel_surcharge: 0.0,
      vat: 0.0,
      searchCriteria: searchCriteria,
    };
    setQuotes([...quotes, newQuote]);
    setHasChanges(true);
  };
 
  const deleteQuote = (id: number) => {
    if (confirm("Are you sure you want to delete this quote?")) {
      const updated = quotes.filter(q => q.id !== id);
      setQuotes(updated);
      setHasChanges(true);
    }
  };
 
  const saveInputJson = async () => {
    try {
      // Only send API response fields, exclude searchCriteria
      const quotesToSave = quotes.map(({ searchCriteria, ...quote }) => quote);
      
      const response = await fetch(API_ENDPOINTS.SAVE_INPUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotesToSave),
      });
 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
 
      const result = await response.json();
     
      // Update backup to current saved state (for next save)
      setBackupQuotes(JSON.parse(JSON.stringify(quotes)));
      setHasChanges(false);
 
      toast({
        title: "Saved Successfully",
        description: result.message || "input.json has been saved successfully.",
      });
    } catch (error) {
      console.error("Failed to save input.json", error);
      toast({
        title: "Error saving file",
        description: error instanceof Error ? error.message : "Could not save input.json. Make sure the server is running.",
        variant: "destructive",
      });
    }
  };
 
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
          <p className="text-center text-muted-foreground">Loading input.json…</p>
        </main>
      </div>
    );
  }
 
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
 
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-primary">
                Admin Panel - Input Data
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage input.json data (used as API payload)
              </p>
            </div>
          </div>
 
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetFromBackup}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={addQuote}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Quote
            </Button>
            <Button
              onClick={saveInputJson}
              className="gap-2"
              disabled={!hasChanges}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
 
        {hasChanges && (
          <Card className="mb-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                    You have unsaved changes
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Click "Save" to download the updated input.json and backup-input.json files, then replace them in the public folder.
                  </p>
                </div>
                <Button onClick={saveInputJson} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
 
        <div className="space-y-6">
          {quotes.map((quote) => (
            <Card key={quote.id} className="border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Quote ID: {quote.id} - {quote.service_name || "New Quote"}
                    </CardTitle>
                    <CardDescription>Reference: {quote.quote_reference}</CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteQuote(quote.id)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {/* Search Criteria (Read-Only) */}
                  {quote.searchCriteria && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Search Criteria (Read-Only)
                      </h3>
                      <div className="space-y-3 rounded-md bg-muted/30 p-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">From Country</Label>
                          <Input
                            value={quote.searchCriteria.fromCountry}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">From City</Label>
                          <Input
                            value={quote.searchCriteria.fromCity}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">From Post Code</Label>
                          <Input
                            value={quote.searchCriteria.fromPostCode}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">To Country</Label>
                          <Input
                            value={quote.searchCriteria.toCountry}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">To City</Label>
                          <Input
                            value={quote.searchCriteria.toCity}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">To Post Code</Label>
                          <Input
                            value={quote.searchCriteria.toPostCode}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
                          <Input
                            type="number"
                            value={quote.searchCriteria.weight}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Width (cm)</Label>
                          <Input
                            type="number"
                            value={quote.searchCriteria.width}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Length (cm)</Label>
                          <Input
                            type="number"
                            value={quote.searchCriteria.length}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Height (cm)</Label>
                          <Input
                            type="number"
                            value={quote.searchCriteria.height}
                            readOnly
                            className="bg-muted/50 cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* API Response Fields - Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Basic Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`id-${quote.id}`}>ID (Read Only)</Label>
                        <Input
                          id={`id-${quote.id}`}
                          type="number"
                          value={quote.id}
                          readOnly
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`quote-ref-${quote.id}`}>Quote Reference</Label>
                        <Input
                          id={`quote-ref-${quote.id}`}
                          value={quote.quote_reference}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`service-${quote.id}`}>Service Name</Label>
                        <Input
                          id={`service-${quote.id}`}
                          value={quote.service_name}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`type-${quote.id}`}>Service Type</Label>
                        <Input
                          id={`type-${quote.id}`}
                          value={quote.service_type_name}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`category-${quote.id}`}>Category</Label>
                        <Input
                          id={`category-${quote.id}`}
                          value={quote.category}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`pickup-${quote.id}`}>Pickup Date</Label>
                        <Input
                          id={`pickup-${quote.id}`}
                          value={quote.pickup_date}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                          placeholder="Mon, 09 Feb 2026\n16:00"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`delivery-${quote.id}`}>Delivery Date</Label>
                        <Input
                          id={`delivery-${quote.id}`}
                          value={quote.delivery_date}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                          placeholder="Thu, 12 Feb 2026\nEnd of business day\n23:30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* API Response Fields - Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Pricing
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`customer-cost-${quote.id}`}>Customer Cost</Label>
                        <Input
                          id={`customer-cost-${quote.id}`}
                          value={quote.customer_cost}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`franchise-cost-${quote.id}`}>Franchise Cost</Label>
                        <Input
                          id={`franchise-cost-${quote.id}`}
                          value={quote.franchise_cost}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`admin-cost-${quote.id}`}>Admin Cost</Label>
                        <Input
                          id={`admin-cost-${quote.id}`}
                          value={quote.admin_cost}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`admin-markup-${quote.id}`}>Admin Markup</Label>
                        <Input
                          id={`admin-markup-${quote.id}`}
                          value={quote.admin_markup}
                          onChange={(e) => updateQuote(quote.id, "admin_markup", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`franchise-markup-${quote.id}`}>Franchise Markup</Label>
                        <Input
                          id={`franchise-markup-${quote.id}`}
                          value={quote.franchise_markup}
                          onChange={(e) => updateQuote(quote.id, "franchise_markup", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`fuel-${quote.id}`}>Fuel Surcharge</Label>
                        <Input
                          id={`fuel-${quote.id}`}
                          type="number"
                          step="0.01"
                          value={quote.fuel_surcharge}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`fuel-franchise-cost-${quote.id}`}>Fuel Franchise Cost</Label>
                        <Input
                          id={`fuel-franchise-cost-${quote.id}`}
                          type="number"
                          step="0.01"
                          value={quote.fuel_franchise_cost ?? 0}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`fuel-admin-cost-${quote.id}`}>Fuel Admin Cost</Label>
                        <Input
                          id={`fuel-admin-cost-${quote.id}`}
                          type="number"
                          step="0.01"
                          value={quote.fuel_admin_cost ?? 0}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`vat-${quote.id}`}>VAT</Label>
                        <Input
                          id={`vat-${quote.id}`}
                          type="number"
                          step="0.01"
                          value={quote.vat}
                          readOnly
                          className="bg-muted/50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
 
        {quotes.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No quotes found. Click "Add Quote" to create one.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};
 
export default Admin;
 