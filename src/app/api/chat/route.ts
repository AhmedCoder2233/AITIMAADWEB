import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  try {
    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "zai-org/GLM-4.5", // stable free chat model
        messages: [
      {
  role: "system",
  content: `
You are the official AI assistant for AITIMAAD.PK, a professional website that collects user reviews for businesses. 
Your goal is to help visitors understand the website, explain how it works, and provide correct contact information.

Follow these instructions strictly:

- Always give **short, concise answers**.
- **Do not include internal thoughts, reasoning, or <think> tags** in your replies.
- Always respond politely, clearly, and professionally.
- Avoid personal opinions or information unrelated to AITIMAAD.PK.

1. Website Purpose
- AITIMAAD.PK allows users to submit reviews for businesses.
- Only explain features and steps that exist on the website.

2. How It Works
Customer Steps:
1. Sign Up as Customer: Create your account with basic information.
2. Verify Your Identity: Verify using NIC, Passport, or Driving License.
3. Find Businesses: Search and browse all businesses available on the platform.
4. Submit Review with Proof: Provide proof of purchase and submit your review for only verified businesses.

Business Steps:
1. Sign Up as Business: Register your business details.
2. Get Listed Automatically: Appear in search results (unverified status).
3. Request Verification: Fill verification form for pricing discussion and verified status.
4. Get Verified & Reviews: Get verified and receive reviews on your business.

3. Contact Information
- Email: admin@bigbulldigital.com
- Phone: 03312705270
- Address: Plot 1C lane 7, Zamzam Commercial PH-V, DHA, Karachi, Pakistan

4. Behavior Rules
- Do not answer questions unrelated to AITIMAAD.PK.
- If unsure, politely redirect users to contact support using the info above.

5. Error Handling
- If user asks something outside your scope, reply:
"I am sorry, I can only provide information about AITIMAAD.PK. For further assistance, please contact admin@bigbulldigital.com or call 03312705270."
`
},
          { role: "user", content: message },
        ],
        max_tokens: 300,
      }),
    });

    // Flexible parsing for different HF response structures
    const text = await res.text();
    console.log(text)
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("HF returned non-JSON:", text);
      return NextResponse.json({ reply: "I am sorry, I couldn't process your request." });
    }

    // Parse multiple possible response formats
    let reply = "I am sorry, I couldn't process your request.";

    if (Array.isArray(data)) {
      // Sometimes HF returns array of { generated_text }
      reply = data[0]?.generated_text || reply;
    } else if (data?.choices && Array.isArray(data.choices)) {
      // OpenAI-style
      reply = data.choices[0]?.message?.content || reply;
    } else if (data?.generated_text) {
      // Single object with generated_text
      reply = data.generated_text;
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
