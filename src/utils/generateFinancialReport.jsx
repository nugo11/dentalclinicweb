import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { geofont } from './fontBase64';

export const generateFinancialReport = (data, dateFrom, dateTo, clinicData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- 1. ფონტის რეგისტრაცია ---
    try {
      doc.addFileToVFS("Geofont.ttf", geofont);
      doc.addFont("Geofont.ttf", "Geofont", "normal");
      doc.setFont("Geofont");
    } catch (e) {
      console.error("Font Load Error:", e);
      doc.setFont("helvetica");
    }

    // --- 2. ჰედერი ---
    doc.setFillColor(40, 44, 101); // მუქი ლურჯი
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("ფინანსური ანგარიშგება", 14, 20);
    
    doc.setFontSize(10);
    doc.text(clinicData.name || "DENTAL HUB", 14, 30);
    doc.text(`პერიოდი: ${dateFrom || 'დასაწყისიდან'} - ${dateTo || 'დღემდე'}`, pageWidth - 14, 20, { align: 'right' });
    doc.text(`შექმნილია: ${new Date().toLocaleString('ka-GE')}`, pageWidth - 14, 30, { align: 'right' });

    // --- 3. შეჯამება (Summary) ---
    const totalRevenue = data.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const cashTotal = data.filter(i => i.paymentMethod === 'cash').reduce((sum, item) => sum + Number(item.price || 0), 0);
    const cardTotal = data.filter(i => i.paymentMethod === 'card').reduce((sum, item) => sum + Number(item.price || 0), 0);
    const transferTotal = data.filter(i => i.paymentMethod === 'transfer').reduce((sum, item) => sum + Number(item.price || 0), 0);

    doc.setTextColor(40, 44, 101);
    doc.setFontSize(12);
    doc.text("ფინანსური შეჯამება:", 14, 55);

    autoTable(doc, {
      startY: 60,
      body: [
        ["ნაღდი ანგარიშსწორება", `${cashTotal.toFixed(2)} ₾`],
        ["ბარათით გადახდა", `${cardTotal.toFixed(2)} ₾`],
        ["საბანკო გადმორიცხვა", `${transferTotal.toFixed(2)} ₾`],
        ["ჯამური შემოსავალი", `${totalRevenue.toFixed(2)} ₾`]
      ],
      theme: 'plain',
      styles: { font: "Geofont", fontSize: 10 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });

    // --- 4. დეტალური ტრანზაქციები ---
    const tableStartY = doc.lastAutoTable.finalY + 20;
    
    // სათაურის ბექგრაუნდი (BG)
    doc.setFillColor(40, 44, 101); // მუქი ლურჯი BG
    doc.rect(14, tableStartY - 10, pageWidth - 28, 8, 'F');

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("ტრანზაქციების დეტალური სია:", 18, tableStartY - 4.5);

    autoTable(doc, {
      startY: tableStartY,
      body: data.map(item => [
        new Date(item.finalizedAt).toLocaleDateString('ka-GE'),
        item.patientName,
        item.paymentMethod === 'cash' ? 'ნაღდი' : item.paymentMethod === 'card' ? 'ბარათი' : 'გადმორიცხვა',
        item.payerType === 'personal' ? 'პირადი' : item.payerType === 'insurance' ? 'სადაზღვ.' : 'კორპ.',
        `${Number(item.price).toFixed(2)} ₾`
      ]),
      theme: 'grid',
      styles: { font: "Geofont", fontSize: 9 },
      columnStyles: {
        4: { halign: 'right' }
      }
    });

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };

  } catch (error) {
    console.error("Report Error:", error);
    alert("ვერ მოხერხდა რეპორტის გენერაცია");
  }
};
