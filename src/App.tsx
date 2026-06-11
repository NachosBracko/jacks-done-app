import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: t } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      const { data: p } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      setTasks(t || []);
      setProjects(p || []);
      setStatus(`✅ Connected | ${t?.length || 0} tasks`);
    } catch (err) {
      console.error(err);
      setStatus("❌ Connection error - check console (F12)");
    }
  };

  const addTask = async () => {
    const title = prompt("Task name?");
    if (!title) return;

    const { error } = await supabase.from('tasks').insert([{
      title,
      due_date: new Date().toISOString().split('T')[0],
      category: 'personal'
    }]);

    if (error) alert("Error: " + error.message);
    else loadData();
  };

  const completeTask = async (id) => {
    await supabase.from('tasks').update({ completed: true }).eq('id', id);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">✅ Done</h1>
        <p className="text-green-400 mb-6">{status}</p>

        <div className="flex gap-2 mb-8 bg-slate-900 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-600' : ''}`}>Dashboard</button>
          <button onClick={() => setActiveTab('projects')} className={`flex-1 py-3 rounded-xl ${activeTab === 'projects' ? 'bg-blue-600' : ''}`}>Projects</button>
        </div>

        {activeTab === 'dashboard' && (
          <div>
            <button onClick={addTask} className="w-full bg-blue-600 py-4 rounded-2xl text-xl font-semibold mb-6 flex items-center justify-center gap-2">
              <Plus /> Add New Task
            </button>

            <div className="space-y-4">
              {tasks.map((task: any) => (
                <div key={task.id} className="bg-slate-900 p-5 rounded-3xl flex justify-between items-center">
                  <div>
                    <div className="font-medium text-lg">{task.title}</div>
                    <div className="text-sm text-slate-400">{task.due_date}</div>
                  </div>
                  <button onClick={() => completeTask(task.id)} className="bg-green-600 px-8 py-3 rounded-2xl">Done</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="text-center py-12 text-slate-400">
            Projects section coming in next update
          </div>
        )}
      </div>
    </div>
  );
}
