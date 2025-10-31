const express = require("express");
const router = express.Router();
const StoreIn = require("../models/storeInModel");
const Warehouse = require("../models/warehouseModel");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// Helper function for role-based filtering
async function getFilteredData(storeInData, role, warehouseId, departmentId) {
  let filteredData = [];

  if (role === "SUPER_ADMIN") {
    filteredData = storeInData;
  } else if (role === "WAREHOUSE_USER") {
    filteredData = storeInData.filter((x) => {
      const itemWarehouseId = String(x.warehouseId?._id || x.warehouseId);
      return x.isActive !== false && itemWarehouseId === warehouseId;
    });
  } else if (role === "MANAGER") {
    if (!departmentId || departmentId === "undefined") return [];

    if (storeInData.length > 0 && storeInData[0].departmentId) {
      filteredData = storeInData.filter((x) => {
        const itemDepartmentId = String(x.departmentId?._id || x.departmentId);
        return x.isActive !== false && itemDepartmentId === departmentId;
      });
    } else {
      const warehouses = await Warehouse.find({ departmentId });
      const warehouseIds = warehouses.map((w) => String(w._id));
      filteredData = storeInData.filter((x) => {
        const itemWarehouseId = String(x.warehouseId?._id || x.warehouseId);
        return x.isActive !== false && warehouseIds.includes(itemWarehouseId);
      });
    }
  }

  return filteredData;
}

// Error handling helpers
const handleValidationError = (error, res) => {
  const errors = Object.values(error.errors).map((e) => e.message);
  return res.status(400).json({ message: "Validation failed", errors });
};

const handleDuplicateKeyError = (error, res) => {
  const field = Object.keys(error.keyPattern)[0];
  return res
    .status(400)
    .json({ message: `Duplicate key error: ${field} already exists` });
};

const handleServerError = (error, res) => {
  console.error("Server error:", error);
  return res
    .status(500)
    .json({ message: "Server error", error: error.message });
};

// Utility function for text wrapping
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

router.get("/downloadpdf-storein", async (req, res) => {
  try {
    const {
      month,
      year,
      role,
      warehouseId,
      departmentId,
      selectedWarehouseDepartment,
    } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const selectedMonth = parseInt(month, 10);
    const selectedYear = parseInt(year, 10);
    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0));

    const storeInData = await StoreIn.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).populate("warehouseId");

    if (!storeInData.length) {
      return res
        .status(404)
        .json({ message: "No data found for the specified date range" });
    }

    const filteredData = await getFilteredData(
      storeInData,
      role,
      warehouseId,
      departmentId
    );
    if (!filteredData.length) {
      return res
        .status(404)
        .json({ message: "No data available for your role and filters" });
    }

    // Create PDF document
    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
      font: "Helvetica",
    });

    // Stream handling to prevent "write after end" error
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=StockIn_Report.pdf"
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Add logo if exists
    const logoPath = path.join(__dirname, "../uploads/images/logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 30, 20, { width: 40 });
    }

    // Header
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = monthNames[selectedMonth - 1];

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Stock In Report", 80, 25)
      .fontSize(10)
      .font("Helvetica")
      .text(`Period: ${monthName} ${selectedYear}`, 80, 45)
      .text(`Generated: ${new Date().toLocaleDateString()}`, 80, 60);

    // Column settings
    const pageWidth = doc.page.width - 60;
    const colWidths = {
      sn: 30,
      code: 120,
      po: 120,
      desc: pageWidth - 550,
      unit: 50,
      qty: 50,
      date: 80,
    };
    const colPositions = {
      sn: 30,
      code: 70,
      po: 190,
      desc: 310,
      unit: 570,
      qty: 650,
      date: 750,
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
      .text("Code", colPositions.code + 5, headerY + 5, {
        width: colWidths.code,
        align: "left",
      })
      .text(
        selectedWarehouseDepartment === "Telecom" ? "PO" : "Scheme",
        colPositions.po + 5,
        headerY + 5,
        { width: colWidths.po, align: "left" }
      )
      .text("Description", colPositions.desc + 5, headerY + 5, {
        width: colWidths.desc,
        align: "left",
      })
      // Change Unit to UOM for Electrical department
      .text(
        selectedWarehouseDepartment === "Electrical" ? "UOM" : "Unit",
        colPositions.unit + 5,
        headerY + 5,
        {
          width: colWidths.unit,
          align: "center",
        }
      )
      .text("Qty", colPositions.qty + 5, headerY + 5, {
        width: colWidths.qty,
        align: "center",
      })
      .text("Date", colPositions.date + 5, headerY + 5, {
        width: colWidths.date,
        align: "center",
      });

    let currentY = headerY + 25;

    for (const [index, item] of filteredData.entries()) {
      // Text Wrapping Fix
      const codeLines = splitLines(
        doc,
        item.materialCode || "N/A",
        colWidths.code - 10
      );
      const poLines = splitLines(doc, item.scheme || "N/A", colWidths.po - 10);
      const descLines = splitLines(
        doc,
        item.description || "N/A",
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
        .text(item.unit || "N/A", colPositions.unit + 5, currentY, {
          width: colWidths.unit,
          align: "center",
        })
        .text(item.materialQty.toString(), colPositions.qty + 5, currentY, {
          width: colWidths.qty,
          align: "center",
        })
        .text(
          new Date(item.createdAt).toLocaleDateString("en-GB"),
          colPositions.date + 5,
          currentY,
          { width: colWidths.date, align: "center" }
        );

      currentY += rowHeight;

      // Page Break
      if (currentY > doc.page.height - 100) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 30 });
        currentY = 30;
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

    // Properly End PDF Stream
    doc.on("error", (err) => console.error("PDF Generation Error:", err));
    doc.end();
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/selected_schemedownloadpdf-storein", async (req, res) => {
  try {
    const { rows, selectedWarehouseDepartment } = req.body;

    if (!rows) {
      return res.status(400).json({ message: "Rows data is required" });
    }

    // Create PDF document with same settings as first endpoint
    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
      font: "Helvetica",
    });

    // Stream handling
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=StockIn_Report.pdf"
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
      .text("Selected Scheme Stock In Report", 80, 25)
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleDateString()}`, 80, 45);

    // Column settings - matching the exact widths from the image
    const pageWidth = doc.page.width - 60;
    const colWidths = {
      sn: 30,
      code: 70,
      po: 90,
      desc: pageWidth - 370,
      unit: 40,
      qty: 40,
      date: 80,
    };
    const colPositions = {
      sn: 30,
      code: 60,
      po: 130,
      desc: 220,
      unit: pageWidth - 170,
      qty: pageWidth - 100,
      date: pageWidth - 40,
    };

    // Table header - matching the style from the image
    const headerY = 80;
    doc.fillColor("#333333").fontSize(10).font("Helvetica-Bold");
    doc.rect(colPositions.sn, headerY, pageWidth, 20).fill("#dddddd").stroke();
    doc.fillColor("#000000");

    doc
      .text("S.N", colPositions.sn + 5, headerY + 5, {
        width: colWidths.sn,
        align: "center",
      })
      .text("Code", colPositions.code + 5, headerY + 5, {
        width: colWidths.code,
        align: "left",
      })
      .text(
        selectedWarehouseDepartment === "Telecom" ? "PO" : "Scheme",
        colPositions.po + 5,
        headerY + 5,
        { width: colWidths.po, align: "left" }
      )
      .text("Description", colPositions.desc + 5, headerY + 5, {
        width: colWidths.desc,
        align: "left",
      })
      // Change Unit to UOM for Electrical department
      .text(
        selectedWarehouseDepartment === "Electrical" ? "UOM" : "Unit",
        colPositions.unit + 5,
        headerY + 5,
        {
          width: colWidths.unit,
          align: "center",
        }
      )
      .text("Qty", colPositions.qty + 5, headerY + 5, {
        width: colWidths.qty,
        align: "center",
      })
      .text("Date", colPositions.date + 5, headerY + 5, {
        width: colWidths.date,
        align: "center",
      });

    let currentY = headerY + 25;

    // Process rows with exact formatting from the image
    for (const [index, row] of rows.entries()) {
      // Format data exactly as shown in the image
      const materialCode = row.materialCode ? String(row.materialCode) : "N/A";
      const scheme = row.scheme ? String(row.scheme) : "N/A";
      const description = row.description ? String(row.description) : "N/A";
      const unit = row.unit ? String(row.unit) : "N/A";
      const materialQty = row.materialQty ? String(row.materialQty) : "N/A";
      const date = row.createdAt
        ? new Date(row.createdAt).toLocaleDateString("en-GB")
        : "N/A";

      // Calculate row height (single line as shown in image)
      const rowHeight = 15;

      // Alternate row color
      doc
        .rect(colPositions.sn, currentY, pageWidth, rowHeight)
        .fill(index % 2 === 0 ? "#ffffff" : "#f8f8f8")
        .stroke();

      // Draw row content - single line format as in the image
      doc.fontSize(9).fillColor("#000000");

      // Serial Number
      doc.text((index + 1).toString(), colPositions.sn + 5, currentY + 5, {
        width: colWidths.sn,
        align: "center",
      });

      // Material Code
      doc.text(materialCode, colPositions.code + 5, currentY + 5, {
        width: colWidths.code,
        align: "left",
      });

      // Scheme/PO CODE
      doc.text(scheme, colPositions.po + 5, currentY + 5, {
        width: colWidths.po,
        align: "left",
      });

      // Description
      doc.text(description, colPositions.desc + 5, currentY + 5, {
        width: colWidths.desc,
        align: "left",
      });

      // Unit
      doc.text(unit, colPositions.unit + 5, currentY + 5, {
        width: colWidths.unit,
        align: "center",
      });

      // Quantity
      doc.text(materialQty, colPositions.qty + 5, currentY + 5, {
        width: colWidths.qty,
        align: "center",
      });

      // Date
      doc.text(date, colPositions.date + 5, currentY + 5, {
        width: colWidths.date,
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
          .text("Code", colPositions.code + 5, currentY + 5, {
            width: colWidths.code,
            align: "left",
          })
          .text(
            selectedWarehouseDepartment === "Telecom" ? "PO " : "Scheme ",
            colPositions.po + 5,
            currentY + 5,
            { width: colWidths.po, align: "left" }
          )
          .text("Description", colPositions.desc + 5, currentY + 5, {
            width: colWidths.desc,
            align: "left",
          })
          // Change Unit to UOM for Electrical department
          .text(
            selectedWarehouseDepartment === "Electrical" ? "UOM" : "Unit",
            colPositions.unit + 5,
            currentY + 5,
            {
              width: colWidths.unit,
              align: "center",
            }
          )
          .text("Qty", colPositions.qty + 5, currentY + 5, {
            width: colWidths.qty,
            align: "center",
          })
          .text("Date", colPositions.date + 5, currentY + 5, {
            width: colWidths.date,
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

// Excel Report Endpoint
router.get("/storein-report", async (req, res) => {
  try {
    const {
      month,
      year,
      role,
      warehouseId,
      departmentId,
      selectedWarehouseDepartment,
    } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const selectedMonth = parseInt(month, 10);
    const selectedYear = parseInt(year, 10);

    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0));

    const storeInData = await StoreIn.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).populate("warehouseId");

    if (!storeInData.length) {
      return res
        .status(404)
        .json({ message: "No data found for the specified date range" });
    }

    const filteredData = await getFilteredData(
      storeInData,
      role,
      warehouseId,
      departmentId
    );

    if (!filteredData.length) {
      return res
        .status(404)
        .json({ message: "No data available for your role and filters" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Stock In Report");
    const headerTitle =
      selectedWarehouseDepartment === "Telecom" ? "PO" : "Scheme";

    // Remove "Notes" column for Electrical department
    const header =
      selectedWarehouseDepartment === "Electrical"
        ? [
            headerTitle,
            "Description",
            "Material Code",
            "Material Qty",
            "UOM", // Changed from "Unit" to "UOM"
            "Created At",
            "Updated At",
            "Created By",
            "Updated By",
          ]
        : [
            headerTitle,
            "Description",
            "Material Code",
            "Material Qty",
            "Notes",
            "Unit",
            "Created At",
            "Updated At",
            "Created By",
            "Updated By",
          ];

    worksheet.addRow(header);

    filteredData.forEach((item) => {
      if (selectedWarehouseDepartment === "Electrical") {
        worksheet.addRow([
          item.scheme,
          item.description,
          item.materialCode,
          item.materialQty,
          item.unit, // This will be "UOM" value
          item.createdAt,
          item.updatedAt,
          item.createdBy,
          item.updatedBy,
        ]);
      } else {
        worksheet.addRow([
          item.scheme,
          item.description,
          item.materialCode,
          item.materialQty,
          item.notes,
          item.unit,
          item.createdAt,
          item.updatedAt,
          item.createdBy,
          item.updatedBy,
        ]);
      }
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=stockin_report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return handleValidationError(error, res);
    }
    if (error.code === 11000) {
      return handleDuplicateKeyError(error, res);
    }
    return handleServerError(error, res);
  }
});

// Excel Report Endpoint for selected scheme
router.post("/storein-report-by-scheme", async (req, res) => {
  try {
    const { rows, columns, selectedWarehouseDepartment } = req.body;

    if (!rows || !columns) {
      return res.status(400).json({ message: "Rows and columns are required" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Stock In Report");

    const updatedColumns = columns
      .map((col) => {
        if (
          col.field === "scheme" &&
          selectedWarehouseDepartment === "Telecom"
        ) {
          return { ...col, headerName: "PO CODE" };
        }
        // Change Unit to UOM and remove Notes for Electrical department
        if (selectedWarehouseDepartment === "Electrical") {
          if (col.field === "unit") {
            return { ...col, headerName: "UOM" };
          }
          if (col.field === "notes") {
            return null; // Remove notes column
          }
        }
        return col;
      })
      .filter((col) => col !== null); // Remove null columns (like notes for Electrical)

    worksheet.columns = updatedColumns.map((col) => ({
      header: col.headerName,
      key: col.field,
      width: 20,
    }));

    worksheet.addRows(rows);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=StockIn_Report.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return handleValidationError(error, res);
    }
    if (error.code === 11000) {
      return handleDuplicateKeyError(error, res);
    }
    return handleServerError(error, res);
  }
});

module.exports = router;
