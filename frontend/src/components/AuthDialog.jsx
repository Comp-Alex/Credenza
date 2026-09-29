import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'
import CursorFollower from './CursorFollower.jsx'

function isBcryptSafeLength(password) {
  return new TextEncoder().encode(password).length <= 72
}

function AuthField({ label, name, type = 'text', autoComplete, error, ...props }) {
  return <label className="auth-field">{label}<input name={name} type={type} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} {...props} />{error && <span className="field-error" id={`${name}-error`}>{error}</span>}</label>
}

export function LoginForm({ onAuthenticated, onSwitch, onCancel }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      setError('Enter a valid email address and password.')
      return
    }
    if (!isBcryptSafeLength(password)) {
      setError('This password is too long. Use at most 72 UTF-8 bytes.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const session = await api.auth.login({ email, password })
      if (!session?.user) throw new Error('We could not start your session. Please try again.')
      onAuthenticated(session)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <p className="block-kicker">WELCOME BACK</p><h2 id="auth-title">Sign in<span className="bio-period">.</span></h2><p className="auth-description">Pick up where your ideas left off.</p>
      <AuthField label="Email" name="email" type="email" autoComplete="email" maxLength={254} required />
      <AuthField label="Password" name="password" type="password" autoComplete="current-password" maxLength={128} required />
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<span aria-hidden="true">↗</span></button>
      <p className="auth-switch">New to Credenza? <button type="button" onClick={onSwitch}>Create an account</button></p>
      <button className="dialog-cancel" type="button" onClick={onCancel}>Back to portfolio</button>
    </form>
  )
}

export function RegisterForm({ onAuthenticated, onSwitch, onCancel }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const displayName = String(formData.get('displayName') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const passwordConfirmation = String(formData.get('passwordConfirmation') || '')
    if (!displayName || displayName.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Add a name and a valid email address.')
      return
    }
    if (password.length < 12 || password.length > 128) {
      setError('Choose a password between 12 and 128 characters.')
      return
    }
    if (!isBcryptSafeLength(password)) {
      setError('Choose a password of at most 72 UTF-8 bytes.')
      return
    }
    if (password !== passwordConfirmation) {
      setError('Those passwords do not match.')
      return
    }

    setBusy(true)
    setError('')
    try {
      const session = await api.auth.register({ displayName, email, password })
      if (!session?.user) throw new Error('We could not create your account. Please try again.')
      onAuthenticated(session)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <p className="block-kicker">MAKE IT YOURS</p><h2 id="auth-title">Create your space<span className="bio-period">.</span></h2><p className="auth-description">A home for the work you want the world to see.</p>
      <AuthField label="Display name" name="displayName" autoComplete="name" maxLength={80} required />
      <AuthField label="Email" name="email" type="email" autoComplete="email" maxLength={254} required />
      <AuthField label="Password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      <AuthField label="Confirm password" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create account'}<span aria-hidden="true">↗</span></button>
      <p className="auth-switch">Already have an account? <button type="button" onClick={onSwitch}>Sign in</button></p>
      <button className="dialog-cancel" type="button" onClick={onCancel}>Back to portfolio</button>
    </form>
  )
}

export default function AuthDialog({ mode, onClose, onAuthenticated }) {
  const dialogRef = useRef(null)
  const [currentMode, setCurrentMode] = useState(mode)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => {
      if (dialog?.open) dialog.close()
    }
  }, [])

  return (
    <dialog ref={dialogRef} className="auth-dialog" aria-labelledby="auth-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <CursorFollower overlay />
      <button className="dialog-close" type="button" aria-label="Close sign-in dialog" onClick={onClose}>×</button>
      {currentMode === 'login' ? <LoginForm onAuthenticated={onAuthenticated} onSwitch={() => setCurrentMode('register')} onCancel={onClose} /> : <RegisterForm onAuthenticated={onAuthenticated} onSwitch={() => setCurrentMode('login')} onCancel={onClose} />}
    </dialog>
  )
}