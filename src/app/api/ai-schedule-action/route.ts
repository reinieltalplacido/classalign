import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../supabase/client';
// import OpenAI or your preferred LLM API
// import { OpenAI } from 'openai';

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { prompt, schedule, user } = await req.json();

  // 1. Use OpenAI or similar to parse the prompt for action and details
  // For demo, we'll use a simple regex-based mock parser
  // In production, replace this with a real LLM call
  let action = null;
  let classData: { subject?: string; day?: string; time?: string } = {};
  let responseText = '';

  const addMatch = prompt.match(/add (?:a|an)? ?(.+?) class on (\w+) at ([\d:apm ]+)/i);
  const editMatch = prompt.match(/edit (.+?) class (.+)/i);
  const deleteMatch = prompt.match(/delete (.+?) class/i);

  if (addMatch) {
    action = 'add';
    classData = {
      subject: addMatch[1],
      day: addMatch[2],
      time: addMatch[3],
    };
  } else if (editMatch) {
    action = 'edit';
    // For demo, not implemented
  } else if (deleteMatch) {
    action = 'delete';
    classData = { subject: deleteMatch[1] };
  }

  if (!action) {
    return NextResponse.json({ reply: "Sorry, I couldn't understand your request.", schedule });
  }

  // 2. Perform the action on Supabase
  let newSchedule = schedule;
  if (action === 'add') {
    // Add class to Supabase
    const { error } = await supabase.from('classes').insert([
      {
        user_id: user.id,
        subject: classData.subject,
        day: classData.day,
        time: classData.time,
      },
    ]);
    if (error) {
      return NextResponse.json({ reply: 'Failed to add class.', schedule });
    }
    responseText = `Added ${classData.subject} class on ${classData.day} at ${classData.time}.`;
  } else if (action === 'delete') {
    // Delete class from Supabase
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('user_id', user.id)
      .eq('subject', classData.subject);
    if (error) {
      return NextResponse.json({ reply: 'Failed to delete class.', schedule });
    }
    responseText = `Deleted ${classData.subject} class.`;
  } else if (action === 'edit') {
    responseText = 'Edit functionality is not implemented in this demo.';
  }

  // 3. Fetch updated schedule
  const { data: updatedSchedule } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ reply: responseText, schedule: updatedSchedule });
} 