# Bits Photo Mart

A Next.js 16 photography marketplace with M-Pesa, Stripe, and PayPal payment integration.

## Features

- 📸 Stock Photo & Video Marketplace
- 🎥 Professional Documentary Production Services
- 💳 M-Pesa, Stripe, and PayPal Payments
- 👥 Multi-role Authentication (Clients, Photographers, Admins)
- 📱 Mobile Responsive Design

## Prerequisites

- Node.js 18+
- MySQL/MariaDB database
- M-Pesa Daraja API credentials (for Kenya payments)
- Stripe account (optional)
- PayPal account (optional)

## Setup

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database and API credentials.

4. **Set up the database**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open http://localhost:3000**

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes
- **Database**: MariaDB with Prisma ORM
- **Auth**: NextAuth v5
- **Payments**: M-Pesa (STK Push), Stripe, PayPal
- **Image Processing**: Sharp

## Project Structure

```
app/                    # Next.js App Router pages
├── api/               # API routes
├── admin/             # Admin dashboard pages
├── dashboard/         # Client dashboard
└── photographer/      # Photographer dashboard

src/
├── components/        # React components
├── lib/              # Utility functions
└── hooks/            # Custom React hooks

prisma/
└── schema.prisma     # Database schema
```

## License

MIT
