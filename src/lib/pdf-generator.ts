
// src/lib/pdf-generator.ts
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order, OrderItem } from "./types";

// Helper to fetch an image and convert it to Base64
async function imageToBase64(url: string): Promise<string> {
    try {
        // Use a CORS proxy if images are on a different domain and CORS is not configured
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error converting image to Base64:", error);
        // Return a placeholder or empty string on error
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAQAAADOPi6zAAAB+klEQVR42u3PMQEAAAgEoNP+nU3b3QcKGU1JSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSUlJSfscjKsn+b9A1gAAAABJRU5ErkJggg==";
    }
}


/**
 * Generates a customer-facing invoice PDF for a given order.
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
  doc.text(order.shippingAddress.split(',').join('\n'), 14, 65); // Better wrapping for addresses
  doc.text(order.contactNumber, 14, 80);

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

  // 3. Table of Items with Images
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Items Ordered", 14, 98);
  
  const tableData = await Promise.all(order.items.map(async item => {
    const imgData = await imageToBase64(item.imageUrl);
    return [
      { content: '', image: imgData }, // Placeholder for image content
      `${item.name}\nQty: ${item.quantity}`,
      `Rs ${item.price.toFixed(2)}`,
      `Rs ${(item.quantity * item.price).toFixed(2)}`
    ];
  }));

  autoTable(doc, {
    startY: 104,
    head: [['', 'Item', 'Unit Price', 'Total']],
    body: tableData as any,
    theme: 'striped',
    headStyles: { fillColor: [143, 188, 143] }, // Soft green from theme
    columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 'auto' },
        2: { halign: 'right' },
        3: { halign: 'right' },
    },
    didDrawCell: (data) => {
        if (data.column.index === 0 && data.cell.section === 'body') {
            const imgData = (data.row.raw as any)[0].image;
            if (imgData) {
                // Add image to cell
                doc.addImage(imgData, 'PNG', data.cell.x + 2, data.cell.y + 2, 16, 16);
            }
        }
    },
    rowPageBreak: 'avoid',
    bodyStyles: { minCellHeight: 20, valign: 'middle' },
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

    // Note on Customer Privacy
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Note: Customer contact details are anonymized. Please ship to the address provided below.", 14, 50);

     // Shipping Information (anonymized)
    doc.setFontSize(14);
    doc.text("Ship To:", 14, 60);
    doc.setFontSize(11);
    doc.text(`Customer Name: ${order.customerName}`, 14, 66);
    doc.text(`Address: ${order.shippingAddress}`, 14, 72);
    
    // Table of Items for this seller
    const tableData = sellerItems.map(item => [
      item.id,
      item.name,
      item.quantity
    ]);

    autoTable(doc, {
      startY: 85,
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
