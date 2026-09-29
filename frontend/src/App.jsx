import { useEffect, useRef, useState } from 'react'
import { api } from './api/client.js'
import AuthDialog from './components/AuthDialog.jsx'
import CursorFollower from './components/CursorFollower.jsx'
import { ContactForm } from './components/PortfolioBlocks.jsx'
import UserDashboard from './components/UserDashboard.jsx'
import './App.css'
import './components/Workspace.css'

const navigation = [
  { label: 'About', href: '#about', icon: 'about' },
  { label: 'Projects', href: '#projects', icon: 'projects' },
  { label: 'Skills', href: '#skills', icon: 'skills' },
  { label: 'Contact', href: '#contact', icon: 'contact' },
]

const skills = [
  { id: 'name', label: 'NAME A SKILL', detail: 'Choose the strengths that matter for your next opportunity.' },
  { id: 'level', label: 'SET A LEVEL', detail: 'Add proficiency when it helps people understand your experience.' },
  { id: 'order', label: 'SET THE ORDER', detail: 'Bring the most relevant skills to the front.' },
  { id: 'context', label: 'ADD CONTEXT', detail: 'Connect skills to projects that show how you use them.' },
]

function Icon({ name, className = '' }) {
  const paths = {
    about: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-3.6 3-5.5 7-5.5s6.5 1.9 7 5.5" /></>,
    projects: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    skills: <><path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7L12 3Z" /><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    contact: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m4.5 7 7.5 6 7.5-6" /></>,
    arrow: <path d="M5 12h14m-7-7 7 7-7 7" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    location: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.2" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  }

  return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Brand({ footer = false }) {
  return <a className={`wordmark${footer ? ' footer-wordmark' : ''}`} href="#top" aria-label="Credenza home"><img className="brand-logo" src="/credenza-logo.svg" alt="" /></a>
}

function SiteHeader({ user, dashboardMode, onAuthRequest, onDashboard, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="site-header">
      <Brand />
      <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="primary-navigation" onClick={() => setMenuOpen((open) => !open)}>
        <Icon name="menu" className="menu-open" /><Icon name="close" className="menu-close" />
      </button>
      <nav className={`primary-navigation${menuOpen ? ' is-open' : ''}`} id="primary-navigation" aria-label="Main navigation">
        {navigation.map(({ label, href, icon }) => <a key={href} href={href} onClick={() => setMenuOpen(false)}><Icon name={icon} /><span>{label}</span></a>)}
        <div className="mobile-auth-actions">
          {user ? <><button type="button" onClick={() => { onDashboard(); setMenuOpen(false) }}>{dashboardMode ? 'Public page' : 'Dashboard'}</button><button type="button" onClick={() => { onLogout(); setMenuOpen(false) }}>Log out</button></> : <><button type="button" onClick={() => { onAuthRequest('login'); setMenuOpen(false) }}>Log in</button><button type="button" onClick={() => { onAuthRequest('register'); setMenuOpen(false) }}>Create profile</button></>}
        </div>
      </nav>
      <div className="header-actions">
        {user ? <><button className="header-login" type="button" onClick={onDashboard}>{dashboardMode ? 'Public page' : 'Dashboard'}</button><button className="header-cta" type="button" onClick={onLogout}>Log out</button></> : <><button className="header-login" type="button" onClick={() => onAuthRequest('login')}>Log in</button><button className="header-cta" type="button" onClick={() => onAuthRequest('register')}>Create profile <Icon name="arrow" /></button></>}
      </div>
    </header>
  )
}

function Reveal({ children, className = '' }) {
  const elementRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      element?.classList.add('is-visible')
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('is-visible')
        observer.disconnect()
      }
    }, { threshold: 0.12 })

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <div ref={elementRef} className={`reveal ${className}`}>{children}</div>
}

function SectionHeading({ index, aside }) {
  return <div className="section-heading"><p className="section-index">{index}</p><span className="section-line" /><p className="section-aside">{aside}</p></div>
}

function TemplatePreview() {
  const [flipped, setFlipped] = useState(false)

  return (
    <button className={`profile-card portfolio-spotlight${flipped ? ' is-flipped' : ''}`} type="button" aria-label={flipped ? 'Flip template preview back' : 'Flip template preview'} aria-pressed={flipped} onClick={() => setFlipped((value) => !value)}>
      <span className="card-inner">
        <span className="card-face card-front">
          <span className="card-topline"><span>TEMPLATE / CANVAS</span><span className="card-led" /></span>
          <span className="focus-art" aria-hidden="true"><span className="focus-orbit focus-orbit-one" /><span className="focus-orbit focus-orbit-two" /><span className="focus-core">01</span><span className="focus-node focus-node-one" /><span className="focus-node focus-node-two" /><span className="focus-node focus-node-three" /></span>
          <span className="card-name">Your story,<br />in focus.</span><span className="card-role">BIO · PROJECTS · SKILLS</span>
          <span className="card-bottomline"><span>YOURS TO MAKE YOURS</span><span>↗</span></span>
        </span>
        <span className="card-face card-back">
          <span className="card-topline"><span>TEMPLATE / INDEX</span><span>02 / 02</span></span>
          <span className="back-heading">Your work,<br />your way.</span>
          <span className="back-copy">Choose a layout, then arrange the sections that tell your story.</span>
          <span className="back-skills"><span>BIO</span><span>PROJECTS</span><span>SKILLS</span></span>
          <span className="card-bottomline"><span>CHOOSE YOUR LAYOUT</span><span>↻</span></span>
        </span>
      </span>
    </button>
  )
}

function HeroSection() {
  return (
    <section className="hero page-grid" aria-labelledby="hero-title">
      <Reveal className="hero-copy">
        <p className="eyebrow"><span className="status-light" />A PORTFOLIO, WITH A PULSE</p>
        <h1 id="hero-title">Show the work.<br /><span>Shape what’s next.</span></h1>
        <p className="hero-description">A portfolio platform for students, graduates, and early-career professionals. Bring your skills, projects, and experience together in one polished, credible place.</p>
        <div className="hero-actions"><a className="button button-primary" href="#projects">Explore the blocks <Icon name="arrow" /></a><a className="text-link" href="#about">How Credenza works <span>↓</span></a></div>
        <div className="hero-note"><span className="note-rule" />YOUR SKILLS · YOUR STORIES · YOUR WAY</div>
      </Reveal>
      <Reveal className="hero-visual"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><TemplatePreview /><span className="visual-caption"><span className="caption-dot" />Start with a layout. Make it yours.</span><span className="visual-index">FIG. 01 — TEMPLATE PREVIEW</span></Reveal>
      <a className="scroll-cue" href="#about" aria-label="Scroll to about section"><span />SCROLL TO EXPLORE</a>
    </section>
  )
}

function AboutSection() {
  return (
    <section className="intro-section section-shell" id="about" aria-labelledby="about-title">
      <SectionHeading index="01 / ABOUT" aside="A good story starts somewhere" />
      <div className="about-layout">
        <Reveal><h2 id="about-title">Present your work.<br /><span>Open new doors.</span></h2></Reveal>
        <Reveal className="about-copy"><p className="large-copy">A more considered way to present what you can do.</p><p>Inspired by the Italian word for a sideboard, Credenza gives students, graduates, and early-career professionals a place to arrange their skills, projects, and experience with care, and connect education to industry.</p><div className="about-meta"><span><Icon name="location" />YOUR CORNER OF THE WORLD</span><span><Icon name="sun" />OPEN TO NEW IDEAS</span></div></Reveal>
      </div>
    </section>
  )
}

const projects = [
  { type: '01 — INTRODUCTION', title: 'A bio that sounds like you', summary: 'Share your direction, background, and the details you want people to remember.', tags: ['Bio', 'Headline'], art: 'orbit', alt: 'Abstract portfolio introduction layout' },
  { type: '02 — SELECTED WORK', title: 'Projects with context', summary: 'Give each piece of work a title, a short explanation, and links or images.', tags: ['Projects', 'Links'], art: 'garden', alt: 'Abstract grid for organizing portfolio projects' },
  { type: '03 — YOUR STRENGTHS', title: 'Skills, at a glance', summary: 'Choose the skills that fit your goals and decide how they appear.', tags: ['Skills', 'Proficiency'], art: 'signal', alt: 'Abstract skills section preview' },
  { type: '04 — NEXT STEPS', title: 'A way to connect', summary: 'Give visitors a clear, accessible way to start a conversation.', tags: ['Contact', 'Opportunities'], art: 'support', alt: 'Abstract contact section preview' },
]

function ProjectArt({ type, alt }) {
  return (
    <div className={`project-art art-${type}`} role="img" aria-label={alt}>
      {type === 'orbit' && <><span className="orbit-label">SIGNAL / 24</span><span className="art-core" /><span className="art-node node-a" /><span className="art-node node-b" /><span className="art-node node-c" /><span className="art-crosshair" /></>}
      {type === 'garden' && <><span className="garden-window"><i /><i /><i /><b /></span><span className="garden-stem" /><span className="garden-leaf leaf-one" /><span className="garden-leaf leaf-two" /><span className="garden-leaf leaf-three" /><span className="garden-label">GROW / 03</span></>}
      {type === 'signal' && <><span className="signal-window"><i /><i /><i /><b>YOUR<br />SKILLS<span>.</span></b><small>EDITABLE CONTENT BLOCK</small></span><span className="signal-sweep" /></>}
      {type === 'support' && <><span className="support-window"><small>CONTACT / NEXT STEP</small><b>SAY HELLO <i>↗</i></b><span><i /><i /><i /></span></span><span className="support-sweep" /></>}
    </div>
  )
}

function ProjectsSection() {
  return (
    <section className="projects-section section-shell" id="projects" aria-labelledby="projects-title">
      <SectionHeading index="02 / CONTENT BLOCKS" aside="Build the portfolio you need" />
      <Reveal className="projects-intro"><h2 id="projects-title">One story.<br /><span>Your structure.</span></h2><p>Start with the sections you need, then shape the order and detail around your field, experience, and next step.</p></Reveal>
      <div className="project-grid">{projects.map((project) => <Reveal key={project.title} className="project-card"><ProjectArt type={project.art} alt={project.alt} /><div className="project-details"><div><p className="project-type">{project.type}</p><h3>{project.title}</h3></div><span className="project-arrow" aria-hidden="true">↗</span><p className="project-summary">{project.summary}</p><div className="tag-row">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></Reveal>)}</div>
    </section>
  )
}

function SkillsSection() {
  const [selectedSkill, setSelectedSkill] = useState(skills[0])

  return (
    <section className="skills-section section-shell" id="skills" aria-labelledby="skills-title">
      <SectionHeading index="03 / SKILLS" aside="Tools are only the beginning" />
      <div className="skills-layout">
        <Reveal className="skills-copy"><h2 id="skills-title">A toolkit<br />that keeps <span>growing.</span></h2><p>Pick a strength. See how it shows up in the work.</p></Reveal>
        <Reveal className="skills-console">
          <div className="console-head"><span><span className="console-light" />SKILLS.EXE</span><span>SELECT TO INSPECT</span></div>
          <div className="skill-list" role="group" aria-label="Choose a skill">{skills.map((skill, index) => <button key={skill.id} data-skill={skill.id} className={`skill-key${selectedSkill.id === skill.id ? ' is-selected' : ''}`} type="button" aria-pressed={selectedSkill.id === skill.id} onClick={() => setSelectedSkill(skill)}>{skill.label}<span>0{index + 1}</span></button>)}</div>
          <div className="skill-output" aria-live="polite"><span className="output-prompt">&gt;</span><p>{selectedSkill.detail}<span className="cursor">_</span></p></div>
        </Reveal>
      </div>
    </section>
  )
}

function ContactSection() {
  return (
    <section className="contact-section section-shell" id="contact" aria-labelledby="contact-title">
      <SectionHeading index="04 / CONTACT" aside="The next chapter is unwritten" />
      <Reveal className="contact-content"><p className="eyebrow"><span className="status-light" />ROOM FOR ONE MORE GOOD IDEA</p><h2 id="contact-title">Let’s make<br /><span>something matter.</span></h2><p className="contact-note">No pitch deck required. Just say hello.</p></Reveal>
      <ContactForm sectionId={null} />
      <div className="contact-footer"><Brand footer /><span>SHOWCASE YOUR SKILLS. BUILD YOUR FUTURE.</span><span>© 2026 CREDENZA</span></div>
    </section>
  )
}

function App() {
  const [authMode, setAuthMode] = useState(null)
  const [session, setSession] = useState(null)
  const [dashboardMode, setDashboardMode] = useState(false)
  const [siteMessage, setSiteMessage] = useState('')

  useEffect(() => {
    let active = true
    api.auth.session().then((currentSession) => {
      if (active && currentSession?.user) setSession(currentSession)
    }).catch(() => {})
    return () => { active = false }
  }, [])

  function handleAuthenticated(authSession) {
    setSession(authSession)
    setDashboardMode(true)
    setAuthMode(null)
  }

  async function handleLogout() {
    try {
      await api.auth.logout()
      setSession(null)
      setDashboardMode(false)
      setSiteMessage('You are signed out.')
    } catch (error) {
      setSiteMessage(error.message)
    }
  }

  return (
    <>
      <CursorFollower />
      <SiteHeader user={session?.user} dashboardMode={dashboardMode} onAuthRequest={setAuthMode} onDashboard={() => setDashboardMode((value) => !value)} onLogout={handleLogout} />
      {siteMessage && <p className="site-notice" role="status" aria-live="polite">{siteMessage}</p>}
      {session?.user && dashboardMode ? <UserDashboard key={session.user.id} user={session.user} initialProfile={session.profile} onBack={() => setDashboardMode(false)} onLogout={handleLogout} /> : (
        <main id="top">
          <HeroSection />
          <AboutSection />
          <ProjectsSection />
          <SkillsSection />
          <ContactSection />
        </main>
      )}
      {authMode && <AuthDialog mode={authMode} onClose={() => setAuthMode(null)} onAuthenticated={handleAuthenticated} />}
    </>
  )
}

export default App
