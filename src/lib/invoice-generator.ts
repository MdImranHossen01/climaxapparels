import { format, isValid } from 'date-fns';

export async function generateInvoicePDF(orderOrOrders: any | any[], settings: any, mode: 'download' | 'print' = 'download') {
  const orders = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
  if (orders.length === 0) return;

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

  const invoicesHtml = orders.map((order, index) => {
    const invoiceId = String(order._id || order.shortId || "").slice(-8).toUpperCase().replace(/^0+/, '');
    const createdAt = order.createdAt ? new Date(order.createdAt) : null;
    const formattedDate = createdAt && isValid(createdAt) ? format(createdAt, "dd MMM yyyy") : "N/A";

    const items = Array.isArray(order.items) ? order.items : [];
    const subtotalRaw = items.reduce((acc: number, item: any) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return acc + price * quantity;
    }, 0);
    const subtotal = Number.isFinite(subtotalRaw) ? subtotalRaw : 0;
    const deliveryCharge = order.deliveryCharge !== undefined
      ? Number(order.deliveryCharge) || 0
      : Math.max(0, (Number(order.totalAmount) || 0) - subtotal);
    const couponDiscount = Number(order.couponDiscountAmount) || 0;
    const walletUsed = Number(order.walletAmountUsed) || 0;
    const totalAmount = Math.round(order.totalAmount - couponDiscount - walletUsed);

    return `
      <div class="invoice-container" style="${index < orders.length - 1 ? 'page-break-after: always; break-after: page;' : ''}">
        <div class="header">
          <div class="brand-logo-container">
            <div class="brand-logo">${brandName}</div>
            <div class="brand-details">
              ${brandAddress ? `<div>${brandAddress}</div>` : ''}
              <div>Email: ${brandEmail} | Phone: ${brandPhone}</div>
            </div>
          </div>
          <div>
            <h1 class="invoice-title">INVOICE</h1>
          </div>
        </div>

        <div class="details-grid">
          <div class="bill-to">
            <h3>Bill To</h3>
            <p><strong>${order.shippingAddress?.fullName || "Customer"}</strong></p>
            ${order.shippingAddress?.street ? `<p>${order.shippingAddress.street}</p>` : ''}
            <p>${order.shippingAddress?.city || ""}${order.shippingAddress?.zipCode ? `, ${order.shippingAddress.zipCode}` : ""}</p>
            <p>Phone: ${order.shippingAddress?.phone || ""}</p>
          </div>
          <div class="order-info">
            <h3>Order Info</h3>
            <div class="info-row">
              <span class="info-label">Invoice #</span>
              <span>${invoiceId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date</span>
              <span>${formattedDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment</span>
              <span>${order.paymentMethod || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status</span>
              <span>${order.status || "Pending"}</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Product</th>
              <th class="text-center" style="width: 80px;">Qty</th>
              <th class="text-right" style="width: 120px;">Unit Price</th>
              <th class="text-right" style="width: 120px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td>
                  <strong>${item.name}</strong>
                  ${item.color || item.size ? `<br><small style="color: var(--muted-foreground)">Color: ${item.color || 'N/A'} | Size: ${item.size || 'N/A'}</small>` : ''}
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">৳${Math.round(item.price)}</td>
                <td class="text-right">৳${Math.round(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-container">
          <div class="totals-box">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>৳${Math.round(subtotal)}</span>
            </div>
            <div class="total-row">
              <span>Shipping Charge:</span>
              <span>৳${Math.round(deliveryCharge)}</span>
            </div>
            <div class="total-row" style="${couponDiscount > 0 ? 'color: var(--foreground);' : ''}">
              <span>Coupon Discount:</span>
              <span>${couponDiscount > 0 ? `- ৳${Math.round(couponDiscount)}` : '৳0'}</span>
            </div>
            <div class="total-row" style="${walletUsed > 0 ? 'color: var(--foreground);' : ''}">
              <span>Loyalty Discount:</span>
              <span>${walletUsed > 0 ? `- ৳${Math.round(walletUsed)}` : '৳0'}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total Amount:</span>
              <span>৳${totalAmount}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice Print</title>
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
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: var(--background);
            padding: 20px;
            page-break-inside: avoid;
            break-inside: avoid;
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
          .invoice-title {
            font-size: 28px;
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
          .bill-to h3, .order-info h3 {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 10px;
            color: var(--muted-foreground);
          }
          .bill-to p, .order-info p {
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
            width: 300px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
          }
          .total-row.grand-total {
            border-top: 2px solid var(--border);
            font-size: 16px;
            font-weight: 700;
            padding-top: 10px;
            color: var(--foreground);
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
            .invoice-container {
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
        ${invoicesHtml}
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Allow fonts and stylesheets to load
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      if (mode === 'print') {
        printWindow.close();
      }
    };
    // Fallback if onload doesn't fire immediately
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
