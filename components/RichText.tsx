import { Fragment, type ReactNode } from 'react'

// Event descriptions are a plain `text` column (events.description) typed into
// a textarea in the admin, so there is no structured rich-text document to
// render — but menus need structure: course subheaders, and one dish per line.
// Markdown-lite keeps the admin editing experience as-is while restoring that
// structure on the public page:
//
//   blank line             -> new block
//   single \n              -> new line within the block
//   **text**               -> bold run
//   a line that is only a
//   bold run               -> course subheader ("**Bites**", "**Main**")
//
// A fully-bold line is promoted to a subheader whether or not it is separated
// by blank lines, so pasted copy with inconsistent spacing still comes out
// looking the same. Built as React nodes rather than dangerouslySetInnerHTML,
// so guest-visible copy can never inject markup.

const BOLD = /\*\*([\s\S]+?)\*\*/g
const ONLY_BOLD = /^\*\*([\s\S]+)\*\*$/

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  BOLD.lastIndex = 0
  while ((match = BOLD.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    nodes.push(
      <strong key={`${keyPrefix}-b${match.index}`} className="font-normal text-brown">
        {match[1]}
      </strong>
    )
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))

  return nodes
}

type Chunk =
  | { kind: 'subheader'; text: string }
  | { kind: 'lines'; lines: string[] }

// Split a block into runs of ordinary lines, with any fully-bold line lifted
// out as its own subheader chunk.
function chunkBlock(block: string): Chunk[] {
  const chunks: Chunk[] = []
  let run: string[] = []

  const flush = () => {
    if (run.length) {
      chunks.push({ kind: 'lines', lines: run })
      run = []
    }
  }

  for (const line of block.split('\n')) {
    const heading = ONLY_BOLD.exec(line.trim())
    if (heading) {
      flush()
      chunks.push({ kind: 'subheader', text: heading[1].trim() })
    } else {
      run.push(line)
    }
  }
  flush()

  return chunks
}

export default function RichText({
  value,
  className = '',
  style,
}: {
  value: string
  className?: string
  style?: React.CSSProperties
}) {
  const blocks = value
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(Boolean)

  return (
    <div className={className} style={style}>
      {blocks.flatMap((block, i) =>
        chunkBlock(block).map((chunk, j) => {
          const key = `${i}-${j}`

          if (chunk.kind === 'subheader') {
            return (
              <p
                key={key}
                className="font-cormorant italic text-brown mt-7 mb-1.5 first:mt-0"
                style={{ fontSize: '22px', lineHeight: 1.3 }}
              >
                {chunk.text}
              </p>
            )
          }

          return (
            <p key={key} className="mb-5 last:mb-0">
              {chunk.lines.map((line, k) => (
                <Fragment key={k}>
                  {k > 0 && <br />}
                  {renderInline(line, `${key}-${k}`)}
                </Fragment>
              ))}
            </p>
          )
        })
      )}
    </div>
  )
}
