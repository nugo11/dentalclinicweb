import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { geofont } from "./fontBase64";

// პროფესიონალური სტატუსების თარგმანი
const statusTranslations = {
  healthy: "ჯანსაღი",
  caries: "კარიესი",
  pulpitis: "პულპიტი",
  periodontitis: "პერიოდონტიტი",
  filling: "დაბჟენილი",
  implant: "იმპლანტი",
  crown: "გვირგვინი",
  missing: "არ არის",
  extraction_req: "ამოსაღები",
  bridge: "ხიდი",
  canal_treated: "არხები"
};

export const generateForm100 = async (patient, clinicData, doctorNotes = "") => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // ფონტის რეგისტრაცია და აქტივაცია
  doc.addFileToVFS("GeoFont.ttf", geofont);
  doc.addFont("GeoFont.ttf", "GeoFont", "normal");
  doc.setFont("GeoFont");

  // 1. მთავარი სათაური
  doc.setFontSize(18);
  doc.text("სამედიცინო ცნობა №100", pageWidth / 2, 20, { align: "center" });

  // 2. კლინიკის დასახელება და თარიღი
  doc.setFontSize(10);
  doc.text(`დაწესებულება: ${clinicData?.clinicName || "AiDent"}`, margin, 35);
  doc.text(`თარიღი: ${new Date().toLocaleDateString("ka-GE")}`, pageWidth - margin, 35, { align: "right" });
  doc.line(margin, 40, pageWidth - margin, 40);

  // ფუნქცია, რომელიც უზრუნველყოფს ყველა უჯრედში ქართული ფონტის გამოყენებას
  const tableOptions = {
    margin: { left: margin, right: margin },
    styles: { font: "GeoFont" },
    didParseCell: (data) => {
      data.cell.styles.font = 'GeoFont'; // ეს ხაზი ასწორებს head-ის პრობლემას
    }
  };

  // 3. პაციენტის მონაცემების ცხრილი
  doc.setFontSize(12);
  autoTable(doc, {
    ...tableOptions,
    startY: 45,
    body: [
      ['პაციენტი:', patient.fullName || "---"],
      ['პირადი ნომერი:', patient.personalId || "---"],
      ['ტელეფონი:', patient.phone || "---"],
      ['ალერგია:', patient.allergies || "არ ფიქსირდება"],
      ['ქრონიკული დაავადებები:', patient.chronicDiseases || "არ ფიქსირდება"],
    ],
    tableWidth: contentWidth,
    theme: 'grid'
  });

  let currentY = doc.lastAutoTable.finalY + 15;

  // 4. კბილების მდგომარეობის ცხრილი
  doc.setFontSize(12);
  doc.text("კბილების მდგომარეობა (ფორმულა):", margin, currentY);

  if (patient.teethStatus && Object.keys(patient.teethStatus).length > 0) {
    const teethRows = Object.entries(patient.teethStatus)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([num, data]) => [
        `№${num}`,
        statusTranslations[data.status] || data.status,
        data.comment || "---"
      ]);

    autoTable(doc, {
      ...tableOptions,
      startY: currentY + 5,
      body: teethRows,
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 'auto' }
      },
      theme: 'striped'
    });
    currentY = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.text("მონაცემები კბილების ფორმულის შესახებ არ ფიქსირდება.", margin, currentY + 10);
    currentY += 25;
  }

  // 5. ექიმის დასკვნა
  if (currentY > 240) { doc.addPage(); currentY = 20; }
  doc.setFontSize(12);
  doc.text("ექიმის დასკვნა და დანიშნულება:", margin, currentY);
  
  doc.setFontSize(10);
  const splitNotes = doc.splitTextToSize(doctorNotes || "ჩანაწერები არ არის", contentWidth);
  doc.text(splitNotes, margin, currentY + 10);
  
  currentY += (splitNotes.length * 7) + 30;

  // 6. ხელმოწერის ნაწილი
  if (currentY > 270) { doc.addPage(); currentY = 20; }
  doc.line(margin, currentY, 80, currentY);
  doc.text("ექიმის ხელმოწერა", margin, currentY + 5);
  
  doc.line(pageWidth - margin - 50, currentY, pageWidth - margin, currentY);
  doc.text("ბეჭდის ადგილი", pageWidth - margin - 50, currentY + 5);

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);

  return new Promise((resolve) => {
    iframe.onload = () => {
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
        resolve();
      }, 1500);
    };
  });
};