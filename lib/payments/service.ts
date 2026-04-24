/**
 * NexCart Payment Service
 *
 * Abstraction layer over multiple payment providers.
 * Swap out provider implementations without changing
 * checkout or order logic.
 *
 * Supported providers:
 * - Stripe (cards, international)
 * - eSewa  (Nepal)
 * - Khalti (Nepal)
 * - COD    (Cash on Delivery — no external API)
 */

export type PaymentProvider = "STRIPE" | "ESEWA" | "KHALTI" | "CASH_ON_DELIVERY";

export interface PaymentInitParams {
  provider: PaymentProvider;
  /** Amount in the smallest currency unit (paisa for NPR, cents for USD) */
  amountCents: number;
  currency: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  /** Where to send the user after payment (success or failure) */
  returnUrl: string;
  failureUrl?: string;
  /** Provider-specific metadata */
  metadata?: Record<string, string>;
}

export interface PaymentInitResult {
  success: boolean;
  /** Redirect the browser to this URL to complete payment */
  redirectUrl?: string;
  /** If the provider returned a session/token (e.g. Stripe checkout session ID) */
  sessionId?: string;
  /** Client-publishable key needed by Stripe.js */
  clientSecret?: string;
  /** Transaction ID assigned by the provider immediately */
  transactionId?: string;
  error?: string;
}

export interface PaymentVerifyParams {
  provider: PaymentProvider;
  orderId: string;
  /** Raw query params forwarded from the provider's callback */
  callbackParams: Record<string, string>;
}

export interface PaymentVerifyResult {
  success: boolean;
  paid: boolean;
  transactionId?: string;
  providerRef?: string;
  amount?: number;
  error?: string;
}

// =============================================================================
// Stripe
// =============================================================================

async function initStripe(params: PaymentInitParams): Promise<PaymentInitResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return { success: false, error: "Stripe is not configured (STRIPE_SECRET_KEY missing)" };
  }

  try {
    // Lazy-load Stripe so it's never bundled in Edge
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2024-12-18.acacia" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: params.currency.toLowerCase(),
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: { name: `NexCart Order #${params.orderNumber}` },
            unit_amount: params.amountCents,
          },
          quantity: 1,
        },
      ],
      customer_email: params.customerEmail,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        ...params.metadata,
      },
      success_url: params.returnUrl,
      cancel_url: params.failureUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
    });

    return {
      success: true,
      redirectUrl: session.url ?? undefined,
      sessionId: session.id,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stripe error";
    console.error("[Payments] Stripe init error:", msg);
    return { success: false, error: msg };
  }
}

async function verifyStripe(params: PaymentVerifyParams): Promise<PaymentVerifyResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return { success: false, paid: false, error: "Stripe not configured" };

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, { apiVersion: "2024-12-18.acacia" });
    const sessionId = params.callbackParams["session_id"];
    if (!sessionId) return { success: false, paid: false, error: "Missing session_id" };

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid = session.payment_status === "paid";

    return {
      success: true,
      paid,
      transactionId: session.payment_intent?.toString(),
      providerRef: session.id,
      amount: session.amount_total ?? undefined,
    };
  } catch (err: unknown) {
    return { success: false, paid: false, error: (err as Error).message };
  }
}

// =============================================================================
// eSewa (Nepal)
// https://developer.esewa.com.np
// =============================================================================

async function initEsewa(params: PaymentInitParams): Promise<PaymentInitResult> {
  const merchantId = process.env.ESEWA_MERCHANT_ID;
  const baseUrl = process.env.ESEWA_BASE_URL ?? "https://rc-epay.esewa.com.np"; // sandbox

  if (!merchantId) {
    return { success: false, error: "eSewa is not configured (ESEWA_MERCHANT_ID missing)" };
  }

  // eSewa v2 uses a signed form POST
  const amountNPR = (params.amountCents / 100).toFixed(2);
  const txnId = `NC-${params.orderNumber}-${Date.now()}`;

  // Build the eSewa payment initiation URL (GET-based for v2 API)
  const callbackUrl = params.returnUrl;
  const redirectUrl =
    `${baseUrl}/api/epay/main?` +
    new URLSearchParams({
      amt: amountNPR,
      psc: "0",
      pdc: "0",
      txAmt: "0",
      tAmt: amountNPR,
      pid: txnId,
      scd: merchantId,
      su: callbackUrl,
      fu: params.failureUrl ?? callbackUrl,
    }).toString();

  return { success: true, redirectUrl, transactionId: txnId };
}

async function verifyEsewa(params: PaymentVerifyParams): Promise<PaymentVerifyResult> {
  const merchantId = process.env.ESEWA_MERCHANT_ID;
  const baseUrl = process.env.ESEWA_BASE_URL ?? "https://rc-epay.esewa.com.np";

  const { oid, amt, refId } = params.callbackParams;

  if (!oid || !amt || !refId) {
    return { success: false, paid: false, error: "Missing eSewa callback params" };
  }

  try {
    const verifyUrl =
      `${baseUrl}/api/epay/txnstatus/` +
      new URLSearchParams({ merchantId: merchantId ?? "", productId: oid, amt, refId });

    const res = await fetch(verifyUrl.toString());
    const text = await res.text();
    const paid = text.includes("Success");

    return { success: true, paid, transactionId: refId, providerRef: oid };
  } catch (err: unknown) {
    return { success: false, paid: false, error: (err as Error).message };
  }
}

// =============================================================================
// Khalti (Nepal)
// https://docs.khalti.com
// =============================================================================

async function initKhalti(params: PaymentInitParams): Promise<PaymentInitResult> {
  const secretKey = process.env.KHALTI_SECRET_KEY;
  const baseUrl = process.env.KHALTI_BASE_URL ?? "https://dev.khalti.com"; // sandbox

  if (!secretKey) {
    return { success: false, error: "Khalti not configured (KHALTI_SECRET_KEY missing)" };
  }

  try {
    const res = await fetch(`${baseUrl}/api/v2/epayment/initiate/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        return_url: params.returnUrl,
        website_url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        amount: params.amountCents, // Khalti uses paisa
        purchase_order_id: params.orderId,
        purchase_order_name: `Order #${params.orderNumber}`,
        customer_info: {
          name: params.customerName,
          email: params.customerEmail,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: (err as { detail?: string }).detail ?? "Khalti error" };
    }

    const data = (await res.json()) as { payment_url: string; pidx: string };
    return {
      success: true,
      redirectUrl: data.payment_url,
      transactionId: data.pidx,
    };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

async function verifyKhalti(params: PaymentVerifyParams): Promise<PaymentVerifyResult> {
  const secretKey = process.env.KHALTI_SECRET_KEY;
  const baseUrl = process.env.KHALTI_BASE_URL ?? "https://dev.khalti.com";

  const pidx = params.callbackParams["pidx"];
  if (!pidx) return { success: false, paid: false, error: "Missing pidx" };

  try {
    const res = await fetch(`${baseUrl}/api/v2/epayment/lookup/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pidx }),
    });

    const data = (await res.json()) as { status: string; transaction_id?: string; total_amount?: number };
    const paid = data.status === "Completed";

    return {
      success: true,
      paid,
      transactionId: data.transaction_id,
      providerRef: pidx,
      amount: data.total_amount,
    };
  } catch (err: unknown) {
    return { success: false, paid: false, error: (err as Error).message };
  }
}

// =============================================================================
// Cash on Delivery — no external API
// =============================================================================

function initCOD(params: PaymentInitParams): PaymentInitResult {
  return {
    success: true,
    transactionId: `COD-${params.orderNumber}`,
  };
}

// =============================================================================
// Public API
// =============================================================================

export async function initiatePayment(params: PaymentInitParams): Promise<PaymentInitResult> {
  switch (params.provider) {
    case "STRIPE":
      return initStripe(params);
    case "ESEWA":
      return initEsewa(params);
    case "KHALTI":
      return initKhalti(params);
    case "CASH_ON_DELIVERY":
      return initCOD(params);
    default:
      return { success: false, error: "Unknown payment provider" };
  }
}

export async function verifyPayment(params: PaymentVerifyParams): Promise<PaymentVerifyResult> {
  switch (params.provider) {
    case "STRIPE":
      return verifyStripe(params);
    case "ESEWA":
      return verifyEsewa(params);
    case "KHALTI":
      return verifyKhalti(params);
    case "CASH_ON_DELIVERY":
      // COD is always "pending" — driver collects on delivery
      return { success: true, paid: false, transactionId: params.callbackParams["ref"] };
    default:
      return { success: false, paid: false, error: "Unknown provider" };
  }
}
