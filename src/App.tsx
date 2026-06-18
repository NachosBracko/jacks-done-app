import React, { useState, useEffect } from 'react';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) {
      setStatus('❌ Missing Supabase keys in Vercel');
    } else {
      setStatus('✅ Environment variables loaded. Supabase connection ready (frontend test)');
    }
  }, []);

  const addTask = () => {
    const title = prompt('Task name?');
    if (title) {
      alert('✅ Task added (frontend). Real Supabase save coming in next update.');
      setTasks([...tasks, { id: Date.now(), title, due_date: new Date().toISOString().split('T')[0] }]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-4xl font-bold mb-6">✅ Done</h1>
      <p className="mb-8 text-lg font-medium">{status}</p>

      <button 
        onClick={addTask}
        className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-xl font-semibold mb-8"
      >
        + Add New Task
      </button>

      <h2 className="text-xl mb-4">Tasks</h2>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-slate-400">No tasks yet. Add one above.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="bg-slate-900 p-5 rounded-3xl">
              {task.title} — {task.due_date}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
