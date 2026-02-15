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
 
type InputQuoteData = {
  id: number; // Unique identifier - not editable
  service_name: string;
  service_type_name: string;
  no_of_packages: string;
  chargeable_weight: string;
  pickup_date: string;
  delivery_date: string;
  category: "standard" | "express" | "dropoff";
  collection_post_code: string;
  collection_country_code: string;
  collection_city: string;
  delivery_post_code: string;
  delivery_country_code: string;
  delivery_city: string;
  quote_reference: string;
  customer_cost: string;
  franchise_cost: string;
  admin_cost: string;
  admin_markup: string;
  reseller_markup: string;
  fuel_surcharge: number;
  vat: number;
};
 
const Admin = () => {
  const [quotes, setQuotes] = useState<InputQuoteData[]>([]);
  const [backupQuotes, setBackupQuotes] = useState<InputQuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
 
  useEffect(() => {
    loadInputJson();
    ensureBackupExists();
  }, []);
 
  const loadInputJson = async () => {
    try {
      const res = await fetch("/input.json?v=" + Date.now());
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json() as InputQuoteData[];
      setQuotes(data);
      setBackupQuotes(JSON.parse(JSON.stringify(data))); // Deep copy for backup
      setHasChanges(false);
    } catch (e) {
      console.error("Failed to load input.json", e);
      toast({
        title: "Error loading input.json",
        description: "Could not read the input.json file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
 
  const ensureBackupExists = async () => {
    try {
      const backupRes = await fetch("/backup-input.json?v=" + Date.now());
      if (!backupRes.ok) {
        // Backup doesn't exist, create it from current input.json
        const inputRes = await fetch("/input.json?v=" + Date.now());
        if (inputRes.ok) {
          const inputData = await inputRes.json();
          // Download backup file
          const backupJsonString = JSON.stringify(inputData, null, 2);
          const backupBlob = new Blob([backupJsonString], { type: "application/json" });
          const backupUrl = URL.createObjectURL(backupBlob);
          const backupLink = document.createElement("a");
          backupLink.href = backupUrl;
          backupLink.download = "backup-input.json";
          document.body.appendChild(backupLink);
          backupLink.click();
          document.body.removeChild(backupLink);
          URL.revokeObjectURL(backupUrl);
        }
      }
    } catch (e) {
      console.error("Error checking backup", e);
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
       
        window.location.reload();
 
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
 
  const updateQuote = (id: number, field: keyof InputQuoteData, value: string | number) => {
    const updated = quotes.map(quote =>
      quote.id === id ? { ...quote, [field]: value } : quote
    );
    setQuotes(updated);
    setHasChanges(true);
  };
 
  const addQuote = () => {
    // Find the maximum ID and increment it
    const maxId = quotes.length > 0 ? Math.max(...quotes.map(q => q.id)) : 0;
    const newId = maxId + 1;
   
    const newQuote: InputQuoteData = {
      id: newId,
      service_name: "",
      service_type_name: "",
      no_of_packages: "1",
      chargeable_weight: "0",
      pickup_date: "",
      delivery_date: "",
      category: "standard",
      collection_post_code: "",
      collection_country_code: "",
      collection_city: "",
      delivery_post_code: "",
      delivery_country_code: "",
      delivery_city: "",
      quote_reference: `GB_DE_${new Date().toLocaleDateString('en-GB').replace(/\//g, '/')} ${new Date().toLocaleTimeString()}`,
      customer_cost: "0",
      franchise_cost: "0",
      admin_cost: "0",
      admin_markup: "0",
      reseller_markup: "0",
      fuel_surcharge: 0.0,
      vat: 0.0,
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
      const response = await fetch(API_ENDPOINTS.SAVE_INPUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotes),
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
                  {/* Basic Info */}
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
                          onChange={(e) => updateQuote(quote.id, "quote_reference", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`service-${quote.id}`}>Service Name</Label>
                        <Input
                          id={`service-${quote.id}`}
                          value={quote.service_name}
                          onChange={(e) => updateQuote(quote.id, "service_name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`type-${quote.id}`}>Service Type</Label>
                        <Input
                          id={`type-${quote.id}`}
                          value={quote.service_type_name}
                          onChange={(e) => updateQuote(quote.id, "service_type_name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`category-${quote.id}`}>Category</Label>
                        <Select
                          value={quote.category}
                          onValueChange={(value) => updateQuote(quote.id, "category", value as InputQuoteData["category"])}
                        >
                          <SelectTrigger id={`category-${quote.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="express">Express</SelectItem>
                            <SelectItem value="dropoff">Drop Off</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`packages-${quote.id}`}>No. of Packages</Label>
                        <Input
                          id={`packages-${quote.id}`}
                          value={quote.no_of_packages}
                          onChange={(e) => updateQuote(quote.id, "no_of_packages", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`weight-${quote.id}`}>Chargeable Weight</Label>
                        <Input
                          id={`weight-${quote.id}`}
                          value={quote.chargeable_weight}
                          onChange={(e) => updateQuote(quote.id, "chargeable_weight", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
 
                  {/* Collection & Delivery */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Collection & Delivery
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`collection-country-${quote.id}`}>Collection Country Code</Label>
                        <Input
                          id={`collection-country-${quote.id}`}
                          value={quote.collection_country_code}
                          onChange={(e) => updateQuote(quote.id, "collection_country_code", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`collection-city-${quote.id}`}>Collection City</Label>
                        <Input
                          id={`collection-city-${quote.id}`}
                          value={quote.collection_city}
                          onChange={(e) => updateQuote(quote.id, "collection_city", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`collection-post-${quote.id}`}>Collection Post Code</Label>
                        <Input
                          id={`collection-post-${quote.id}`}
                          value={quote.collection_post_code}
                          onChange={(e) => updateQuote(quote.id, "collection_post_code", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`delivery-country-${quote.id}`}>Delivery Country Code</Label>
                        <Input
                          id={`delivery-country-${quote.id}`}
                          value={quote.delivery_country_code}
                          onChange={(e) => updateQuote(quote.id, "delivery_country_code", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`delivery-city-${quote.id}`}>Delivery City</Label>
                        <Input
                          id={`delivery-city-${quote.id}`}
                          value={quote.delivery_city}
                          onChange={(e) => updateQuote(quote.id, "delivery_city", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`delivery-post-${quote.id}`}>Delivery Post Code</Label>
                        <Input
                          id={`delivery-post-${quote.id}`}
                          value={quote.delivery_post_code}
                          onChange={(e) => updateQuote(quote.id, "delivery_post_code", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
 
                  {/* Pricing & Dates */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Pricing & Dates
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`customer-cost-${quote.id}`}>Customer Cost</Label>
                        <Input
                          id={`customer-cost-${quote.id}`}
                          value={quote.customer_cost}
                          onChange={(e) => updateQuote(quote.id, "customer_cost", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`franchise-cost-${quote.id}`}>Franchise Cost</Label>
                        <Input
                          id={`franchise-cost-${quote.id}`}
                          value={quote.franchise_cost}
                          onChange={(e) => updateQuote(quote.id, "franchise_cost", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`admin-cost-${quote.id}`}>Admin Cost</Label>
                        <Input
                          id={`admin-cost-${quote.id}`}
                          value={quote.admin_cost}
                          onChange={(e) => updateQuote(quote.id, "admin_cost", e.target.value)}
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
                        <Label htmlFor={`reseller-markup-${quote.id}`}>Reseller Markup</Label>
                        <Input
                          id={`reseller-markup-${quote.id}`}
                          value={quote.reseller_markup}
                          onChange={(e) => updateQuote(quote.id, "reseller_markup", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`fuel-${quote.id}`}>Fuel Surcharge</Label>
                        <Input
                          id={`fuel-${quote.id}`}
                          type="number"
                          step="0.01"
                          value={quote.fuel_surcharge}
                          onChange={(e) => updateQuote(quote.id, "fuel_surcharge", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`vat-${quote.id}`}>VAT</Label>
                        <Input
                          id={`vat-${quote.id}`}
                          type="number"
                          step="0.01"
                          value={quote.vat}
                          onChange={(e) => updateQuote(quote.id, "vat", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`pickup-${quote.id}`}>Pickup Date</Label>
                        <Input
                          id={`pickup-${quote.id}`}
                          value={quote.pickup_date}
                          onChange={(e) => updateQuote(quote.id, "pickup_date", e.target.value)}
                          placeholder="Mon, 09 Feb 2026\n16:00"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`delivery-${quote.id}`}>Delivery Date</Label>
                        <Input
                          id={`delivery-${quote.id}`}
                          value={quote.delivery_date}
                          onChange={(e) => updateQuote(quote.id, "delivery_date", e.target.value)}
                          placeholder="Thu, 12 Feb 2026\nEnd of business day\n23:30"
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
 