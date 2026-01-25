import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const response = await fetch("https://router.huggingface.co/routers/text-generation-queue", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "KuemhappxLgWSCkxTpechMQbgrkKcJVSpm",
        inputs: message,
        parameters: { max_new_tokens: 150 },
      }),
    });

    const data = await response.json();
    console.log("HF Response:", data);

    // Handle different response structures
    let text = "Sorry, I couldn't process that.";
    if (Array.isArray(data) && data[0]?.generated_text) {
      text = data[0].generated_text;
    } else if (data?.generated_text) {
      text = data.generated_text;
    } else if (Array.isArray(data) && typeof data[0] === "string") {
      text = data[0];
    }

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch from Hugging Face" }, { status: 500 });
  }
}
