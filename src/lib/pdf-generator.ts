
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order, OrderItem } from "./types";

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

    // Shipping info for the seller's reference
    doc.setFontSize(12);
    doc.text("Ship to Customer:", 14, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(order.customerName, 14, 52);
    doc.text(order.shippingAddress, 14, 58);


    // Table of Items for this seller
    const tableData = sellerItems.map(item => [
      item.id,
      item.name,
      item.quantity
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Product ID', 'Item Name', 'Quantity to Ship']],
      body: tableData as any,
      theme: 'striped',
      headStyles: { fillColor: [160, 82, 45] }, // Warm brown from theme
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Please package these items and prepare them for shipping to our distribution center.", 105, finalY + 20, { align: 'center' });


    doc.save(`CloudStore_Order_${order.id}_Seller_${sellerName.replace(/\s/g, '')}.pdf`);
  });
}

/**
 * Generates a customer-facing invoice PDF based on the order details page.
 * @param order The order object.
 */
export async function generateCustomerInvoicePdf(order: Order) {
  const doc = new jsPDF();
  
  // --- Styling ---
  const primaryColor = '#8FBC8F'; // Soft Green
  const accentColor = '#A0522D'; // Warm Brown
  const textColor = '#333333';
  const mutedColor = '#666666';

  // --- Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.text('CloudStore Invoice', 14, 22);
  doc.setFontSize(12);
  doc.setTextColor(textColor);
  doc.text(`Order #${order.id}`, 14, 30);
  doc.text(`Placed on: ${new Date(order.createdAt).toLocaleDateString()}`, 14, 36);

  // --- Columns for Details ---
  // Shipping Details (Left Column)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Shipping To:', 14, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(order.customerName, 14, 58);
  const addressLines = doc.splitTextToSize(order.shippingAddress, 80);
  doc.text(addressLines, 14, 64);
  const shippingDetailsEndY = 64 + (addressLines.length * 5);
  doc.text(order.contactNumber, 14, shippingDetailsEndY + 2);

  // Order Summary (Right Column)
  const summaryStartX = 110;
  autoTable(doc, {
    startY: 50,
    startX: summaryStartX,
    theme: 'plain',
    tableWidth: 86,
    styles: {
      font: 'helvetica',
      fontSize: 11,
      cellPadding: 1,
    },
    body: [
        ['Subtotal:', `Rs ${order.subtotal.toFixed(2)}`],
        ['Platform Fee:', `Rs ${order.platformFee.toFixed(2)}`],
        ['Handling Fee:', `Rs ${order.handlingFee.toFixed(2)}`],
        ['Shipping:', 'Free'],
    ],
    columnStyles: {
        0: { halign: 'left', cellWidth: 40 },
        1: { halign: 'right', cellWidth: 46 },
    }
  });

  // Total Line
  const summaryTableY = (doc as any).lastAutoTable.finalY;
  doc.setDrawColor(mutedColor);
  doc.line(summaryStartX, summaryTableY + 1, summaryStartX + 86, summaryTableY + 1); // Separator
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', summaryStartX, summaryTableY + 7);
  doc.text(`Rs ${order.total.toFixed(2)}`, summaryStartX + 86, summaryTableY + 7, { align: 'right' });


  // --- Items Table ---
  const tableBody = order.items.map(item => [
    item.name,
    item.quantity,
    `Rs ${item.price.toFixed(2)}`,
    `Rs ${(item.price * item.quantity).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: Math.max(shippingDetailsEndY, summaryTableY) + 15,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: tableBody as any,
    theme: 'striped',
    headStyles: {
        fillColor: primaryColor,
        textColor: 'white'
    },
    styles: {
        font: 'helvetica',
        fontSize: 10,
    }
  });


  // --- Footer ---
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(10);
  doc.setTextColor(mutedColor);
  doc.text(`Thank you for your purchase from CloudStore!`, 105, finalY + 20, { align: 'center' });

  // --- Save ---
  doc.save(`CloudStore_Invoice_${order.id}.pdf`);
}
