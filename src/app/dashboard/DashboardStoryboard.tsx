"use client";

import React, { useState, useEffect } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Plus,
  BookOpen,
  MapPin,
  Users,
  TrendingUp,
  Brain,
  Edit,
  Trash2,
  AlertCircle,
  Send,
  User,
  Bot,
  Printer,
  Download,
  FileText,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { createClient } from "../../../supabase/client";
import { toast } from "@/components/ui/use-toast";

type ClassItem = {
  id: string;
  user_id: string;
  subject: string;
  day: string;
  time: string;
  room?: string;
  professor?: string;
  color?: string;
  created_at?: string;
};

function getTimeSlots(classes: { time?: string }[]): string[] {
  // Helper to parse time string (e.g., '07:00') to minutes
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  // Helper to format minutes to 'h:mm AM/PM'
  const toTime = (min: number) => {
    let h = Math.floor(min / 60);
    const m = min % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  };
  let minTime = 7 * 60; // 07:00
  let maxTime = 18 * 60; // 18:00
  classes.forEach((cls) => {
    if (cls.time) {
      // Support both 'HH:MM' and 'HH:MM - HH:MM'
      const [start, end] = cls.time.split("-").map((s) => s.trim());
      if (start && /^\d{2}:\d{2}$/.test(start)) {
        minTime = Math.min(minTime, toMinutes(start));
      }
      if (end && /^\d{2}:\d{2}$/.test(end)) {
        maxTime = Math.max(maxTime, toMinutes(end));
      }
    }
  });
  // Generate slots every hour from minTime to maxTime (inclusive)
  const slots: string[] = [];
  for (let t = minTime; t <= maxTime; t += 60) {
    slots.push(toTime(t));
  }
  return slots;
}

// Move parseTimeToMinutes outside the component
function parseTimeToMinutes(t: string): number {
  t = t.trim();
  if (/AM|PM/i.test(t)) {
    // 12-hour format
    const [time, ampm] = t.split(/\s+/);
    let [h, m] = time.split(":").map(Number);
    if (ampm.toUpperCase() === "PM" && h !== 12) h += 12;
    if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
    return h * 60 + (m || 0);
  } else {
    // 24-hour format
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  }
}

export default function DashboardStoryboard() {
  const supabase = createClient();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addClassModalOpen, setAddClassModalOpen] = useState(false);
  const [addClassLoading, setAddClassLoading] = useState(false);
  const [addClassError, setAddClassError] = useState<string | null>(null);
  const [addClassForm, setAddClassForm] = useState({
    subject: "",
    day: "",
    time: "",
    room: "",
    professor: "",
    color: "",
  });

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      type: "ai",
      message:
        "Hi! I'm your AI Schedule Assistant. I can help you create and optimize your class schedule. What would you like to do today?",
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Add user state
  const [userInfo, setUserInfo] = useState<{ id?: string; name?: string; email?: string }>({});

  // Floating AI Chat state
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Add state for edit/delete modals and selected class
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [editForm, setEditForm] = useState({
    subject: "",
    day: "",
    time: "",
    room: "",
    professor: "",
    color: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add state for delete all classes modal
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState<string | null>(null);

  // Fetch user and classes on mount
  useEffect(() => {
    const fetchUserAndClasses = async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Could not get user. Please sign in.");
        setLoading(false);
        return;
      }
      // Set user info (prefer full_name, then name, then email)
      setUserInfo({
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        email: user.email,
      });
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) {
        setError("Failed to load classes.");
        setLoading(false);
        return;
      }
      setClasses(data || []);
      setLoading(false);
    };
    fetchUserAndClasses();
  }, []);

  // Add class handler
  const handleAddClass = async () => {
    setAddClassLoading(true);
    setAddClassError(null);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setAddClassError("Could not get user. Please sign in.");
      setAddClassLoading(false);
      return;
    }
    const { error } = await supabase.from('classes').insert([
      {
        user_id: user.id,
        ...addClassForm,
      },
    ]);
    if (error) {
      setAddClassError("Failed to add class.");
      setAddClassLoading(false);
      return;
    }
    // Show toast on success
    toast({
      title: "Class added!",
      description: "Your class was added successfully.",
    });
    // Refresh classes
    const { data, error: fetchError } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setClasses(data || []);
    setAddClassLoading(false);
    setAddClassModalOpen(false);
    setAddClassForm({ subject: "", day: "", time: "", room: "", professor: "", color: "" });
  };

  // Replace timeSlots definition in component
  const timeSlots = getTimeSlots(classes);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const getClassForTimeSlot = (day: string, time: string) => {
    return classes.find((cls: ClassItem) => {
      const classStartTime = cls.time.split(" - ")[0];
      // Compare in minutes
      return (
        cls.day === day &&
        parseTimeToMinutes(classStartTime) === parseTimeToMinutes(time)
      );
    });
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage = {
      id: chatMessages.length + 1,
      type: "user",
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMessage]);
    setChatInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: chatMessages.length + 2,
        type: "ai",
        message: getAIResponse(chatInput),
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    if (input.includes("schedule") || input.includes("class")) {
      return "I can help you create a schedule! What subjects do you need to schedule? Please tell me the course names, preferred days, and any time constraints you have.";
    } else if (input.includes("optimize") || input.includes("improve")) {
      return "I notice you have some gaps in your current schedule. I can suggest moving your Chemistry class to Tuesday at 2 PM to create better study blocks. Would you like me to apply this change?";
    } else if (input.includes("conflict") || input.includes("overlap")) {
      return "I'll check for any scheduling conflicts. Currently, your schedule looks good with no overlapping classes. All your classes have appropriate time gaps between them.";
    } else {
      return "I'm here to help with your class scheduling! You can ask me to create schedules, optimize existing ones, check for conflicts, or get suggestions for better time management.";
    }
  };

  const handlePrint = () => {
    const scheduleElement = document.getElementById("schedule-container");
    if (!scheduleElement) return window.print();
    const printContents = scheduleElement.outerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const handleSavePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).jsPDF;

      const scheduleElement = document.getElementById("schedule-container");
      if (!scheduleElement) {
        alert("Schedule not found");
        return;
      }

      const canvas = await html2canvas(scheduleElement, {
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4"); // landscape orientation

      const imgWidth = 297; // A4 width in mm (landscape)
      const pageHeight = 210; // A4 height in mm (landscape)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Use userInfo.name or fallback to email for PDF filename
      const displayName = userInfo.name || userInfo.email || "Schedule";
      pdf.save(`${displayName.replace(/\s+/g, "_")}_Schedule.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Edit handler
  const handleEditClass = async () => {
    if (!selectedClass) return;
    setEditLoading(true);
    setEditError(null);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setEditError("Could not get user. Please sign in.");
      setEditLoading(false);
      return;
    }
    const { error } = await supabase
      .from('classes')
      .update({ ...editForm })
      .eq('id', selectedClass.id)
      .eq('user_id', user.id);
    if (error) {
      setEditError("Failed to update class.");
      setEditLoading(false);
      return;
    }
    toast({ title: "Class updated!", description: "Your class was updated successfully." });
    // Refresh classes
    const { data, error: fetchError } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setClasses(data || []);
    setEditLoading(false);
    setEditModalOpen(false);
    setSelectedClass(null);
  };

  // Delete handler
  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    setDeleteLoading(true);
    setDeleteError(null);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setDeleteError("Could not get user. Please sign in.");
      setDeleteLoading(false);
      return;
    }
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', selectedClass.id)
      .eq('user_id', user.id);
    if (error) {
      setDeleteError("Failed to delete class.");
      setDeleteLoading(false);
      return;
    }
    toast({ title: "Class deleted!", description: "Your class was deleted successfully." });
    // Refresh classes
    const { data, error: fetchError } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setClasses(data || []);
    setDeleteLoading(false);
    setDeleteModalOpen(false);
    setSelectedClass(null);
  };

  // Delete all classes handler
  const handleDeleteAllClasses = async () => {
    setDeleteAllLoading(true);
    setDeleteAllError(null);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setDeleteAllError("Could not get user. Please sign in.");
      setDeleteAllLoading(false);
      return;
    }
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('user_id', user.id);
    if (error) {
      setDeleteAllError("Failed to delete all classes.");
      setDeleteAllLoading(false);
      return;
    }
    toast({ title: "All classes deleted!", description: "All your classes were deleted successfully." });
    // Refresh classes
    const { data, error: fetchError } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setClasses(data || []);
    setDeleteAllLoading(false);
    setDeleteAllModalOpen(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ClassAlign Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {userInfo.name || userInfo.email || "User"}!
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog open={addClassModalOpen} onOpenChange={setAddClassModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Class
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Plus size={20} /> Add New Class
                    </DialogTitle>
                    <DialogDescription>
                      Quickly add a new class to your schedule
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="e.g., Advanced Calculus"
                        value={addClassForm.subject}
                        onChange={e => setAddClassForm({ ...addClassForm, subject: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="day">Day</Label>
                        <Select
                          value={addClassForm.day}
                          onValueChange={value => setAddClassForm({ ...addClassForm, day: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {days.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          placeholder="09:00 - 10:30"
                          value={addClassForm.time}
                          onChange={e => setAddClassForm({ ...addClassForm, time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="room">Room</Label>
                        <Input
                          id="room"
                          placeholder="e.g., Room A-101"
                          value={addClassForm.room}
                          onChange={e => setAddClassForm({ ...addClassForm, room: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="professor">Professor</Label>
                        <Input
                          id="professor"
                          placeholder="e.g., Dr. Smith"
                          value={addClassForm.professor}
                          onChange={e => setAddClassForm({ ...addClassForm, professor: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      <Label htmlFor="color" className="mb-0">Color</Label>
                      <input
                        id="color"
                        type="color"
                        value={addClassForm.color || "#a3a3a3"}
                        onChange={e => setAddClassForm({ ...addClassForm, color: e.target.value })}
                        className="w-8 h-8 border rounded shadow-sm cursor-pointer"
                        style={{ padding: 0, background: 'none' }}
                      />
                    </div>
                    {addClassError && (
                      <div className="text-red-500 text-sm">{addClassError}</div>
                    )}
                    <Button className="w-full" onClick={handleAddClass} disabled={addClassLoading}>
                      {addClassLoading ? 'Adding...' : 'Add Class'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={deleteAllModalOpen} onOpenChange={setDeleteAllModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center gap-2">
                    <Trash2 size={16} />
                    Delete All
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Trash2 size={20} /> Delete All Classes
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete <b>all</b> your classes? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  {deleteAllError && (
                    <div className="text-red-500 text-sm mb-2">{deleteAllError}</div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button variant="destructive" onClick={handleDeleteAllClasses} disabled={deleteAllLoading}>
                      {deleteAllLoading ? 'Deleting...' : 'Delete All'}
                    </Button>
                    <Button variant="outline" onClick={() => setDeleteAllModalOpen(false)} disabled={deleteAllLoading}>
                      Cancel
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handlePrint}
              >
                <Printer size={16} />
                Print
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleSavePDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Save PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Classes
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classes.length}</div>
                <p className="text-xs text-muted-foreground">This semester</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">Hours scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Free Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">28</div>
                <p className="text-xs text-muted-foreground">Hours available</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Efficiency
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">
                  Schedule optimization
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Calendar View */}
          <Card id="schedule-container">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Weekly Schedule
              </CardTitle>
              <CardDescription>
                Your class schedule for this week. Click on any class to edit or
                view details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-6 gap-2 min-w-[800px]">
                  {/* Header row */}
                  <div className="p-3 font-semibold text-center bg-gray-100 rounded-lg">
                    Time
                  </div>
                  {days.map((day) => (
                    <div
                      key={day}
                      className="p-3 font-semibold text-center bg-gray-100 rounded-lg"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Time slots */}
                  {timeSlots.map((time) => (
                    <React.Fragment key={time}>
                      <div className="p-3 text-sm text-gray-600 text-center border-r">
                        {time}
                      </div>
                      {days.map((day) => {
                        const classData = getClassForTimeSlot(day, time);
                        return (
                          <div
                            key={`${day}-${time}`}
                            className="p-1 min-h-[60px] border border-gray-200 rounded"
                          >
                            {classData && (
                              <div
                                className={`${classData.color ?? "bg-gray-200 text-black"} p-2 rounded text-xs h-full flex flex-col justify-between cursor-pointer hover:opacity-90 transition-opacity`}
                                style={{ backgroundColor: classData.color || '#e5e7eb', color: '#000' }}
                              >
                                <div>
                                  <div className="font-semibold truncate">
                                    {classData.subject}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <MapPin size={10} />
                                    <span className="truncate">
                                      {classData.room}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-end gap-1 mt-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 hover:bg-white/20"
                                    onClick={() => {
                                      setSelectedClass(classData);
                                      setEditForm({
                                        subject: classData.subject || "",
                                        day: classData.day || "",
                                        time: classData.time || "",
                                        room: classData.room || "",
                                        professor: classData.professor || "",
                                        color: classData.color || "",
                                      });
                                      setEditModalOpen(true);
                                    }}
                                  >
                                    <Edit size={10} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-5 w-5 p-0 hover:bg-white/20"
                                    onClick={() => {
                                      setSelectedClass(classData);
                                      setDeleteModalOpen(true);
                                    }}
                                  >
                                    <Trash2 size={10} />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & AI Suggestions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Schedule Assistant with Chat - removed */}
          </div>

          {/* Recent Classes & Upcoming */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Classes</CardTitle>
                <CardDescription>Your schedule for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classes.slice(0, 3).map((cls: ClassItem) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${cls.color}`}
                        ></div>
                        <div>
                          <div className="font-medium text-sm">
                            {cls.subject}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center gap-2">
                            <Clock size={10} />
                            {cls.time}
                            <MapPin size={10} />
                            {cls.room}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">Today</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Overview</CardTitle>
                <CardDescription>
                  Weekly statistics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Classes per day
                    </span>
                    <span className="font-semibold">2.4 avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Busiest day</span>
                    <Badge>Monday</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Free time blocks
                    </span>
                    <span className="font-semibold">8 slots</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Schedule conflicts
                    </span>
                    <Badge variant="destructive">0</Badge>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" className="w-full">
                      View Detailed Analytics
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Print & Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Print & Export
              </CardTitle>
              <CardDescription>
                Save or print your schedule for offline use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Printer className="mx-auto mb-2 text-blue-500" size={32} />
                  <h3 className="font-semibold mb-1">Print Schedule</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Print your weekly schedule directly from your browser
                  </p>
                  <Button onClick={handlePrint} className="w-full">
                    <Printer size={16} className="mr-2" />
                    Print Now
                  </Button>
                </div>

                <div className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="mx-auto mb-2 text-green-500" size={32} />
                  <h3 className="font-semibold mb-1">Save as PDF</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Download your schedule as a PDF file for sharing
                  </p>
                  <Button
                    onClick={handleSavePDF}
                    disabled={isGeneratingPDF}
                    className="w-full"
                  >
                    {isGeneratingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        Save PDF
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center p-4 border rounded-lg bg-gray-50">
                  <Calendar
                    className="mx-auto mb-2 text-purple-500"
                    size={32}
                  />
                  <h3 className="font-semibold mb-1">Export Options</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    More export formats coming soon
                  </p>
                  <Button variant="outline" disabled className="w-full">
                    <FileText size={16} className="mr-2" />
                    Coming Soon
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 rounded-full p-1">
                    <AlertCircle size={16} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      Print Tips
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>
                        • For best print quality, use landscape orientation
                      </li>
                      <li>
                        • Ensure your browser's print settings include
                        background colors
                      </li>
                      <li>
                        • PDF files are automatically named with your name and
                        date
                      </li>
                      <li>
                        • Large schedules may span multiple pages when printed
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Floating AI Chat Button & Overlay */}
        <div>
          {/* Floating Button */}
          {!aiChatOpen && (
            <button
              className="fixed bottom-6 right-6 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center transition-all duration-200"
              onClick={() => setAiChatOpen(true)}
              aria-label="Open AI Chat"
            >
              <Brain size={32} />
            </button>
          )}
          {/* Chat Overlay */}
          {aiChatOpen && (
            <div className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[90vw] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-purple-600 text-white">
                <span className="font-semibold flex items-center gap-2"><Brain size={18} /> AI Chat</span>
                <button onClick={() => setAiChatOpen(false)} aria-label="Close AI Chat" className="hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>
              <div className="p-2 bg-gray-50 flex-1 min-h-[350px] max-h-[400px] overflow-y-auto">
                <AIChatModalContent schedule={classes} userInfo={userInfo} setSchedule={setClasses} />
              </div>
            </div>
          )}
        </div>
        {/* Edit Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
              <DialogDescription>Update your class details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-subject">Subject</Label>
                <Input
                  id="edit-subject"
                  value={editForm.subject}
                  onChange={e => setEditForm({ ...editForm, subject: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-day">Day</Label>
                  <Select
                    value={editForm.day}
                    onValueChange={value => setEditForm({ ...editForm, day: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input
                    id="edit-time"
                    value={editForm.time}
                    onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-room">Room</Label>
                  <Input
                    id="edit-room"
                    value={editForm.room}
                    onChange={e => setEditForm({ ...editForm, room: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-professor">Professor</Label>
                  <Input
                    id="edit-professor"
                    value={editForm.professor}
                    onChange={e => setEditForm({ ...editForm, professor: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Label htmlFor="edit-color" className="mb-0">Color</Label>
                <input
                  id="edit-color"
                  type="color"
                  value={editForm.color || "#a3a3a3"}
                  onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                  className="w-8 h-8 border rounded shadow-sm cursor-pointer"
                  style={{ padding: 0, background: 'none' }}
                />
              </div>
              {editError && <div className="text-red-500 text-sm">{editError}</div>}
              <Button className="w-full" onClick={handleEditClass} disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Delete Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Class</DialogTitle>
              <DialogDescription>Are you sure you want to delete this class? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            {deleteError && <div className="text-red-500 text-sm mb-2">{deleteError}</div>}
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" onClick={handleDeleteClass} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function AIChatModalContent({ schedule, userInfo, setSchedule }: { schedule: any[], userInfo: { id?: string; name?: string; email?: string }, setSchedule: (s: any[]) => void }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "ai",
      message: schedule.length === 0
        ? "You have no classes scheduled yet. Ask me to add one!"
        : "Analyzing your current schedule...",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  React.useEffect(() => {
    if (!hasAnalyzed) {
      analyzeSchedule();
      setHasAnalyzed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyzeSchedule = async () => {
    setIsTyping(true);
    try {
      const res = await fetch('/api/ai-schedule-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: "Analyze my current schedule and suggest improvements.", schedule, user: userInfo })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.schedule) setSchedule(data.schedule);
      const aiResponse = {
        id: Date.now() + Math.random(),
        type: "ai",
        message: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: Date.now() + Math.random(),
        type: "ai",
        message: "Sorry, I couldn't connect to the AI service. Please try again later.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = {
      id: Date.now() + Math.random(),
      type: "user",
      message: input,
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);
    setInput("");
    setIsTyping(true);
    try {
      const res = await fetch('/api/ai-schedule-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, schedule, user: userInfo })
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.schedule) setSchedule(data.schedule);
      const aiResponse = {
        id: Date.now() + Math.random(),
        type: "ai",
        message: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        id: Date.now() + Math.random(),
        type: "ai",
        message: "Sorry, I couldn't connect to the AI service. Please try again later.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div>
      <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50 space-y-3 mb-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex gap-2 max-w-[80%] ${
                message.type === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-purple-500 text-white"
                }`}
              >
                {message.type === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`rounded-lg p-3 text-sm ${
                  message.type === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white border shadow-sm"
                }`}
              >
                {message.message}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="flex gap-2 max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500 text-white">
                <Bot size={16} />
              </div>
              <div className="bg-white border shadow-sm rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="Ask the AI about your schedule..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          disabled={isTyping}
        />
        <Button onClick={handleSend} size="icon" disabled={isTyping || !input.trim()}>
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
} 