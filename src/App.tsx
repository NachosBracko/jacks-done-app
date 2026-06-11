import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Trash2 } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const { data: t } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      const { data: p } = await supabase.from('projects').select('*');
      setTasks(t || []);
      setProjects(p || []);
      setStatus(`✅ Loaded ${t?.length || 0} tasks`);
    } catch (e) {
      setStatus("❌ Database connection issue");
      console.error(e);
    }
  };

  const addTask = async () => {
    const title = prompt("Task name?");
    if (!title) return;

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ 
        title, 
        due_date: new Date().toISOString().split('T')[0],
        category: 'personal'
      }])
      .select();

    if (error) alert("Error saving: " + error.message);
    else {
      alert("✅ Saved to database!");
      loadAllData();
    }
  };

  const completeTask = async (id) => {
    await supabase.from('tasks').update({ completed: true }).eq('id', id);
    loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">✅ Done</h1>
        <p className="text-green-400 mb-8">{status}</p>

        <button 
          onClick={addTask}
          className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-xl font-semibold mb-8 flex items-center justify-center gap-2"
        >
          <Plus size={24} /> Add New Task
        </button>

        <h2 className="text-2xl mb-4">Tasks</h2>
        <div className="space-y-3">
          {tasks.map((task: any) => (
            <div key={task.id} className="bg-slate-900 rounded-3xl p-5 flex justify-between items-center">
              <div>
                <div className="font-medium">{task.title}</div>
                <div className="text-sm text-slate-400">{task.due_date}</div>
              </div>
              <button 
                onClick={() => completeTask(task.id)}
                className="bg-green-600 px-6 py-2 rounded-2xl"
              >
                Done
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
