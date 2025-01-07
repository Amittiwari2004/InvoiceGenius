import express from 'express';
import multer from 'multer';
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import cors from 'cors';
import path from 'path';

const app = express();
const port = 3000;

// Middleware
app.use(cors({
  origin: true, // Allowed origins
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));
app.use(express.json());
app.use(express.static('public'));

// Ensure upload and output directories exist
const createRequiredDirectories = async () => {
  const dirs = ['uploads', 'output'];
  for (const dir of dirs) {
    try {
      await fsPromises.access(dir);
    } catch {
      await fsPromises.mkdir(dir);
    }
  }
};
createRequiredDirectories();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG and PNG allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Helper functions
const formatCurrency = (amount) => `₹${parseFloat(amount).toFixed(2)}`;

const cleanup = async (filePath) => {
  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
};

// Generate Invoice Function
const generateInvoice = async (invoiceData, logoPath) => {
  const doc = new PDFDocument({
    margin: 30,
    size: 'A4'
  });

  const outputPath = path.join('output', `Invoice_${Date.now()}.pdf`);
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Helper function for drawing lines
  const drawHorizontalLine = (y) => {
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(30, y)
      .lineTo(565, y)
      .stroke();
  };

  // Add logo
  doc.image(logoPath, 30, 30, { width: 80 });

  // Store Details
  doc
    .fontSize(20)
    .fillColor(invoiceData.color || '#2c3e50')
    .text(invoiceData.storeName, 120, 40);

  const storeInfoY = 65;
  doc
    .fontSize(10)
    .fillColor('#34495e')
    .text(invoiceData.storeDetails.address, 120, storeInfoY)
    .text(invoiceData.storeDetails.city, 120, storeInfoY + 15)
    .text(`Phone: ${invoiceData.storeDetails.phone}`, 120, storeInfoY + 30)
    .text(`Email: ${invoiceData.storeDetails.email}`, 120, storeInfoY + 45);

  // Invoice Details
  doc
    .fontSize(16)
    .fillColor(invoiceData.color || '#2c3e50')
    .text('TAX INVOICE', 400, 30)
    .fontSize(10)
    .fillColor('#34495e')
    .text(`Invoice No: ${invoiceData.invoiceDetails.invoiceNumber}`, 400, 55)
    .text(`Order No: ${invoiceData.invoiceDetails.orderNumber}`, 400, 70)
    .text(`Date: ${format(new Date(invoiceData.invoiceDetails.date), 'dd/MM/yyyy')}`, 400, 85)
    .text(`Time: ${invoiceData.invoiceDetails.time}`, 400, 100);

  drawHorizontalLine(130);

  // Customer Details
  doc
    .fontSize(12)
    .fillColor(invoiceData.color || '#2c3e50')
    .text('Bill To:', 30, 150);

  doc
    .fontSize(10)
    .fillColor('#34495e')
    .text(invoiceData.customer.name, 30, 170)
    .text(invoiceData.customer.address, 30, 185)
    .text(invoiceData.customer.city, 30, 200)
    .text(`Phone: ${invoiceData.customer.phone}`, 30, 215)
    .text(`Email: ${invoiceData.customer.email}`, 30, 230);

  // Delivery Partner Details
  doc
    .fontSize(12)
    .fillColor(invoiceData.color || '#2c3e50')
    .text('Delivery Details:', 300, 150);

  doc
    .fontSize(10)
    .fillColor('#34495e')
    .text(`Partner: ${invoiceData.deliveryPartner.name}`, 300, 170)
    .text(`Tracking ID: ${invoiceData.deliveryPartner.trackingId}`, 300, 185)
    .text(`Estimated Delivery: ${invoiceData.deliveryPartner.estimatedDelivery}`, 300, 200);

  // Products Table
  const tableTop = 280;
  const tableHeaders = ['Item Details', 'Batch/Exp', 'Qty', 'MRP', 'Price', 'Amount'];
  const columnWidths = [200, 80, 40, 70, 70, 75];
  
  // Draw Table Headers
  let xPosition = 30;
  doc
    .fontSize(10)
    .fillColor(invoiceData.color || '#2c3e50');

  tableHeaders.forEach((header, i) => {
    doc.text(header, xPosition, tableTop, { width: columnWidths[i], align: 'left' });
    xPosition += columnWidths[i];
  });

  drawHorizontalLine(295);

  // Table Rows
  let y = tableTop + 30;
  let totalMRP = 0;
  let totalAmount = 0;

  for (const product of invoiceData.products) {
    const itemTotal = product.price * product.quantity;
    totalMRP += product.mrp * product.quantity;
    totalAmount += itemTotal;

    xPosition = 30;
    doc
      .fontSize(9)
      .fillColor('#34495e');

    // Item Details
    doc.text(`${product.name}\n${product.brand}`, xPosition, y, { width: columnWidths[0] });
    xPosition += columnWidths[0];

    // Batch/Expiry
    doc.text(`${product.batch}\n${format(new Date(product.expiry), 'dd/MM/yyyy')}`, xPosition, y, { width: columnWidths[1] });
    xPosition += columnWidths[1];

    // Quantity
    doc.text(product.quantity.toString(), xPosition, y, { width: columnWidths[2] });
    xPosition += columnWidths[2];

    // MRP
    doc.text(formatCurrency(product.mrp), xPosition, y, { width: columnWidths[3] });
    xPosition += columnWidths[3];

    // Price
    doc.text(formatCurrency(product.price), xPosition, y, { width: columnWidths[4] });
    xPosition += columnWidths[4];

    // Amount
    doc.text(formatCurrency(itemTotal), xPosition, y, { width: columnWidths[5] });

    y += 30;
  }

  drawHorizontalLine(y + 10);

  // Summary
  y += 30;
  const totalDiscount = totalMRP - totalAmount;
  
  doc
    .fontSize(10)
    .fillColor('#34495e');

  // Summary table with payment method
  const summaryData = [
    { label: 'Total MRP:', value: formatCurrency(totalMRP) },
    { label: 'Total Discount:', value: formatCurrency(totalDiscount) },
    { label: 'Net Amount:', value: formatCurrency(totalAmount) },
    { label: 'Payment Method:', value: invoiceData.paymentMethod }
  ];

  summaryData.forEach((row, i) => {
    doc
      .text(row.label, 400, y + (i * 20))
      .text(row.value, 490, y + (i * 20));
  });

  // Terms and Conditions
  y += 100;
  doc
    .fontSize(12)
    .fillColor(invoiceData.color || '#2c3e50')
    .text('Terms and Conditions:', 30, y);

  y += 20;
  doc
    .fontSize(9)
    .fillColor('#34495e');

  // Split terms and conditions into lines and render them
  const termsLines = invoiceData.termsAndConditions.split('\n');
  termsLines.forEach((line, index) => {
    doc.text(line, 30, y + (index * 15), { width: 535 });
  });

  // Footer
  doc
    .fontSize(10)
    .fillColor('#2c3e50')
    .text(`Thank you for choosing ${invoiceData.storeName}`, 0, 780, { align: 'center' })
    .fontSize(8)
    .fillColor('#666666')
    .text(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 0, 795, { align: 'center' });

  // Finalize PDF
  doc.end();

  // Return a promise that resolves when the PDF is fully written
  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
  });
};

// Validation middleware
const validateInvoiceData = (data) => {
  const required = {
    storeName: 'Store name',
    storeDetails: {
      address: 'Store address',
      city: 'Store city',
      phone: 'Store phone',
      email: 'Store email'
    },
    invoiceDetails: {
      invoiceNumber: 'Invoice number',
      orderNumber: 'Order number',
      date: 'Invoice date',
      time: 'Invoice time'
    },
    customer: {
      name: 'Customer name',
      address: 'Customer address',
      city: 'Customer city',
      phone: 'Customer phone'
    },
    deliveryPartner: {
      name: 'Delivery partner name',
      trackingId: 'Tracking ID',
      estimatedDelivery: 'Estimated delivery date'
    },
    paymentMethod: 'Payment method',
    termsAndConditions: 'Terms and conditions',
    products: 'Products'
  };

  const errors = [];

  // Check top-level fields
  for (const [key, value] of Object.entries(required)) {
    if (typeof value === 'string') {
      if (!data[key]) {
        errors.push(`Missing ${value}`);
      }
    } else {
      // Check nested fields
      if (!data[key]) {
        errors.push(`Missing ${key}`);
      } else {
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          if (!data[key][nestedKey]) {
            errors.push(`Missing ${nestedValue}`);
          }
        }
      }
    }
  }

  // Validate products array
  if (Array.isArray(data.products) && data.products.length > 0) {
    data.products.forEach((product, index) => {
      if (!product.name) errors.push(`Product ${index + 1}: Missing name`);
      if (!product.quantity) errors.push(`Product ${index + 1}: Missing quantity`);
      if (!product.mrp) errors.push(`Product ${index + 1}: Missing MRP`);
      if (!product.price) errors.push(`Product ${index + 1}: Missing price`);
      if (parseFloat(product.price) > parseFloat(product.mrp)) {
        errors.push(`Product ${index + 1}: Price cannot be greater than MRP`);
      }
    });
  } else {
    errors.push('At least one product is required');
  }

  return errors;
};

// API Routes
app.post('/generate-invoice', upload.single('logo'), async (req, res) => {
  try {
    const invoiceData = JSON.parse(req.body.data);
    const logoPath = req.file.path;

    // Validate invoice data
    const validationErrors = validateInvoiceData(invoiceData);
    if (validationErrors.length > 0) {
      await cleanup(logoPath);
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Generate PDF
    const outputPath = await generateInvoice(invoiceData, logoPath);

    // Stream the PDF back to client
    const pdfStream = await fsPromises.readFile(outputPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
    res.send(pdfStream);

    // Cleanup files
    await Promise.all([
      cleanup(logoPath),
      cleanup(outputPath)
    ]);

  } catch (error) {
    console.error('Error generating invoice:', error);
    if (req.file) {
      await cleanup(req.file.path);
    }
    res.status(500).json({
      error: 'Failed to generate invoice',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: 'Maximum file size is 5MB'
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      details: err.message
    });
  }
  
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});