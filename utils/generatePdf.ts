export function generatePdfFromHtml(html: string, _filename = 'ehr.pdf'): Promise<void> {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return Promise.reject(new Error('Unable to open print window'));

  const css = `body{font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding:20px; color:#111}`;
  const content = `<!doctype html><html><head><meta charset="utf-8"/><title>Print</title><style>${css}</style></head><body><div class="container">${html}</div></body></html>`;

  printWindow.document.open();
  printWindow.document.write(content);
  printWindow.document.close();

  return new Promise<void>((resolve) => {
    setTimeout(() => {
      try { printWindow.focus(); printWindow.print(); } catch (e) { /* ignore */ }
      resolve();
    }, 500);
  });
}
