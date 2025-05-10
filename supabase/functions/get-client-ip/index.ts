import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Log request headers for debugging
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));

    // Get IP from various headers
    const xForwardedFor = req.headers.get("x-forwarded-for");
    const xRealIp = req.headers.get("x-real-ip");
    const cfConnectingIp = req.headers.get("cf-connecting-ip");

    console.log("x-forwarded-for:", xForwardedFor);
    console.log("x-real-ip:", xRealIp);
    console.log("cf-connecting-ip:", cfConnectingIp);

    // Try different headers in order of preference
    let clientIP = "unknown";

    if (xForwardedFor) {
      // Get the first IP in the list (client IP)
      clientIP = xForwardedFor.split(",")[0].trim();
    } else if (xRealIp) {
      clientIP = xRealIp.trim();
    } else if (cfConnectingIp) {
      clientIP = cfConnectingIp.trim();
    }

    console.log("Determined client IP:", clientIP);

    // Validate IP format
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (!ipv4Regex.test(clientIP) && !ipv6Regex.test(clientIP)) {
      console.warn("Invalid IP format detected:", clientIP);
      clientIP = "unknown";
    }

    return new Response(
      JSON.stringify({ 
        ip: clientIP,
        headers: {
          xForwardedFor: xForwardedFor || null,
          xRealIp: xRealIp || null,
          cfConnectingIp: cfConnectingIp || null
        }
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-client-ip function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to determine client IP",
        message: error.message,
        stack: error.stack
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});