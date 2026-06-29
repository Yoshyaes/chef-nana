'use client'

const DIETARY_OPTIONS = ['Vegan', 'Vegetarian', 'Gluten-free', 'Dairy-free', 'Halal', 'Kosher']
const ALLERGEN_OPTIONS = ['Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Gluten', 'Soy', 'Fish']

interface Dish {
  name: string
  description: string
  dietary: string[]
  allergens: string[]
}

interface Course {
  name: string
  dishes: Dish[]
}

interface Props {
  courses: Course[]
  onChange: (courses: Course[]) => void
}

function emptyDish(): Dish {
  return { name: '', description: '', dietary: [], allergens: [] }
}

function emptyCourse(): Course {
  return { name: '', dishes: [emptyDish()] }
}

function toggleArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
}

export default function CourseDishRepeater({ courses, onChange }: Props) {
  function updateCourse(i: number, patch: Partial<Course>) {
    const next = [...courses]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }

  function addCourse() {
    onChange([...courses, emptyCourse()])
  }

  function removeCourse(i: number) {
    onChange(courses.filter((_, idx) => idx !== i))
  }

  function moveCourse(i: number, dir: -1 | 1) {
    const next = [...courses]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  function updateDish(ci: number, di: number, patch: Partial<Dish>) {
    const next = [...courses]
    const dishes = [...next[ci].dishes]
    dishes[di] = { ...dishes[di], ...patch }
    next[ci] = { ...next[ci], dishes }
    onChange(next)
  }

  function addDish(ci: number) {
    const next = [...courses]
    next[ci] = { ...next[ci], dishes: [...next[ci].dishes, emptyDish()] }
    onChange(next)
  }

  function removeDish(ci: number, di: number) {
    const next = [...courses]
    next[ci] = { ...next[ci], dishes: next[ci].dishes.filter((_, idx) => idx !== di) }
    onChange(next)
  }

  function moveDish(ci: number, di: number, dir: -1 | 1) {
    const next = [...courses]
    const dishes = [...next[ci].dishes]
    const j = di + dir
    if (j < 0 || j >= dishes.length) return
    ;[dishes[di], dishes[j]] = [dishes[j], dishes[di]]
    next[ci] = { ...next[ci], dishes }
    onChange(next)
  }

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    border: '1px solid #e5d9c9',
    borderRadius: 7,
    fontSize: 13,
    color: 'var(--brown)',
    background: '#fff',
  }

  const labelStyle = {
    fontSize: 11,
    color: '#9a7d5a',
    display: 'block' as const,
    marginBottom: 4,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#9a7d5a', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
          Courses
        </div>
        <button
          type="button"
          onClick={addCourse}
          style={{
            padding: '5px 12px',
            background: 'transparent',
            border: '1px solid #e5d9c9',
            borderRadius: 7,
            fontSize: 12,
            color: '#9a7d5a',
            cursor: 'pointer',
          }}
        >
          + Add course
        </button>
      </div>

      {courses.length === 0 && (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: '#9a7d5a',
          fontSize: 13,
          border: '1px dashed #e5d9c9',
          borderRadius: 10,
          marginBottom: 8,
        }}>
          No courses yet. Add a course to start building the menu.
        </div>
      )}

      {courses.map((course, ci) => (
        <div key={ci} style={{
          border: '1px solid #e5d9c9',
          borderRadius: 10,
          padding: '16px',
          marginBottom: 12,
          background: '#faf7f3',
        }}>
          {/* Course header */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Course name</label>
              <input
                value={course.name}
                onChange={e => updateCourse(ci, { name: e.target.value })}
                placeholder="e.g. Starters, Mains, Desserts"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 20 }}>
              <button type="button" onClick={() => moveCourse(ci, -1)} disabled={ci === 0}
                style={{ padding: '4px 8px', border: '1px solid #e5d9c9', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, color: '#9a7d5a', opacity: ci === 0 ? 0.4 : 1 }}>
                ↑
              </button>
              <button type="button" onClick={() => moveCourse(ci, 1)} disabled={ci === courses.length - 1}
                style={{ padding: '4px 8px', border: '1px solid #e5d9c9', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, color: '#9a7d5a', opacity: ci === courses.length - 1 ? 0.4 : 1 }}>
                ↓
              </button>
              <button type="button" onClick={() => removeCourse(ci)}
                style={{ padding: '4px 8px', border: '1px solid #e5d9c9', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, color: '#B85A35' }}>
                Remove
              </button>
            </div>
          </div>

          {/* Dishes */}
          {course.dishes.map((dish, di) => (
            <div key={di} style={{
              background: '#fff',
              border: '1px solid #eee5d7',
              borderRadius: 8,
              padding: '12px',
              marginBottom: 8,
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Dish name</label>
                  <input
                    value={dish.name}
                    onChange={e => updateDish(ci, di, { name: e.target.value })}
                    placeholder="e.g. Jollof Rice"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 20 }}>
                  <button type="button" onClick={() => moveDish(ci, di, -1)} disabled={di === 0}
                    style={{ padding: '4px 8px', border: '1px solid #e5d9c9', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, color: '#9a7d5a', opacity: di === 0 ? 0.4 : 1 }}>
                    ↑
                  </button>
                  <button type="button" onClick={() => moveDish(ci, di, 1)} disabled={di === course.dishes.length - 1}
                    style={{ padding: '4px 8px', border: '1px solid #e5d9c9', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, color: '#9a7d5a', opacity: di === course.dishes.length - 1 ? 0.4 : 1 }}>
                    ↓
                  </button>
                  {course.dishes.length > 1 && (
                    <button type="button" onClick={() => removeDish(ci, di)}
                      style={{ padding: '4px 8px', border: '1px solid #e5d9c9', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 11, color: '#B85A35' }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Description</label>
                <input
                  value={dish.description}
                  onChange={e => updateDish(ci, di, { description: e.target.value })}
                  placeholder="Brief description of the dish"
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ ...labelStyle, marginBottom: 6 }}>Dietary</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {DIETARY_OPTIONS.map(opt => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5c3a22', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={dish.dietary.includes(opt)}
                          onChange={() => updateDish(ci, di, { dietary: toggleArray(dish.dietary, opt) })}
                          style={{ accentColor: 'var(--gold)' }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ ...labelStyle, marginBottom: 6 }}>Allergens</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ALLERGEN_OPTIONS.map(opt => (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5c3a22', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={dish.allergens.includes(opt)}
                          onChange={() => updateDish(ci, di, { allergens: toggleArray(dish.allergens, opt) })}
                          style={{ accentColor: '#B85A35' }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => addDish(ci)}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: '1px dashed #e5d9c9',
              borderRadius: 7,
              fontSize: 12,
              color: '#9a7d5a',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            + Add dish
          </button>
        </div>
      ))}
    </div>
  )
}
