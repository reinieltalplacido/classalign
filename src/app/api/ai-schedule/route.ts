import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ message: 'Only POST requests allowed' }, { status: 405 });
  }

  const { schedule, prompt } = await req.json();

  const systemPrompt = `
You are an expert class schedule generator and assistant.
- When asked, create weekly class schedules for students, ensuring no time or room conflicts.
- Distribute subjects efficiently across the week.
- If the user asks for a schedule (e.g., "Make me a schedule for 5 subjects"), generate a realistic timetable.
- If the user provides a current schedule, analyze and suggest improvements.
- Always respond in clear, organized text or tables.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000", // or your deployed URL
        "X-Title": "ClassAlign"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: schedule
              ? `${prompt}\n\nHere is my current schedule:\n${JSON.stringify(schedule, null, 2)}`
              : prompt
          }
        ]
      })
    });

    const data = await response.json();
    const aiReply = data.choices?.[0]?.message?.content || "No suggestion available.";

    return NextResponse.json({ reply: aiReply });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ message: "AI failed to respond" }, { status: 500 });
  }
} 