const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const splitLines = (doc, text, maxWidth) => {
  const words = text.split(" ");
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

// Excel Report
router.post("/poTrackingExc-report", async (req, res) => {
  try {
    const { rows, columns, department } = req.body;

    if (!rows || !columns) {
      return res.status(400).json({ error: "Rows and columns are required" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("PO Tracking Report");

    // Adjust headers based on department
    const adjustedColumns = columns.map((col) => {
      if (col.field === "scheme" && department === "Telecom") {
        return { ...col, headerName: "PO" };
      }
      return col;
    });

    worksheet.columns = adjustedColumns.map((col) => ({
      header: col.headerName,
      key: col.field,
      width: 20,
    }));

    // Add the filtered rows directly
    worksheet.addRows(rows);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PO_Tracking_Report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/poTrackingPdf-report", async (req, res) => {
  try {
    const { rows, department } = req.body;

    if (!rows) {
      return res.status(400).json({ message: "Rows data is required" });
    }

    // Create PDF document with same settings as stock-in
    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
      font: "Helvetica",
    });

    // Stream handling
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=PO_Tracking_Report.pdf"
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Add logo if exists
    const logoPath = path.join(__dirname, "../uploads/images/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 30, 20, { width: 40 });
    }

    // Header
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("RWS PO Tracking Report", 80, 25)
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleDateString()}`, 80, 45);

    // Column settings - matching stock-in style but with PO tracking columns
    const pageWidth = doc.page.width - 60;
    const colWidths = {
      sn: 30,
      code: 100,
      po: 100,
      desc: 200,
      poQty: 60,
      recQty: 60,
      remQty: 60,
      unit: 50,
    };
    const colPositions = {
      sn: 30,
      code: 70,
      po: 170,
      desc: 270,
      poQty: 470,
      recQty: 530,
      remQty: 590,
      unit: 650,
    };

    // Table header
    const headerY = 80;
    doc.fillColor("#333333").fontSize(10).font("Helvetica-Bold");
    doc.rect(colPositions.sn, headerY, pageWidth, 20).fill("#dddddd").stroke();
    doc.fillColor("#000000");

    doc
      .text("S.N", colPositions.sn + 5, headerY + 5, {
        width: colWidths.sn,
        align: "center",
      })
      .text("CODE", colPositions.code + 5, headerY + 5, {
        width: colWidths.code,
        align: "left",
      })
      .text(
        department === "Telecom" ? "PO" : "SCHEME",
        colPositions.po + 5,
        headerY + 5,
        { width: colWidths.po, align: "left" }
      )
      .text("DESCRIPTION", colPositions.desc + 5, headerY + 5, {
        width: colWidths.desc,
        align: "left",
      })
      .text("PO QTY", colPositions.poQty + 5, headerY + 5, {
        width: colWidths.poQty,
        align: "center",
      })
      .text("REC QTY", colPositions.recQty + 5, headerY + 5, {
        width: colWidths.recQty,
        align: "center",
      })
      .text("REM QTY", colPositions.remQty + 5, headerY + 5, {
        width: colWidths.remQty,
        align: "center",
      })
      .text("UNIT", colPositions.unit + 5, headerY + 5, {
        width: colWidths.unit,
        align: "center",
      });

    let currentY = headerY + 25;

    // Process rows with same formatting as stock-in
    for (const [index, row] of rows.entries()) {
      // Text Wrapping Fix
      const codeLines = splitLines(
        doc,
        row.itemCode || "N/A",
        colWidths.code - 10
      );
      const poLines = splitLines(doc, row.scheme || "N/A", colWidths.po - 10);
      const descLines = splitLines(
        doc,
        row.description || "N/A",
        colWidths.desc - 10
      );
      const rowHeight = Math.max(
        15,
        codeLines.length * 12,
        poLines.length * 12,
        descLines.length * 12
      );

      // Alternate row color
      doc
        .rect(colPositions.sn, currentY, pageWidth, rowHeight)
        .fill(index % 2 === 0 ? "#ffffff" : "#f8f8f8")
        .stroke();

      doc
        .fontSize(9)
        .fillColor("#000000")
        .text((index + 1).toString(), colPositions.sn + 5, currentY, {
          width: colWidths.sn,
          align: "center",
        })
        .text(codeLines.join("\n"), colPositions.code + 5, currentY, {
          width: colWidths.code,
          align: "left",
        })
        .text(poLines.join("\n"), colPositions.po + 5, currentY, {
          width: colWidths.po,
          align: "left",
        })
        .text(descLines.join("\n"), colPositions.desc + 5, currentY, {
          width: colWidths.desc,
          align: "left",
        })
        .text(row.poQty?.toString() || "0", colPositions.poQty + 5, currentY, {
          width: colWidths.poQty,
          align: "center",
        })
        .text(
          row.receivedPoQty?.toString() || "0",
          colPositions.recQty + 5,
          currentY,
          {
            width: colWidths.recQty,
            align: "center",
          }
        )
        .text(
          row.remainingQty?.toString() || "0",
          colPositions.remQty + 5,
          currentY,
          {
            width: colWidths.remQty,
            align: "center",
          }
        )
        .text(row.unit || "N/A", colPositions.unit + 5, currentY, {
          width: colWidths.unit,
          align: "center",
        });

      currentY += rowHeight;

      // Page Break
      if (currentY > doc.page.height - 100) {
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
            width: colWidths.sn,
            align: "center",
          })
          .text("CODE", colPositions.code + 5, currentY + 5, {
            width: colWidths.code,
            align: "left",
          })
          .text(
            department === "Telecom" ? "PO" : "SCHEME ",
            colPositions.po + 5,
            currentY + 5,
            { width: colWidths.po, align: "left" }
          )
          .text("DESCRIPTION", colPositions.desc + 5, currentY + 5, {
            width: colWidths.desc,
            align: "left",
          })
          .text("PO QTY", colPositions.poQty + 5, currentY + 5, {
            width: colWidths.poQty,
            align: "center",
          })
          .text("REC QTY", colPositions.recQty + 5, currentY + 5, {
            width: colWidths.recQty,
            align: "center",
          })
          .text("REM QTY", colPositions.remQty + 5, currentY + 5, {
            width: colWidths.remQty,
            align: "center",
          })
          .text("UNIT", colPositions.unit + 5, currentY + 5, {
            width: colWidths.unit,
            align: "center",
          });

        currentY += 25;
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

    doc.end();
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = router;
