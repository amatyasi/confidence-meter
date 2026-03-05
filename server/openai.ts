import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface EvidenceParsingResult {
  [categoryId: string]: number;
}

export async function parseEvidenceWithLLM(evidenceText: string): Promise<EvidenceParsingResult> {
  const prompt = `You are an expert at analyzing product evidence and categorizing it according to Itamar Gilad's Confidence Meter methodology. 

Please analyze the following evidence text and determine how many indicators should be assigned to each evidence category. Return your response as a JSON object with category IDs as keys and indicator counts as values.

Evidence Categories:
- "self-conviction": Personal conviction about the idea (weight: 0.01 each, examples: Strong personal belief, gut feeling, intuition)
- "pitch-deck": Formal presentations or materials prepared (weight: 0.02 each, examples: Presentation prepared, slides created, narrative developed)
- "thematic-support": Alignment with broader themes/trends (weight: 0.05 each, examples: Aligns with vision/strategy, current trends/buzzword, outside research, macro trends, product methodology)
- "others-opinion": Opinions from colleagues/experts (weight: 0.1 each, examples: The team/management/external expert/investor/press think it's a good idea)
- "estimates-plans": Detailed planning work (weight: 0.3 each, examples: Back of the envelope calculations, Eng/UX feasibility evaluation, Project timeline, Business model Canvas)
- "anecdotal": Individual stories and observations (weight: 0.5 each, examples: Support by a few product data points, sales request, 1-3 interested customers, one competitor has it)
- "market-data": External market research and industry data (weight: 1.0 each, examples: Supported by surveys, smoke tests, all competitors have it)
- "user-customer": Direct evidence from users/customers (weight: 2.0 each, examples: Lots of product data, top user request, interviews with 20+ users, usability study, MVP)
- "test-results": Systematic testing results (weight: 3.0 each, examples: Longitudinal user studies, large-scale MVP, alpha/beta, A/B experiments)

Guidelines:
- Each indicator should represent a distinct piece of evidence
- Be conservative but fair in your assessment
- If evidence mentions multiple people or sources, count them separately when appropriate
- If evidence is vague or weak, assign fewer indicators
- Return only the JSON object with category IDs and counts

Evidence text to analyze:
${evidenceText}

Respond with JSON in this exact format:
{
  "self-conviction": 0,
  "pitch-deck": 0,
  "thematic-support": 0,
  "others-opinion": 0,
  "estimates-plans": 0,
  "anecdotal": 0,
  "market-data": 0,
  "user-customer": 0,
  "test-results": 0
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert product manager analyzing evidence for confidence scoring. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Ensure all categories are present with default values
    const defaultResult: EvidenceParsingResult = {
      "self-conviction": 0,
      "pitch-deck": 0,
      "thematic-support": 0,
      "others-opinion": 0,
      "estimates-plans": 0,
      "anecdotal": 0,
      "market-data": 0,
      "user-customer": 0,
      "test-results": 0
    };

    return { ...defaultResult, ...result };
  } catch (error) {
    console.error("Error parsing evidence with LLM:", error);
    throw new Error("Failed to parse evidence. Please try again.");
  }
}