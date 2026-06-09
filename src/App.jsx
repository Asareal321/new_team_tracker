import { useState, useEffect } from 'react'
import { supabase, isConfigured } from './supabase'
import TaskBoard from './components/TaskBoard.jsx'
import DailySummary from './components/DailySummary.jsx'
import './App.css'

const TEAM = ['Me', 'Teammate 1', 'Teammate 2']
const LOCAL_KEY = 'team-tracker-tasks'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || [] } catch { return [] }
}
function saveLocal(tasks) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(tasks))
}

export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('board')

  useEffect(() => {
    if (!isConfigured) {
      setTasks(loadLocal())
      setLoading(false)
      return
    }

    fetchTasks()

    const channel = supabase
      .channel('tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setTasks(data)
    setLoading(false)
  }

  async function addTask(task) {
    if (!isConfigured) {
      const next = [...tasks, { ...task, id: crypto.randomUUID() }]
      setTasks(next); saveLocal(next); return
    }
    await supabase.from('tasks').insert([task])
  }

  async function updateTask(id, updates) {
    if (!isConfigured) {
      const next = tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      setTasks(next); saveLocal(next); return
    }
    await supabase.from('tasks').update(updates).eq('id', id)
  }

  async function deleteTask(id) {
    if (!isConfigured) {
      const next = tasks.filter(t => t.id !== id)
      setTasks(next); saveLocal(next); return
    }
    await supabase.from('tasks').delete().eq('id', id)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <span className="logo">⬡</span>
          <h1>Team Tracker</h1>
        </div>
        <nav className="header-nav">
          <button className={view === 'board' ? 'nav-btn active' : 'nav-btn'} onClick={() => setView('board')}>Board</button>
          <button className={view === 'summary' ? 'nav-btn active' : 'nav-btn'} onClick={() => setView('summary')}>Daily Summary</button>
        </nav>
      </header>

      {!isConfigured && (
        <div className="setup-banner">
          <span>Running in local mode — data saves to this browser only.</span>
          <span className="banner-hint">Copy <code>.env.example</code> → <code>.env</code> with your Supabase credentials to enable shared sync.</span>
        </div>
      )}

      <main className="app-main">
        {loading ? (
          <div className="loading">Loading tasks…</div>
        ) : view === 'board' ? (
          <TaskBoard tasks={tasks} team={TEAM} onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask} />
        ) : (
          <DailySummary tasks={tasks} team={TEAM} />
        )}
      </main>
    </div>
  )
}
