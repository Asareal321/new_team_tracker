import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import { useGarden } from '../context/GardenContext'
import TaskBoard, { MAX_UP_NEXT } from '../components/TaskBoard'
import PersonalProjectsModal from '../components/PersonalProjectsModal'
import Onboarding from '../components/Onboarding'
import { setVisibility } from '../lib/community'
import { requestTour } from '../lib/tourState'

function DoneTaskModal({ task, tasks = [], projects, onAdd, onUpdateProject, onPromote, onDismiss }) {
  const [nextTitle, setNextTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const project = projects.find(p => p.id === task.project_id)

  // If a top-slot task (High + To Do) was just completed, offer to promote an
  // existing to-do into the freed slot.
  const wasTopSlot = task.priority === 'high'
  const promotable = tasks
    .filter(t => t.status === 'todo' && t.priority !== 'high' && t.id !== task.id)
    .slice(0, 6)

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
        <h3 className="done-modal-heading">{wasTopSlot ? 'Top slot open!' : 'Task completed!'}</h3>
        <p className="done-modal-task">"{task.title}"</p>
        {project && <p className="done-modal-project">{project.name}</p>}

        {wasTopSlot && (
          <div className="done-next-section">
            <label className="done-next-label">Promote a task to your top slot</label>
            {promotable.length === 0 ? (
              <p className="done-modal-hint">No other to-do tasks to promote — add one below.</p>
            ) : (
              <div className="promote-list">
                {promotable.map(t => (
                  <button
                    key={t.id}
                    className="promote-item"
                    onClick={async () => { await onPromote(t.id, { priority: 'high' }); onDismiss() }}
                  >
                    <span className={`status-dot ${t.priority}`} />
                    <span className="promote-item-title">{t.title}</span>
                    <span className="promote-item-cta">Promote →</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
  const { currentTeamId } = useTeam()
  const {
    rewardTaskAdded, rewardTaskDone, recordDoingCleared,
    state: garden, ready: gardenReady, completeOnboarding,
  } = useGarden()
  const [tasks, setTasks] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [projectMembers, setProjectMembers] = useState([])
  const [taskUpdates, setTaskUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  // { task, fromDoing } — the completion being celebrated. `fromDoing` means
  // it emptied the Doing column, which is counted but no longer paid.
  const [doneTask, setDoneTask] = useState(null)
  const [showProjectsManager, setShowProjectsManager] = useState(false)

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
      .select('*, task_assignees(user_id, response_status, response_reason, suggested_priority, suggested_due_date, responded_at)')
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    query = currentTeamId
      ? query.eq('team_id', currentTeamId)
      : query.is('team_id', null).eq('user_id', user.id)
    const { data, error } = await query
    if (error) console.error('[trakkit] Failed to load tasks — is the DB migration applied?', error.message)
    let tasks = data || []

    // At end of day (in the user's LOCAL timezone), archive any task that
    // was marked Done on a previous day. Until then a Done task stays in the
    // Done tab. Comparing local dates — not UTC — prevents tasks from being
    // archived the same evening they're completed. archived_at keeps the
    // original done timestamp so the task lands on the calendar under the
    // day it was actually finished.
    const localDay = ts => {
      const d = ts ? new Date(ts) : new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    const today = localDay()
    const toArchive = tasks.filter(t => {
      const ts = t.updated_at || t.created_at
      return t.status === 'done' && ts && localDay(ts) < today
    })
    if (toArchive.length) {
      await Promise.all(toArchive.map(t =>
        supabase.from('tasks')
          .update({ status: 'archived', archived_at: t.updated_at || t.created_at })
          .eq('id', t.id)
      ))
      const archiveMap = new Map(toArchive.map(t => [t.id, t.updated_at || t.created_at]))
      tasks = tasks.map(t => archiveMap.has(t.id)
        ? { ...t, status: 'archived', archived_at: archiveMap.get(t.id) }
        : t)
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
    let query = supabase.from('projects').select('*').order('created_at', { ascending: true })
    query = currentTeamId ? query.eq('team_id', currentTeamId) : query.is('team_id', null).eq('created_by', user.id)
    const { data, error } = await query
    if (error) console.error('[trakkit] Failed to load projects', error.message)
    setProjects(data || [])
  }, [currentTeamId, user])

  const fetchProjectMembers = useCallback(async () => {
    if (!currentTeamId) { setProjectMembers([]); return }
    const { data } = await supabase
      .from('project_members')
      .select('project_id, user_id, projects!inner(team_id)')
      .eq('projects.team_id', currentTeamId)
    setProjectMembers((data || []).map(r => ({ project_id: r.project_id, user_id: r.user_id })))
  }, [currentTeamId])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTasks(), fetchTeamMembers(), fetchProjects(), fetchProjectMembers()]).then(() => setLoading(false))

    const channel = supabase
      .channel(`board-${currentTeamId ?? 'personal'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: currentTeamId ? `team_id=eq.${currentTeamId}` : undefined }, fetchProjects)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, fetchProjectMembers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_updates' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchTasks, fetchTeamMembers, fetchProjects, fetchProjectMembers, currentTeamId])

  async function addTask({ assigneeIds = [], ...task }) {
    const samePriority = tasks.filter(t => t.priority === task.priority && t.status === task.status)
    const maxPos = samePriority.reduce((m, t) => Math.max(m, t.position ?? 0), 0)
    const { data } = await supabase
      .from('tasks')
      .insert([{ ...task, user_id: user.id, team_id: currentTeamId, position: maxPos + 1000 }])
      .select('id')
      .single()
    if (data?.id) rewardTaskAdded()
    if (data?.id && assigneeIds.length) {
      await supabase.from('task_assignees').insert(
        assigneeIds.map(uid => ({
          task_id: data.id, user_id: uid,
          response_status: uid === user.id ? 'accepted' : 'pending',
        }))
      )
    }
    return data?.id
  }

  // Finishing a recurring task mints its next occurrence. The new copy is
  // created from the completed one rather than on a clock, so a weekly chore
  // done three days late simply moves — you never come back to a stack of
  // missed copies. The next due date is measured from the task's own due date
  // when it had one (so a Monday task stays a Monday task), otherwise from
  // today. Assignees carry over already accepted: they agreed to the recurring
  // task, not to each individual instance.
  const nextDueDate = useCallback((task) => {
    if (!task.due_date) return null
    const d = new Date(task.due_date + 'T00:00:00')
    if (task.recurrence === 'daily') d.setDate(d.getDate() + 1)
    else if (task.recurrence === 'weekly') d.setDate(d.getDate() + 7)
    else if (task.recurrence === 'monthly') d.setMonth(d.getMonth() + 1)
    else return null
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const respawnRecurring = useCallback(async (task) => {
    if (!task?.recurrence) return
    const id = crypto.randomUUID()
    // The next occurrence lands in Up next unless Up next is full, in which
    // case it waits in the braindump — the same rule a typed task follows. A
    // repeat that quietly overfilled the band would make the limit a lie.
    const upNextFull = tasks.filter(t => t.status === 'todo').length >= MAX_UP_NEXT
    const { error } = await supabase.from('tasks').insert({
      id,
      title: task.title,
      notes: task.notes || '',
      status: upNextFull ? 'braindump' : 'todo',
      priority: task.priority,
      due_date: nextDueDate(task),
      project_id: task.project_id,
      recurrence: task.recurrence,
      user_id: task.user_id,
      team_id: task.team_id,
      position: task.position ?? null,
    })
    if (error) {
      console.error('[trakkit] could not create the next occurrence — is migration-recurring-tasks.sql applied?', error.message)
      return
    }
    const assigneeIds = (task.task_assignees || []).map(a => a.user_id)
    if (assigneeIds.length) {
      await supabase.from('task_assignees').insert(
        assigneeIds.map(uid => ({ task_id: id, user_id: uid, response_status: 'accepted' }))
      )
    }
    await fetchTasks()
  }, [nextDueDate, fetchTasks, tasks])

  // Finishing a task banks its seed and coins, and on a personal board also
  // earns a rain cloud. Both wait until the completion modal is out of the way
  // (follow-up task added, or skipped) so the cloud gets the centre of the
  // screen to itself. The reward is paid on every board — the garden belongs to
  // the account, so work done on a team board still counts; only the cloud is
  // personal-only, since it shouldn't interrupt a shared board.
  // Rewards land once the completion modal is out of the way, so the cloud gets
  // the centre of the screen to itself. Both pay on every board — the garden
  // belongs to the account, so work done on a team board counts the same.
  function dismissDoneTask() {
    const cleared = doneTask?.fromDoing
    setDoneTask(null)
    rewardTaskDone()
    if (cleared) recordDoingCleared()
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

  // Diffs against the task's current assignees so an unrelated add/remove
  // doesn't reset someone who already accepted back to "pending".
  async function updateAssignees(taskId, assigneeIds) {
    const task = tasks.find(t => t.id === taskId)
    const creatorId = task?.user_id
    const existingIds = new Set((task?.task_assignees || []).map(a => a.user_id))
    const nextIds = new Set(assigneeIds)
    const toRemove = [...existingIds].filter(id => !nextIds.has(id))
    const toAdd = [...nextIds].filter(id => !existingIds.has(id))
    if (toRemove.length) {
      await supabase.from('task_assignees').delete().eq('task_id', taskId).in('user_id', toRemove)
    }
    if (toAdd.length) {
      await supabase.from('task_assignees').insert(
        toAdd.map(uid => ({
          task_id: taskId, user_id: uid,
          response_status: uid === creatorId ? 'accepted' : 'pending',
        }))
      )
    }
  }

  async function respondToAssignment(taskId, response, { reason, suggestedPriority, suggestedDueDate } = {}) {
    const { error } = await supabase.rpc('respond_to_task_assignment', {
      _task_id: taskId,
      _response: response,
      _reason: reason || null,
      _suggested_priority: suggestedPriority || null,
      _suggested_due_date: suggestedDueDate || null,
    })
    if (error) throw error
  }

  async function resolveChangeRequest(taskId, assigneeId, apply) {
    const { error } = await supabase.rpc('resolve_change_request', {
      _task_id: taskId,
      _assignee_id: assigneeId,
      _apply: apply,
    })
    if (error) throw error
  }

  // Personal-project mutations are optimistic (so they appear instantly, not
  // only after the realtime refetch) and surface errors — the likeliest one
  // being that migration-personal-projects.sql hasn't been run, which leaves
  // projects.team_id NOT NULL and rejects a personal (team_id null) row.
  async function addProject(form) {
    const id = crypto.randomUUID()
    const row = { id, ...form, team_id: currentTeamId, created_by: user.id, created_at: new Date().toISOString() }
    setProjects(prev => [...prev, row])
    const { error } = await supabase.from('projects').insert(row)
    if (error) { setProjects(prev => prev.filter(p => p.id !== id)); throw error }
    return id
  }

  async function updateProject(id, updates) {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    const { error } = await supabase.from('projects').update(updates).eq('id', id)
    if (error) { fetchProjects(); throw error }
  }

  async function deleteProject(id) {
    setProjects(prev => prev.filter(p => p.id !== id))
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { fetchProjects(); throw error }
  }

  if (loading) return <div className="loading">Loading tasks…</div>


  return (
    <div>
      <TaskBoard
        onManageProjects={!currentTeamId ? () => setShowProjectsManager(true) : null}
        onAddProject={!currentTeamId ? addProject : null}
        tasks={tasks}
        teamMembers={teamMembers}
        projects={projects}
        projectMembers={projectMembers}
        taskUpdates={taskUpdates}
        currentUserId={user.id}
        currentTeamId={currentTeamId}
        onAdd={addTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onAddUpdate={addUpdate}
        onDeleteUpdate={deleteUpdate}
        onUpdateAssignees={updateAssignees}
        onRespondToAssignment={respondToAssignment}
        onResolveChangeRequest={resolveChangeRequest}
        onTaskDone={task => {
          // A clear is the column actually going empty — that's what the
          // quests and awards that read it say ("Empty the Doing band"). It
          // pays nothing now, so there's no farming pressure to design around;
          // it just has to be true.
          //
          // Decided here rather than from the refreshed list: this task was
          // the last one in Doing, and it's leaving because it was finished.
          // A card dragged back to Up next also empties the column, and that
          // isn't a clear.
          const clearedDoing = task.status === 'in_progress'
            && !tasks.some(t => t.status === 'in_progress' && t.id !== task.id)
          setDoneTask({ task, fromDoing: clearedDoing })
          respawnRecurring(task)
        }}
      />
      {doneTask && (
        <DoneTaskModal
          task={doneTask.task}
          tasks={tasks}
          projects={projects}
          onAdd={addTask}
          onUpdateProject={updateProject}
          onPromote={updateTask}
          onDismiss={dismissDoneTask}
        />
      )}
      {/* First run, personal board only — a team board isn't yours to seed. */}
      {gardenReady && garden && !garden.onboarded && !currentTeamId && (
        <Onboarding
          displayName={user?.user_metadata?.display_name}
          onFinish={async ({ seedKey, projectName, firstTask, isPublic }) => {
            // A named project is created for real, so the project the tour
            // just explained is on the board when the tour closes. If creating
            // it fails (the personal-projects migration hasn't run), the first
            // task still lands — unfiled beats lost.
            let projectId = null
            if (projectName) {
              try { projectId = await addProject({ name: projectName, status: 'active' }) }
              catch { projectId = null }
            }
            if (firstTask) {
              await addTask({ title: firstTask, notes: '', status: 'todo', priority: 'high', due_date: null, project_id: projectId, assigneeIds: [user.id] })
            }
            // Visibility is a community feature, so it needs the community
            // migration. An unmigrated database shouldn't cost you the setup —
            // private is the default there anyway.
            try { await setVisibility(user.id, !!isPublic) } catch { /* not migrated yet */ }
            await completeOnboarding(seedKey)
            await fetchTasks()
            // The walk starts on the board and ends in the garden, so it is
            // Layout's to run, not this page's.
            requestTour()
          }}
        />
      )}

      {showProjectsManager && (
        <PersonalProjectsModal
          projects={projects}
          onAddProject={addProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          onClose={() => setShowProjectsManager(false)}
        />
      )}
    </div>
  )
}
