import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get user profile to get company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    // Get company settings
    const { data: settings, error: settingsError } = await supabase
      .from('company_settings')
      .select('company_name, phone, email, address')
      .eq('company_id', profile.company_id)
      .single()

    if (settingsError) {
      console.error('Error fetching company settings:', settingsError)
      return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
    }

    return NextResponse.json(settings || {})
  } catch (error) {
    console.error('Error in company settings API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
