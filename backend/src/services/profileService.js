import { knex } from '../db/knex.js'
import { recordAudit } from '../utils/audit.js'
import { HttpError } from '../utils/HttpError.js'

function normalizeProjects(projects = []) {
  return projects.map((project, position) => ({
    title: project.title.trim(),
    description: project.description?.trim() || '',
    github_link: project.githubUrl?.trim() || '',
    screenshot_url: project.screenshotUrl?.trim() || '',
    position,
  }))
}

function normalizeSkills(skills = []) {
  return skills.map((skill, position) => ({
    skill_name: skill.name.trim(),
    proficiency: skill.level,
    position,
  }))
}

export async function saveProfile(userId, profile) {
  return knex.transaction(async (transaction) => {
    const userFields = {
      display_name: profile.displayName.trim(),
      headline: profile.headline?.trim() || '',
      bio: profile.bio?.trim() || '',
      location: profile.location?.trim() || '',
      photo_url: profile.photoUrl?.trim() || '',
      updated_at: transaction.fn.now(),
    }
    const [user] = await transaction('users').where({ id: userId }).update(userFields).returning(['id', 'display_name', 'headline', 'bio', 'location', 'photo_url'])
    await transaction('projects').where({ user_id: userId }).del()
    await transaction('skills').where({ user_id: userId }).del()

    const projects = normalizeProjects(profile.projects)
    const skills = normalizeSkills(profile.skills)
    if (projects.length) await transaction('projects').insert(projects.map((project) => ({ ...project, user_id: userId })))
    if (skills.length) await transaction('skills').insert(skills.map((skill) => ({ ...skill, user_id: userId })))
    const templateName = profile.templateName || 'Canvas'
    const template = await transaction('templates').where({ name: templateName, active: true }).first()
    if (!template) throw new HttpError(400, 'Choose an available portfolio layout.')
    await transaction('user_templates').insert({ user_id: userId, template_id: template.id }).onConflict('user_id').merge({ template_id: template.id, updated_at: transaction.fn.now() })
    await recordAudit(transaction, userId, 'portfolio.updated', { projectCount: projects.length, skillCount: skills.length })

    return {
      displayName: user.display_name,
      headline: user.headline,
      bio: user.bio,
      location: user.location,
      photoUrl: user.photo_url,
      template: { id: template.id, name: template.name, settings: {} },
      templateName: template.name,
      projects: projects.map((project) => ({ title: project.title, description: project.description, githubUrl: project.github_link, screenshotUrl: project.screenshot_url })),
      skills: skills.map((skill) => ({ name: skill.skill_name, level: skill.proficiency })),
    }
  })
}

export async function listTemplates(database = knex) {
  return database('templates').select('id', 'name', 'description', 'preview_url as previewUrl').where({ active: true }).orderBy('name')
}

export async function assignTemplate(userId, templateId, settings = {}) {
  const template = await knex('templates').where({ id: templateId, active: true }).first()
  if (!template) return null
  await knex('user_templates').insert({ user_id: userId, template_id: template.id, settings }).onConflict('user_id').merge({ template_id: template.id, settings, updated_at: knex.fn.now() })
  await recordAudit(knex, userId, 'portfolio.template_changed', { templateId })
  return { id: template.id, name: template.name, settings }
}

export async function listProjects(userId) {
  return knex('projects').select('id', 'title', 'description', 'github_link as githubUrl', 'screenshot_url as screenshotUrl', 'position').where({ user_id: userId }).orderBy('position').orderBy('created_at')
}

export async function listSkills(userId) {
  return knex('skills').select('id', 'skill_name as name', 'proficiency as level', 'position').where({ user_id: userId }).orderBy('position').orderBy('created_at')
}

export async function createProject(userId, project) {
  const [created] = await knex('projects').insert({ user_id: userId, title: project.title.trim(), description: project.description?.trim() || '', github_link: project.githubUrl?.trim() || '', screenshot_url: project.screenshotUrl?.trim() || '' }).returning(['id', 'title', 'description', 'github_link', 'screenshot_url'])
  await recordAudit(knex, userId, 'portfolio.project_created', { projectId: created.id })
  return { id: created.id, title: created.title, description: created.description, githubUrl: created.github_link, screenshotUrl: created.screenshot_url }
}

export async function updateProject(userId, projectId, project) {
  const [updated] = await knex('projects').where({ user_id: userId, id: projectId }).update({ title: project.title.trim(), description: project.description?.trim() || '', github_link: project.githubUrl?.trim() || '', screenshot_url: project.screenshotUrl?.trim() || '', updated_at: knex.fn.now() }).returning(['id', 'title', 'description', 'github_link', 'screenshot_url'])
  if (!updated) return null
  await recordAudit(knex, userId, 'portfolio.project_updated', { projectId })
  return { id: updated.id, title: updated.title, description: updated.description, githubUrl: updated.github_link, screenshotUrl: updated.screenshot_url }
}

export async function deleteProject(userId, projectId) {
  const deletedCount = await knex('projects').where({ user_id: userId, id: projectId }).del()
  if (deletedCount) await recordAudit(knex, userId, 'portfolio.project_deleted', { projectId })
  return Boolean(deletedCount)
}

export async function createSkill(userId, skill) {
  const [created] = await knex('skills').insert({ user_id: userId, skill_name: skill.name.trim(), proficiency: skill.level }).returning(['id', 'skill_name', 'proficiency'])
  await recordAudit(knex, userId, 'portfolio.skill_created', { skillId: created.id })
  return { id: created.id, name: created.skill_name, level: created.proficiency }
}

export async function updateSkill(userId, skillId, skill) {
  const [updated] = await knex('skills').where({ user_id: userId, id: skillId }).update({ skill_name: skill.name.trim(), proficiency: skill.level }).returning(['id', 'skill_name', 'proficiency'])
  if (!updated) return null
  await recordAudit(knex, userId, 'portfolio.skill_updated', { skillId })
  return { id: updated.id, name: updated.skill_name, level: updated.proficiency }
}

export async function deleteSkill(userId, skillId) {
  const deletedCount = await knex('skills').where({ user_id: userId, id: skillId }).del()
  if (deletedCount) await recordAudit(knex, userId, 'portfolio.skill_deleted', { skillId })
  return Boolean(deletedCount)
}