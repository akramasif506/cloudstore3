
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
