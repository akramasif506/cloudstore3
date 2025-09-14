
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order, OrderItem } from "./types";

/**
 * Generates a PDF summary report for a list of orders within a date range.
 * @param orders The list of orders to include in the report.
 * @param dateRange The date range for the report title.
 */
export async function generateOrderSummaryPdf(orders: Order[], dateRange: { from: string, to: string }) {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    // Add logo
    doc.addImage('/logo.png', 'PNG', 14, 16, 30, 7.5);

    // Header
    doc.setFontSize(20);
    doc.text("Order Summary Report", 195, 22, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`Report Generated: ${today}`, 195, 28, { align: 'right' });
    doc.text(`Date Range: ${new Date(dateRange.from).toLocaleDateString()} to ${new Date(dateRange.to).toLocaleDateString()}`, 195, 34, { align: 'right' });

    // Table of Orders
    const tableData = orders.map(order => [
        order.id,
        new Date(order.createdAt).toLocaleDateString(),
        order.customerName,
        order.status,
        `Rs ${order.total.toFixed(2)}`
    ]);

    autoTable(doc, {
        startY: 50,
        head: [['Order ID', 'Date', 'Customer', 'Status', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 25, 40] },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    // Totals Section
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    doc.setFontSize(12);
    doc.text("Summary Totals", 14, finalY + 15);
    doc.setFontSize(10);
    doc.text(`Total Orders: ${orders.length}`, 14, finalY + 22);
    doc.text(`Total Revenue: Rs ${totalRevenue.toFixed(2)}`, 14, finalY + 28);


    doc.save(`CloudStore_OrderSummary_${dateRange.from}_to_${dateRange.to}.pdf`);
}


/**
 * Generates one or more seller-facing order request PDFs for multiple orders.
 * Items are grouped by seller, and a separate PDF is generated for each seller.
 * @param orders The array of order objects, which must include full seller details.
 */
export async function generateSellerOrderPdfs(orders: Order[]) {
  // Group items by seller across all selected orders
  const itemsBySeller: { [sellerId: string]: (OrderItem & { orderId: string })[] } = {};

  orders.forEach(order => {
      order.items.forEach(item => {
          const sellerId = item.seller?.id || 'unknown_seller';
          if (!itemsBySeller[sellerId]) {
            itemsBySeller[sellerId] = [];
          }
          itemsBySeller[sellerId].push({ ...item, orderId: order.id });
      });
  });


  // Generate a PDF for each seller
  for (const sellerId of Object.keys(itemsBySeller)) {
    const sellerItems = itemsBySeller[sellerId];
    const sellerInfo = sellerItems[0].seller;
    const sellerName = sellerInfo?.name || 'Unknown Seller';
    
    const doc = new jsPDF();
    
    // Add logo
    doc.addImage('/logo.png', 'PNG', 14, 16, 30, 7.5);

    // Header
    doc.setFontSize(20);
    doc.text("Fulfillment Request", 195, 22, { align: 'right' });
    
    const startY = 40;

    // Seller Details Box
    doc.setFontSize(12);
    doc.text("Pickup From:", 14, startY);
    doc.setDrawColor(200); // Light gray border
    doc.roundedRect(12, startY + 2, 186, 30, 3, 3, 'S'); // Make box wider
    doc.setFontSize(10);
    doc.text(`Seller: ${sellerName}`, 16, startY + 9);
    doc.text(`Contact: ${sellerInfo?.contactNumber || 'N/A'}`, 16, startY + 15);
    doc.text(`Address: ${(sellerInfo as any)?.address || 'N/A'}`, 16, startY + 21, { maxWidth: 180 });

    // Table of Items for this seller
    const tableData = sellerItems.map(item => [
      `#${item.orderId}`,
      item.id.substring(0, 10) + '...',
      item.name,
      item.quantity
    ]);

    autoTable(doc, {
      startY: startY + 40,
      head: [['Order ID', 'Product ID', 'Item Name', 'Quantity to Ship']],
      body: tableData as any,
      theme: 'striped',
      headStyles: { fillColor: [37, 25, 40] },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Please package these items and prepare them for shipping.", 105, finalY + 20, { align: 'center' });

    const today = new Date().toISOString().split('T')[0];
    doc.save(`CloudStore_Fulfillment_${sellerName.replace(/\s/g, '')}_${today}.pdf`);
  }
}

async function addImageToPdf(doc: jsPDF, imageUrl: string, x: number, y: number, width: number, height: number): Promise<void> {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        const blob = await response.blob();
        
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onloadend = () => {
                try {
                    const base64data = reader.result as string;
                    // Extract MIME type and pure Base64 data
                    const mimeTypeMatch = base64data.match(/^data:(image\/\w+);base64,/);
                    if (!mimeTypeMatch) {
                        throw new Error("Could not determine image type from data URL.");
                    }
                    const imageFormat = mimeTypeMatch[1].split('/')[1].toUpperCase();
                    
                    doc.addImage(base64data, imageFormat, x, y, width, height);
                    resolve();
                } catch(e) {
                     reject(e);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error adding image to PDF, skipping:", error);
        // Draw a placeholder if image fetching fails
        doc.setFillColor(230);
        doc.rect(x, y, width, height, 'F');
        doc.setTextColor(150);
        doc.setFontSize(8);
        doc.text("Image N/A", x + width / 2, y + height / 2, { align: 'center' });
    }
}


/**
 * Generates a multi-page PDF containing invoices for each selected order.
 * @param orders The list of orders to generate invoices for.
 */
export async function generateInvoicesPdf(orders: Order[]) {
    const doc = new jsPDF();
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];

        if (i > 0) {
            doc.addPage();
        }
        
        // --- Safely access order values with fallbacks ---
        const subtotal = order.subtotal ?? 0;
        const platformFee = order.platformFee ?? 0;
        const handlingFee = order.handlingFee ?? 0;
        const tax = order.tax ?? 0;
        const discountValue = order.discount?.value ?? 0;

        // --- Invoice Header ---
        doc.addImage('/logo.png', 'PNG', 14, 16, 30, 7.5);
        doc.setFontSize(22);
        doc.text("Tax Invoice", 195, 22, { align: 'right' });

        // --- Order Details ---
        doc.setFontSize(10);
        doc.text(`Order ID: #${order.id}`, 14, 40);
        doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 46);
        
        // --- Shipping Details ---
        doc.setFontSize(12);
        doc.text("Ship To:", 14, 56);
        doc.setFontSize(10);
        doc.text(order.customerName, 14, 62);
        const addressLines = doc.splitTextToSize(order.shippingAddress, 90);
        doc.text(addressLines, 14, 68);
        const addressHeight = (addressLines.length * 5);
        doc.text(`Contact: ${order.contactNumber}`, 14, 68 + addressHeight);
        
        // --- Items Table ---
        const tableBody = [];
        const imagePromises = [];

        for (const item of order.items) {
            tableBody.push([
                { content: '' }, // Placeholder for image
                item.name,
                item.quantity.toString(),
                `Rs ${item.price.toFixed(2)}`,
                `Rs ${(item.price * item.quantity).toFixed(2)}`,
            ]);
        }

        let firstRowY = 0;
        autoTable(doc, {
            startY: 110,
            head: [['Item', 'Description', 'Qty', 'Unit Price', 'Total']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [37, 25, 40] },
            didDrawCell: (data) => {
                 if (data.section === 'body' && data.column.index === 0) {
                    if (!firstRowY) firstRowY = data.cell.y;
                    const item = order.items[data.row.index];
                    const imageSize = 18;
                    const yPos = data.cell.y + (data.cell.height - imageSize) / 2;
                    imagePromises.push(addImageToPdf(doc, item.imageUrl, data.cell.x + 2, yPos, imageSize, imageSize));
                 }
            }
        });
        
        // Wait for all images to be drawn
        await Promise.all(imagePromises);

        // --- Totals Section ---
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        if (finalY > 260) {
            doc.addPage();
            finalY = 20;
        }

        const totals = [
            ['Subtotal', `Rs ${subtotal.toFixed(2)}`],
            ['Platform Fee', `Rs ${platformFee.toFixed(2)}`],
            ['Handling Fee', `Rs ${handlingFee.toFixed(2)}`],
            ['Tax', `Rs ${tax.toFixed(2)}`],
        ];
        
        if (order.discount && discountValue > 0) {
             totals.push([`Discount (${order.discount.name})`, `- Rs ${discountValue.toFixed(2)}`]);
        }
        
        totals.push(['Shipping', 'Free']);

        autoTable(doc, {
            body: totals,
            startY: finalY,
            theme: 'plain',
            columnStyles: { 0: { cellWidth: 'auto', halign: 'right' }, 1: { cellWidth: 'auto', halign: 'right' } },
            tableWidth: 'wrap',
            margin: { left: 120 },
        });
        
        const summaryY = (doc as any).lastAutoTable.finalY;
        
        // --- Grand Total ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Total Paid:", 120, summaryY + 10, { align: 'right' });
        doc.text(`Rs ${order.total.toFixed(2)}`, 195, summaryY + 10, { align: 'right' });

        // --- Footer ---
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Thank you for your business!", 105, 285, { align: 'center' });
    }

    doc.save(`CloudStore_Invoices_${today}.pdf`);
}
