
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order, OrderItem, User } from "./types";
import { initializeAdmin } from "./firebase-admin";

async function getSellerDetails(sellerId: string): Promise<Partial<User> | null> {
    if (sellerId === 'unknown_seller') return null;
    try {
        const { db } = initializeAdmin();
        const userRef = db.ref(`users/${sellerId}`);
        const snapshot = await userRef.once('value');
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch details for seller ${sellerId}:`, error);
        return null;
    }
}


/**
 * Generates one or more seller-facing order request PDFs.
 * If an order has items from multiple sellers, a separate PDF is generated for each.
 * @param order The order object.
 */
export async function generateSellerOrderPdfs(order: Order) {
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
  for (const sellerId of Object.keys(itemsBySeller)) {
    const sellerItems = itemsBySeller[sellerId];
    const sellerInfo = await getSellerDetails(sellerId);
    const sellerName = sellerInfo?.name || 'Unknown Seller';
    
    const doc = new jsPDF();
    
    // Add logo
    doc.addImage('/logo.png', 'PNG', 14, 16, 30, 7.5); // width: 30, height: 7.5

    // Header
    doc.setFontSize(20);
    doc.text("Fulfillment Request", 150, 22, { align: 'right' });
    
    const startY = 40;

    // Seller Details Box
    doc.setFontSize(12);
    doc.text("Pickup From:", 14, startY);
    doc.setDrawColor(200); // Light gray border
    doc.roundedRect(12, startY + 2, 90, 30, 3, 3, 'S');
    doc.setFontSize(10);
    doc.text(`Seller: ${sellerName}`, 16, startY + 9);
    doc.text(`Contact: ${sellerInfo?.mobileNumber || 'N/A'}`, 16, startY + 15);
    doc.text(`Address: ${sellerInfo?.address || 'N/A'}`, 16, startY + 21, { maxWidth: 85 });
    
    // Order Details Box
    doc.setFontSize(12);
    doc.text("Order Details:", 110, startY);
    doc.roundedRect(108, startY + 2, 90, 30, 3, 3, 'S');
    doc.setFontSize(10);
    doc.text(`Order ID: #${order.id}`, 110, startY + 9);
    doc.text(`Customer Name: ${order.customerName}`, 110, startY + 15);
    doc.text(`Customer Contact: ${order.contactNumber}`, 110, startY + 21);


    // Table of Items for this seller
    const tableData = sellerItems.map(item => [
      item.id.substring(0, 10) + '...', // Shorten ID for table
      item.name,
      item.quantity
    ]);

    autoTable(doc, {
      startY: startY + 38,
      head: [['Product ID', 'Item Name', 'Quantity to Ship']],
      body: tableData as any,
      theme: 'striped',
      headStyles: { fillColor: [37, 25, 40] }, // Adjusted theme color
    });

    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Please package these items and prepare them for shipping.", 105, finalY + 20, { align: 'center' });

    doc.save(`CloudStore_Order_${order.id}_Seller_${sellerName.replace(/\s/g, '')}.pdf`);
  }
}
