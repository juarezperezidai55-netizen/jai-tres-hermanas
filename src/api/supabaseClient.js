import { createClient } from '@supabase/supabase-js'

// Credenciales oficiales de tu proyecto JAI Tres Hermanas
const supabaseUrl = 'https://pmlbvhjhywdekphshjxo.supabase.co'
const supabaseAnonKey = 'sb_publishable_iBrYUj0m7c8NsHTaUQHfhw_msU_MS0L'

// 1. CLIENTE BLINDADO PARA LA TIENDA DE CLIENTES
// Guarda la sesión de forma exclusiva bajo la clave 'jai_customer_session'
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'jai_customer_session',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 2. CLIENTE BLINDADO PARA EL PANEL DE ADMINISTRACIÓN / TRABAJADORES
// Guarda la sesión de forma exclusiva bajo la clave 'jai_admin_session'
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'jai_admin_session',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})