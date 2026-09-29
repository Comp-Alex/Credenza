import { useState } from 'react'
import { api } from '../api/client.js'
import { validateProfile } from '../utils/profileUtils.js'
import { TemplateA, TemplateB, TemplateSwitcher } from './Templates.jsx'

function makeEmptyProfile(user, profile = {}) {
  return {
    displayName: profile.displayName || user.displayName || '',
    headline: profile.headline || '',
    bio: profile.bio || '',
    location: profile.location || '',
    photoUrl: profile.photoUrl || '',
    templateName: profile.template?.name || profile.templateName || 'Canvas',
    projects: Array.isArray(profile.projects) ? profile.projects : [],
    skills: Array.isArray(profile.skills) ? profile.skills : [],
  }
}

export default function UserDashboard({ user, initialProfile, onBack, onLogout }) {
  const [savedProfile, setSavedProfile] = useState(() => makeEmptyProfile(user, initialProfile))
  const [profile, setProfile] = useState(() => makeEmptyProfile(user, initialProfile))
  const [template, setTemplate] = useState(() => (initialProfile?.template?.name || initialProfile?.templateName) === 'Index' ? 'index' : 'canvas')
  const [editMode, setEditMode] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })

  function updateProfile(patch) {
    setProfile((current) => ({ ...current, ...patch }))
    setStatus({ type: '', message: '' })
  }

  function updateProject(index, patch) {
    setProfile((current) => ({
      ...current,
      projects: current.projects.map((project, projectIndex) => projectIndex === index ? { ...project, ...patch } : project),
    }))
    setStatus({ type: '', message: '' })
  }

  function updateSkill(index, patch) {
    setProfile((current) => ({
      ...current,
      skills: current.skills.map((skill, skillIndex) => skillIndex === index ? { ...skill, ...patch } : skill),
    }))
    setStatus({ type: '', message: '' })
  }

  function addProject() {
    setProfile((current) => ({ ...current, projects: [...current.projects, { title: '', description: '', githubUrl: '', screenshotUrl: '' }] }))
  }

  function addSkill() {
    setProfile((current) => ({ ...current, skills: [...current.skills, { name: '', level: 70 }] }))
  }

  function removeProject(index) {
    setProfile((current) => ({ ...current, projects: current.projects.filter((_, projectIndex) => projectIndex !== index) }))
  }

  function removeSkill(index) {
    setProfile((current) => ({ ...current, skills: current.skills.filter((_, skillIndex) => skillIndex !== index) }))
  }

  function cancelEditing() {
    setProfile(savedProfile)
    setEditMode(false)
    setStatus({ type: '', message: '' })
  }

  function selectTemplate(value) {
    setTemplate(value)
    setProfile((current) => ({ ...current, templateName: value === 'index' ? 'Index' : 'Canvas' }))
    setStatus({ type: '', message: '' })
  }

  async function saveProfile() {
    const validationMessage = validateProfile(profile)
    if (validationMessage) {
      setStatus({ type: 'error', message: validationMessage })
      return
    }

    setBusy(true)
    setStatus({ type: '', message: '' })
    try {
      const result = await api.profile.update({ ...profile, templateName: template === 'index' ? 'Index' : 'Canvas' })
      const nextProfile = makeEmptyProfile(user, result?.profile || profile)
      setProfile(nextProfile)
      setSavedProfile(nextProfile)
      setTemplate(nextProfile.templateName === 'Index' ? 'index' : 'canvas')
      setEditMode(false)
      setStatus({ type: 'success', message: 'Your portfolio is up to date.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  const templateProps = {
    profile,
    editMode,
    onChange: updateProfile,
    onProjectChange: updateProject,
    onAddProject: addProject,
    onRemoveProject: removeProject,
    onSkillChange: updateSkill,
    onAddSkill: addSkill,
    onRemoveSkill: removeSkill,
  }
  const ActiveTemplate = template === 'canvas' ? TemplateA : TemplateB

  return (
    <main className="dashboard-page" aria-labelledby="dashboard-title">
      <div className="dashboard-toolbar">
        <div className="dashboard-title-group"><p className="block-kicker">YOUR CREDENZA / STUDIO</p><h1 id="dashboard-title">{user.displayName || 'Your portfolio'}<span className="bio-period">.</span></h1></div>
        <div className="dashboard-controls">
          <div className="dashboard-mode" role="group" aria-label="Portfolio editing mode">
            <button type="button" className={!editMode ? 'is-selected' : ''} aria-pressed={!editMode} onClick={() => setEditMode(false)}>Preview</button>
            <button type="button" className={editMode ? 'is-selected' : ''} aria-pressed={editMode} onClick={() => setEditMode(true)}>Edit</button>
          </div>
          <TemplateSwitcher value={template} onChange={selectTemplate} />
          {editMode ? <><button className="dashboard-secondary" type="button" onClick={cancelEditing} disabled={busy}>Cancel</button><button className="button button-primary" type="button" onClick={saveProfile} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></> : <button className="dashboard-secondary" type="button" onClick={onBack}>Public page</button>}
          <button className="dashboard-logout" type="button" onClick={onLogout}>Log out</button>
        </div>
      </div>
      {status.message && <p className={`dashboard-status ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'} aria-live="polite">{status.message}</p>}
      <div className="dashboard-workspace">
        <nav className="dashboard-sidebar" aria-label="Portfolio sections">
          <a href="#about"><span>01</span>Bio</a>
          <a href="#projects"><span>02</span>Projects</a>
          <a href="#skills"><span>03</span>Skills</a>
          <a href="#contact"><span>04</span>Contact</a>
        </nav>
        <div className={`dashboard-preview${editMode ? ' is-editing' : ''}`} aria-busy={busy}>
          <ActiveTemplate {...templateProps} />
        </div>
      </div>
    </main>
  )
}