

# Logistics Shipping Calculator & Quote Dashboard

## Design System
- **Primary colors**: Deep Blue (`#1a365d`) with Golden Yellow (`#f6ad55`) accents
- **Style**: Clean corporate aesthetic with rounded cards, ample whitespace, subtle shadows
- **Typography**: Bold headings, clear hierarchy

## Page 1: Shipping Calculator (Landing Page `/`)
- Hero section with branded header (logo area, company name, navigation link to quotes)
- Centered **Shipping Calculator Card** with:
  - **From Address** section: Street Address, City, Post Code in a 3-column row
  - **To Address** section: Street Address, City, Post Code in a 3-column row
  - **Parcel Dimensions** section: Weight (kg), Width (cm), Length (cm), Height (cm) as numeric inputs
  - **"Get Quotes"** button with loading spinner animation
- Form validation using Zod (required fields, numeric constraints)
- On submit, navigates to Page 2

## Page 2: Quote Comparison Dashboard (`/quotes`)
- 3-column responsive grid: **Standard**, **Express**, **Drop Off**
- Each column contains a vertical stack of **Service Quote Cards** showing:
  - Provider name & logo placeholder (DHL, FedEx, UPS, etc.)
  - Service type label (e.g., "Overnight", "Ground")
  - Collapsible pricing breakdown: Base Price, Fuel Surcharge, VAT
  - Large bold **Total Price**
  - Pickup Date & Estimated Delivery with calendar icons
  - **"Select"** button per card
- On mobile, columns stack vertically
- **Mock JSON data** powering all quotes, structured for easy API swap later
- **Admin toast notification** that triggers if the data structure deviates from the expected schema (hidden dev tool for agentic AI monitoring)

## Navigation
- Simple top navbar with links between the two pages
- Back button on quotes page to return to calculator

## Responsive Design
- All layouts adapt from desktop 3-column to mobile single-column
- Input rows collapse to stacked on small screens

