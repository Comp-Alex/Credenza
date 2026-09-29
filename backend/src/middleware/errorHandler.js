import { HttpError } from '../utils/HttpError.js'

export function notFound(_request, _response, next) {
  next(new HttpError(404, 'That endpoint does not exist.'))
}

export function errorHandler(error, _request, response, _next) {
  if (error.type === 'entity.too.large') return response.status(413).json({ error: 'That request is too large.' })
  if (error.code === '23505') return response.status(409).json({ error: 'That record already exists.' })

  const status = error instanceof HttpError ? error.status : 500
  if (status >= 500) console.error(error)
  return response.status(status).json({
    error: status === 500 ? 'Credenza is having a moment. Please try again shortly.' : error.message,
    ...(error.details ? { details: error.details } : {}),
  })
}