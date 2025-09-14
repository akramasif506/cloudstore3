
"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Order, OrderItem } from "./types";

// Helper to safely fetch and convert an image to a data URI
async function getImageUrlAsDataUri(url: string): Promise<string | null> {
    if (!url) return null;
    try {
        // Use a CORS proxy to get around browser security restrictions
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image via proxy: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching image for PDF:", error);
        return null; // Return null to indicate failure
    }
}


async function addImageToPdf(doc: jsPDF, imageUrl: string, x: number, y: number, w: number, h: number) {
    const dataUri = await getImageUrlAsDataUri(imageUrl);
    if (dataUri) {
        try {
            doc.addImage(dataUri, 'PNG', x, y, w, h);
        } catch (e) {
            console.error("jsPDF.addImage failed:", e);
            // Draw a placeholder if adding the image fails
            doc.setDrawColor(200);
            doc.setFillColor(240, 240, 240);
            doc.rect(x, y, w, h, 'FD');
            doc.setTextColor(150);
            doc.setFontSize(8);
            doc.text("Image", x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
        }
    } else {
         // Draw a placeholder if fetching the image fails
        doc.setDrawColor(200);
        doc.setFillColor(240, 240, 240);
        doc.rect(x, y, w, h, 'FD');
        doc.setTextColor(150);
        doc.setFontSize(8);
        doc.text("No Image", x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
    }
}

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
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
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
