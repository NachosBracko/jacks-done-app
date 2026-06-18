import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects'>('dashboard');
  const [status, setStatus] = useState('Loading...');

  // Load data from Supabase when the app starts
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setTasks(tasksData || []);
      setProjects(projectsData || []);
      setStatus(`✅ Connected | ${tasksData?.length || 0} tasks`);
    } catch (error: any) {
      console.error('Supabase error:', error);
      setStatus('❌ Failed to connect to database');
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
      alert('Error saving task: ' + error.message);
    } else {
      loadData(); // Refresh the list
    }
  };

  const completeTask = async (id: string) => {
    await supabase.from('tasks').update({ completed: true }).eq('id', id);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3">
            ✅ Done
          </h1>
          <div className="text-sm text-green-400">{status}</div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900 rounded-2xl p-1 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 rounded-xl font-medium ${activeTab === 'dashboard' ? 'bg-blue-600' : ''}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-3 rounded-xl font-medium ${activeTab === 'projects' ? 'bg-blue-600' : ''}`}
          >
            Projects
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <button
              onClick={addTask}
              className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-lg font-semibold mb-8 flex items-center justify-center gap-2"
            >
              <Plus size={22} /> Add New Task
            </button>

            <h2 className="text-xl font-semibold mb-4">Today's Tasks</h2>

            <div className="space-y-3">
              {tasks.length === 0 && (
                <p className="text-slate-400">No tasks yet. Add one above.</p>
              )}
              {tasks.map((task) => (
                <div key={task.id} className="bg-slate-900 rounded-3xl p-5 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-slate-400">{task.due_date}</div>
                  </div>
                  <button
                    onClick={() => completeTask(task.id)}
                    className="bg-green-600 px-6 py-2 rounded-2xl text-sm"
                  >
                    Done
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="text-center py-12">
            <h2 className="text-2xl mb-4">Projects</h2>
            <p className="text-slate-400">Car flips and repairs will go here.</p>
            <p className="text-slate-500 text-sm mt-2">(Coming in next update)</p>
          </div>
        )}
      </div>
    </div>
  );
}
