"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain,
  Send,
  User,
  Bot,
  ArrowLeft,
  Upload,
  Calendar,
} from "lucide-react";
import Link from "next/link";

type ScheduleItem = {
  subject: string;
  day: string;
  time: string;
  room: string;
  professor: string;
};

type ChatMessage = {
  id: number;
  type: "user" | "ai";
  message: string;
  timestamp: Date;
  schedule?: ScheduleItem[];
};

export default function AIChatPage() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: "ai",
      message:
        "Hello! I'm your dedicated AI Schedule Assistant. I can help you create, optimize, and manage your class schedule. You can also share your current schedule with me for personalized suggestions. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Mock schedule data that could be sent
  const mockSchedule = [
    {
      subject: "Computer Science 101",
      day: "Monday",
      time: "09:00 - 10:30",
      room: "Room A-101",
      professor: "Dr. Smith",
    },
    {
      subject: "Mathematics",
      day: "Monday",
      time: "11:00 - 12:30",
      room: "Room B-205",
      professor: "Prof. Johnson",
    },
    {
      subject: "Physics Lab",
      day: "Tuesday",
      time: "14:00 - 16:00",
      room: "Lab C-301",
      professor: "Dr. Wilson",
    },
    {
      subject: "English Literature",
      day: "Wednesday",
      time: "10:00 - 11:30",
      room: "Room D-102",
      professor: "Prof. Davis",
    },
    {
      subject: "Chemistry",
      day: "Thursday",
      time: "13:00 - 14:30",
      room: "Lab E-201",
      professor: "Dr. Brown",
    },
  ];

  const askAIScheduler = async (prompt: string, currentSchedule?: any[]) => {
    const res = await fetch('/api/ai-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, schedule: currentSchedule })
    });
    const data = await res.json();
    return data.reply;
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: chatMessages.length + 1,
      type: "user",
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMessage]);
    setChatInput("");
    setIsTyping(true);

    // Call your backend API for the AI response
    const aiReply = await askAIScheduler(chatInput);

    const aiResponse: ChatMessage = {
      id: chatMessages.length + 2,
      type: "ai",
      message: aiReply,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const handleSendSchedule = () => {
    const scheduleMessage: ChatMessage = {
      id: chatMessages.length + 1,
      type: "user",
      message: "Here's my current schedule:",
      timestamp: new Date(),
      schedule: mockSchedule,
    };

    setChatMessages([...chatMessages, scheduleMessage]);
    setIsTyping(true);

    // AI response to receiving schedule
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: chatMessages.length + 2,
        type: "ai",
        message:
          "Thank you for sharing your schedule! I can see you have 5 classes this week:\n\n• Monday: CS 101 (9:00-10:30), Math (11:00-12:30)\n• Tuesday: Physics Lab (14:00-16:00)\n• Wednesday: English Literature (10:00-11:30)\n• Thursday: Chemistry (13:00-14:30)\n\nI notice you have good distribution but some optimization opportunities. Would you like me to suggest improvements for better time management and study blocks?",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Brain className="text-purple-500" size={24} />
                <h1 className="text-xl font-bold">AI Schedule Assistant</h1>
              </div>
            </div>
            <Button
              onClick={handleSendSchedule}
              className="flex items-center gap-2"
              variant="outline"
            >
              <Upload size={16} />
              Send My Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={20} />
              One-on-One Schedule Chat
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Chat Messages */}
            <div className="h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 space-y-4 mb-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      message.type === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-purple-500 text-white"
                      }`}
                    >
                      {message.type === "user" ? (
                        <User size={18} />
                      ) : (
                        <Bot size={18} />
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-4 ${
                        message.type === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-white border shadow-sm"
                      }`}
                    >
                      <div className="whitespace-pre-line text-sm">
                        {message.message}
                      </div>
                      {message.schedule && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border">
                          <div className="text-xs font-semibold mb-2 text-blue-900">
                            📅 Schedule Details:
                          </div>
                          {message.schedule.map((cls: ScheduleItem, index: number) => (
                            <div
                              key={index}
                              className="text-xs text-blue-800 mb-1"
                            >
                              <strong>{cls.subject}</strong> - {cls.day} {cls.time} ({cls.room})
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-500 text-white">
                      <Bot size={18} />
                    </div>
                    <div className="bg-white border shadow-sm rounded-lg p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-3">
              <Input
                placeholder="Ask me anything about your schedule, request optimizations, or get personalized suggestions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={isTyping || !chatInput.trim()}
              >
                <Send size={16} />
              </Button>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChatInput("Can you help me optimize my current schedule?");
                }}
                disabled={isTyping}
              >
                Optimize Schedule
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChatInput("I want to add a new class to my schedule");
                }}
                disabled={isTyping}
              >
                Add New Class
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChatInput("Check my schedule for any conflicts");
                }}
                disabled={isTyping}
              >
                Check Conflicts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChatInput("Show me my free time blocks this week");
                }}
                disabled={isTyping}
              >
                Free Time Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChatInput("Make me a weekly class schedule for 5 subjects.");
                }}
                disabled={isTyping}
              >
                Generate 5-Subject Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
