// Public endpoint: returns detailed place info including opening hours.
// Uses the GOOGLE_MAPS_API_KEY secret (kept server-side).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DetailsRequest = {
  placeId: string;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      console.error("Missing GOOGLE_MAPS_API_KEY secret");
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as DetailsRequest;
    const placeId = body?.placeId;

    if (!placeId || typeof placeId !== "string") {
      return new Response(JSON.stringify({ error: "Invalid placeId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fields = [
      "name",
      "formatted_address",
      "formatted_phone_number",
      "website",
      "opening_hours",
      "rating",
      "geometry",
      "photos",
      "editorial_summary",
    ].join(",");

    const params = new URLSearchParams({
      place_id: placeId,
      fields,
      key: apiKey,
    });

    const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;

    console.log("place-details request", { placeId });

    const resp = await fetch(url);
    const json = await resp.json();

    console.log("place-details response", {
      httpStatus: resp.status,
      status: json?.status,
      error_message: json?.error_message,
    });

    if (json?.status !== "OK") {
      return new Response(
        JSON.stringify({
          error: json?.error_message || "Place details request failed",
          status: json?.status,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const r = json?.result ?? {};

    // Build photo URL from photo_reference if available
    let photoUrl: string | undefined;
    if (Array.isArray(r?.photos) && r.photos.length > 0 && r.photos[0]?.photo_reference) {
      const photoRef = r.photos[0].photo_reference;
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;
    }

    const result = {
      name: r?.name,
      address: r?.formatted_address,
      phone: r?.formatted_phone_number,
      website: r?.website,
      rating: r?.rating,
      latitude: r?.geometry?.location?.lat,
      longitude: r?.geometry?.location?.lng,
      photoUrl,
      openNow: r?.opening_hours?.open_now,
      openingHours: r?.opening_hours?.weekday_text ?? [],
      description: r?.editorial_summary?.overview,
    };

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("place-details unexpected error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
