import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Save, Download, Upload, Plus, Trash2 } from "lucide-react";
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

type QuoteData = {
  id: string;
  service_name: string;
  service_type_name: string;
  category: "standard" | "express" | "dropoff";
  optimized_customer_cost: number;
  fuel_surcharge: number;
  vat: number;
  total: number;
  pickup_date: string;
  delivery_date: string;
  customer_cost: number;
  increased_profit: number;
};

const Admin = () => {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const res = await fetch("/quotes-data.json?v=" + Date.now());
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json() as QuoteData[];
      setQuotes(data);
      setHasChanges(false);
    } catch (e) {
      console.error("Failed to load quotes", e);
      toast({
        title: "Error loading quotes",
        description: "Could not read the quotes data file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuote = (index: number, field: keyof QuoteData, value: string | number) => {
    const updated = [...quotes];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total if pricing fields change
    if (field === "optimized_customer_cost" || field === "fuel_surcharge" || field === "vat") {
      const base = field === "optimized_customer_cost" ? Number(value) : updated[index].optimized_customer_cost;
      const fuel = field === "fuel_surcharge" ? Number(value) : updated[index].fuel_surcharge;
      const vat = field === "vat" ? Number(value) : updated[index].vat;
      updated[index].total = Number((base + fuel + vat).toFixed(2));
    }
    
    setQuotes(updated);
    setHasChanges(true);
  };

  const addQuote = () => {
    const newQuote: QuoteData = {
      id: `new-${Date.now()}`,
      service_name: "",
      service_type_name: "",
      category: "standard",
      optimized_customer_cost: 0,
      fuel_surcharge: 0,
      vat: 0,
      total: 0,
      pickup_date: "",
      delivery_date: "",
      customer_cost: 0,
      increased_profit: 0,
    };
    setQuotes([...quotes, newQuote]);
    setHasChanges(true);
  };

  const deleteQuote = (index: number) => {
    if (confirm("Are you sure you want to delete this quote?")) {
      const updated = quotes.filter((_, i) => i !== index);
      setQuotes(updated);
      setHasChanges(true);
    }
  };

  const exportJSON = () => {
    const jsonString = JSON.stringify(quotes, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quotes-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "JSON Exported",
      description: "quotes-data.json has been downloaded. Replace the file in the public folder.",
    });
  };

  const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as QuoteData[];
        setQuotes(data);
        setHasChanges(true);
        toast({
          title: "JSON Imported",
          description: "Quotes data has been loaded. Click Save to export the updated file.",
        });
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Invalid JSON file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = "";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
          <p className="text-center text-muted-foreground">Loading quotes…</p>
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
                Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage quotes data
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportJSON} className="gap-2">
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <label>
              <Button variant="outline" asChild className="gap-2 cursor-pointer">
                <span>
                  <Upload className="h-4 w-4" />
                  Import JSON
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importJSON}
                className="hidden"
              />
            </label>
            <Button
              onClick={addQuote}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Quote
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
                    Click "Export JSON" to download the updated file, then replace quotes-data.json in the public folder.
                  </p>
                </div>
                <Button onClick={exportJSON} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save & Export
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {quotes.map((quote, index) => (
            <Card key={quote.id} className="border-border/60">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Quote #{index + 1} - {quote.service_name || "New Quote"}
                    </CardTitle>
                    <CardDescription>ID: {quote.id}</CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteQuote(index)}
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
                        <Label htmlFor={`id-${index}`}>ID</Label>
                        <Input
                          id={`id-${index}`}
                          value={quote.id}
                          onChange={(e) => updateQuote(index, "id", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`service-${index}`}>Service Name</Label>
                        <Input
                          id={`service-${index}`}
                          value={quote.service_name}
                          onChange={(e) => updateQuote(index, "service_name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`type-${index}`}>Service Type</Label>
                        <Input
                          id={`type-${index}`}
                          value={quote.service_type_name}
                          onChange={(e) => updateQuote(index, "service_type_name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`category-${index}`}>Category</Label>
                        <Select
                          value={quote.category}
                          onValueChange={(value) => updateQuote(index, "category", value as QuoteData["category"])}
                        >
                          <SelectTrigger id={`category-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="express">Express</SelectItem>
                            <SelectItem value="dropoff">Drop Off</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Pricing
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`cost-${index}`}>Optimized Customer Cost (£)</Label>
                        <Input
                          id={`cost-${index}`}
                          type="number"
                          step="0.01"
                          value={quote.optimized_customer_cost}
                          onChange={(e) => updateQuote(index, "optimized_customer_cost", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`fuel-${index}`}>Fuel Surcharge (£)</Label>
                        <Input
                          id={`fuel-${index}`}
                          type="number"
                          step="0.01"
                          value={quote.fuel_surcharge}
                          onChange={(e) => updateQuote(index, "fuel_surcharge", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`vat-${index}`}>VAT (£)</Label>
                        <Input
                          id={`vat-${index}`}
                          type="number"
                          step="0.01"
                          value={quote.vat}
                          onChange={(e) => updateQuote(index, "vat", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`total-${index}`}>Total (£)</Label>
                        <Input
                          id={`total-${index}`}
                          type="number"
                          step="0.01"
                          value={quote.total}
                          onChange={(e) => updateQuote(index, "total", parseFloat(e.target.value) || 0)}
                          className="font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Additional Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`pickup-${index}`}>Pickup Date (HTML)</Label>
                        <Input
                          id={`pickup-${index}`}
                          value={quote.pickup_date}
                          onChange={(e) => updateQuote(index, "pickup_date", e.target.value)}
                          placeholder="Thu, 12 Feb 2026<br/>End of business day<br/>23:30<br/><b>Non-Guaranteed</b>"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`delivery-${index}`}>Delivery Date (HTML)</Label>
                        <Input
                          id={`delivery-${index}`}
                          value={quote.delivery_date}
                          onChange={(e) => updateQuote(index, "delivery_date", e.target.value)}
                          placeholder="Mon, 17 Feb 2026<br/>End of business day<br/>23:30<br/><b>Non-Guaranteed</b>"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`old-price-${index}`}>Customer Cost (£)</Label>
                        <Input
                          id={`old-price-${index}`}
                          type="number"
                          step="0.01"
                          value={quote.customer_cost}
                          onChange={(e) => updateQuote(index, "customer_cost", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`profit-${index}`}>Increased Profit (£)</Label>
                        <Input
                          id={`profit-${index}`}
                          type="number"
                          step="0.01"
                          value={quote.increased_profit}
                          onChange={(e) => updateQuote(index, "increased_profit", parseFloat(e.target.value) || 0)}
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
