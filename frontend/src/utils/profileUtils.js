export function safeHttpUrl(value) {
  if (!value?.trim()) return ''
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch {
    return ''
  }
}

export function isGithubUrl(value) {
  const safeUrl = safeHttpUrl(value)
  return safeUrl ? new URL(safeUrl).hostname === 'github.com' : !value?.trim()
}

export function validateProfile(profile) {
  if (!profile.displayName?.trim()) return 'Add a display name before saving.'
  if (profile.displayName.length > 80) return 'Keep your display name under 80 characters.'
  if ((profile.bio || '').length > 1600) return 'Keep your bio under 1,600 characters.'
  if (profile.photoUrl && !safeHttpUrl(profile.photoUrl)) return 'The profile photo must use an HTTP or HTTPS URL.'

  for (const project of profile.projects || []) {
    if (!project.title?.trim()) return 'Give each project a title before saving.'
    if ((project.description || '').length > 600) return 'Keep project descriptions under 600 characters.'
    if (project.githubUrl && !isGithubUrl(project.githubUrl)) return 'Project links must point to github.com.'
    if (project.screenshotUrl && !safeHttpUrl(project.screenshotUrl)) return 'Project screenshots must use an HTTP or HTTPS URL.'
  }

  if ((profile.skills || []).some((skill) => !skill.name?.trim())) return 'Give each skill a name before saving.'
  return ''
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'C'
}