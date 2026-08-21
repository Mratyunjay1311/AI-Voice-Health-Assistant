const PDFDocument = require("pdfkit");

function generateHealthReportPDF(report) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const chunks = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);

        resolve(pdfBuffer);
      });

      doc.on("error", (error) => {
        reject(error);
      });


      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text(
          "AI Health Screening Report",
          {
            align: "center",
          }
        );

      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#6b7280")
        .text(
          `Generated on: ${new Date().toLocaleString()}`,
          {
            align: "center",
          }
        );

      doc.moveDown(1.5);


    
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#92400e")
        .text(
          "IMPORTANT: This is a preliminary health screening report and not a medical diagnosis. Please consult a qualified healthcare professional for medical advice."
        );

      doc.moveDown(1.5);


     
      const section = (
        title,
        content
      ) => {

        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#111827")
          .text(title);

        doc.moveDown(0.3);

        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor("#374151")
          .text(
            content ||
            "Not reported."
          );

        doc.moveDown(1);

      };


      

      section(
        "Main Concern",
        report.mainConcern
      );

      section(
        "Duration",
        report.duration
      );

      section(
        "Severity",
        report.severity
      );


     

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#111827")
        .text(
          "Symptoms Reported"
        );

      doc.moveDown(0.3);


      if (
        Array.isArray(
          report.symptoms
        ) &&
        report.symptoms.length > 0
      ) {

        report.symptoms.forEach(
          (symptom) => {

            doc
              .fontSize(11)
              .font("Helvetica")
              .fillColor("#374151")
              .text(
                `• ${symptom}`
              );

          }
        );

      } else {

        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor("#374151")
          .text(
            "No symptoms reported."
          );

      }

      doc.moveDown(1);



      section(
        "Medical History",
        report.medicalHistory
      );


    

      section(
        "Current Medications",
        report.medications
      );




      section(
        "Risk Factors",
        report.riskFactors
      );


  
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#991b1b")
        .text(
          "Red Flags"
        );

      doc.moveDown(0.3);


      if (
        Array.isArray(
          report.redFlags
        ) &&
        report.redFlags.length > 0
      ) {

        report.redFlags.forEach(
          (flag) => {

            doc
              .fontSize(11)
              .font("Helvetica")
              .fillColor("#991b1b")
              .text(
                `• ${flag}`
              );

          }
        );

      } else {

        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor("#374151")
          .text(
            "No red-flag symptoms were reported."
          );

      }

      doc.moveDown(1);



      section(
        "Conversation Summary",
        report.conversationSummary
      );


  

      section(
        "General Next Steps",
        report.recommendations
      );




      doc.moveDown(1);

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#6b7280")
        .text(
          "This report summarizes information provided during the AI health screening conversation. It does not constitute medical diagnosis, treatment, or professional medical advice.",
          {
            align: "center",
          }
        );




      doc.end();

    } catch (error) {

      reject(error);

    }
  });
}




module.exports = {
  generateHealthReportPDF,
};