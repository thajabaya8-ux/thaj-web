// window.print() left an iPhone admin with nothing they recognised how
// to act on — Safari's print sheet doesn't read as "save this file" to
// someone who's never used it, so the waybill just seemed to do nothing.
// This renders the same on-screen .waybill element straight into a real
// .pdf and hands it to the browser's own download/save flow instead —
// works the same way on every device, no print dialog detour needed.
export async function downloadWaybillPdf(el: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf')
  ]);
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height / canvas.width) * imgWidth;
  pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
  pdf.save(filename);
}
