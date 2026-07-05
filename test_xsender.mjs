import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrsblpmhbkdgjsxiinpp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yc2JscG1oYmtkZ2pzeGlpbnBwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY3MzA4MywiZXhwIjoyMDk2MjQ5MDgzfQ.BAz8TdW10LSdg5YM9uF4KNQze0UIpVWIwrXSql4DmrY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testWA() {
  console.log("Fetching WA Config from Supabase...")
  const { data: config_val, error } = await supabase.rpc('get_wa_config')
  
  if (error) {
    console.error("Error fetching config:", error)
    return
  }
  
  console.log("Config loaded:", config_val)
  
  if (!config_val || !config_val.api_key) {
    console.error("No API key in config")
    return
  }

  const payloadBody = {
    api_key: config_val.api_key,
    sender: config_val.sender,
    number: "087791134515", // Sending to the same number as a test
    message: "Halo! Ini pesan pengujian dari sistem Event Management MAKT dengan pengaturan nomor yang baru.",
    footer: "MAKT System"
  }

  console.log("Sending message to XSender...")
  const WA_GATEWAY_URL = "https://xsender.id/api/send-message"
  
  try {
    const response = await fetch(WA_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payloadBody)
    })
    
    let responseData;
    try {
      responseData = await response.json();
    } catch(e) {
      console.log("Response not JSON:", await response.text())
      return
    }
    
    console.log("XSender Response:", responseData)
  } catch (e) {
    console.error("Fetch error:", e)
  }
}

testWA()
