import PDFDocument from 'pdfkit';
import { CheckbookData } from '../types/check.types';
import * as fs from 'fs';
import * as path from 'path';
import { formatDateLong, LIBYA_CONFIG } from './locale';

export class PDFGenerator {
  /**
   * Generate a PDF file for a checkbook
   * @param checkbookData The checkbook data to generate PDF for
   * @param outputDir Directory to save the PDF file
   * @returns Path to the generated PDF file
   */
  static async generateCheckbookPDF(
    checkbookData: CheckbookData,
    outputDir: string = './output'
  ): Promise<string> {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create filename
    const timestamp = new Date().getTime();
    const filename = `checkbook_${checkbookData.operation.accountNumber}_${timestamp}.pdf`;
    const filepath = path.join(outputDir, filename);

    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 20,
          layout: 'portrait',
        });

        // Pipe to file
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Register MICR font
        const micrFontPath = path.join(__dirname, '../fonts/micrenc.ttf');
        if (fs.existsSync(micrFontPath)) {
          doc.registerFont('MICR', micrFontPath);
        }

        // Add Arabic font support (using Arial as fallback)
        // Note: For production, use a proper Arabic font like Amiri or Cairo
        // doc.registerFont('Arabic', 'path/to/arabic-font.ttf');

        // Cover page
        this.addCoverPage(doc, checkbookData);

        // Add each check on a separate page
        checkbookData.checks.forEach((check, index) => {
          doc.addPage({
            size: [
              this.mmToPoints(check.checkSize.width),
              this.mmToPoints(check.checkSize.height),
            ],
            margin: 0,
          });
          this.addCheckPage(doc, check, checkbookData.operation.branchName);
        });

        // Finalize PDF
        doc.end();

        stream.on('finish', () => {
          resolve(filepath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add cover page with checkbook information
   */
  private static addCoverPage(doc: any, checkbookData: CheckbookData): void {
    const { operation } = checkbookData;

    doc.fontSize(24).text('Check Printing System', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('Checkbook Details', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12);
    doc.text(`Account Number: ${operation.accountNumber}`);
    doc.text(`Account Holder: ${operation.accountHolderName}`);
    doc.text(`Account Type: ${operation.accountType === 1 ? 'Individual' : 'Corporate'}`);
    doc.text(`Branch: ${operation.branchName}`);
    doc.text(`Routing Number: ${operation.routingNumber}`);
    doc.moveDown();
    doc.text(`Serial Range: ${operation.serialFrom} - ${operation.serialTo}`);
    doc.text(`Total Checks: ${operation.sheetsPrinted}`);
    doc.text(`Print Date: ${formatDateLong(operation.printDate)}`);
    doc.moveDown(2);

    doc.fontSize(10);
    doc.text('MICR Line Format (RTL - Right to Left):', { underline: true });
    doc.text('[Account Type] [Account Number] [Routing Number] [Serial]');
    doc.moveDown();
    doc.text('Example MICR Line:');
    
    // Use MICR font if available, otherwise fallback to Courier
    try {
      doc.font('MICR').fontSize(12).text(checkbookData.checks[0].micrLine);
      doc.font('Helvetica').fontSize(8).text('(Type starts from right: 01=Individual, 02=Corporate)');
    } catch (e) {
      doc.font('Courier').text(checkbookData.checks[0].micrLine);
      doc.text('(Type starts from right: 01=Individual, 02=Corporate)', { fontSize: 8 });
    }
  }

  /**
   * Add a single check page
   */
  private static addCheckPage(
    doc: any,
    check: any,
    branchName: string
  ): void {
    const width = this.mmToPoints(check.checkSize.width);
    const height = this.mmToPoints(check.checkSize.height);

    // Add border
    doc
      .rect(5, 5, width - 10, height - 10)
      .stroke();

    // Branch name at top center
    doc.fontSize(14).text(branchName, 10, 20, {
      width: width - 20,
      align: 'center',
    });

    // Serial number at top right (RTL positioning)
    doc.fontSize(12).text(`Serial: ${check.serialNumber}`, width - 120, 45, {
      width: 110,
      align: 'right',
    });

    // Date field
    doc.fontSize(10).text('Date: ____________', 20, 60);

    // Pay to the order of
    doc.fontSize(10).text('Pay to the order of:', 20, 90);
    doc
      .moveTo(20, 110)
      .lineTo(width - 20, 110)
      .stroke();

    // Amount in words
    doc.fontSize(10).text('Amount:', 20, 120);
    doc
      .moveTo(20, 140)
      .lineTo(width - 100, 140)
      .stroke();

    // Amount in numbers
    doc.fontSize(10).text('Amount:', width - 90, 120);
    doc.rect(width - 90, 130, 70, 20).stroke();

    // Signature line
    doc.fontSize(10).text('Authorized Signature:', 20, height - 80);
    doc
      .moveTo(20, height - 60)
      .lineTo(150, height - 60)
      .stroke();

    // Account holder name at bottom left
    doc.fontSize(8).font('Helvetica').text(check.accountHolderName, 20, height - 40);

    // MICR line at bottom (in special MICR font style)
    try {
      doc.fontSize(12).font('MICR').text(check.micrLine, 20, height - 25, {
        width: width - 40,
        align: 'center',
      });
    } catch (e) {
      // Fallback to Courier if MICR font is not available
      doc.fontSize(10).font('Courier').text(check.micrLine, 20, height - 25, {
        width: width - 40,
        align: 'center',
      });
    }

    // Add some decorative elements
    doc
      .moveTo(10, 70)
      .lineTo(width - 10, 70)
      .dash(5, { space: 5 })
      .stroke()
      .undash();
  }

  /**
   * Convert millimeters to points (PDF unit)
   */
  private static mmToPoints(mm: number): number {
    return mm * 2.83465; // 1mm = 2.83465 points
  }
}

