// Key of the last section whose top is above `line`, or null above the first one.
// At the bottom of the page it is the last section, even if that one is too short to reach the line.
export function currentSection(sections, line, atBottom = false) {
  if (atBottom && sections.length) return sections.at(-1).key;
  let cur = null;
  for (const s of sections) if (s.top < line) cur = s.key;
  return cur;
}
