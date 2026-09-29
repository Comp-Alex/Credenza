import bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'node:crypto'
import { knex } from '../db/knex.js'
import { recordAudit } from '../utils/audit.js'
import { HttpError } from '../utils/HttpError.js'
import { issueTokenPair, tokenFingerprint } from '../utils/tokens.js'

const passwordCost = 12
const dummyPasswordHash = await bcrypt.hash(randomBytes(32).toString('hex'), passwordCost)

function publicUser(user) {
  return { id: user.id, displayName: user.display_name, email: user.email, role: user.role }
}

function publicProfile(user, projects = [], skills = [], template = null) {
  return {
    displayName: user.display_name,
    headline: user.headline,
    bio: user.bio,
    location: user.location,
    photoUrl: user.photo_url,
    projects: projects.map((project) => ({ id: project.id, title: project.title, description: project.description, githubUrl: project.github_link, screenshotUrl: project.screenshot_url })),
    skills: skills.map((skill) => ({ id: skill.id, name: skill.skill_name, level: skill.proficiency })),
    template: template ? { id: template.id, name: template.name, settings: template.settings } : null,
  }
}

async function loadPortfolio(database, user) {
  const [projects, skills, template] = await Promise.all([
    database('projects').where({ user_id: user.id }).orderBy('position').orderBy('created_at'),
    database('skills').where({ user_id: user.id }).orderBy('position').orderBy('created_at'),
    database('user_templates').join('templates', 'user_templates.template_id', 'templates.id')
      .select('templates.id', 'templates.name', 'user_templates.settings').where('user_templates.user_id', user.id).first(),
  ])
  return publicProfile(user, projects, skills, template)
}

export async function registerAccount({ displayName, email, password }) {
  const passwordHash = await bcrypt.hash(password, passwordCost)
  return knex.transaction(async (transaction) => {
    const [user] = await transaction('users').insert({ display_name: displayName, email: email.toLowerCase(), password_hash: passwordHash }).returning(['id', 'display_name', 'email', 'role', 'headline', 'bio', 'location', 'photo_url'])
    const defaultTemplate = await transaction('templates').where({ name: 'Canvas', active: true }).first()
    if (defaultTemplate) await transaction('user_templates').insert({ user_id: user.id, template_id: defaultTemplate.id })
    await recordAudit(transaction, user.id, 'account.registered')
    return { user: publicUser(user), profile: await loadPortfolio(transaction, user) }
  })
}

export async function loginAccount({ email, password }, response) {
  const normalizedEmail = email.toLowerCase()
  const user = await knex('users').whereRaw('lower(email) = ?', [normalizedEmail]).first()
  const validPassword = await bcrypt.compare(password, user?.password_hash || dummyPasswordHash)
  if (!user || !validPassword) {
    await recordAudit(knex, user?.id, 'auth.login_failed', { emailHash: createHash('sha256').update(normalizedEmail).digest('hex') })
    throw new HttpError(401, 'Those sign-in details did not match. Check them and try again.')
  }

  await issueTokenPair(user, response)
  await recordAudit(knex, user.id, 'auth.login_succeeded')
  return { user: publicUser(user), profile: await loadPortfolio(knex, user) }
}

export async function currentSession(user) {
  const profile = await loadPortfolio(knex, user)
  return { user: publicUser(user), profile }
}

export async function logoutAccount(refreshToken) {
  let userId = null
  if (refreshToken) {
    const [revoked] = await knex('refresh_tokens').where({ token_hash: tokenFingerprint(refreshToken) }).whereNull('revoked_at').update({ revoked_at: knex.fn.now() }).returning('user_id')
    userId = revoked?.user_id || null
  }
  await recordAudit(knex, userId, 'auth.logout')
}