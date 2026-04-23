export const generateInvoice = async (order, clinicData) => {
  const vatAmount = order.vatAmount || (Number(order.price || 0) * 0.18);
  const materialsAmount = order.extraMaterials?.reduce((sum, m) => sum + (Number(m.amount) * Number(m.pricePerUnit || 0)), 0) || 0;
  const servicesAmount = Number(order.price || 0) - materialsAmount;

  const content = `
    <html>
      <head>
        <title>ინვოისი - ${order.patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; background: #fff; }
          .card { max-width: 850px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 50px; border-radius: 32px; position: relative; }
          .header { border-bottom: 2px solid #f1f5f9; padding-bottom: 35px; margin-bottom: 45px; display: flex; justify-content: space-between; align-items: center; }
          .logo-img { height: 70px; object-fit: contain; }
          .clinic-branding h2 { margin: 0; color: #6366f1; font-weight: 900; font-size: 28px; letter-spacing: -1px; }
          .clinic-legal { font-size: 11px; color: #64748b; margin-top: 8px; font-weight: 600; line-height: 1.6; }
          .invoice-info { text-align: right; }
          .title-label { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em; color: #94a3b8; margin-bottom: 10px; }
          .invoice-id { font-size: 16px; font-weight: 700; color: #1e293b; }
          .date-val { font-size: 13px; font-weight: 700; color: #64748b; margin-top: 5px; }
          
          .customer-section { margin-bottom: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .label { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px; }
          .value { font-size: 16px; font-weight: 700; color: #0f172a; }

          table { width: 100%; border-collapse: collapse; margin-top: 40px; }
          th { text-align: left; font-size: 11px; font-weight: 900; text-transform: uppercase; color: #94a3b8; padding: 20px 15px; border-bottom: 2px solid #f1f5f9; letter-spacing: 0.05em; }
          td { padding: 20px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #475569; font-weight: 500; }
          .item-category { font-size: 9px; font-weight: 900; color: #6366f1; text-transform: uppercase; display: block; margin-bottom: 4px; }

          .summary-section { margin-top: 50px; display: grid; grid-template-columns: 1.5fr 1fr; gap: 60px; }
          .bank-info { font-size: 11px; color: #64748b; line-height: 1.6; }
          .bank-item { margin-bottom: 15px; padding: 12px; background: #f8fafc; border-radius: 12px; }
          
          .total-box { background: #1e293b; color: #fff; padding: 35px; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
          .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
          .total-row:last-child { margin-bottom: 0; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1); }
          .total-label { font-size: 10px; font-weight: 900; text-transform: uppercase; opacity: 0.6; }
          .total-value { font-size: 14px; font-weight: 700; }
          .grand-total { font-size: 26px; font-weight: 900; color: #fbbf24; }
          
          .stamp { position: absolute; bottom: 140px; left: 50px; width: 140px; height: 140px; opacity: 0.7; transform: rotate(-12deg); pointer-events: none; }
          .footer { margin-top: 100px; padding-top: 30px; border-top: 1px dashed #e2e8f0; text-align: center; font-size: 12px; font-weight: 700; color: #94a3b8; }
          
          @media print {
            body { padding: 0; }
            .card { border: none; max-width: 100%; }
            .total-box { background: #1e293b !important; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="clinic-branding">
              ${clinicData.logoUrl ? `<img src="${clinicData.logoUrl}" class="logo-img" />` : `<h2>${clinicData.name || 'DENTAL HUB'}</h2>`}
              <div class="clinic-legal">
                <div>${clinicData.legalName || clinicData.name}</div>
                <div>ს/კ: ${clinicData.idCode || '---'}</div>
                <div>მის: ${clinicData.address || '---'}</div>
                <div>ტელ: ${clinicData.phone || '---'}</div>
              </div>
            </div>
            <div class="invoice-info">
              <div class="title-label">ინვოისი</div>
              <div class="invoice-id">#INV-${order.id?.slice(-8).toUpperCase()}</div>
              <div class="date-val">${new Date(order.finalizedAt || Date.now()).toLocaleDateString('ka-GE')}</div>
            </div>
          </div>

          <div class="customer-section">
            <div>
              <div class="label">პაციენტი</div>
              <div class="value">${order.patientName}</div>
            </div>
            ${order.personalId ? `
            <div>
              <div class="label">პირადი ნომერი</div>
              <div class="value">${order.personalId}</div>
            </div>
            ` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>აღწერა</th>
                <th style="text-align: center">რაოდ.</th>
                <th style="text-align: right">ფასი</th>
                <th style="text-align: right">ჯამი</th>
              </tr>
            </thead>
            <tbody>
              ${order.billedServices?.map(s => `
                <tr>
                  <td>
                    <span class="item-category">მომსახურება</span>
                    ${s.name}
                  </td>
                  <td style="text-align: center">1</td>
                  <td style="text-align: right">₾${Number(s.price).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 700; color: #0f172a;">₾${Number(s.price).toFixed(2)}</td>
                </tr>
              `).join('')}
              ${order.extraMaterials?.map(m => `
                <tr>
                  <td>
                    <span class="item-category">დამატებითი მასალა</span>
                    ${m.name}
                  </td>
                  <td style="text-align: center">${m.amount} ${m.unit || ''}</td>
                  <td style="text-align: right">₾${Number(m.pricePerUnit || 0).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: 700; color: #0f172a;">₾${(Number(m.amount) * Number(m.pricePerUnit || 0)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-section">
            <div class="bank-info">
              <div class="label" style="margin-bottom: 15px;">საბანკო რეკვიზიტები</div>
              ${clinicData.bankAccounts?.map(acc => `
                <div class="bank-item">
                  <div style="font-weight: 700; color: #1e293b; margin-bottom: 4px;">${acc.bankName}</div>
                  <div style="font-family: monospace; font-size: 12px; letter-spacing: 0.05em;">${acc.iban}</div>
                </div>
              `).join('') || '<div class="bank-item">---</div>'}
            </div>
            
            <div class="total-box">
              <div class="total-row">
                <span class="total-label">მომსახურება</span>
                <span class="total-value">₾${servicesAmount.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">დამატებითი ხარჯი</span>
                <span class="total-value">₾${materialsAmount.toFixed(2)}</span>
              </div>
              <div class="total-row" style="color: #fbbf24;">
                <span class="total-label" style="color: inherit">დღგ (18%)</span>
                <span class="total-value">₾${vatAmount.toFixed(2)}</span>
              </div>
              <div class="total-row" style="margin-top: 20px;">
                <span class="total-label">სულ გადასახდელი</span>
                <span class="grand-total">₾${Number(order.price).toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${clinicData.stampUrl ? `<img src="${clinicData.stampUrl}" class="stamp" />` : ''}

          <div class="footer">გმადლობთ, რომ სარგებლობთ ჩვენი მომსახურებით!</div>
        </div>
        <script>
          window.onload = function() { 
            window.print(); 
          }
        </script>
      </body>
    </html>
  `;
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const pri = iframe.contentWindow;
  pri.document.open();
  pri.document.write(content);
  pri.document.close();

  return new Promise((resolve) => {
    setTimeout(() => {
      document.body.removeChild(iframe);
      resolve();
    }, 1500);
  });
};