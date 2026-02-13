import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ServiceQuote } from "@/data/mockQuotes";

interface QuoteCardProps {
  quote: ServiceQuote;
}

/** Parse HTML date string like "Thu, 12 Feb 2026<br/>End of business day<br/>23:30<br/><b>Non-Guaranteed</b>" */
function parseDateHtml(html: string) {
  const parts = html.split(/<br\s*\/?>/i).map((p) => p.trim()).filter(Boolean);
  return parts.map((part) => {
    const boldMatch = part.match(/^<b>(.*?)<\/b>$/i);
    if (boldMatch) {
      return { text: boldMatch[1], bold: true };
    }
    return { text: part, bold: false };
  });
}

const DateDisplay = ({ html, label }: { html: string; label: string }) => {
  const parts = parseDateHtml(html);
  return (
    <div className="flex-1 space-y-0.5">
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm">
        {parts.map((p, i) => (
          <div key={i} className={p.bold ? "font-bold text-primary" : "text-foreground"}>
            {p.text}
          </div>
        ))}
      </div>
    </div>
  );
};

const QuoteCard = ({ quote }: QuoteCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-border/60 shadow-md transition-shadow hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">{quote.provider}</p>
            <p className="text-sm text-muted-foreground">{quote.serviceType}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {quote.provider.slice(0, 2)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pricing Breakdown - always visible */}
        <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
          Pricing Breakdown
        </div>
        <div className="space-y-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Base Price</span>
            <span className="font-medium">£{quote.pricing.basePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fuel Surcharge</span>
            <span className="font-medium">£{quote.pricing.fuelSurcharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span className="font-medium">£{quote.pricing.vat.toFixed(2)}</span>
          </div>
        </div>

        {/* Old Base Price & Increased Profit - Collapsible */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between rounded-md bg-muted/30 border border-border/40 px-3 py-2 text-sm font-medium hover:bg-muted/50"
            >
              <span className="text-muted-foreground">Additional Details</span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-1 rounded-md bg-muted/30 border border-border/40 px-3 py-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Old Base Price</span>
                <span className="font-medium">£{quote.oldBasePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Increased Profit</span>
                <span className="font-medium text-green-600">£{quote.increasedProfit.toFixed(2)}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Total */}
        <div className="flex items-baseline justify-between border-t pt-3">
          <span className="text-sm font-medium text-muted-foreground">Total</span>
          <span className="text-2xl font-extrabold text-primary">
            £{quote.totalPrice.toFixed(2)}
          </span>
        </div>

        {/* Dates */}
        <div className="flex gap-4">
          <DateDisplay html={quote.pickupDate} label="Pickup" />
          <DateDisplay html={quote.estimatedDelivery} label="Delivery" />
        </div>

        <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
          Select
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuoteCard;
