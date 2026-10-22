// One entry per backend resource. The admin console builds its lists and forms from this.
// Field names match the Spring Boot entities exactly.

export const SKILL_CATEGORIES = ['LANGUAGE', 'FRAMEWORK', 'DATABASE', 'TOOL', 'CORE', 'CONCEPT', 'FRONTEND']

const order = { name: 'displayOrder', label: 'Display order', type: 'number', hint: 'Lower shows first', min: 0 }

export const RESOURCES = [
  {
    key: 'profile',
    code: '01',
    label: 'Profile',
    singular: 'Profile',
    endpoint: '/profile',
    title: (p) => `${p.firstName} ${p.lastName}`,
    subtitle: (p) => p.headline,
    fields: [
      { name: 'firstName', label: 'First name', type: 'text', required: true, max: 60 },
      { name: 'lastName', label: 'Last name', type: 'text', required: true, max: 60 },
      { name: 'headline', label: 'Headline', type: 'text', max: 200, hint: 'Shown under your name on the recruiter page' },
      { name: 'location', label: 'Location', type: 'text', max: 120 },
      { name: 'summary', label: 'Summary', type: 'textarea', rows: 5 },
      { name: 'seeking', label: 'Open to', type: 'text', max: 200, hint: 'e.g. Backend Developer roles' },
      { name: 'achievements', label: 'Achievements', type: 'list', hint: 'One per line', rows: 5 },
      { name: 'languages', label: 'Languages spoken', type: 'list', hint: 'One per line' },
      order,
    ],
  },
  {
    key: 'education',
    code: 'ED',
    label: 'Education',
    singular: 'Education',
    endpoint: '/education',
    title: (e) => e.degree,
    subtitle: (e) => [e.school, e.period].filter(Boolean).join(' — '),
    fields: [
      { name: 'degree', label: 'Degree', type: 'text', required: true, max: 150 },
      { name: 'school', label: 'College / school', type: 'text', required: true, max: 150 },
      { name: 'place', label: 'City', type: 'text', max: 150 },
      { name: 'period', label: 'Years', type: 'text', max: 60, hint: 'e.g. 2021 – 2025' },
      { name: 'score', label: 'Score', type: 'text', max: 60, hint: 'e.g. CGPA 8.4 / 10' },
      order,
    ],
  },
  {
    key: 'projects',
    code: '03',
    label: 'Missions',
    singular: 'Project',
    endpoint: '/projects',
    title: (p) => p.title,
    subtitle: (p) => [p.featured && 'Featured', p.techStack?.join(' · ')].filter(Boolean).join(' — '),
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 120 },
      { name: 'tagline', label: 'Tagline', type: 'text', max: 200 },
      { name: 'description', label: 'Description', type: 'textarea', rows: 5 },
      { name: 'techStack', label: 'Tech stack', type: 'list', hint: 'One per line' },
      { name: 'highlights', label: 'Highlights', type: 'list', hint: 'One per line', rows: 5 },
      { name: 'githubUrl', label: 'GitHub URL', type: 'url' },
      { name: 'liveUrl', label: 'Live URL', type: 'url' },
      { name: 'imageUrl', label: 'Image URL', type: 'url' },
      { name: 'featured', label: 'Featured mission', type: 'checkbox' },
      order,
    ],
  },
  {
    key: 'skills',
    code: '02',
    label: 'Power cells',
    singular: 'Skill',
    endpoint: '/skills',
    title: (s) => s.name,
    subtitle: (s) => s.category,
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, max: 60 },
      { name: 'category', label: 'Category', type: 'select', required: true, options: SKILL_CATEGORIES },
      order,
    ],
    defaults: { category: 'LANGUAGE' },
  },
  {
    key: 'certificates',
    code: '04',
    label: 'Honors',
    singular: 'Certificate',
    endpoint: '/certificates',
    title: (c) => c.title,
    subtitle: (c) => [c.issuer, c.issuedOn].filter(Boolean).join(' — '),
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 150 },
      { name: 'issuer', label: 'Issuer', type: 'text', required: true, max: 120 },
      { name: 'issuedOn', label: 'Issued on', type: 'date' },
      { name: 'credentialUrl', label: 'Credential URL', type: 'url' },
      { name: 'imageUrl', label: 'Image URL', type: 'url' },
      order,
    ],
  },
  {
    key: 'links',
    code: '05',
    label: 'Transmission',
    singular: 'Link',
    endpoint: '/links',
    title: (l) => l.label,
    subtitle: (l) => l.url,
    fields: [
      { name: 'label', label: 'Label', type: 'text', required: true, max: 40 },
      { name: 'url', label: 'URL', type: 'url', required: true, max: 300 },
      order,
    ],
  },
]

/** A blank form for a resource. */
export function emptyForm(resource, nextOrder = 0) {
  const form = {}
  for (const f of resource.fields) {
    form[f.name] =
      f.type === 'checkbox' ? false
        : f.type === 'list' ? []
          : f.type === 'number' || f.type === 'range' ? 0
            : ''
  }
  return { ...form, ...resource.defaults, displayOrder: nextOrder }
}

/** Copies only the editable fields from a record coming from the API. */
export function toForm(resource, record) {
  const form = emptyForm(resource)
  for (const f of resource.fields) {
    const v = record[f.name]
    if (v !== null && v !== undefined) form[f.name] = v
  }
  return form
}

/** Cleans the form before sending: trims text, drops empty list lines, sends blank optional fields as null. */
export function toPayload(resource, form) {
  const body = {}
  for (const f of resource.fields) {
    let v = form[f.name]
    if (f.type === 'list') v = (v ?? []).map((s) => s.trim()).filter(Boolean)
    else if (f.type === 'number' || f.type === 'range') v = Number(v) || 0
    else if (typeof v === 'string') {
      v = v.trim()
      if (v === '' && !f.required) v = null
    }
    body[f.name] = v
  }
  return body
}
