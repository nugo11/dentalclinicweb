import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { geofont } from './fontBase64'; // შენი Base64 ფონტი

export const generateInvoice = (orderData, clinicData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- 1. ფონტის რეგისტრაცია ---
    // ვიყენებთ try-catch-ს ფონტისთვის, რომ არასწორი კოდის შემთხვევაში PDF მაინც შეიქმნას
    try {
      doc.addFileToVFS("Geofont.ttf", geofont);
      doc.addFont("Geofont.ttf", "Geofont", "normal");
      doc.setFont("Geofont");
    } catch (e) {
      console.error("Font Load Error:", e);
      doc.setFont("helvetica"); // fallback
    }

    // --- 2. დიზაინერული ჰედერი ---
    doc.setFillColor(124, 93, 250); 
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(clinicData.name ? clinicData.name.toUpperCase() : "DENTAL HUB", 14, 25);
    
    doc.setFontSize(10);
    doc.text("სტომატოლოგიური კლინიკა / DENTAL CLINIC", 14, 35);

    // --- 3. ინვოისის მეტამონაცემები (ზედა მარჯვენა კუთხე) ---
    doc.setFontSize(10);
    doc.text(`ინვოისი: #${orderData.id?.slice(0, 8).toUpperCase()}`, pageWidth - 70, 20);
    doc.text(`თარიღი: ${new Date(orderData.finalizedAt || Date.now()).toLocaleDateString('ka-GE')}`, pageWidth - 70, 27);
    
    // სტატუსის ბეჯი
    const isPaid = orderData.paidAmount >= orderData.price;
    doc.setFillColor(isPaid ? 16 : 239, isPaid ? 185 : 68, isPaid ? 129 : 68);
    doc.roundedRect(pageWidth - 70, 31, 30, 7, 1, 1, 'F');
    doc.text(isPaid ? "გადახდილია" : "გადასახდელია", pageWidth - 68, 36);

    // --- 4. რეკვიზიტები ---
    doc.setTextColor(40, 44, 101);
    doc.setFontSize(12);
    doc.text("გამომწერი:", 14, 60);
    doc.text("პაციენტი:", 110, 60);

    doc.setFontSize(10);
    doc.setTextColor(100);
    
    // კლინიკის ინფო
    doc.text([
      `მისამართი: ${clinicData.address}`,
      `ს/კ: ${clinicData.tin}`,
      `ტელ: ${clinicData.phone}`
    ], 14, 68);

    // პაციენტის ინფო
    doc.text([
      `სახელი: ${orderData.patientName}`,
      `პირადი №: ${orderData.personalId || '---'}`,
      `ტელ: ${orderData.phone || '---'}`
    ], 110, 68);

    // --- 5. მომსახურების ცხრილი ---
    // სათაურის ბექგრაუნდი (BG)
    doc.setFillColor(245, 243, 255); // ნაზი იასამნისფერი BG
    doc.rect(14, 82, pageWidth - 28, 8, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(124, 93, 250);
    doc.text("გაწეული მომსახურება:", 18, 87.5);

    autoTable(doc, {
      startY: 92,
      body: orderData.billedServices?.map(s => [
        s.name, 
        "1", 
        `${Number(s.price).toFixed(2)} ₾`, 
        `${Number(s.price).toFixed(2)} ₾`
      ]) || [],
      theme: 'grid',
      styles: { font: "Geofont", fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // --- 6. ფინანსური შეჯამება ---
    const finalY = doc.lastAutoTable.finalY + 15;
    const summaryX = pageWidth - 85;

    doc.setFontSize(11);
    doc.setTextColor(40, 44, 101);
    doc.text("ჯამური ღირებულება:", summaryX, finalY);
    doc.text(`${Number(orderData.price).toFixed(2)} ₾`, pageWidth - 14, finalY, { align: "right" });

    doc.setTextColor(16, 185, 129);
    doc.text("გადახდილი თანხა:", summaryX, finalY + 8);
    doc.text(`${Number(orderData.paidAmount).toFixed(2)} ₾`, pageWidth - 14, finalY + 8, { align: "right" });

    doc.setDrawColor(230);
    doc.line(summaryX, finalY + 12, pageWidth - 14, finalY + 12);

    const balance = Number(orderData.price) - Number(orderData.paidAmount);
    if (balance > 0) {
      doc.setTextColor(239, 68, 68); // წითელი თუ დავალიანებაა
    } else {
      doc.setTextColor(40, 44, 101);
    }

    doc.setFontSize(14);
    doc.text("დარჩენილი ნაშთი:", summaryX, finalY + 22);
    doc.text(`${balance.toFixed(2)} ₾`, pageWidth - 14, finalY + 22, { align: "right" });

    // --- 7. ფუტერი ---
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text("გმადლობთ, რომ სარგებლობთ ჩვენი მომსახურებით!", pageWidth / 2, 285, { align: "center" });

    doc.save(`ინვოისი_${orderData.patientName.replace(/\s+/g, '_')}.pdf`);

  } catch (error) {
    console.error("PDF გენერაციის შეცდომა:", error);
    alert("ვერ მოხერხდა PDF-ის შექმნა. შეამოწმეთ ფონტის კოდი.");
  }
};