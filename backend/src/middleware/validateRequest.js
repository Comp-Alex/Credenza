import { validationResult } from 'express-validator'
import { HttpError } from '../utils/HttpError.js'

export function validateRequest(request, _response, next) {
  const result = validationResult(request)
  if (result.isEmpty()) return next()
  return next(new HttpError(400, 'Check the information and try again.', result.array({ onlyFirstError: true }).map(({ path, msg }) => ({ field: path, message: msg }))))
}