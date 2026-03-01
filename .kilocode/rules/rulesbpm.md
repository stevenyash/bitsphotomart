# rulesbpm.md

Rule description here...

## Guidelines

# BitsPhotoMart Project Rules (Next.js 16 + React 19)

## Core Architecture
- **SSR/Server Components:** Default to React Server Components (RSC). Only use `'use client'` when hooks (useState, useEffect) or interactivity are strictly required.
- **Data Access:** Always use **Prisma** for database operations. Ensure MariaDB compatibility.
- **Form Handling:** Use **React Hook Form** with **Zod** schema validation.
- **Styling:** Use **Tailwind CSS 4** and **daisyUI** components. Leverage `clsx` and `tailwind-merge` for dynamic classes.

## Authentication & Security
- **NextAuth v5:** Use the Auth.js beta patterns (middleware, `auth()` function).
- **Sensitive Data:** Never expose Stripe/PayPal secret keys or database URLs to the client.
- **Password Hashing:** Use `bcryptjs` for any manual credential handling.

## Payments & Files
- **Payments:** Follow official **Stripe** and **PayPal Server SDK** patterns for checkout sessions and webhooks.
- **Image Processing:** Use **Sharp** for optimizing photo uploads and **Multer** for handling multipart/form-data.

## Code Quality (Zero-Bug Policy)
- **TypeScript:** No `any`. Always use the types from `@types/react` and Prisma's generated types.
- **Error Handling:** Use `try/catch` blocks for all database and payment API calls.
- **Lucide Icons:** Use `lucide-react` for all UI icons.
# M-Pesa Integration Rules (Next.js 16 + Prisma)

## Daraja API Workflow
- **Authentication:** Use a Server Action or Utility to generate the `OAuth` access token. Encrypt and store the `Consumer Key` and `Consumer Secret` in `.env`.
- **STK Push:** Implement the `mpesa/stkpush/v1/processrequest` endpoint. Use `TransactionType: "CustomerPayBillOnline"` for Paybill/Till transactions.
- **Formatting:** Ensure phone numbers are normalized to the `2547XXXXXXXX` or `2541XXXXXXXX` format before sending to Safaricom.

## Database & Callbacks (Prisma)
- **Callback URL:** Define a public route (e.g., `/api/payments/callback`) to receive Safaricom's POST request.
- **Transaction Tracking:** Use **Prisma** to create a record in a `Transaction` table immediately after a successful STK Push initiation, storing the `CheckoutRequestID` for reconciliation.
- **Status Updates:** Update the transaction status in MariaDB once the callback confirms success (`ResultCode: 0`) or failure.

## Security & Reliability
- **Verification:** Implement a polling mechanism or a dedicated `/status/[id]` endpoint so the frontend can check payment status after the user enters their PIN.
- **Environment:** Use `https://sandbox.safaricom.co.ke` for testing and switch to `https://api.safaricom.co.ke` only for production.

