import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Body = {
  planId?: string
  companyId?: string
}

const PLANS: Record<string, { title: string; price: number }> = {
  basic: { title: 'Basic', price: 1000 },
  pro: { title: 'Pro', price: 3000 },
  enterprise: { title: 'Enterprise', price: 10000 },
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: Body = await req.json()
    const { planId, companyId } = body

    if (!planId || !companyId) {
      return NextResponse.json({ error: 'planId and companyId are required' }, { status: 400 })
    }

    const plan = PLANS[planId]
    if (!plan) {
      return NextResponse.json({ error: 'Unknown planId' }, { status: 400 })
    }

    const MERCADO_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!MERCADO_TOKEN) {
      return NextResponse.json({ error: 'MercadoPago not configured' }, { status: 500 })
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const CURRENCY = process.env.MERCADOPAGO_CURRENCY || 'USD'
    const MODE = process.env.MERCADOPAGO_MODE || 'sandbox'

    const preference = {
      items: [
        {
          id: planId,
          title: plan.title,
          quantity: 1,
          unit_price: plan.price,
          currency_id: CURRENCY,
        },
      ],
      external_reference: `${companyId}:${user.id}:${planId}`,
      back_urls: {
        success: `${APP_URL}/dashboard`,
        failure: `${APP_URL}/dashboard`,
        pending: `${APP_URL}/dashboard`,
      },
      auto_return: 'approved',
    }

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MERCADO_TOKEN}`,
      },
      body: JSON.stringify(preference),
    })

    if (!mpRes.ok) {
      const text = await mpRes.text()
      return NextResponse.json({ error: 'MercadoPago error', details: text }, { status: 502 })
    }

    const data = await mpRes.json()

    const init_point = MODE === 'sandbox' ? data.sandbox_init_point ?? data.init_point : data.init_point

    return NextResponse.json({ init_point, preference_id: data.id })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}

export const runtime = 'nodejs'
