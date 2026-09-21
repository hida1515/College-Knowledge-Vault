// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code is running on Supabase Edge Functions (Deno runtime).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  recipientUserId?: string;
  recipientUserIds?: string[];
  fcmToken?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Convert PEM to crypto key for JWT signing
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const cleanPem = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  
  const binaryDer = Uint8Array.from(atob(cleanPem), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

// Base64URL encode string or buffer
function base64UrlEncode(input: string | Uint8Array): string {
  const str = typeof input === "string" 
    ? btoa(input) 
    : btoa(String.fromCharCode(...input));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Get Google OAuth2 access token for Firebase Cloud Messaging API v1
async function getAccessToken(clientEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const unsignedToken = `${encodedHeader}.${encodedClaimSet}`;

  const cryptoKey = await importPrivateKey(privateKeyPem);
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signature = base64UrlEncode(new Uint8Array(signatureBuffer));
  const jwt = `${unsignedToken}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const resJson = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to obtain Google access token: ${JSON.stringify(resJson)}`);
  }
  return resJson.access_token;
}

// Send FCM message via HTTP v1 API
async function sendFCMMessage(
  accessToken: string,
  projectId: string,
  targetToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const messageUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const payload = {
    message: {
      token: targetToken,
      notification: {
        title,
        body,
      },
      data: data || {},
    },
  };

  const response = await fetch(messageUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
    const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
    const rawPrivateKey = Deno.env.get("FIREBASE_PRIVATE_KEY");

    if (!projectId || !clientEmail || !rawPrivateKey) {
      console.warn("FCM credentials missing in Supabase secrets (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
      return new Response(
        JSON.stringify({
          error: "FCM secrets not configured",
          detail: "Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in Supabase Edge Functions secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
    const body: NotificationRequest = await req.json();
    const { recipientUserId, recipientUserIds, fcmToken, title, body: notifBody, data } = body;

    // Initialize Supabase admin client to retrieve user FCM tokens if needed
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const targetTokens: string[] = [];

    if (fcmToken) {
      targetTokens.push(fcmToken);
    }

    const userIdsToQuery: string[] = [];
    if (recipientUserId) userIdsToQuery.push(recipientUserId);
    if (recipientUserIds && recipientUserIds.length > 0) userIdsToQuery.push(...recipientUserIds);

    if (userIdsToQuery.length > 0) {
      const { data: users, error } = await supabase
        .from("users")
        .select("fcm_token")
        .in("id", userIdsToQuery)
        .not("fcm_token", "is", null);

      if (!error && users) {
        users.forEach((u: { fcm_token: string | null }) => {
          if (u.fcm_token && !targetTokens.includes(u.fcm_token)) {
            targetTokens.push(u.fcm_token);
          }
        });
      }
    }

    if (targetTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active FCM tokens found for recipients" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken(clientEmail, privateKey);
    const results = await Promise.all(
      targetTokens.map((token) =>
        sendFCMMessage(accessToken, projectId, token, title, notifBody, data)
      )
    );

    return new Response(
      JSON.stringify({ success: true, deliveredCount: targetTokens.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-notification error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
