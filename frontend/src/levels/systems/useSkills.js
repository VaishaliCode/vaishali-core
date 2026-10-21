import { useEffect, useState } from "react"
import api from '../../api/client'

export const CATEGORY_ORDER = ['LANGUAGE', 'FRAMEWORK', 'DATABASE', 'TOOL', 'CORE', 'CONCEPT', 'FRONTEND']

export default function useSkills() {
  const [groups, setGroups] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    api.get('/skills')
      .then((res) => {
        setGroups(groupByCategory(res.data))
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  return { groups, status }
}

function groupByCategory(skills) {
  const map = {}
  for (const skill of skills) {
    if (!map[skill.category]) map[skill.category] = []
    map[skill.category].push(skill)
  }
  return CATEGORY_ORDER
    .filter((category) => map[category])
    .map((category) => ({ category, skills: map[category] }))
}