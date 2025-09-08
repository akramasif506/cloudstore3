

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
 * Generates one or more seller-facing order request PDFs.
 * If an order has items from multiple sellers, a separate PDF is generated for each.
 * @param order The order object, which must include full seller details.
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
    const sellerInfo = sellerItems[0].seller; // All items in this group have the same seller
    const sellerName = sellerInfo?.name || 'Unknown Seller';
    
    const doc = new jsPDF();
    
    // Add logo
    doc.addImage('/logo.png', 'PNG', 14, 16, 30, 7.5); // width: 30, height: 7.5

    // Header
    doc.setFontSize(20);
    doc.text("Fulfillment Request", 195, 22, { align: 'right' });
    
    const startY = 40;

    // Seller Details Box
    doc.setFontSize(12);
    doc.text("Pickup From:", 14, startY);
    doc.setDrawColor(200); // Light gray border
    doc.roundedRect(12, startY + 2, 90, 30, 3, 3, 'S');
    doc.setFontSize(10);
    doc.text(`Seller: ${sellerName}`, 16, startY + 9);
    doc.text(`Contact: ${sellerInfo?.contactNumber || 'N/A'}`, 16, startY + 15);
    doc.text(`Address: ${(sellerInfo as any)?.address || 'N/A'}`, 16, startY + 21, { maxWidth: 85 });
    
    // Order Details Box - Customer info removed
    doc.setFontSize(12);
    doc.text("Order Details:", 110, startY);
    doc.roundedRect(108, startY + 2, 90, 15, 3, 3, 'S'); // Reduced height of the box
    doc.setFontSize(10);
    doc.text(`Order ID: #${order.id}`, 110, startY + 9);

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
