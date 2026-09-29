import { Router } from 'express'
import { body, param } from 'express-validator'
import { authenticate, requireRole } from '../middleware/auth.js'
import { validateRequest } from '../middleware/validateRequest.js'
import { assignTemplate, createProject, createSkill, deleteProject, deleteSkill, listProjects, listSkills, listTemplates, saveProfile, updateProject, updateSkill } from '../services/profileService.js'
import { knex } from '../db/knex.js'
import { HttpError } from '../utils/HttpError.js'

const router = Router()
const uuidParam = (name) => param(name).isUUID().withMessage(`A valid ${name} is required.`)
const httpUrl = (value) => {
  if (!value) return true
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && (process.env.NODE_ENV !== 'production' || url.protocol === 'https:')
  } catch {
    return false
  }
}

const projectFields = [
  body('title').isString().trim().isLength({ min: 1, max: 100 }).withMessage('Project titles must be 1 to 100 characters long.'),
  body('description').optional().isString().trim().isLength({ max: 600 }).withMessage('Project descriptions must be under 600 characters.'),
  body('githubUrl').optional().isString().trim().isLength({ max: 500 }).withMessage('GitHub URLs must be under 500 characters.').bail().custom((value) => !value || (httpUrl(value) && new URL(value).hostname === 'github.com')).withMessage('Project links must use GitHub over HTTP or HTTPS.'),
  body('screenshotUrl').optional().isString().trim().isLength({ max: 500 }).withMessage('Screenshot URLs must be under 500 characters.').bail().custom(httpUrl).withMessage('Screenshots must use an HTTP URL locally and HTTPS in production.'),
]
const skillFields = [
  body('name').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Skill names must be 1 to 50 characters long.'),
  body('level').isInt({ min: 0, max: 100 }).withMessage('Skill proficiency must be between 0 and 100.').toInt(),
]

router.get('/templates', async (_request, response) => response.json({ templates: await listTemplates() }))
router.post('/user/template', authenticate, [
  body('templateId').isUUID().withMessage('A valid template ID is required.'),
  body('settings').optional().isObject({ strict: true }).withMessage('Template settings must be an object.'),
], validateRequest, async (request, response) => {
  const template = await assignTemplate(request.user.id, request.body.templateId, request.body.settings || {})
  if (!template) throw new HttpError(404, 'That template is not available.')
  response.json({ template })
})

router.post('/admin/templates', authenticate, requireRole('admin'), [
  body('name').isString().trim().isLength({ min: 1, max: 40 }),
  body('description').isString().trim().isLength({ min: 1, max: 240 }),
  body('previewUrl').optional().isString().trim().isLength({ max: 500 }).bail().custom(httpUrl),
], validateRequest, async (request, response) => {
  const [template] = await knex('templates').insert({ name: request.body.name, description: request.body.description, preview_url: request.body.previewUrl || '' }).returning(['id', 'name', 'description', 'preview_url'])
  response.status(201).json({ template: { id: template.id, name: template.name, description: template.description, previewUrl: template.preview_url } })
})

router.get('/projects/:userId', [uuidParam('userId')], validateRequest, async (request, response) => response.json({ projects: await listProjects(request.params.userId) }))
router.post('/projects', authenticate, projectFields, validateRequest, async (request, response) => response.status(201).json({ project: await createProject(request.user.id, request.body) }))
router.put('/projects/:id', authenticate, [uuidParam('id'), ...projectFields], validateRequest, async (request, response) => {
  const project = await updateProject(request.user.id, request.params.id, request.body)
  if (!project) throw new HttpError(404, 'That project does not exist.')
  response.json({ project })
})
router.delete('/projects/:id', authenticate, [uuidParam('id')], validateRequest, async (request, response) => {
  if (!await deleteProject(request.user.id, request.params.id)) throw new HttpError(404, 'That project does not exist.')
  response.status(204).end()
})

router.get('/skills/:userId', [uuidParam('userId')], validateRequest, async (request, response) => response.json({ skills: await listSkills(request.params.userId) }))
router.post('/skills', authenticate, skillFields, validateRequest, async (request, response) => response.status(201).json({ skill: await createSkill(request.user.id, request.body) }))
router.put('/skills/:id', authenticate, [uuidParam('id'), ...skillFields], validateRequest, async (request, response) => {
  const skill = await updateSkill(request.user.id, request.params.id, request.body)
  if (!skill) throw new HttpError(404, 'That skill does not exist.')
  response.json({ skill })
})
router.delete('/skills/:id', authenticate, [uuidParam('id')], validateRequest, async (request, response) => {
  if (!await deleteSkill(request.user.id, request.params.id)) throw new HttpError(404, 'That skill does not exist.')
  response.status(204).end()
})

router.put('/profile', authenticate, [
  body('displayName').isString().trim().isLength({ min: 1, max: 80 }).withMessage('Display names must be 1 to 80 characters long.'),
  body('headline').optional().isString().trim().isLength({ max: 120 }),
  body('bio').optional().isString().trim().isLength({ max: 1600 }),
  body('location').optional().isString().trim().isLength({ max: 100 }),
  body('photoUrl').optional().isString().trim().isLength({ max: 500 }).bail().custom(httpUrl).withMessage('Photo URLs must use HTTP locally and HTTPS in production.'),
  body('templateName').optional().isIn(['Canvas', 'Index']).withMessage('Choose Canvas or Index.'),
  body('projects').optional().isArray({ max: 20 }).withMessage('A portfolio may include up to 20 projects.'),
  body('projects.*.title').if(body('projects').exists()).isString().trim().isLength({ min: 1, max: 100 }).withMessage('Project titles must be 1 to 100 characters long.'),
  body('projects.*.description').optional().isString().trim().isLength({ max: 600 }),
  body('projects.*.githubUrl').optional().isString().trim().isLength({ max: 500 }).bail().custom((value) => !value || (httpUrl(value) && new URL(value).hostname === 'github.com')).withMessage('Project links must use GitHub over HTTP or HTTPS.'),
  body('projects.*.screenshotUrl').optional().isString().trim().isLength({ max: 500 }).bail().custom(httpUrl),
  body('skills').optional().isArray({ max: 40 }).withMessage('A portfolio may include up to 40 skills.'),
  body('skills.*.name').if(body('skills').exists()).isString().trim().isLength({ min: 1, max: 50 }).withMessage('Skill names must be 1 to 50 characters long.'),
  body('skills.*.level').if(body('skills').exists()).isInt({ min: 0, max: 100 }).withMessage('Skill proficiency must be between 0 and 100.').toInt(),
], validateRequest, async (request, response) => response.json({ profile: await saveProfile(request.user.id, request.body) }))

export default router