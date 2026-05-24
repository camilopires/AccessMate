import { describe, test, expect } from 'bun:test';

// happy-dom is registered via bunfig.toml preload.
const { h, mount, clear } = await import('../src/dom');

describe('h()', () => {
  test('creates an element with attributes and children', () => {
    const el = h('div', { id: 'x', className: 'card' }, 'hello');
    expect(el.id).toBe('x');
    expect(el.className).toBe('card');
    expect(el.textContent).toBe('hello');
  });

  test('attaches event handlers when key starts with on', () => {
    let fired = 0;
    const btn = h('button', { onclick: () => (fired += 1) }, 'go');
    btn.click();
    expect(fired).toBe(1);
  });

  test('skips false / null / undefined children', () => {
    const el = h('div', {}, 'a', false, null, undefined, 'b');
    expect(el.textContent).toBe('ab');
  });

  test('boolean attributes are set when truthy, omitted when falsy', () => {
    const t = h('input', { disabled: true });
    expect(t.hasAttribute('disabled')).toBe(true);
    const f = h('input', { disabled: false });
    expect(f.hasAttribute('disabled')).toBe(false);
  });
});

describe('mount() / clear()', () => {
  test('mount replaces existing children', () => {
    const root = document.createElement('div');
    root.appendChild(document.createElement('p'));
    mount(root, h('span', {}, 'new'));
    expect(root.children.length).toBe(1);
    expect(root.firstElementChild?.tagName).toBe('SPAN');
  });

  test('clear empties the node', () => {
    const root = document.createElement('div');
    root.appendChild(document.createElement('p'));
    clear(root);
    expect(root.children.length).toBe(0);
  });
});
