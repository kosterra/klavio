/**
 * A very small XML reader – enough for MusicXML (elements, attributes, text;
 * no DTD, no namespaces needed). Works the same in the browser and in Node,
 * so the importer has no dependency on a DOM.
 */
export interface XmlNode {
  name: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code =
        e[1]?.toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e] ?? m;
  });
}

export function parseXml(source: string): XmlNode {
  const root: XmlNode = { name: '#root', attrs: {}, children: [], text: '' };
  const stack: XmlNode[] = [root];
  const re =
    /<!--[\s\S]*?-->|<!\[CDATA\[([\s\S]*?)\]\]>|<![^>]*>|<\?[\s\S]*?\?>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const top = stack.at(-1)!;
    if (m[1] !== undefined) top.text += m[1];
    else if (m[2]) {
      if (stack.length > 1 && top.name === m[2]) stack.pop();
    } else if (m[3]) {
      const attrs: Record<string, string> = {};
      for (const a of m[4]!.matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))
        attrs[a[1]!] = decode(a[2] ?? a[3] ?? '');
      const node: XmlNode = { name: m[3], attrs, children: [], text: '' };
      top.children.push(node);
      if (!m[5]) stack.push(node);
    } else if (m[6] !== undefined) top.text += decode(m[6]);
  }
  return root;
}

export const child = (n: XmlNode | undefined, name: string) =>
  n?.children.find((c) => c.name === name);
export const children = (n: XmlNode | undefined, name: string) =>
  n?.children.filter((c) => c.name === name) ?? [];
export const textOf = (n: XmlNode | undefined, ...path: string[]): string | undefined => {
  let cur = n;
  for (const p of path) cur = child(cur, p);
  return cur?.text.trim();
};
