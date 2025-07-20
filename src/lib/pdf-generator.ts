
// src/lib/pdf-generator.ts
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order, OrderItem } from "./types";

/**
 * Generates a customer-facing invoice PDF for a given order, mirroring the order details page.
 * @param order The order object.
 */
export async function generateCustomerInvoicePdf(order: Order) {
  const doc = new jsPDF();

  // 1. Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("CloudStore Invoice", 14, 22);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Order #${order.id.substring(0, 8)}`, 14, 30);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 36);
  
  doc.setLineWidth(0.5);
  doc.line(14, 42, 196, 42);

  // 2. Two-Column Layout for Shipping and Summary
  // Left Column: Shipping Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text("Shipping To:", 14, 52);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerName, 14, 59);
  const addressLines = doc.splitTextToSize(order.shippingAddress, 80); // Wrap address
  doc.text(addressLines, 14, 65);
  doc.text(order.contactNumber, 14, 65 + addressLines.length * 5 + 5);


  // Right Column: Order Summary
  const rightAlign = doc.internal.pageSize.width - 14;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Order Summary:", rightAlign, 52, { align: 'right' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const summaryY = 59;
  doc.text("Subtotal:", rightAlign - 35, summaryY);
  doc.text(`Rs ${order.subtotal.toFixed(2)}`, rightAlign, summaryY, { align: 'right' });
  doc.text("Platform Fee:", rightAlign - 35, summaryY + 6);
  doc.text(`Rs ${order.platformFee.toFixed(2)}`, rightAlign, summaryY + 6, { align: 'right' });
  doc.text("Handling Fee:", rightAlign - 35, summaryY + 12);
  doc.text(`Rs ${order.handlingFee.toFixed(2)}`, rightAlign, summaryY + 12, { align: 'right' });
  
  doc.setLineWidth(0.2);
  doc.line(rightAlign - 35, summaryY + 16, rightAlign, summaryY + 16);
  
  doc.setFont('helvetica', 'bold');
  doc.text("Total:", rightAlign - 35, summaryY + 22);
  doc.text(`Rs ${order.total.toFixed(2)}`, rightAlign, summaryY + 22, { align: 'right' });

  // 3. Table of Items
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Items Ordered", 14, 105);
  
  const tableData = order.items.map(item => [
    item.name,
    item.quantity,
    `Rs ${item.price.toFixed(2)}`,
    `Rs ${(item.quantity * item.price).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 112,
    head: [['Item', 'Quantity', 'Unit Price', 'Total']],
    body: tableData as any,
    theme: 'striped',
    headStyles: { fillColor: [143, 188, 143] }, // Soft green from theme
    columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
    },
    rowPageBreak: 'avoid',
  });


  // 4. Footer
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Thank you for your purchase from CloudStore!", 105, finalY + 20, { align: 'center' });
  doc.text("cloudstore.example.com", 105, finalY + 25, { align: 'center' });


  // Save the PDF
  doc.save(`CloudStore_Invoice_${order.id.substring(0, 8)}.pdf`);
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
    doc.text(`Order ID: #${order.id.substring(0, 8)}`, 14, 30);
    doc.text(`Seller: ${sellerName}`, 14, 36);

    // Shipping Information
    doc.setFontSize(14);
    doc.text("Ship To:", 14, 50);
    doc.setFontSize(11);
    doc.text(`Customer Name: ${order.customerName}`, 14, 56);
    const addressLines = doc.splitTextToSize(order.shippingAddress, 180);
    doc.text(addressLines, 14, 62);
    
    // Table of Items for this seller
    const tableData = sellerItems.map(item => [
      item.id,
      item.name,
      item.quantity
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Product ID', 'Item Name', 'Quantity to Ship']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [160, 82, 45] }, // Warm brown from theme
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Please package these items and prepare them for shipping.", 105, finalY + 20, { align: 'center' });


    doc.save(`CloudStore_Order_${order.id.substring(0, 8)}_Seller_${sellerName.replace(/\s/g, '')}.pdf`);
  });
}
