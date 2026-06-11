import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('tasks').select('*').limit(5);
      if (error) throw error;
      setTasks(data || []);
      setStatus(`✅ Connected! Found ${data.length} tasks`);
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Connection error: " + err.message);
    }
  };

  const addTask = async () => {
    const title = prompt("Enter task title:");
    if (!title) return;

    const { error } = await supabase
      .from('tasks')
      .insert([{ title, due_date: new Date().toISOString().split('T')[0] }]);

    if (error) alert("Save failed: " + error.message);
    else {
      alert("✅ Task saved to database!");
      testConnection();
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto text-white">
      <h1 className="text-5xl font-bold mb-8">✅ Done</h1>
      
      <p className="mb-6 text-lg">{status}</p>

      <button 
        onClick={addTask}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-xl mb-8 w-full"
      >
        + Add New Task (Test Save)
      </button>

      <h2 className="text-2xl mb-4">Tasks in Database</h2>
      {tasks.length === 0 ? (
        <p>No tasks yet. Add one above.</p>
      ) : (
        tasks.map((t: any) => (
          <div key={t.id} className="bg-slate-800 p-4 rounded-xl mb-3">
            {t.title} — {t.due_date}
          </div>
        ))
      )}
    </div>
  );
}
