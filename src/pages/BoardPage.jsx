import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import TaskBoard from '../components/TaskBoard'

function DoneTaskModal({ task, projects, onAdd, onUpdateProject, onDismiss }) {
  const [nextTitle, setNextTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const project = projects.find(p => p.id === task.project_id)

  async function handleAddNext() {
    const title = nextTitle.trim()
    if (!title) return
    setAdding(true)
    await onAdd({
      title,
      status: 'todo',
      priority: task.priority,
      project_id: task.project_id,
      notes: '',
      due_date: null,
      assigneeIds: [],
    })
    onDismiss()
  }

  async function handleCompleteProject() {
    if (project) await onUpdateProject(project.id, { status: 'completed' })
    onDismiss()
  }

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="done-modal" onClick={e => e.stopPropagation()}>
        <div className="done-check">✓</div>
        <h3 className="done-modal-heading">Task completed!</h3>
        <p className="done-modal-task">"{task.title}"</p>
        {project && <p className="done-modal-project">{project.name}</p>}

        <div className="done-next-section">
          <label className="done-next-label">Add a follow-up task</label>
          <div className="done-next-row">
            <input
              autoFocus
              className="done-next-input"
              value={nextTitle}
              onChange={e => setNextTitle(e.target.value)}
              placeholder="What needs to happen next?"
              onKeyDown={e => e.key === 'Enter' && handleAddNext()}
            />
            <button
              className="btn-primary"
              onClick={handleAddNext}
              disabled={!nextTitle.trim() || adding}
            >
              Add
            </button>
          </div>
        </div>

        <div className="done-modal-footer">
          {project && (
            <button className="done-complete-project-btn" onClick={handleCompleteProject}>
              Mark "{project.name}" as completed
            </button>
          )}
          <button className="btn-ghost" onClick={onDismiss}>Skip</button>
        </div>
      </div>
    </div>
  )
}

export default function BoardPage() {
  const { user } = useAuth()
  const { currentTeamId, teams } = useTeam()
  const [tasks, setTasks] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [taskUpdates, setTaskUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [doneTask, setDoneTask] = useState(null)

  const fetchTaskUpdates = useCallback(async (taskIds) => {
    if (!taskIds.length) { setTaskUpdates([]); return }
    const { data } = await supabase
      .from('task_updates')
      .select('id, task_id, body, created_at, profiles(display_name)')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false })
    setTaskUpdates(data || [])
  }, [])

  const fetchTasks = useCallback(async () => {
    let query = supabase
      .from('tasks')
      .select('*, task_assignees(user_id)')
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    query = currentTeamId
      ? query.eq('team_id', currentTeamId)
      : query.is('team_id', null).eq('user_id', user.id)
    const { data } = await query
    let tasks = data || []

    // Archive any done tasks that were last updated before today
    const today = new Date().toISOString().slice(0, 10)
    const toArchive = tasks.filter(t => t.status === 'done' && t.updated_at?.slice(0, 10) < today)
    if (toArchive.length) {
      await supabase.from('tasks').update({ status: 'archived' }).in('id', toArchive.map(t => t.id))
      const archiveIds = new Set(toArchive.map(t => t.id))
      tasks = tasks.map(t => archiveIds.has(t.id) ? { ...t, status: 'archived' } : t)
    }

    setTasks(tasks)
    await fetchTaskUpdates(tasks.map(t => t.id))
  }, [currentTeamId, user, fetchTaskUpdates])

  const fetchTeamMembers = useCallback(async () => {
    if (!currentTeamId) {
      setTeamMembers([{ id: user.id, display_name: 'You' }])
      return
    }
    const { data } = await supabase
      .from('team_members')
      .select('user_id, profiles(id, display_name)')
      .eq('team_id', currentTeamId)
    setTeamMembers((data || []).map(r => ({ id: r.profiles.id, display_name: r.profiles.display_name })))
  }, [currentTeamId, user])

  const fetchProjects = useCallback(async () => {
    if (!currentTeamId) { setProjects([]); return }
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', currentTeamId)
      .order('created_at', { ascending: true })
    setProjects(data || [])
  }, [currentTeamId])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTasks(), fetchTeamMembers(), fetchProjects()]).then(() => setLoading(false))

    const channel = supabase
      .channel(`board-${currentTeamId ?? 'personal'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: currentTeamId ? `team_id=eq.${currentTeamId}` : undefined }, fetchProjects)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_updates' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchTasks, fetchTeamMembers, fetchProjects, currentTeamId])

  async function addTask({ assigneeIds = [], ...task }) {
    const samePriority = tasks.filter(t => t.priority === task.priority && t.status === task.status)
    const maxPos = samePriority.reduce((m, t) => Math.max(m, t.position ?? 0), 0)
    const { data } = await supabase
      .from('tasks')
      .insert([{ ...task, user_id: user.id, team_id: currentTeamId, position: maxPos + 1000 }])
      .select('id')
      .single()
    if (data?.id && assigneeIds.length) {
      await supabase.from('task_assignees').insert(
        assigneeIds.map(uid => ({ task_id: data.id, user_id: uid }))
      )
    }
    return data?.id
  }

  async function updateTask(id, updates) {
    await supabase.from('tasks').update(updates).eq('id', id)
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
  }

  async function addUpdate(taskId, body, newStatus) {
    await supabase.from('task_updates').insert([{ task_id: taskId, user_id: user.id, body }])
    if (newStatus) {
      await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    }
  }

  async function deleteUpdate(updateId) {
    await supabase.from('task_updates').delete().eq('id', updateId)
  }

  async function updateAssignees(taskId, assigneeIds) {
    await supabase.from('task_assignees').delete().eq('task_id', taskId)
    if (assigneeIds.length) {
      await supabase.from('task_assignees').insert(
        assigneeIds.map(uid => ({ task_id: taskId, user_id: uid }))
      )
    }
  }

  async function updateProject(id, updates) {
    await supabase.from('projects').update(updates).eq('id', id)
  }

  if (loading) return <div className="loading">Loading tasks…</div>

  const teamName = currentTeamId ? (teams.find(t => t.id === currentTeamId)?.name || 'Team') : 'Personal'

  return (
    <div>
      <div className="board-hero">
        <h1 className="board-hero-title">{teamName} Taskboard</h1>
      </div>
      <TaskBoard
        tasks={tasks}
        teamMembers={teamMembers}
        projects={projects}
        taskUpdates={taskUpdates}
        currentUserId={user.id}
        currentTeamId={currentTeamId}
        onAdd={addTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onAddUpdate={addUpdate}
        onDeleteUpdate={deleteUpdate}
        onUpdateAssignees={updateAssignees}
        onTaskDone={task => setDoneTask(task)}
      />
      {doneTask && (
        <DoneTaskModal
          task={doneTask}
          projects={projects}
          onAdd={addTask}
          onUpdateProject={updateProject}
          onDismiss={() => setDoneTask(null)}
        />
      )}
    </div>
  )
}
