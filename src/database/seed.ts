import 'dotenv/config';
import { db, pool } from './index';
import {
  courses,
  modules,
  lessons,
  courseEnrollments,
  lessonCompletions,
} from './schemas/content.schema';
import { users } from './schemas/auth.schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/*
  Seed Script
  - Creates instructors & learners
  - Creates realistic tech & data courses (original descriptions)
  - Adds modules & lessons with mixed content types
  - Enrolls learners and simulates partial progress

  NOTE: All course and lesson text is original, inspired by common learning themes
  (NOT copied from Coursera, DataCamp, etc.).
*/

interface CreatedUser {
  id: string;
  role: string;
  email: string;
}

// Helper to wrap plain text into a simple rich-text JSON (TipTap/ProseMirror-like) structure
function makeRichTextDoc(paragraph: string) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: paragraph,
          },
        ],
      },
    ],
  } as const;
}

async function clearExisting() {
  // Order matters due to FK constraints
  await db.delete(lessonCompletions);
  await db.delete(lessons);
  await db.delete(modules);
  await db.delete(courseEnrollments);
  await db.delete(courses);
  // We won't delete existing users; safer for environments.
}

async function ensureUsers(): Promise<Record<string, CreatedUser>> {
  const existing = await db.select().from(users);
  const byEmail: Record<string, CreatedUser> = {};
  for (const u of existing) {
    byEmail[u.email] = { id: u.id, role: u.role, email: u.email };
  }

  const toCreate: Array<Omit<typeof users.$inferInsert, 'id'>> = [];

  const seedUsers = [
    {
      username: 'alice.instructor',
      firstName: 'Alice',
      lastName: 'Nguyen',
      email: 'alice.instructor@example.com',
      role: 'instructor' as const,
      password: 'Password123!'
    },
    {
      username: 'ben.instructor',
      firstName: 'Ben',
      lastName: 'Santos',
      email: 'ben.instructor@example.com',
      role: 'instructor' as const,
      password: 'Password123!'
    },
    {
      username: 'chloe.learner',
      firstName: 'Chloe',
      lastName: 'Martinez',
      email: 'chloe.learner@example.com',
      role: 'learner' as const,
      password: 'Password123!'
    },
    {
      username: 'diego.learner',
      firstName: 'Diego',
      lastName: 'Khan',
      email: 'diego.learner@example.com',
      role: 'learner' as const,
      password: 'Password123!'
    },
    {
      username: 'admin',
      firstName: 'Platform',
      lastName: 'Admin',
      email: 'admin@example.com',
      role: 'admin' as const,
      password: 'AdminPass123!'
    }
  ];

  for (const su of seedUsers) {
    if (!byEmail[su.email]) {
      const hash = await bcrypt.hash(su.password, 10);
      toCreate.push({
        username: su.username,
        firstName: su.firstName,
        lastName: su.lastName,
        email: su.email,
        role: su.role,
        password: hash,
      });
    }
  }

  if (toCreate.length) {
    const inserted = await db.insert(users).values(toCreate).returning();
    for (const u of inserted) {
      byEmail[u.email] = { id: u.id, role: u.role, email: u.email };
    }
  }

  return byEmail;
}

async function seedCourses(userMap: Record<string, CreatedUser>) {
  const instructors = Object.values(userMap).filter(u => u.role === 'instructor');
  if (instructors.length < 2) throw new Error('Need at least two instructors');

  const [alice, ben] = instructors;

  const courseDefinitions = [
    {
      title: 'Foundations of Data Analysis with Python',
      smallDescription: 'Learn core data analysis workflows using Python tools.',
      description: 'A practical introduction to data analysis. You will explore data wrangling, exploratory analysis, and simple visualization patterns using clean, modern Python tooling. By the end, you can transform raw CSV files into insights with clarity and structure.',
      category: 'Data Science',
      thumbnailUrl: 'https://placehold.co/600x400/data-python.png',
      estimatedHours: 18,
      price: 0,
      difficulty: 'beginner',
      status: 'published',
      instructorId: alice.id,
      modules: [
        {
          title: 'Getting Oriented',
            description: 'Understand the analysis mindset and environment setup.',
            lessons: [
              {
                title: 'Why Data Analysis Matters',
                description: 'Role of analysis in decision making.',
                contentType: 'text',
                contentData: 'Data analysis converts raw observations into navigable insight. In this lesson we define goals and a reproducible workflow.',
                durationMinutes: 8
              },
              {
                title: 'Setting Up Your Python Environment',
                description: 'Lightweight reproducible setup.',
                contentType: 'video',
                contentData: 'https://videos.example.com/setup-env.mp4',
                durationMinutes: 12
              },
              {
                title: 'Working with Jupyter Notebooks',
                description: 'Interactive exploration fundamentals.',
                contentType: 'text',
                contentData: 'Best practices: narrative cells, version control, modular experimentation.',
                durationMinutes: 10
              }
            ]
        },
        {
          title: 'Core Data Manipulation',
          description: 'Load, clean, and reshape tabular data.',
          lessons: [
            {
              title: 'Importing Tabular Data',
              description: 'CSV, parquet, and type inference.',
              contentType: 'text',
              contentData: 'Use pandas read_*, control dtypes early, detect schema drift.',
              durationMinutes: 14
            },
            {
              title: 'Cleaning & Normalizing Fields',
              description: 'Handling missing and inconsistent values.',
              contentType: 'video',
              contentData: 'https://videos.example.com/clean-fields.mp4',
              durationMinutes: 15
            },
            {
              title: 'Reshaping with Melt & Pivot',
              description: 'Tidy transformation patterns.',
              contentType: 'text',
              contentData: 'Long vs wide tradeoffs; pipeline composition patterns.',
              durationMinutes: 11
            }
          ]
        }
      ]
    },
    {
      title: 'Modern Frontend Engineering with TypeScript',
      smallDescription: 'Architect scalable frontend applications using TypeScript.',
      description: 'This course walks through practical patterns for building maintainable, component-driven user interfaces. You will adopt strict typing, decomposition strategies, accessibility considerations, and performance profiling to ship resilient interfaces.',
      category: 'Web Development',
      thumbnailUrl: 'https://placehold.co/600x400/ts-frontend.png',
      estimatedHours: 22,
      price: 49,
      difficulty: 'intermediate',
      status: 'published',
      instructorId: ben.id,
      modules: [
        {
          title: 'Type System Essentials',
          description: 'Leverage type inference & generics.',
          lessons: [
            {
              title: 'From Any to Never: Type Safety Spectrum',
              description: 'Phases of tightening a codebase.',
              contentType: 'text',
              contentData: 'Progressively constrain surfaces; treat implicit any as a migration smell.',
              durationMinutes: 9
            },
            {
              title: 'Generics that Communicate Shape',
              description: 'Designing reusable abstractions.',
              contentType: 'video',
              contentData: 'https://videos.example.com/generics-shape.mp4',
              durationMinutes: 16
            }
          ]
        },
        {
          title: 'Performance & Accessibility',
          description: 'Ship fast, inclusive experiences.',
          lessons: [
            {
              title: 'Rendering Costs & Hydration',
              description: 'Minimizing wasted work.',
              contentType: 'text',
              contentData: 'Analyze flame charts, memo boundaries, and stream patterns.',
              durationMinutes: 13
            },
            {
              title: 'Accessible Components',
              description: 'Avoid anti-patterns.',
              contentType: 'text',
              contentData: 'Semantics first, ARIA second. Keyboard loops & focus traps done right.',
              durationMinutes: 12
            }
          ]
        }
      ]
    },
    {
      title: 'Statistical Thinking for Analysts',
      smallDescription: 'Practical statistics to support everyday product questions.',
      description: 'Focus on clarity over jargon. You will design lightweight experiments, interpret uncertainty, and frame variance in business-ready language. Emphasis on assumptions and communicating risk.',
      category: 'Data Science',
      thumbnailUrl: 'https://placehold.co/600x400/stats.png',
      estimatedHours: 15,
      price: 35,
      difficulty: 'intermediate',
      status: 'published',
      instructorId: alice.id,
      modules: [
        {
          title: 'Reasoning Under Uncertainty',
          description: 'Foundational concepts.',
          lessons: [
            {
              title: 'Sampling Intuition',
              description: 'Why sample vs population differs.',
              contentType: 'text',
              contentData: 'Coverage vs precision tradeoffs; random vs systematic errors.',
              durationMinutes: 10
            },
            {
              title: 'Confidence Without Overconfidence',
              description: 'Intervals as ranges of plausible values.',
              contentType: 'text',
              contentData: 'Interpretation patterns & misuse pitfalls (not probability of truth).',
              durationMinutes: 11
            }
          ]
        }
      ]
    },
    {
      title: 'Intro to Machine Learning Pipelines',
      smallDescription: 'From raw dataset to deployable predictive service.',
      description: 'Learn how to structure an end‑to‑end ML workflow: data readiness, feature viewpoints, model baselines, evaluation honesty, iteration loops, and lightweight deployment patterns for early value delivery.',
      category: 'Machine Learning',
      thumbnailUrl: 'https://placehold.co/600x400/ml-pipelines.png',
      estimatedHours: 20,
      price: 59,
      difficulty: 'intermediate',
      status: 'published',
      instructorId: alice.id,
      modules: [
        {
          title: 'Data Readiness & Profiling',
          description: 'Understand the raw surface before modeling.',
          lessons: [
            {
              title: 'Profiling for Risks Early',
              description: 'Detect leakage, imbalance, drift signals.',
              contentType: 'text',
              contentData: 'Systematically scan distributions, cardinality, missingness heat maps. Flag target leakage candidates.',
              durationMinutes: 14
            },
            {
              title: 'Feature Contracts',
              description: 'Designing stable interfaces.',
              contentType: 'text',
              contentData: 'Explicit data contracts reduce pipeline breakage; version features, annotate provenance.',
              durationMinutes: 9
            }
          ]
        },
        {
          title: 'Model Iteration Loop',
          description: 'Baseline first, then justify complexity.',
          lessons: [
            {
              title: 'Baselines & Sanity Checks',
              description: 'Always beat naive baselines honestly.',
              contentType: 'text',
              contentData: 'Start with majority / linear models. Validate metric stability with repeated splits.',
              durationMinutes: 12
            }
          ]
        }
      ]
    },
    {
      title: 'Cloud Architecture Fundamentals',
      smallDescription: 'Design resilient, observable cloud backends.',
      description: 'You will map business requirements to lean, fault‑tolerant architectures. Emphasis on latency budgets, cost awareness, graceful degradation, and iterative observability maturity.',
      category: 'Cloud',
      thumbnailUrl: 'https://placehold.co/600x400/cloud-arch.png',
      estimatedHours: 16,
      price: 42,
      difficulty: 'intermediate',
      status: 'published',
      instructorId: ben.id,
      modules: [
        {
          title: 'Resilience Patterns',
          description: 'Handling failure as a first-class scenario.',
          lessons: [
            {
              title: 'Backoff & Circuit Breakers',
              description: 'Staying fast under partial outages.',
              contentType: 'text',
              contentData: 'Calibrate retry budgets; monitor saturation signals; avoid retry storms.',
              durationMinutes: 11
            }
          ]
        }
      ]
    },
    {
      title: 'Practical SQL for Analytics & Operations',
      smallDescription: 'Query patterns that scale analytical clarity.',
      description: 'Move beyond SELECT *. Learn expressive window logic, dimensional modeling queries, incremental rollups, and defensively written transformations that survive schema evolution.',
      category: 'Data Engineering',
      thumbnailUrl: 'https://placehold.co/600x400/sql.png',
      estimatedHours: 14,
      price: 25,
      difficulty: 'beginner',
      status: 'published',
      instructorId: ben.id,
      modules: [
        {
          title: 'Shaping Result Sets',
          description: 'Window & aggregation synergy.',
          lessons: [
            {
              title: 'Window Frames in Plain Language',
              description: 'Cumulative vs sliding semantics.',
              contentType: 'text',
              contentData: 'Define frame boundaries intentionally; prevent accidental unbounded scans.',
              durationMinutes: 13
            }
          ]
        }
      ]
    },
    {
      title: 'Data Visualization Story Craft',
      smallDescription: 'Transform metrics into narrative shifts.',
      description: 'Focus on audience alignment, layering context, pre‑attentive cues, and eliminating chart noise. You will justify every pixel with intention.',
      category: 'Data Visualization',
      thumbnailUrl: 'https://placehold.co/600x400/dataviz.png',
      estimatedHours: 10,
      price: 19,
      difficulty: 'beginner',
      status: 'published',
      instructorId: alice.id,
      modules: [
        {
          title: 'Visual Encodings',
          description: 'Choosing form for function.',
          lessons: [
            {
              title: 'Color & Contrast Ethics',
              description: 'Readability & accessibility.',
              contentType: 'text',
              contentData: 'Limit palettes; encode hierarchy with saturation not rainbow chaos.',
              durationMinutes: 9
            }
          ]
        }
      ]
    },
    {
      title: 'API Design for Evolving Backends',
      smallDescription: 'Stable interfaces through change pressure.',
      description: 'Plan for versioning, schema negotiation, idempotency guarantees, and tight feedback loops. Emphasis on pragmatic contracts that remain adaptable.',
      category: 'Backend',
      thumbnailUrl: 'https://placehold.co/600x400/api.png',
      estimatedHours: 17,
      price: 39,
      difficulty: 'advanced',
      status: 'published',
      instructorId: ben.id,
      modules: [
        {
          title: 'Interface Stability',
          description: 'Minimize breaking events.',
          lessons: [
            {
              title: 'Deprecation Playbooks',
              description: 'Sunset endpoints responsibly.',
              contentType: 'text',
              contentData: 'Announce with timelines; dual‑run phases; observability around usage tail.',
              durationMinutes: 12
            }
          ]
        }
      ]
    },
    {
      title: 'Secure Coding Essentials',
      smallDescription: 'Prevent classes of vulnerabilities early.',
      description: 'You will internalize threat modeling habits, input normalization, output encoding, and operational guardrails. Build a proactive rather than reactive security posture.',
      category: 'Security',
      thumbnailUrl: 'https://placehold.co/600x400/security.png',
      estimatedHours: 12,
      price: 45,
      difficulty: 'intermediate',
      status: 'published',
      instructorId: alice.id,
      modules: [
        {
          title: 'Common Web Risks',
          description: 'Patterns & mitigations.',
          lessons: [
            {
              title: 'Injection Mindset',
              description: 'Neutralize untrusted input.',
              contentType: 'text',
              contentData: 'Parameterized queries, strict parsers, denylist pitfalls vs allow rules.',
              durationMinutes: 10
            }
          ]
        }
      ]
    }
  ];

  const insertedCourses: Array<{ id: string; title: string; instructorId: string; }> = [];

  for (const c of courseDefinitions) {
    // Ensure description is stored as a JSON string (rich text) if it's plain text
    const descriptionJsonString = (() => {
      if (!c.description) return JSON.stringify(makeRichTextDoc(''));
      // If already looks like JSON (starts with { or [), trust it
      const trimmed = c.description.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed; // assume already JSON
      return JSON.stringify(makeRichTextDoc(c.description));
    })();

    const [created] = await db.insert(courses).values({
      title: c.title,
      smallDescription: c.smallDescription,
      description: descriptionJsonString,
      category: c.category,
      thumbnailUrl: c.thumbnailUrl,
      estimatedHours: c.estimatedHours,
      price: c.price,
      status: c.status as any,
      difficulty: c.difficulty as any,
      instructorId: c.instructorId,
    }).returning({ id: courses.id, title: courses.title, instructorId: courses.instructorId });

    insertedCourses.push(created);

    // Modules
    let moduleOrder = 1;
    for (const m of c.modules) {
      const [mod] = await db.insert(modules).values({
        courseId: created.id,
        title: m.title,
        description: m.description,
        order: moduleOrder++,
      }).returning({ id: modules.id });

      // Lessons
      let lessonOrder = 1;
      for (const l of m.lessons) {
        await db.insert(lessons).values({
          moduleId: mod.id,
          title: l.title,
          description: l.description,
          contentType: l.contentType as any,
          contentData: l.contentData,
            order: lessonOrder++,
          durationMinutes: l.durationMinutes,
        });
      }
    }
  }

  return insertedCourses;
}

async function seedEnrollments(userMap: Record<string, CreatedUser>, courseRecords: Array<{ id: string; instructorId: string; }>) {
  const learners = Object.values(userMap).filter(u => u.role === 'learner');
  if (!learners.length) return;

  for (const learner of learners) {
    for (const course of courseRecords) {
      // Enroll in first two courses only
      if (Math.random() < 0.7) {
        await db.insert(courseEnrollments).values({
          userId: learner.id,
          courseId: course.id,
          progressPercentage: Math.floor(Math.random() * 60),
        });
      }
    }
  }
}

async function main() {
  const start = Date.now();
  console.log('🌱 Seeding database...');
  await clearExisting();
  console.log('🧹 Cleared existing content records');
  const usersMap = await ensureUsers();
  console.log('👥 Users ensured:', Object.keys(usersMap).length);
  const courseRecords = await seedCourses(usersMap);
  console.log('📚 Courses inserted:', courseRecords.length);
  await seedEnrollments(usersMap, courseRecords);
  console.log('🧾 Enrollments seeded');
  console.log(`✅ Seed complete in ${Date.now() - start}ms`);
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
