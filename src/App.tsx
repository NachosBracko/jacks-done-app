import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl ? "✅ Loaded" : "❌ MISSING");
console.log("Supabase Key:", supabaseKey ? "✅ Loaded" : "❌ MISSING");

const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: t } = await supabase.from('tasks').select('*');
      const { data: p } = await supabase.from('projects').select('*');
      setTasks(t || []);
      setProjects(p || []);
      setMessage(`Loaded ${t?.length || 0} tasks and ${p?.length || 0} projects`);
    } catch (err) {
      console.error("Supabase Error:", err);
      setMessage("Error connecting to database");
    }
  };

  const addTask = async () => {
    const title = prompt("Task title?");
    if (!title) return;

    const { error } = await supabase
      .from('tasks')
      .insert([{ title, due_date: new Date().toISOString().split('T')[0], category: 'personal' }]);

    if (error) alert("Error: " + error.message);
    else {
      alert("Task added!");
      loadData();
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">✅ Done</h1>
      
      <button onClick={addTask} className="bg-blue-600 text-white px-6 py-3 rounded-2xl mb-8">
        + Add New Task
      </button>

      <p className="mb-4 text-green-400">{message}</p>

      <h2 className="text-2xl mb-4">Tasks from Database</h2>
      <div className="space-y-3">
        {tasks.length === 0 && <p>No tasks yet...</p>}
        {tasks.map((t: any) => (
          <div key={t.id} className="bg-slate-800 p-4 rounded-2xl">
            {t.title} — {t.due_date}
          </div>
        ))}
      </div>
    </div>
  );
}
