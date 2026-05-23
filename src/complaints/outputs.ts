export interface MailtoInput {
  to: string;
  subject: string;
  body: string;
}

export function buildMailtoUrl({ to, subject, body }: MailtoInput): string {
  const params = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (!to) return `mailto:?${params}`;
  return `mailto:${encodeURIComponent(to).replace(/%40/g, '@')}?${params}`;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function markdownToHtml(md: string): { title: string; body: string } {
  const lines = md.split('\n');
  let title = 'Complaint';
  const parts: string[] = [];
  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length > 0) {
      parts.push(`<p>${escapeHtml(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('# ')) {
      flushParagraph();
      title = line.slice(2).trim();
      parts.push(`<h1>${escapeHtml(title)}</h1>`);
    } else if (line.startsWith('## ')) {
      flushParagraph();
      parts.push(`<h2>${escapeHtml(line.slice(3).trim())}</h2>`);
    } else if (line.startsWith('- ')) {
      flushParagraph();
      parts.push(`<ul><li>${escapeHtml(line.slice(2))}</li></ul>`);
    } else if (line === '') {
      flushParagraph();
    } else {
      paragraph.push(line);
    }
  }
  flushParagraph();
  return { title, body: parts.join('\n') };
}

const STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14pt; color: #000; background: #fff; margin: 40px; line-height: 1.5; }
  h1 { font-size: 24pt; margin: 0 0 12px 0; }
  h2 { font-size: 18pt; margin: 16px 0 6px 0; }
  p { margin: 0 0 8px 0; }
  ul { padding-left: 22px; margin: 0 0 8px 0; }
`;

export function complaintToHtml(markdown: string): string {
  const { title, body } = markdownToHtml(markdown);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>${STYLE}</style>
  </head>
  <body>${body}</body>
</html>`;
}

export async function copyComplaint(text: string): Promise<void> {
  const Clip = await import('expo-clipboard');
  await Clip.setStringAsync(text);
}

export async function exportComplaintPdf(markdown: string): Promise<void> {
  const html = complaintToHtml(markdown);
  const Print = await import('expo-print');
  await Print.printAsync({ html });
}

export async function openComplaintMailto(input: MailtoInput): Promise<void> {
  const url = buildMailtoUrl(input);
  const { Linking } = await import('react-native');
  await Linking.openURL(url);
}
