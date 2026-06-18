import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks(data || []);
      setStatus(`✅ Connected | ${data.length} tasks`);
    } catch (err: any) {
      console.error(err);
      setStatus('❌ Connection error - check console (F12)');
    }
  };

  const addTask = async () => {
    const title = prompt('Task name?');
    if (!title) return;

    const { error } = await supabase.from('tasks').insert([{
      title,
      due_date: new Date().toISOString().split('T')[0],
      category: 'personal'
    }]);

    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('✅ Task saved!');
      loadTasks();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-4xl font-bold mb-6">✅ Done</h1>
      <p className="mb-6 text-green-400">{status}</p>

      <button 
        onClick={addTask}
        className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-xl font-semibold mb-8"
      >
        + Add New Task
      </button>

      <h2 className="text-xl mb-4">Tasks</h2>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="bg-slate-900 p-5 rounded-3xl">
            {task.title} — {task.due_date}
          </div>
        ))}
      </div>
    </div>
  );
}
