const express = require("express");
const router = express.Router();
const StockOut = require("../models/stockOutModel");
const Warehouse = require("../models/warehouseModel"); // Add this import
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

// Add this helper function for role-based filtering
async function getFilteredData(stockOutData, role, warehouseId, departmentId) {
  let filteredData = [];

  if (role === "SUPER_ADMIN") {
    filteredData = stockOutData; // No filtering needed
  } else if (role === "WAREHOUSE_USER") {
    filteredData = stockOutData.filter((x) => {
      const itemWarehouseId = String(x.warehouseId?._id || x.warehouseId);
      const matches = itemWarehouseId === warehouseId;
      return x.isActive !== false && matches;
    });
  } else if (role === "MANAGER") {
    if (!departmentId || departmentId === "undefined") {
      return [];
    }

    // First check if we can filter directly by departmentId in the data
    if (stockOutData.length > 0 && stockOutData[0].departmentId) {
      filteredData = stockOutData.filter((x) => {
        const itemDepartmentId = String(x.departmentId?._id || x.departmentId);
        return x.isActive !== false && itemDepartmentId === departmentId;
      });
    } else {
      // Fetch warehouses for the department
      const warehouses = await Warehouse.find({
        departmentId: departmentId,
      });

      const warehouseIds = warehouses.map((w) => String(w._id));
      filteredData = stockOutData.filter((x) => {
        const itemWarehouseId = String(x.warehouseId?._id || x.warehouseId);
        const matches = warehouseIds.includes(itemWarehouseId);

        return x.isActive !== false && matches;
      });
    }
  } else {
    // Default case - no access

    filteredData = [];
  }

  return filteredData;
}

// Updated stock-out PDF endpoints to match stock-in format

// Helper function for text wrapping (same as stock-in)
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

// Updated selected scheme stock-out endpoint
router.post("/selected_schemedownloadpdf-stockout", async (req, res) => {
  try {
    const { rows, selectedWarehouseDepartment } = req.body;

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
      "attachment; filename=StockOut_Report.pdf"
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
      .text("Stock Out Report", 80, 25)
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated: ${new Date().toLocaleDateString()}`, 80, 45);

    // Column settings - matching stock-in exactly
    const pageWidth = doc.page.width - 60;
    const colWidths = {
      sn: 30,
      code: 120,
      po: 120,
      desc: pageWidth - 430,
      unit: 50,
      qty: 50,
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
        selectedWarehouseDepartment === "Telecom" ? "PO " : "Scheme",
        colPositions.po + 5,
        headerY + 5,
        { width: colWidths.po, align: "left" }
      )
      .text("Description", colPositions.desc + 5, headerY + 5, {
        width: colWidths.desc,
        align: "left",
      })
      .text("Unit", colPositions.unit + 5, headerY + 5, {
        width: colWidths.unit,
        align: "center",
      })
      .text("Qty", colPositions.qty + 5, headerY + 5, {
        width: colWidths.qty,
        align: "center",
      })
      .text("Date", colPositions.date + 5, headerY + 5, {
        width: colWidths.date,
        align: "center",
      });

    let currentY = headerY + 25;

    // Process rows with same formatting as stock-in
    for (const [index, row] of rows.entries()) {
      // Text Wrapping Fix
      const codeLines = splitLines(
        doc,
        row.materialCode || "N/A",
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
        .text(row.unit || "N/A", colPositions.unit + 5, currentY, {
          width: colWidths.unit,
          align: "center",
        })
        .text(row.materialQty.toString(), colPositions.qty + 5, currentY, {
          width: colWidths.qty,
          align: "center",
        })
        .text(
          row.createdAt
            ? new Date(row.createdAt).toLocaleDateString("en-GB")
            : "N/A",
          colPositions.date + 5,
          currentY,
          { width: colWidths.date, align: "center" }
        );

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
            selectedWarehouseDepartment === "Telecom" ? "PO" : "Scheme",
            colPositions.po + 5,
            currentY + 5,
            { width: colWidths.po, align: "left" }
          )
          .text("Description", colPositions.desc + 5, currentY + 5, {
            width: colWidths.desc,
            align: "left",
          })
          .text("Unit", colPositions.unit + 5, currentY + 5, {
            width: colWidths.unit,
            align: "center",
          })
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

// Updated regular stock-out endpoint
router.get("/downloadpdf-stockout", async (req, res) => {
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

    const stockOutData = await StockOut.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).populate("warehouseId");

    if (!stockOutData.length) {
      return res
        .status(404)
        .json({ message: "No data found for the specified date range" });
    }

    const filteredData = await getFilteredData(
      stockOutData,
      role,
      warehouseId,
      departmentId
    );
    if (!filteredData.length) {
      return res
        .status(404)
        .json({ message: "No data available for your role and filters" });
    }

    // Create PDF document (same as stock-in)
    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
      font: "Helvetica",
    });

    // Stream handling
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=StockOut_Report.pdf"
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
      .text("Stock Out Report", 80, 25)
      .fontSize(10)
      .font("Helvetica")
      .text(`Period: ${monthName} ${selectedYear}`, 80, 45)
      .text(`Generated: ${new Date().toLocaleDateString()}`, 80, 60);

    // Column settings (same as stock-in)
    const pageWidth = doc.page.width - 60;
    const colWidths = {
      sn: 30,
      code: 120,
      po: 120,
      desc: pageWidth - 430,
      unit: 50,
      qty: 50,
      date: 80,
    };
    const colPositions = {
      sn: 30,
      code: 70,
      po: 180,
      desc: 330,
      unit: 550,
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
        selectedWarehouseDepartment === "Telecom" ? "PO " : "Scheme ",
        colPositions.po + 5,
        headerY + 5,
        { width: colWidths.po, align: "left" }
      )
      .text("Description", colPositions.desc + 5, headerY + 5, {
        width: colWidths.desc,
        align: "left",
      })
      .text("Unit", colPositions.unit + 5, headerY + 5, {
        width: colWidths.unit,
        align: "center",
      })
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

    doc.end();
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/stockout-report", async (req, res) => {
  try {
    const {
      month,
      year,
      role,
      warehouseId,
      departmentId,
      department,
      selectedWarehouseDepartment,
    } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    const selectedMonth = parseInt(month, 10);
    const selectedYear = parseInt(year, 10);

    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth + 5, 0));

    const stockOutData = await StockOut.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$createdAt" }, selectedMonth] },
          { $eq: [{ $year: "$createdAt" }, selectedYear] },
        ],
      },
      updatedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate("warehouseId");

    if (!stockOutData.length) {
      return res
        .status(404)
        .json({ error: "No data found for the specified date range" });
    }

    // Apply role-based filtering
    const filteredData = await getFilteredData(
      stockOutData,
      role,
      warehouseId,
      departmentId
    );

    if (!filteredData.length) {
      return res
        .status(404)
        .json({ error: "No data available for your role and filters" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Stock Out Report");
    const headerTitle =
      selectedWarehouseDepartment === "Telecom" ? "PO" : "Scheme";
    // Determine the header based on role and department
    const header = [
      headerTitle,
      "Description",
      "Material Code",
      "Material Qty",

      selectedWarehouseDepartment === "Telecom" ? "Notes" : "Address",
      "Unit",
      selectedWarehouseDepartment === "Telecom" ? "Site ID" : "Area Code",
      "Receiver Name",
      "Created At",
      "Updated At",
      "Created By",
      "Updated By",
    ];

    // Add headers
    worksheet.addRow(header);

    // Add data
    filteredData.forEach((item) => {
      worksheet.addRow([
        item.scheme,
        item.description,
        item.materialCode,
        item.materialQty,
        item.address,
        item.unit,
        item.areaCode,
        item.receiverName,
        item.createdAt,
        item.updatedAt,
        item.createdBy,
        item.updatedBy,
      ]);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=stockout_report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/stockout-report-by-scheme", async (req, res) => {
  try {
    const { rows, columns, role, department, selectedWarehouseDepartment } =
      req.body;

    if (!rows || !columns) {
      return res.status(400).json({ error: "Rows and columns are required" });
    }

    // Generate Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Store In Report");

    const updatedColumns = columns.map((col) => {
      if (col.field === "scheme" && selectedWarehouseDepartment === "Telecom") {
        return { ...col, headerName: "PO " }; // Change header text to "PO Number"
      }
      if (
        col.field === "areaCode" &&
        selectedWarehouseDepartment === "Telecom"
      ) {
        return { ...col, headerName: "Site ID" }; // Change header text to "Site ID"
      }
      if (
        col.field === "address" &&
        selectedWarehouseDepartment === "Telecom"
      ) {
        return { ...col, headerName: "Notes" }; // Change header text to "Notes"
      }
      return col;
    });
    // Add headers
    worksheet.columns = updatedColumns.map((col) => ({
      header: col.headerName,
      key: col.field,
      width: 20,
    }));

    // Add rows
    worksheet.addRows(rows);

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=StoreIn_Report.xlsx`
    );

    // Send the file as a response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
