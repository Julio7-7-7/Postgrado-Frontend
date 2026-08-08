export function maxTextWidth(elements: HTMLElement[]): number {
  if (elements.length === 0) return 0;
  const probe = document.createElement('span');
  probe.style.position = 'fixed';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.style.visibility = 'hidden';
  probe.style.whiteSpace = 'nowrap';
  const cs = getComputedStyle(elements[0]);
  probe.style.font = cs.font;
  probe.style.fontWeight = cs.fontWeight;
  probe.style.letterSpacing = cs.letterSpacing;
  document.body.appendChild(probe);
  let max = 0;
  for (const el of elements) {
    probe.textContent = el.textContent || '';
    max = Math.max(max, probe.offsetWidth);
  }
  probe.remove();
  return max;
}
