const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const splitLines = (doc, text, maxWidth) => {
  const words = String(text || "").split(" ");
  let line = "";
  let lines = [];

  words.forEach((word) => {
    if (doc.widthOfString(line + word) < maxWidth) {
      line += word + " ";
    } else {
      lines.push(line.trim());
      line = word + " ";
    }
  });

  if (line) lines.push(line.trim());
  return lines;
};

// Helper function to safely convert values to numbers
const safeNumber = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper function to safely convert values to strings
const safeString = (value) => {
  if (value === null || value === undefined) return "N/A";
  return String(value);
};

// Endpoint to download Excel
router.post("/material-report-exl", async (req, res) => {
  try {
    const { rows, columns, role, department, departmentName } = req.body;

    if (!rows || !columns) {
      return res.status(400).json({ error: "Rows and columns are required" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Material Report");

    // Adjust headers based on department
    const adjustedColumns = columns.map((col) => {
      if (col.field === "scheme" && departmentName === "Telecom") {
        return { ...col, headerName: "PO" }; // Replace "Scheme" with "PO Number"
      }
      return col;
    });

    // Add headers
    worksheet.columns = adjustedColumns.map((col) => ({
      header: col.headerName,
      key: col.field,
      width: 20,
    }));

    // Add data - ensure we're getting all fields properly with safe conversion
    const adjustedRows = rows.map((row) => {
      const safeRow = {
        materialCode: safeString(row.materialCode),
        scheme: safeString(row.scheme),
        poNumber: safeString(row.poNumber || row.scheme),
        description: safeString(row.description),
        stockin: safeNumber(row.stockin),
        stockOut: safeNumber(row.stockOut),
        remaningStock: safeNumber(row.remaningStock),
        date: safeString(row.date),
      };

      if (department === "Telecom") {
        return safeRow; // Replace "scheme" with "poNumber"
      }
      return safeRow;
    });

    worksheet.addRows(adjustedRows);

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=StockIn_Report.xlsx"
    );

    // Send the file as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to download PDF
router.post("/material-report", async (req, res) => {
  let doc;

  try {
    const { rows, departmentName } = req.body;

    if (!rows || !Array.isArray(rows)) {
      return res
        .status(400)
        .json({ message: "Rows data is required and must be an array" });
    }

    // Create PDF document with same settings as stock-in
    doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
      font: "Helvetica",
    });

    // Set response headers before piping
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Material_Report.pdf"
    );
    res.setHeader("Content-Type", "application/pdf");

    // Handle stream errors
    doc.on("error", (err) => {
      console.error("PDF Document error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error generating PDF" });
      }
    });

    res.on("error", (err) => {
      console.error("Response stream error:", err);
    });

    // Pipe the PDF to response
    doc.pipe(res);

    // Add logo if exists
    const logoPath = path.join(__dirname, "../uploads/images/logo.png");
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 30, 20, { width: 40 });
      } catch (logoError) {
        console.warn("Could not load logo:", logoError.message);
      }
    }

    // Header
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Material Report", 80, 25)
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleDateString()}`, 80, 45);

    // Column settings - fixed positioning and widths
    const pageWidth = doc.page.width - 60;
    const colWidths = {
      sn: 40,
      code: 120,
      desc: 250,
      stockIn: 90,
      stockOut: 90,
      remaining: 90,
    };

    const colPositions = {
      sn: 30,
      code: 80,
      desc: 210,
      stockIn: 470,
      stockOut: 570,
      remaining: 670,
    };

    // Table header
    const headerY = 80;
    doc.fillColor("#333333").fontSize(10).font("Helvetica-Bold");
    doc.rect(colPositions.sn, headerY, pageWidth, 20).fill("#dddddd").stroke();
    doc.fillColor("#000000");

    doc
      .text("S.N", colPositions.sn + 5, headerY + 5, {
        width: colWidths.sn - 10,
        align: "center",
      })
      .text("MATERIAL CODE", colPositions.code + 5, headerY + 5, {
        width: colWidths.code - 10,
        align: "left",
      })
      .text("DESCRIPTION", colPositions.desc + 5, headerY + 5, {
        width: colWidths.desc - 10,
        align: "left",
      })
      .text("STOCK IN", colPositions.stockIn + 5, headerY + 5, {
        width: colWidths.stockIn - 10,
        align: "center",
      })
      .text("STOCK OUT", colPositions.stockOut + 5, headerY + 5, {
        width: colWidths.stockOut - 10,
        align: "center",
      })
      .text("REMAINING", colPositions.remaining + 5, headerY + 5, {
        width: colWidths.remaining - 10,
        align: "center",
      });

    let currentY = headerY + 25;

    // Process rows with safe data handling
    for (const [index, row] of rows.entries()) {
      try {
        // Safely convert all values
        const materialCode = safeString(row.materialCode);
        const description = safeString(row.description);
        const stockIn = safeNumber(row.stockin || row.stockIn);
        const stockOut = safeNumber(row.stockOut);
        const remaining = safeNumber(row.remaningStock || row.remainingStock);

        // Text Wrapping with safe string handling
        const codeLines = splitLines(doc, materialCode, colWidths.code - 10);
        const descLines = splitLines(doc, description, colWidths.desc - 10);

        const rowHeight = Math.max(
          15,
          codeLines.length * 12,
          descLines.length * 12
        );

        // Check if we need a new page
        if (currentY + rowHeight > doc.page.height - 100) {
          doc.addPage({ size: "A4", layout: "landscape", margin: 30 });
          currentY = 30;

          // Redraw header on new page
          doc.fillColor("#333333").fontSize(10).font("Helvetica-Bold");
          doc
            .rect(colPositions.sn, currentY, pageWidth, 20)
            .fill("#dddddd")
            .stroke();
          doc.fillColor("#000000");

          doc
            .text("S.N", colPositions.sn + 5, currentY + 5, {
              width: colWidths.sn - 10,
              align: "center",
            })
            .text("MATERIAL CODE", colPositions.code + 5, currentY + 5, {
              width: colWidths.code - 10,
              align: "left",
            })
            .text("DESCRIPTION", colPositions.desc + 5, currentY + 5, {
              width: colWidths.desc - 10,
              align: "left",
            })
            .text("STOCK IN", colPositions.stockIn + 5, currentY + 5, {
              width: colWidths.stockIn - 10,
              align: "center",
            })
            .text("STOCK OUT", colPositions.stockOut + 5, currentY + 5, {
              width: colWidths.stockOut - 10,
              align: "center",
            })
            .text("REMAINING", colPositions.remaining + 5, currentY + 5, {
              width: colWidths.remaining - 10,
              align: "center",
            });

          currentY += 25;
        }

        // Alternate row color
        doc
          .rect(colPositions.sn, currentY, pageWidth, rowHeight)
          .fill(index % 2 === 0 ? "#ffffff" : "#f8f8f8")
          .stroke();

        // Add row data with safe values
        doc
          .fontSize(9)
          .fillColor("#000000")
          .text((index + 1).toString(), colPositions.sn + 5, currentY + 3, {
            width: colWidths.sn - 10,
            align: "center",
          })
          .text(codeLines.join("\n"), colPositions.code + 5, currentY + 3, {
            width: colWidths.code - 10,
            align: "left",
          })
          .text(descLines.join("\n"), colPositions.desc + 5, currentY + 3, {
            width: colWidths.desc - 10,
            align: "left",
          })
          .text(stockIn.toString(), colPositions.stockIn + 5, currentY + 3, {
            width: colWidths.stockIn - 10,
            align: "center",
          })
          .text(stockOut.toString(), colPositions.stockOut + 5, currentY + 3, {
            width: colWidths.stockOut - 10,
            align: "center",
          })
          .text(
            remaining.toString(),
            colPositions.remaining + 5,
            currentY + 3,
            {
              width: colWidths.remaining - 10,
              align: "center",
            }
          );

        currentY += rowHeight;
      } catch (rowError) {
        console.error(`Error processing row ${index}:`, rowError);
        // Skip this row and continue
        continue;
      }
    }

    // Footer
    const footerY = doc.page.height - 80;
    doc
      .moveTo(30, footerY - 10)
      .lineTo(doc.page.width - 30, footerY - 10)
      .stroke("#cccccc");
    doc
      .fontSize(9)
      .text("Store by: ________________________", 30, footerY)
      .text("Received by: ________________________", 250, footerY)
      .text("Project Manager: ________________________", 470, footerY)
      .text("Vehicle No. ________________________", 30, footerY + 20);

    // End the document
    doc.end();
  } catch (error) {
    console.error("Server error:", error);

    // End the document if it exists and hasn't been ended
    if (doc && !doc.destroyed) {
      try {
        doc.end();
      } catch (endError) {
        console.error("Error ending document:", endError);
      }
    }

    // Send error response if headers haven't been sent
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
});

module.exports = router;
