import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { answers, restaurants } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format restaurant list for the AI
    const restaurantList = restaurants?.length > 0 
      ? restaurants.map((r: any, i: number) => 
          `${i + 1}. ${r.name} - ${r.cuisine || 'Various'} cuisine, ${r.rating || 'N/A'} stars, ${r.distance} mi away${r.description ? ` - ${r.description}` : ''}`
        ).join('\n')
      : null;

    const systemPrompt = restaurantList 
      ? `You are a fun restaurant matchmaker! Based on the user's quiz answers, pick THE BEST restaurant from the provided list that matches their mood and preferences.

AVAILABLE RESTAURANTS:
${restaurantList}

You MUST pick exactly ONE restaurant from the list above. Respond with a JSON object:
{
  "restaurantName": "exact name from list",
  "restaurantIndex": number (0-indexed position in the list),
  "matchReason": "a fun, personalized 2-3 sentence explanation of why this is their perfect match based on their answers",
  "emoji": "a relevant food emoji"
}

Return ONLY the JSON object, no other text.`
      : `You are a fun restaurant recommendation expert. Based on the user's quiz answers, suggest the perfect cuisine type for them.

Respond with a JSON object:
{
  "cuisine": "the type of cuisine they should try",
  "matchReason": "a fun, personalized 2-3 sentence explanation of why this cuisine matches their mood",
  "emoji": "a relevant food emoji"
}

Return ONLY the JSON object, no other text.`;

    const userMessage = `Here are my quiz answers:
- Mood: ${answers.mood}
- Preferred vibe: ${answers.vibe}
- Hunger level: ${answers.hunger}
- Adventure level: ${answers.adventure}
- Dining with: ${answers.company}`;

    console.log("Calling AI with", restaurants?.length || 0, "restaurants");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get recommendations");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    console.log("AI response:", content);

    // Parse the JSON response
    let recommendation;
    try {
      // Clean up potential markdown formatting
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recommendation = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse AI response:", content, e);
      throw new Error("Invalid response format");
    }

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in restaurant-quiz:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
