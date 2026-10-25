// Key of the last section whose top is above `line`, or null above the first one
export function currentSection(sections, line) {
  let cur = null;
  for (const s of sections) if (s.top < line) cur = s.key;
  return cur;
}
