import jsPDF from 'jspdf';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface ExportData {
  type: string;
  form?: any;
  result?: any;
  timestamp: string;
  calculations?: any[];
}

export function exportToPDF(data: ExportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Primary blue
  doc.text('Actuary Rent', margin, yPosition);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Your Smart Pension Calculator', margin, yPosition + 8);
  
  yPosition += 25;

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  
  if (data.type === 'bulk_export') {
    doc.text('Rapport d\'historique des calculs', margin, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date(data.timestamp).toLocaleString('fr-FR')}`, margin, yPosition);
    doc.text(`Nombre de calculs: ${data.calculations?.length || 0}`, margin, yPosition + 5);
    yPosition += 20;

    // Summary table for bulk export
    if (data.calculations && data.calculations.length > 0) {
      const tableData = data.calculations.map((calc, index) => [
        (index + 1).toString(),
        getTypeLabel(calc.type),
        `€${calc.data.annualAmount.toLocaleString()}`,
        `€${calc.result.presentValue.toLocaleString()}`,
        new Date(calc.timestamp).toLocaleDateString('fr-FR'),
      ]);

      // Simple table implementation
      const headers = ['#', 'Type', 'Montant annuel', 'Valeur actuelle', 'Date'];
      const colWidths = [15, 50, 35, 35, 30];
      
      // Headers
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      headers.forEach((header, i) => {
        const x = margin + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
        doc.text(header, x, yPosition);
      });
      yPosition += 8;

      // Data rows
      tableData.forEach((row) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = margin;
        }
        
        row.forEach((cell, i) => {
          const x = margin + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
          doc.text(cell, x, yPosition);
        });
        yPosition += 6;
      });
    }
  } else {
    doc.text(`Calcul de ${getTypeLabel(data.type)}`, margin, yPosition);
    yPosition += 15;

    if (data.form && data.result) {
      // Parameters
      doc.setFontSize(12);
      doc.text('Paramètres:', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const params = [
        `Âge: ${data.form.age} ans`,
        `Sexe: ${data.form.gender === 'male' ? 'Homme' : 'Femme'}`,
        `Taux d'intérêt: ${data.form.interestRate}%`,
        `Montant annuel: €${data.form.annualAmount.toLocaleString()}`,
        `Table de mortalité: ${data.form.mortalityTable}`,
      ];

      params.forEach(param => {
        doc.text(param, margin, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // Results
      doc.setFontSize(12);
      doc.text('Résultats:', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const results = [
        `Valeur actuelle: €${data.result.presentValue.toLocaleString()}`,
        `Paiement mensuel: €${data.result.monthlyPayment.toLocaleString()}`,
        `Total des paiements: €${data.result.totalPayments.toLocaleString()}`,
        `Espérance de vie: ${data.result.lifeExpectancy} ans`,
      ];

      results.forEach(result => {
        doc.text(result, margin, yPosition);
        yPosition += 6;
      });
    }
  }

  // Footer
  const footerY = doc.internal.pageSize.height - 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, margin, footerY);
  doc.text('Actuary Rent - Calculs actuariels professionnels', pageWidth - margin - 80, footerY);

  // Save
  const filename = data.type === 'bulk_export' 
    ? `actuary-rent-historique-${new Date().toISOString().split('T')[0]}.pdf`
    : `actuary-rent-${data.type}-${new Date().toISOString().split('T')[0]}.pdf`;
  
  doc.save(filename);
}

export function exportToExcel(data: ExportData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Actuary Rent';
  workbook.created = new Date();

  if (data.type === 'bulk_export' && data.calculations) {
    const worksheet = workbook.addWorksheet('Historique des calculs');
    
    // Headers
    worksheet.columns = [
      { header: 'Type de rente', key: 'type', width: 25 },
      { header: 'Âge', key: 'age', width: 10 },
      { header: 'Sexe', key: 'gender', width: 10 },
      { header: 'Taux d\'intérêt (%)', key: 'interestRate', width: 15 },
      { header: 'Montant annuel (€)', key: 'annualAmount', width: 20 },
      { header: 'Valeur actuelle (€)', key: 'presentValue', width: 20 },
      { header: 'Paiement mensuel (€)', key: 'monthlyPayment', width: 20 },
      { header: 'Espérance de vie', key: 'lifeExpectancy', width: 15 },
      { header: 'Date de calcul', key: 'timestamp', width: 20 },
    ];

    // Data
    data.calculations.forEach(calc => {
      worksheet.addRow({
        type: getTypeLabel(calc.type),
        age: calc.data.age,
        gender: calc.data.gender === 'male' ? 'Homme' : 'Femme',
        interestRate: calc.data.interestRate,
        annualAmount: calc.data.annualAmount,
        presentValue: calc.result.presentValue,
        monthlyPayment: calc.result.monthlyPayment,
        lifeExpectancy: calc.result.lifeExpectancy,
        timestamp: new Date(calc.timestamp).toLocaleString('fr-FR'),
      });
    });

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
  } else if (data.form && data.result) {
    // Single calculation export
    const worksheet = workbook.addWorksheet('Calcul de rente');
    
    // Parameters section
    worksheet.addRow(['PARAMÈTRES']);
    worksheet.addRow(['Type de rente', getTypeLabel(data.type)]);
    worksheet.addRow(['Âge', data.form.age]);
    worksheet.addRow(['Sexe', data.form.gender === 'male' ? 'Homme' : 'Femme']);
    worksheet.addRow(['Taux d\'intérêt (%)', data.form.interestRate]);
    worksheet.addRow(['Montant annuel (€)', data.form.annualAmount]);
    worksheet.addRow(['Table de mortalité', data.form.mortalityTable]);
    worksheet.addRow([]);

    // Results section
    worksheet.addRow(['RÉSULTATS']);
    worksheet.addRow(['Valeur actuelle (€)', data.result.presentValue]);
    worksheet.addRow(['Paiement mensuel (€)', data.result.monthlyPayment]);
    worksheet.addRow(['Total des paiements (€)', data.result.totalPayments]);
    worksheet.addRow(['Espérance de vie (années)', data.result.lifeExpectancy]);
    worksheet.addRow([]);

    // Projections
    if (data.result.projections) {
      worksheet.addRow(['PROJECTIONS']);
      worksheet.addRow(['Année', 'Paiement (€)', 'Cumulé (€)', 'Probabilité']);
      
      data.result.projections.forEach((proj: any) => {
        worksheet.addRow([proj.year, proj.payment, proj.cumulativePayment, proj.probability]);
      });
    }

    // Styling
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A9').font = { bold: true, size: 14 };
    if (data.result.projections) {
      worksheet.getCell(`A${13 + (data.result.projections ? 1 : 0)}`).font = { bold: true, size: 14 };
    }
  }

  // Save
  const filename = data.type === 'bulk_export' 
    ? `actuary-rent-historique-${new Date().toISOString().split('T')[0]}.xlsx`
    : `actuary-rent-${data.type}-${new Date().toISOString().split('T')[0]}.xlsx`;

  workbook.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
  });
}

export function exportToJSON(data: ExportData) {
  const jsonData = {
    exportInfo: {
      application: 'Actuary Rent',
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      type: data.type,
    },
    data: data.type === 'bulk_export' ? data.calculations : { form: data.form, result: data.result },
  };

  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const filename = data.type === 'bulk_export' 
    ? `actuary-rent-historique-${new Date().toISOString().split('T')[0]}.json`
    : `actuary-rent-${data.type}-${new Date().toISOString().split('T')[0]}.json`;
  
  saveAs(blob, filename);
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    simple: 'Rente viagère simple',
    reversible: 'Rente viagère réversible',
    temporary: 'Rente temporaire',
    deferred: 'Rente différée',
    growing: 'Rente croissante',
  };
  return labels[type] || type;
}