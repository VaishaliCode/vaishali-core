// Recruiter view (/recruiter) — EVERYTHING on that page now comes live from the backend
// (edit it in /admin → Profile, Education, Power cells, Missions, Honors, Transmission).
//
// This file is only a backup copy: the page shows it if the free server is still waking up
// after a few seconds (or is down), then swaps in the live data the moment it arrives.
// You don't need to keep it perfectly in sync.

export const resume = {
  fallback: {
    profile: {
      firstName: 'Vaishali',
      lastName: 'Muley',
      headline: 'Backend Developer · Java · Spring Boot · PostgreSQL',
      location: 'Chhatrapati Sambhajinagar, Maharashtra',
      summary:
        'Computer Science engineer who thinks in Java and dreams in data structures. I design REST APIs, lock them down with JWT, model data in PostgreSQL — and once got curious enough to build an entire programming language from scratch, lexer to runtime.',
      seeking: 'Backend Developer / Software Engineer roles',
      achievements: [
        '5★ rating in Java — HackerRank',
        '5★ rating in SQL — HackerRank',
        'Designed and built VibeLang, a programming language & interpreter written from scratch in Java',
      ],
      languages: ['English', 'Marathi', 'Hindi'],
    },

    education: [
      { id: 'f1', degree: 'B.E. Computer Science & Engineering', school: 'ICEEM College', place: 'Chhatrapati Sambhajinagar, Maharashtra' },
    ],

    skills: [
      ['Java', 'LANGUAGE'],
      ['Spring Boot', 'FRAMEWORK'], ['Spring MVC', 'FRAMEWORK'], ['Hibernate', 'FRAMEWORK'], ['Spring Data JPA', 'FRAMEWORK'],
      ['PostgreSQL', 'DATABASE'], ['MySQL', 'DATABASE'],
      ['Maven', 'TOOL'], ['Git & GitHub', 'TOOL'], ['Docker', 'TOOL'], ['Linux', 'TOOL'], ['Postman', 'TOOL'],
      ['Data Structures & Algorithms', 'CORE'], ['DBMS', 'CORE'], ['Operating Systems', 'CORE'],
      ['Computer Networks', 'CORE'], ['Cloud Computing', 'CORE'],
      ['OOP', 'CONCEPT'], ['REST APIs & JWT', 'CONCEPT'], ['System Design (basic)', 'CONCEPT'],
      ['Database Design & ER Modeling', 'CONCEPT'],
      ['HTML / CSS / Bootstrap', 'FRONTEND'],
    ].map(([name, category], i) => ({ id: `f${i}`, name, category })),

    projects: [
      {
        id: 'f1',
        title: 'VibeLang',
        tagline: 'A custom programming language & interpreter, built from scratch in Java',
        techStack: ['Java', 'Spring Boot', 'React'],
        highlights: [
          'Lexer → Parser → AST → Interpreter → Runtime pipeline',
          'Operator precedence and short-circuit evaluation',
          'Runtime error handling, nested scopes, loops, conditionals and I/O',
          'Spring Boot + React web playground for executing .vibe programs',
        ],
        githubUrl: 'https://github.com/VaishaliCode',
      },
      {
        id: 'f2',
        title: 'Smart Revision Tracker',
        tagline: 'AI-based learning system with spaced-repetition scheduling',
        techStack: ['Java', 'Spring Boot', 'PostgreSQL', 'JPA / Hibernate'],
        highlights: [
          'REST APIs for subjects, topics, revision logs and performance tracking',
          'Spaced repetition for personalised revision scheduling',
          'PostgreSQL schema via JPA/Hibernate with validation and exception handling',
          'Controller–Service–Repository architecture with performance analytics',
        ],
        githubUrl: 'https://github.com/VaishaliCode',
      },
    ],

    certificates: [
      { id: 'f1', title: 'Introduction to Cloud Computing', issuer: 'IBM · Coursera' },
      { id: 'f2', title: 'Java', issuer: 'HackerRank' },
      { id: 'f3', title: 'The Bits and Bytes of Computer Networking', issuer: 'Google · Coursera' },
      { id: 'f4', title: 'SQL (Intermediate)', issuer: 'HackerRank' },
    ],

    links: [
      { label: 'GitHub', url: 'https://github.com/VaishaliCode' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/vaishali-muley-614765248' },
      { label: 'Email', url: 'mailto:vaishali.muley30112003@gmail.com' },
    ],
  },
}
