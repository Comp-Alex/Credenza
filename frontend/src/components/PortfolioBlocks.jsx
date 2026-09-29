import { useState } from 'react'
import { api } from '../api/client.js'
import { initials, isGithubUrl, safeHttpUrl } from '../utils/profileUtils.js'

export function BioCard({ profile, editMode, onChange }) {
  const photoUrl = safeHttpUrl(profile.photoUrl)

  return (
    <section className="portfolio-block bio-card" id="about" aria-labelledby="bio-title">
      <p className="block-kicker">01 / THE PERSON</p>
      <div className="bio-content">
        <div className="bio-avatar">
          {photoUrl ? <img src={photoUrl} alt={`${profile.displayName || 'Profile'} portrait`} /> : <span aria-label="Profile photo placeholder">{initials(profile.displayName)}</span>}
        </div>
        <div className="bio-copy">
          {editMode ? (
            <div className="editor-fields">
              <label>Display name<input value={profile.displayName || ''} maxLength={80} onChange={(event) => onChange({ displayName: event.target.value })} /></label>
              <label>Headline<input value={profile.headline || ''} maxLength={120} onChange={(event) => onChange({ headline: event.target.value })} /></label>
              <label>Bio<textarea value={profile.bio || ''} maxLength={1600} rows={5} onChange={(event) => onChange({ bio: event.target.value })} /></label>
              <label>Location<input value={profile.location || ''} maxLength={100} onChange={(event) => onChange({ location: event.target.value })} /></label>
              <label>Photo URL<input type="url" value={profile.photoUrl || ''} maxLength={500} placeholder="https://…" onChange={(event) => onChange({ photoUrl: event.target.value })} /></label>
            </div>
          ) : (
            <>
              <h2 id="bio-title">{profile.displayName || 'Your name'}<span className="bio-period">.</span></h2>
              <p className="bio-headline">{profile.headline || 'Add a headline that sounds like you.'}</p>
              <p className="bio-description">{profile.bio || 'A few lines about what you make, what you care about, and where you want to go next.'}</p>
              {profile.location && <p className="bio-location">{profile.location}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export function ProjectGrid({ projects = [], editMode, onProjectChange, onAddProject, onRemoveProject, list = false }) {
  return (
    <section className={`portfolio-block project-grid-block${list ? ' project-list-layout' : ''}`} id="projects" aria-labelledby="portfolio-projects-title">
      <div className="block-heading"><div><p className="block-kicker">02 / SELECTED WORK</p><h2 id="portfolio-projects-title">Projects<span className="bio-period">.</span></h2></div>{editMode && <button className="small-action" type="button" onClick={onAddProject}>+ Add project</button>}</div>
      <div className="editable-project-grid">
        {projects.length === 0 && <p className="empty-content">Your next project can start here.</p>}
        {projects.map((project, index) => {
          const screenshotUrl = safeHttpUrl(project.screenshotUrl)
          const githubUrl = isGithubUrl(project.githubUrl) ? safeHttpUrl(project.githubUrl) : ''
          return (
            <article className="editable-project" key={project.id || index}>
              {screenshotUrl ? <img className="project-screenshot" src={screenshotUrl} alt={`${project.title || 'Project'} screenshot`} loading="lazy" /> : <div className="project-placeholder" aria-hidden="true"><span>PROJECT / {String(index + 1).padStart(2, '0')}</span><i /></div>}
              {editMode ? (
                <div className="editor-fields project-editor">
                  <label>Title<input value={project.title || ''} maxLength={100} onChange={(event) => onProjectChange(index, { title: event.target.value })} /></label>
                  <label>Description<textarea value={project.description || ''} maxLength={600} rows={3} onChange={(event) => onProjectChange(index, { description: event.target.value })} /></label>
                  <label>GitHub URL<input type="url" value={project.githubUrl || ''} maxLength={500} placeholder="https://github.com/…" onChange={(event) => onProjectChange(index, { githubUrl: event.target.value })} /></label>
                  <label>Screenshot URL<input type="url" value={project.screenshotUrl || ''} maxLength={500} placeholder="https://…" onChange={(event) => onProjectChange(index, { screenshotUrl: event.target.value })} /></label>
                  <button className="remove-action" type="button" onClick={() => onRemoveProject(index)}>Remove project</button>
                </div>
              ) : (
                <div className="editable-project-copy"><h3>{project.title || 'Untitled project'}</h3><p>{project.description || 'Add a short note about the problem, process, or result.'}</p>{githubUrl && <a className="github-link" href={githubUrl} target="_blank" rel="noreferrer noopener">View on GitHub <span aria-hidden="true">↗</span></a>}</div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function SkillTags({ skills = [], editMode, onSkillChange, onAddSkill, onRemoveSkill }) {
  return (
    <section className="portfolio-block skill-tags-block" id="skills" aria-labelledby="portfolio-skills-title">
      <div className="block-heading"><div><p className="block-kicker">03 / WHAT I BRING</p><h2 id="portfolio-skills-title">Skills<span className="bio-period">.</span></h2></div>{editMode && <button className="small-action" type="button" onClick={onAddSkill}>+ Add skill</button>}</div>
      <div className="skill-tag-list">
        {skills.length === 0 && <p className="empty-content">Add the skills you want people to remember.</p>}
        {skills.map((skill, index) => <div className="profile-skill" key={skill.id || index}>
          {editMode ? <div className="skill-editor"><label>Skill<input value={skill.name || ''} maxLength={50} onChange={(event) => onSkillChange(index, { name: event.target.value })} /></label><label>Level<input type="number" min="0" max="100" value={skill.level ?? 70} onChange={(event) => onSkillChange(index, { level: Math.max(0, Math.min(100, Number(event.target.value))) })} /></label><button className="remove-action" type="button" aria-label={`Remove ${skill.name || 'skill'}`} onClick={() => onRemoveSkill(index)}>×</button></div> : <><div className="skill-tag-label"><span>{skill.name}</span><span>{Math.max(0, Math.min(100, Number(skill.level) || 0))}%</span></div><div className="skill-meter" role="meter" aria-label={`${skill.name} proficiency`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.max(0, Math.min(100, Number(skill.level) || 0))}><span style={{ width: `${Math.max(0, Math.min(100, Number(skill.level) || 0))}%` }} /></div></>}
        </div>)}
      </div>
    </section>
  )
}

export function ContactForm({ sectionId = 'contact' }) {
  const [values, setValues] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const message = String(formData.get('message') || '').trim()
    const email = String(formData.get('email') || '').trim()
    if (message.length < 10 || message.length > 3000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ type: 'error', message: 'Add a valid email and a message between 10 and 3,000 characters.' })
      return
    }

    setBusy(true)
    setStatus({ type: '', message: '' })
    try {
      await api.contact.send({ name: String(formData.get('name') || '').trim(), email, message })
      setValues({ name: '', email: '', message: '' })
      setStatus({ type: 'success', message: 'Message received. Thanks for reaching out.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="portfolio-block contact-form-block" id={sectionId || undefined} aria-labelledby="portfolio-contact-title">
      <p className="block-kicker">04 / SAY HELLO</p><h2 id="portfolio-contact-title">Start a conversation<span className="bio-period">.</span></h2>
      <form className="contact-form" onSubmit={handleSubmit} noValidate>
        <label>Your name<input name="name" autoComplete="name" maxLength={80} value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /></label>
        <label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} /></label>
        <label className="contact-message-field">Message<textarea name="message" minLength={10} maxLength={3000} rows={4} required value={values.message} onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))} /></label>
        <div className="contact-submit-row"><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send message'}<span aria-hidden="true">↗</span></button><p className={`form-status ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'} aria-live="polite">{status.message}</p></div>
      </form>
    </section>
  )
}