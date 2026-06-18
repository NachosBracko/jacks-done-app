import React, { useState, useEffect } from 'react';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    console.log("Supabase URL:", supabaseUrl ? "✅" : "❌");
    setStatus(supabaseUrl ? "✅ Environment variables loaded" : "❌ Missing environment variables");
  }, []);

  const addTask = () => {
    const title = prompt("Task name?");
    if (title) {
      alert("Task added (frontend only for now - Supabase connection needs fixing)");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-4xl font-bold mb-6">✅ Done</h1>
      <p className="mb-8 text-lg">{status}</p>

      <button 
        onClick={addTask}
        className="w-full bg-blue-600 py-4 rounded-2xl text-xl font-semibold mb-8"
      >
        + Add New Task
      </button>

      <p className="text-slate-400">Check console (F12) for more details</p>
    </div>
  );
}
