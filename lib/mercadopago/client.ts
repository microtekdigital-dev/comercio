import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const resolveAccessToken = () =>
  process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || "";

const getPreferenceClient = () => {
  const accessToken = resolveAccessToken();
  if (!accessToken) {
    throw new Error("MercadoPago access token not configured");
  }
  return new Preference(new MercadoPagoConfig({ accessToken }));
};

const getPaymentClient = () => {
  const accessToken = resolveAccessToken();
  if (!accessToken) {
    throw new Error("MercadoPago access token not configured");
  }
  return new Payment(new MercadoPagoConfig({ accessToken }));
};

export interface CreatePreferenceInput {
  planId: string;
  planName: string;
  planDescription: string;
  price: number;
  currency: string;
  companyId: string;
  userId: string;
  userEmail: string;
  baseUrl?: string;
}

export async function createPaymentPreference(input: CreatePreferenceInput) {
  const {
    planId,
    planName,
    planDescription,
    price,
    currency,
    companyId,
    userId,
    userEmail,
    baseUrl,
  } = input;

  const externalReference = `${companyId}|${planId}|${Date.now()}`;
  const resolvedCurrency =
    (currency || process.env.MERCADOPAGO_CURRENCY || "USD").toUpperCase();
  const resolvedBaseUrl = resolveBaseUrl(baseUrl);

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Invalid plan price");
  }

  const preferenceClient = getPreferenceClient();
  
  console.log("Creating MercadoPago preference:");
  console.log("- Base URL:", resolvedBaseUrl);
  console.log("- External reference:", externalReference);
  console.log("- Price:", price);
  console.log("- Currency:", resolvedCurrency);
  
  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: planId,
          title: planName,
          description: planDescription,
          quantity: 1,
          unit_price: price,
          currency_id: resolvedCurrency,
        },
      ],
      payer: {
        email: userEmail,
      },
      external_reference: externalReference,
      back_urls: {
        success: `${resolvedBaseUrl}/dashboard/billing?status=success`,
        failure: `${resolvedBaseUrl}/dashboard/billing?status=failure`,
        pending: `${resolvedBaseUrl}/dashboard/billing?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${resolvedBaseUrl}/api/mercadopago/webhook`,
      metadata: {
        company_id: companyId,
        plan_id: planId,
        user_id: userId,
      },
    },
  });

  console.log("Preference created:", preference.id);

  return preference;
}

export async function getPaymentById(paymentId: string) {
  const paymentClient = getPaymentClient();
  const payment = await paymentClient.get({ id: paymentId });
  return payment;
}

const resolveBaseUrl = (override?: string) => {
  const raw =
    override ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    process.env.DEPLOY_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000";

  const withScheme = raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `https://${raw}`;

  try {
    return new URL(withScheme).origin;
  } catch {
    return "http://localhost:3000";
  }
};
