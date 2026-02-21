import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Get user profile with company info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, full_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      company_id: profile.company_id,
      full_name: profile.full_name
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
