// Public endpoint: returns nearby restaurants using Google Places Web Service.
// Uses the GOOGLE_MAPS_API_KEY secret (kept server-side).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NearbyRequest = {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  openNow?: boolean;
  pageToken?: string;
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

    const body = (await req.json()) as NearbyRequest;

    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);
    const radiusMeters = Number(body?.radiusMeters ?? 8047);
    const openNow = body?.openNow ?? true;
    const pageToken = body?.pageToken;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return new Response(JSON.stringify({ error: "Invalid latitude/longitude" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: String(radiusMeters),
      type: "restaurant",
      key: apiKey,
    });

    // `opennow` is a flag param (no value required)
    if (openNow) params.append("opennow", "");
    if (pageToken) params.set("pagetoken", pageToken);

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`;

    console.log("places-nearby request", {
      latitude,
      longitude,
      radiusMeters,
      openNow,
      pageToken: !!pageToken,
    });

    const resp = await fetch(url);
    const json = await resp.json();

    console.log("places-nearby response", {
      httpStatus: resp.status,
      status: json?.status,
      error_message: json?.error_message,
      resultsCount: Array.isArray(json?.results) ? json.results.length : 0,
    });

    // Common statuses: OK, ZERO_RESULTS, REQUEST_DENIED, OVER_QUERY_LIMIT, INVALID_REQUEST
    if (json?.status !== "OK" && json?.status !== "ZERO_RESULTS") {
      return new Response(
        JSON.stringify({
          error: json?.error_message || "Places request failed",
          status: json?.status,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const cuisineMap: Record<string, string> = {
      american_restaurant: "American",
      bakery: "Bakery",
      bar: "Bar",
      barbecue_restaurant: "Barbecue",
      brazilian_restaurant: "Brazilian",
      breakfast_restaurant: "Breakfast",
      brunch_restaurant: "Brunch",
      cafe: "Cafe",
      chinese_restaurant: "Chinese",
      coffee_shop: "Coffee Shop",
      fast_food_restaurant: "Fast Food",
      french_restaurant: "French",
      greek_restaurant: "Greek",
      hamburger_restaurant: "Burger",
      ice_cream_shop: "Ice Cream",
      indian_restaurant: "Indian",
      indonesian_restaurant: "Indonesian",
      italian_restaurant: "Italian",
      japanese_restaurant: "Japanese",
      korean_restaurant: "Korean",
      lebanese_restaurant: "Lebanese",
      mediterranean_restaurant: "Mediterranean",
      mexican_restaurant: "Mexican",
      middle_eastern_restaurant: "Middle Eastern",
      pizza_restaurant: "Pizza",
      ramen_restaurant: "Ramen",
      sandwich_shop: "Sandwiches",
      seafood_restaurant: "Seafood",
      spanish_restaurant: "Spanish",
      steak_house: "Steakhouse",
      sushi_restaurant: "Sushi",
      thai_restaurant: "Thai",
      turkish_restaurant: "Turkish",
      vegan_restaurant: "Vegan",
      vegetarian_restaurant: "Vegetarian",
      vietnamese_restaurant: "Vietnamese",
    };

    const results = (json?.results ?? []).map((r: any) => {
      const types: string[] = Array.isArray(r?.types) ? r.types : [];
      const cuisine = types.map((t) => cuisineMap[t]).find(Boolean);

      // Build photo URL from photo_reference if available
      let photoUrl: string | undefined;
      if (Array.isArray(r?.photos) && r.photos.length > 0 && r.photos[0]?.photo_reference) {
        const photoRef = r.photos[0].photo_reference;
        photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;
      }

      return {
        id: r?.place_id ?? "",
        name: r?.name ?? "Unknown Restaurant",
        address: r?.vicinity ?? "",
        latitude: r?.geometry?.location?.lat ?? latitude,
        longitude: r?.geometry?.location?.lng ?? longitude,
        rating: typeof r?.rating === "number" ? r.rating : undefined,
        cuisine,
        openNow: r?.opening_hours?.open_now ?? undefined,
        photoUrl,
      };
    });

    return new Response(
      JSON.stringify({
        results,
        nextPageToken: json?.next_page_token ?? null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("places-nearby unexpected error", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
