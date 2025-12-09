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
    const { answers } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a fun and friendly restaurant recommendation expert. Based on the user's quiz answers, suggest 3 types of restaurants or cuisines they should try. Be specific, enthusiastic, and give a brief reason for each suggestion.

Format your response as a JSON array with exactly 3 objects, each having:
- "cuisine": the type of cuisine or restaurant style
- "reason": a fun, personalized reason based on their answers (1-2 sentences)
- "emoji": a relevant food emoji

Example format:
[
  {"cuisine": "Thai", "reason": "Your love for bold flavors means Thai cuisine will blow your taste buds away!", "emoji": "🍜"},
  {"cuisine": "Mediterranean", "reason": "Perfect for sharing with friends like you mentioned!", "emoji": "🥙"},
  {"cuisine": "Japanese Izakaya", "reason": "Great for adventurous eaters who love variety!", "emoji": "🍱"}
]

Return ONLY the JSON array, no other text.`;

    const userMessage = `Here are my quiz answers:
- Mood: ${answers.mood}
- Preferred vibe: ${answers.vibe}
- Hunger level: ${answers.hunger}
- Adventure level: ${answers.adventure}
- Dining with: ${answers.company}`;

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

    // Parse the JSON response
    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid response format");
    }

    return new Response(JSON.stringify({ recommendations }), {
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
