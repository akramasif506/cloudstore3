
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order, OrderItem } from "./types";

/**
 * Generates a professional, customer-facing invoice PDF for a given order.
 * @param order The order object.
 */
export async function generateCustomerInvoicePdf(order: Order) {
  const doc = new jsPDF();

  // Define colors and fonts
  const primaryColor = '#8FBC8F'; // Soft Green from theme
  const textColor = '#3a3a3a'; // Dark warm gray
  const headerColor = '#2f2f2f';

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(headerColor);
  doc.text("CloudStore Invoice", 105, 20, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  doc.text(`Order #${order.id}`, 105, 28, { align: 'center' });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 105, 34, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(primaryColor);
  doc.line(14, 42, 196, 42);

  // --- Two-column Layout for Shipping and Summary ---

  // Shipping Details (Left Column)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text("Shipping To:", 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(order.customerName, 14, 58);
  const addressLines = doc.splitTextToSize(order.shippingAddress, 80); // Wrap address
  doc.text(addressLines, 14, 64);
  doc.text(order.contactNumber, 14, 64 + (addressLines.length * 5) + 2);

  // Order Summary (Right Column)
  autoTable(doc, {
    startY: 50,
    margin: { left: 105 }, // Start at the right side of the page
    tableWidth: 'auto',
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 1.5,
      textColor: textColor,
    },
    head: [
      [{ content: 'Order Summary', styles: { fontStyle: 'bold', fontSize: 12, halign: 'right' } }]
    ],
    body: [
      [{ content: `Subtotal:`, styles: { halign: 'right' } }, { content: `Rs ${order.subtotal.toFixed(2)}`, styles: { halign: 'right' } }],
      [{ content: `Platform Fee:`, styles: { halign: 'right' } }, { content: `Rs ${order.platformFee.toFixed(2)}`, styles: { halign: 'right' } }],
      [{ content: `Handling Fee:`, styles: { halign: 'right' } }, { content: `Rs ${order.handlingFee.toFixed(2)}`, styles: { halign: 'right' } }],
    ],
    foot: [
      [{ content: 'Total:', styles: { fontStyle: 'bold', fontSize: 12, halign: 'right' } }, { content: `Rs ${order.total.toFixed(2)}`, styles: { fontStyle: 'bold', fontSize: 12, halign: 'right' } }]
    ],
    didDrawPage: (data) => {
        // Add a line above the total
        doc.setLineWidth(0.3);
        const foot = data.table.foot[0];
        if (foot) {
             const y = foot.y;
             // FIX: Use table.getRightX() is not a function. Use table.width and table.x instead.
             const tableRightX = data.table.x + data.table.width;
             doc.line(data.table.x, y, tableRightX, y);
        }
    }
  });


  // --- Items Table ---
  const finalY_header = (doc as any).lastAutoTable.finalY || 80;
  
  const tableData = order.items.map(item => [
    { content: `${item.name}\n(ID: ${item.id.substring(0, 8)}...)`, styles: { valign: 'middle' } },
    { content: item.quantity, styles: { halign: 'center', valign: 'middle' } },
    { content: `Rs ${item.price.toFixed(2)}`, styles: { halign: 'right', valign: 'middle' } },
    { content: `Rs ${(item.price * item.quantity).toFixed(2)}`, styles: { halign: 'right', valign: 'middle' } }
  ]);

  autoTable(doc, {
    startY: finalY_header + 10,
    head: [['Item Description', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [60, 56, 91], // --background HSL values
      textColor: [25, 10, 20], // --foreground HSL values
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  });

  doc.save(`CloudStore_Invoice_${order.id}.pdf`);
}


/**
 * Generates one or more seller-facing order request PDFs.
 * If an order has items from multiple sellers, a separate PDF is generated for each.
 * @param order The order object.
 */
export function generateSellerOrderPdfs(order: Order) {
  // Group items by seller
  const itemsBySeller: { [sellerId: string]: OrderItem[] } = {};

  order.items.forEach(item => {
    const sellerId = item.seller?.id || 'unknown_seller';
    if (!itemsBySeller[sellerId]) {
      itemsBySeller[sellerId] = [];
    }
    itemsBySeller[sellerId].push(item);
  });

  // Generate a PDF for each seller
  Object.keys(itemsBySeller).forEach(sellerId => {
    const sellerItems = itemsBySeller[sellerId];
    const sellerName = sellerItems[0]?.seller?.name || 'Unknown Seller';
    
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("CloudStore - Fulfillment Request", 14, 22);
    doc.setFontSize(12);
    doc.text(`Order ID: #${order.id}`, 14, 30);
    doc.text(`Seller: ${sellerName}`, 14, 36);


    // Table of Items for this seller
    const tableData = sellerItems.map(item => [
      item.id,
      item.name,
      item.quantity
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Product ID', 'Item Name', 'Quantity to Ship']],
      body: tableData as any,
      theme: 'striped',
      headStyles: { fillColor: [25, 57, 40] }, // Warm brown from theme
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Please package these items and prepare them for shipping.", 105, finalY + 20, { align: 'center' });


    doc.save(`CloudStore_Order_${order.id}_Seller_${sellerName.replace(/\s/g, '')}.pdf`);
  });
}
