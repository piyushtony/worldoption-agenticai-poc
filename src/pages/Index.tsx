import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import { API_ENDPOINTS } from "@/config/api";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  fromCountry: z.string().trim().min(1, "Required").max(200),
  fromCity: z.string().trim().min(1, "Required").max(100),
  fromPostCode: z.string().trim().min(1, "Required").max(20),
  toCountry: z.string().trim().min(1, "Required").max(200),
  toCity: z.string().trim().min(1, "Required").max(100),
  toPostCode: z.string().trim().min(1, "Required").max(20),
  weight: z.coerce.number().positive("Must be > 0").max(1000),
  width: z.coerce.number().positive("Must be > 0").max(500),
  length: z.coerce.number().positive("Must be > 0").max(500),
  height: z.coerce.number().positive("Must be > 0").max(500),
});

type FormValues = z.infer<typeof schema>;

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromCountry: "GB", fromCity : "East Sussex", fromPostCode : "BN27 4BN",
      toCountry: "DE", toCity : "Karlsruhe", toPostCode : "76131",
      weight : 6,
      width : 35,
      length : 25,
      height : 25,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      // Prepare the request payload matching input.json format exactly
      const requestPayload = {
        collection_country_code: data.fromCountry.trim(),
        collection_city: data.fromCity.trim(),
        collection_post_code: data.fromPostCode.trim(),
        delivery_country_code: data.toCountry.trim(),
        delivery_city: data.toCity.trim(),
        delivery_post_code: data.toPostCode.trim(),
        weight: Number(data.weight),
        width: Number(data.width),
        length: Number(data.length),
        height: Number(data.height),
        no_of_packages: 1,
      };

      // Log the payload for debugging (matches input.json format)
      console.log('Sending API request with payload:', JSON.stringify(requestPayload, null, 2));

      // Call API to get quotes
      const response = await fetch(API_ENDPOINTS.GET_QUOTES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`API error! status: ${response.status}`);
      }

      const quotesData = await response.json();
      
      // Navigate to quotes page with both form data and API response
      navigate("/quotes", { 
        state: {
          searchCriteria: data,
          quotesResponse: quotesData,
        }
      });
    } catch (error) {
      console.error("Failed to fetch quotes", error);
      toast({
        title: "Error fetching quotes",
        description: error instanceof Error ? error.message : "Could not fetch quotes from the API. Please try again.",
        variant: "destructive",
      });
      // Still navigate to quotes page even if API fails, so user can see the form data
      navigate("/quotes", { state: { searchCriteria: data } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
            Shipping Calculator
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Get instant courier quotes for your shipment
          </p>
        </div>

        <Card className="w-full max-w-2xl shadow-xl border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">Shipment Details</CardTitle>
            <CardDescription>Enter addresses and parcel dimensions below</CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* From */}
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    From Address
                  </legend>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField control={form.control} name="fromCountry" render={({ field }) => (
                      <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="GB" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="fromCity" render={({ field }) => (
                      <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="London" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="fromPostCode" render={({ field }) => (
                      <FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="EC1A 1BB" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </fieldset>

                {/* To */}
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    To Address
                  </legend>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField control={form.control} name="toCountry" render={({ field }) => (
                      <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="DE" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="toCity" render={({ field }) => (
                      <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Manchester" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="toPostCode" render={({ field }) => (
                      <FormItem><FormLabel>Post Code</FormLabel><FormControl><Input placeholder="M1 1AA" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </fieldset>

                {/* Parcel */}
                <fieldset>
                  <legend className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Parcel Dimensions
                  </legend>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <FormField control={form.control} name="weight" render={({ field }) => (
                      <FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="0.0" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="width" render={({ field }) => (
                      <FormItem><FormLabel>Width (cm)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="0.0" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="length" render={({ field }) => (
                      <FormItem><FormLabel>Length (cm)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="0.0" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="height" render={({ field }) => (
                      <FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" step="0.1" placeholder="0.0" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </fieldset>

                <Button type="submit" size="lg" disabled={loading} className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-base">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Fetching Quotes…
                    </>
                  ) : (
                    <>
                      Get Quotes
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
