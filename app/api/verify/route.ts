import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// 🔒 PRIVATE PROMPT (NOT EXPOSED TO USERS)
const INTERNAL_PROMPT = `
You are an image verification system.

Analyze the given image and return STRICT JSON:

{
  "face_detected": boolean,
  "tampered": boolean,
  "confidence": number
}

Do not return anything except JSON.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, image_url } = body;

    // ✅ Token check
    if (token !== process.env.API_SECRET_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!image_url) {
      return NextResponse.json(
        { error: "image_url required" },
        { status: 400 }
      );
    }

    // 🤖 Hidden prompt is used here (user NEVER sees it)
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: INTERNAL_PROMPT },
            {
              type: "input_image",
              image_url: image_url,
            },
          ],
        },
      ],
    });

    return NextResponse.json({
      status: "success",
      result: response.output[0].content[0],
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
