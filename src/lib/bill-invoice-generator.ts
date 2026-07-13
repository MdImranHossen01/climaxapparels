import { format, isValid } from 'date-fns';

export async function generateBillPDF(bill: any, settings: any, mode: 'download' | 'print' = 'download') {
  const brandName = settings?.brandName || "Climax Apparels";
  const brandEmail = settings?.contact?.email || "";
  const brandPhone = settings?.contact?.phone || "";
  const brandAddress = settings?.contact?.address || "";

  // Dynamic colors based on shadcn/tailwind config (HSL values usually)
  let primary = '#00D1B2';
  let primaryForeground = '#ffffff';
  let border = '#e2e8f0';
  let mutedForeground = '#64748b';
  let foreground = '#0f172a';
  let background = '#ffffff';

  if (typeof window !== 'undefined') {
    const rootStyle = getComputedStyle(document.documentElement);
    const getHsl = (varName: string, fallback: string) => {
      const val = rootStyle.getPropertyValue(varName).trim();
      if (!val) return fallback;
      if (val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl')) return val;
      return `hsl(${val})`;
    };
    primary = getHsl('--primary', primary);
    primaryForeground = getHsl('--primary-foreground', primaryForeground);
    border = getHsl('--border', border);
    mutedForeground = getHsl('--muted-foreground', mutedForeground);
    foreground = getHsl('--foreground', foreground);
    background = getHsl('--background', background);
  }

  const getAbsoluteUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return url;
  };

  const docType = bill.documentType || 'bill';

  // Titles & Labels
  let title = "BILL INVOICE";
  let labelTo = "BILL TO:";
  let labelNo = "BILL NO #:";
  if (docType === 'offer') {
    title = "QUOTATION";
    labelTo = "QUOTATION TO:";
    labelNo = "QUOTATION NO #:";
  } else if (docType === 'chalan') {
    title = "DELIVERY CHALLAN";
    labelTo = "DELIVER TO:";
    labelNo = "CHALLAN NO #:";
  }

  const invoiceId = String(bill.invoiceNo || bill._id || "").slice(-11).toUpperCase();
  const billDate = bill.date ? new Date(bill.date) : new Date();
  const formattedDate = billDate && isValid(billDate) ? format(billDate, "dd MMM yyyy") : "N/A";

  const items = Array.isArray(bill.items) ? bill.items : [];

  let footerThankYou = `Thank you for doing business with ${brandName}!`;
  let footerGenerated = `This is a computer generated bill and does not require a physical signature.`;
  if (docType === 'offer') {
    footerThankYou = `Thank you for requesting a quotation from ${brandName}!`;
    footerGenerated = `This is a computer generated quotation and does not require a physical signature.`;
  } else if (docType === 'chalan') {
    footerThankYou = `Thank you for choosing ${brandName}!`;
    footerGenerated = `This is a computer generated delivery challan and does not require a physical signature.`;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title} #${invoiceId}</title>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          :root {
            --primary: ${primary};
            --primary-foreground: ${primaryForeground};
            --border: ${border};
            --muted-foreground: ${mutedForeground};
            --foreground: ${foreground};
            --background: ${background};
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Inter', 'Noto Sans Bengali', sans-serif;
            margin: 0;
            padding: 20px;
            color: var(--foreground);
            background-color: var(--background);
            font-size: 14px;
            line-height: 1.5;
          }
          .bill-container {
            max-width: 800px;
            margin: 0 auto;
            background: var(--background);
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--border);
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .brand-logo-container {
            display: flex;
            flex-direction: column;
          }
          .brand-logo-img {
            max-height: 60px;
            max-width: 220px;
            object-fit: contain;
            margin-bottom: 5px;
          }
          .brand-logo {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary);
            text-transform: uppercase;
            margin-bottom: 5px;
          }
          .brand-details {
            font-size: 12px;
            color: var(--muted-foreground);
          }
          .bill-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--border);
            text-align: right;
            margin: 0;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .bill-to h3, .bill-info h3 {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 10px;
            color: var(--muted-foreground);
          }
          .bill-to p, .bill-info p {
            margin: 4px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .info-label {
            font-weight: 600;
            color: var(--muted-foreground);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background-color: var(--primary);
            color: var(--primary-foreground);
            text-align: left;
            padding: 10px;
            font-size: 12px;
            text-transform: uppercase;
          }
          td {
            padding: 12px 10px;
            border-bottom: 1px solid var(--border);
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .totals-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          .totals-box {
            width: 320px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
          }
          .total-row.highlight {
            font-weight: 600;
            color: var(--foreground);
          }
          .total-row.grand-total {
            border-top: 2px solid var(--border);
            font-size: 15px;
            font-weight: 700;
            padding-top: 8px;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: var(--muted-foreground);
            border-top: 1px solid var(--border);
            padding-top: 20px;
            margin-top: 40px;
          }
          @media print {
            body {
              padding: 0;
            }
            .bill-container {
              padding: 0;
              max-width: 100%;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <div class="brand-logo-container">
              <div class="brand-logo">${brandName}</div>
              <div class="brand-details">
                ${brandAddress ? `<div>${brandAddress}</div>` : ''}
                <div>Email: ${brandEmail} | Phone: ${brandPhone}</div>
              </div>
            </div>
            <div>
              <h1 class="bill-title">${title}</h1>
            </div>
          </div>

          <div class="details-grid">
            <div class="bill-to">
              <h3>${labelTo}</h3>
              <p><strong>${bill.clientName || "Client Name"}</strong></p>
              ${bill.clientAddress ? `<p>Address: ${bill.clientAddress}</p>` : ''}
              <p>Phone: ${bill.clientPhone || ""}</p>
            </div>
            <div class="bill-info">
              <h3>Document Info</h3>
              <div class="info-row">
                <span class="info-label">${labelNo}</span>
                <span>${invoiceId}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date</span>
                <span>${formattedDate}</span>
              </div>
              ${docType === 'bill' ? `
                <div class="info-row">
                  <span class="info-label">Status</span>
                  <span>${bill.status || "Pending"}</span>
                </div>
                ${bill.status === 'Due' && bill.expectedReceivableDate ? `
                  <div class="info-row">
                    <span class="info-label">Expected Date</span>
                    <span>${format(new Date(bill.expectedReceivableDate), "dd MMM yyyy")}</span>
                  </div>
                ` : ''}
              ` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Description</th>
                <th class="text-center" style="width: 80px;">Qty</th>
                ${docType !== 'chalan' ? `
                  <th class="text-right" style="width: 120px;">Rate</th>
                  <th class="text-right" style="width: 120px;">Amount</th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              ${items.map((item: any, index: number) => `
                <tr>
                  <td>${index + 1}</td>
                  <td><strong>${item.name || ""}</strong></td>
                  <td class="text-center">${item.quantity || 1}</td>
                  ${docType !== 'chalan' ? `
                    <td class="text-right">৳${Math.round(item.price || 0)}</td>
                    <td class="text-right">৳${Math.round((item.price || 0) * (item.quantity || 1))}</td>
                  ` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${docType !== 'chalan' ? `
            <div class="totals-container">
              <div class="totals-box">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>৳${Math.round(bill.subtotal || 0)}</span>
                </div>
                ${bill.deliveryCharge > 0 ? `
                  <div class="total-row">
                    <span>Delivery Charge:</span>
                    <span>৳${Math.round(bill.deliveryCharge)}</span>
                  </div>
                ` : ''}
                ${bill.serviceFee > 0 ? `
                  <div class="total-row">
                    <span>Service Fee:</span>
                    <span>৳${Math.round(bill.serviceFee)}</span>
                  </div>
                ` : ''}
                ${bill.discount > 0 ? `
                  <div class="total-row" style="color: var(--primary);">
                    <span>${bill.discountType === 'percentage' ? `Discount (${bill.discountValue}%):` : 'Discount:'}</span>
                    <span>- ৳${Math.round(bill.discount)}</span>
                  </div>
                ` : ''}
                <div class="total-row highlight">
                  <span>Total:</span>
                  <span>৳${Math.round(bill.total || 0)}</span>
                </div>
                
                ${docType === 'bill' ? `
                  ${bill.prevDue > 0 ? `
                    <div class="total-row">
                      <span>Previous Due:</span>
                      <span>৳${Math.round(bill.prevDue)}</span>
                    </div>
                  ` : ''}
                  <div class="total-row grand-total">
                    <span>Grand Total:</span>
                    <span>৳${Math.round(bill.gTotal || 0)}</span>
                  </div>
                  <div class="total-row">
                    <span>Paid Amount:</span>
                    <span>৳${Math.round(bill.cashIn || 0)}</span>
                  </div>
                  <div class="total-row highlight" style="${bill.currentBillDue > 0 ? 'color: var(--destructive);' : 'color: var(--primary);'}">
                    <span>Remaining Due:</span>
                    <span>৳${Math.round(bill.currentBillDue || 0)}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      if (mode === 'print') {
        printWindow.close();
      }
    };
    
    setTimeout(() => {
      if (printWindow.document.readyState === 'complete') {
        printWindow.focus();
        printWindow.print();
        if (mode === 'print') {
          printWindow.close();
        }
      }
    }, 1000);
  }
}
