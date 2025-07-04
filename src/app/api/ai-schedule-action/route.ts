import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../supabase/client';
// import OpenAI or your preferred LLM API
// import { OpenAI } from 'openai';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { prompt, schedule, user } = await req.json();

  // 1. Use OpenRouter to extract intent
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    console.error('OpenRouter API key is missing.');
    return NextResponse.json({ reply: 'AI service is not configured. Please contact support.', schedule });
  }

  // Compose the system prompt for intent extraction
  const systemPrompt = `
You are a helpful assistant for a class scheduling app. 
Extract the user's intent from their message. 
Return a JSON object with these fields: action (add, edit, delete), subject, day, time. 
If the user wants to delete all classes, set action to 'delete_all'.
If you cannot extract intent, reply with {"error": "Sorry, I couldn't understand your request."}
User message: "${prompt}"
`;

  // Call OpenRouter API
  let aiIntent;
  let openrouterRes;
  let openrouterData;
  let openrouterText;
  let intentExtractionFailed = false;
  try {
    openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-maverick:free',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for a class scheduling app.' },
          { role: 'user', content: systemPrompt },
        ],
        max_tokens: 100,
        temperature: 0,
      }),
    });
    openrouterText = await openrouterRes.text();
    try {
      openrouterData = JSON.parse(openrouterText);
    } catch (jsonErr) {
      console.error('OpenRouter API returned non-JSON:', openrouterText);
      intentExtractionFailed = true;
    }
    if (!openrouterRes.ok) {
      console.error('OpenRouter API error:', openrouterRes.status, openrouterData);
      intentExtractionFailed = true;
    }
    if (!intentExtractionFailed) {
      const content = openrouterData.choices?.[0]?.message?.content;
      if (!content) {
        console.error('OpenRouter API missing content:', openrouterData);
        intentExtractionFailed = true;
      } else {
        try {
          aiIntent = JSON.parse(content);
        } catch (parseErr) {
          console.error('AI intent JSON parse error:', content);
          intentExtractionFailed = true;
        }
      }
    }
  } catch (e) {
    console.error('OpenRouter API fetch error:', e);
    if (openrouterRes) {
      console.error('OpenRouter API response (raw):', openrouterText);
    }
    intentExtractionFailed = true;
  }

  // If intent extraction failed, fallback to general chat
  if (intentExtractionFailed || aiIntent?.error) {
    // Fallback: general chat
    try {
      const generalChatRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openrouterKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-maverick:free',
          messages: [
            { role: 'user', content: prompt },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });
      const generalChatText = await generalChatRes.text();
      let generalChatData;
      try {
        generalChatData = JSON.parse(generalChatText);
      } catch (jsonErr) {
        console.error('General chat API returned non-JSON:', generalChatText);
        return NextResponse.json({ reply: 'AI service returned an invalid response. Please try again later.', schedule });
      }
      if (!generalChatRes.ok) {
        console.error('General chat API error:', generalChatRes.status, generalChatData);
        return NextResponse.json({ reply: 'AI service is currently unavailable. Please try again later.', schedule });
      }
      const chatContent = generalChatData.choices?.[0]?.message?.content;
      if (!chatContent) {
        console.error('General chat API missing content:', generalChatData);
        return NextResponse.json({ reply: 'AI service did not return a valid response. Please try again.', schedule });
      }
      return NextResponse.json({ reply: chatContent, schedule });
    } catch (e) {
      console.error('General chat API fetch error:', e);
      return NextResponse.json({ reply: 'AI service is unreachable. Please check your connection or try again later.', schedule });
    }
  }

  // 2. Perform the action on Supabase
  let responseText = '';
  if (aiIntent.action === 'add') {
    const { subject, day, time } = aiIntent;
    if (!subject || !day || !time) {
      return NextResponse.json({ reply: 'Please specify subject, day, and time to add a class.', schedule });
    }
    const { error } = await supabase.from('classes').insert([
      {
        user_id: user.id,
        subject,
        day,
        time,
      },
    ]);
    if (error) {
      return NextResponse.json({ reply: 'Failed to add class.', schedule });
    }
    responseText = `Added ${subject} class on ${day} at ${time}.`;
  } else if (aiIntent.action === 'delete') {
    const { subject } = aiIntent;
    if (!subject) {
      return NextResponse.json({ reply: 'Please specify the subject to delete.', schedule });
    }
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('user_id', user.id)
      .eq('subject', subject);
    if (error) {
      return NextResponse.json({ reply: 'Failed to delete class.', schedule });
    }
    responseText = `Deleted ${subject} class.`;
  } else if (aiIntent.action === 'edit') {
    const { subject, day, time } = aiIntent;
    if (!subject || !day || !time) {
      return NextResponse.json({ reply: 'Please specify subject, day, and time to edit a class.', schedule });
    }
    const { error } = await supabase
      .from('classes')
      .update({ day, time })
      .eq('user_id', user.id)
      .eq('subject', subject);
    if (error) {
      return NextResponse.json({ reply: 'Failed to edit class.', schedule });
    }
    responseText = `Updated ${subject} class to ${day} at ${time}.`;
  } else if (aiIntent.action === 'delete_all') {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('user_id', user.id);
    if (error) {
      return NextResponse.json({ reply: 'Failed to delete all classes.', schedule });
    }
    responseText = 'Deleted all classes.';
  } else {
    return NextResponse.json({ reply: "Sorry, I couldn't understand your request.", schedule });
  }

  // 3. Fetch updated schedule
  const { data: updatedSchedule } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ reply: responseText, schedule: updatedSchedule });
} 