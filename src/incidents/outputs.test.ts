import { describe, it, expect } from 'vitest';
import { buildMailtoUrl, complaintToHtml } from './outputs';

describe('buildMailtoUrl', () => {
  it('builds a mailto URL with subject and body', () => {
    const url = buildMailtoUrl({
      to: 'complaints@example.com',
      subject: 'Complaint: missed assist',
      body: 'Dear team,\n\nI was missed.',
    });
    expect(url).toMatch(/^mailto:complaints@example\.com\?/);
    expect(url).toMatch(/subject=Complaint%3A%20missed%20assist/);
    expect(url).toMatch(/body=Dear%20team%2C/);
  });

  it("falls back to a 'no recipient' mailto when to is empty", () => {
    const url = buildMailtoUrl({ to: '', subject: 'Hi', body: 'x' });
    expect(url).toBe('mailto:?subject=Hi&body=x');
  });
});

describe('complaintToHtml', () => {
  it('renders markdown headings as H1/H2 with escaped body', () => {
    const html = complaintToHtml('# Title\n\n## Sub\n\nBody with <html>');
    expect(html).toMatch(/<title>Title<\/title>/);
    expect(html).toMatch(/<h1>Title<\/h1>/);
    expect(html).toMatch(/<h2>Sub<\/h2>/);
    expect(html).toMatch(/&lt;html&gt;/);
  });

  it('uses an accessible body font size', () => {
    const html = complaintToHtml('# X\n\nbody');
    expect(html).toMatch(/font-size:\s*1[4-9]pt/i);
  });
});
