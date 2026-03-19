import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 405,
      });
    }

    const { contractText, fileName, fileSize, fileType } = await req.json();

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured on server. Please contact administrator."
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

    const openai = new OpenAI({ apiKey: openaiApiKey });

    const systemPrompt = `You are a legal contract analyst specializing in music industry agreements. Analyze contracts and provide structured, actionable insights.

Your analysis should be:
- Specific to the actual content of the contract
- Based on music industry standards and best practices
- Focused on protecting the artist's interests
- Clear and actionable

IMPORTANT: Only provide analysis based on the actual contract content. Do not hallucinate or make up details that aren't in the contract. If the contract text is limited, acknowledge this and provide general guidance.`;

    const userPrompt = `Please analyze this contract file: "${fileName}" (${fileSize} bytes, type: ${fileType})

${contractText && contractText.length > 100 ? `Contract text:\n${contractText}` : 'Note: Limited text available. Please provide general analysis based on the file name and common contract types in the music industry.'}

Provide your analysis in the following JSON format:
{
  "title": "Brief descriptive title for this contract",
  "summary": "2-3 paragraph summary of the contract's purpose, main terms, and structure",
  "keyTerms": [
    "**Term Name**: Description of the term",
    "**Another Term**: Description"
  ],
  "risks": [
    "**Risk Title**: Specific concern and why it matters",
    "**Another Risk**: Description"
  ],
  "recommendations": [
    "**Recommendation Title**: Specific actionable advice",
    "**Another Recommendation**: Description"
  ]
}

Important guidelines:
- Each keyTerm, risk, and recommendation should start with bold text (using **) for the title
- List at least 5-7 key terms from the actual contract
- Identify 3-5 specific risks based on the actual content
- Provide 4-6 actionable recommendations
- If you cannot read the actual contract text, acknowledge this and provide general guidance for this type of contract based on the filename
- Do not invent specific dollar amounts, dates, or party names unless they are clearly stated in the contract`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    const analysis = JSON.parse(content);

    return new Response(
      JSON.stringify({
        title: analysis.title || "Contract Analysis",
        summary: analysis.summary || "Unable to generate summary",
        keyTerms: Array.isArray(analysis.keyTerms) ? analysis.keyTerms : [],
        risks: Array.isArray(analysis.risks) ? analysis.risks : [],
        recommendations: Array.isArray(analysis.recommendations)
          ? analysis.recommendations
          : [],
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
    console.error("Error processing contract analysis:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error during contract analysis"
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
