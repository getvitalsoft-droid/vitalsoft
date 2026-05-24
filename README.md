# VitalSoft — Landing Page

Premium dark SaaS landing page for VitalSoft short-form video editing service.

**Stack:** Next.js 14 · TypeScript · Tailwind CSS · Framer Motion · Stripe

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# → Fill in your Stripe keys and payment links

# 3. Run dev server
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
vitalsoft/
├── app/
│   ├── api/contact/route.ts   ← Contact form backend (POST /api/contact)
│   ├── layout.tsx             ← Root layout + SEO metadata
│   ├── page.tsx               ← Main page (assembles all sections)
│   └── globals.css            ← Global styles + Tailwind
├── components/
│   ├── Navbar.tsx             ← Sticky nav with mobile menu
│   ├── HeroSection.tsx        ← Hero with animated headline + CTAs
│   ├── StatsBar.tsx           ← Social proof numbers
│   ├── TestimonialsSection.tsx← Glassmorphism testimonial cards
│   ├── ServicesSection.tsx    ← Service cards grid
│   ├── PricingSection.tsx     ← 4-plan pricing grid with Stripe links
│   ├── CalculatorSection.tsx  ← Interactive price slider + contact form
│   ├── FAQSection.tsx         ← Accordion FAQ
│   ├── FinalCTA.tsx           ← Bottom conversion section
│   └── Footer.tsx
├── lib/
│   └── stripe.ts              ← Pricing logic + Stripe URL builder
├── .env.example               ← Environment variable template
└── tailwind.config.ts
```

---

## Stripe Setup

### 1. Create Payment Links (Stripe Dashboard)
Go to **Dashboard → Payment Links → Create link** and create 5 recurring links:
- Starter — €150/month
- Growth — €250/month
- Scale — €350/month
- Pro — €450/month
- Custom — (price added via URL params or a separate checkout)

Copy the generated URLs into `.env.local`.

### 2. Enable prefilled_email
On each payment link, enable **"Allow customer to change email"** so the pre-filled email from the calculator works.

### 3. Webhooks (optional for production)
Set up a webhook at `yourdomain.com/api/webhook` to handle:
- `checkout.session.completed` — onboard new client
- `customer.subscription.deleted` — offboard churned client

---

## Pricing Logic

Located in `lib/stripe.ts → calcPrice()`:

| Videos/month | Price/video (marginal) | Monthly total |
|---|---|---|
| 1–10 | €15 | €15–€150 |
| 11–20 | €10 | €150–€250 |
| 21–30 | €10 | €250–€350 |
| 31–40 | €10 | €350–€450 |
| 41–60 | €9 | €450–€630 |
| 61–80 | €8 | €630–€790 |
| 81–100 | €7 | €790–€930 |

---

## Contact Form Backend

`POST /api/contact` accepts:
```json
{
  "name": "string",
  "email": "string",
  "social": "string (optional)",
  "source": "string (optional)",
  "notes": "string (optional)",
  "videos": 20,
  "price": 250
}
```

Currently stores to an in-memory array (console.log for demo).
**Replace with:** Supabase, Prisma/Postgres, Airtable, or a Resend notification.

---

## Deployment (Vercel)

```bash
# Deploy to Vercel
npx vercel

# Add env vars in Vercel dashboard (or via CLI):
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# ... etc
```

---

## Customisation

- **Colors:** Edit CSS variables in `globals.css` (--accent for the yellow)
- **Fonts:** Change imports in `layout.tsx` (currently Syne + DM Sans)
- **Pricing:** Edit `PRICING_PLANS` array in `lib/stripe.ts`
- **Services:** Edit `services` array in `ServicesSection.tsx`
- **FAQ:** Edit `faqs` array in `FAQSection.tsx`
 
