import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle, VerticalAlign,
  TableAnchorType, RelativeVerticalPosition, RelativeHorizontalPosition,
  OverlapType,
} from 'docx';

const BORDER = { style: BorderStyle.SINGLE, size: 3, color: '000000' };
const ALL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};
const DIAGONAL_BORDER = { ...ALL_BORDERS, tl2br: BORDER };

function cell(text, { bold = false, size = 22, align = AlignmentType.CENTER, w, rowSpan, colSpan, borders = ALL_BORDERS, vAlign = VerticalAlign.CENTER } = {}) {
  const props = {
    borders,
    verticalAlign: vAlign,
    children: [new Paragraph({
      alignment: align,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text, bold, size, font: { name: '굴림' } })],
    })],
  };
  if (w !== undefined) props.width = { size: w, type: WidthType.DXA };
  if (rowSpan !== undefined) props.rowSpan = rowSpan;
  if (colSpan !== undefined) props.columnSpan = colSpan;
  return new TableCell(props);
}

function spacedName(name) {
  return name.split('').join(' ');
}

// Approval stamp table — floats at top-right, below the title
function makeApprovalTable() {
  return new Table({
    float: {
      horizontalAnchor: TableAnchorType.PAGE,
      verticalAnchor: RelativeVerticalPosition.TEXT,
      absoluteHorizontalPosition: 5561,
      absoluteVerticalPosition: 700,
      overlap: OverlapType.NEVER,
    },
    width: { size: 4542, type: WidthType.DXA },
    rows: [
      new TableRow({
        height: { value: 400, rule: 'atLeast' },
        children: [
          cell('계', { w: 1099 }),
          cell('부장', { w: 1099 }),
          cell('교감', { w: 1172 }),
          cell('교장', { w: 1172 }),
        ],
      }),
      new TableRow({
        height: { value: 700, rule: 'atLeast' },
        children: [
          cell('', { w: 1099 }),
          cell('', { w: 1099 }),
          cell('전결', { w: 1172, size: 20 }),
          cell('', { w: 1172, borders: DIAGONAL_BORDER }),
        ],
      }),
    ],
  });
}

// Main data table
function makeDataTable(rows) {
  const COL_WIDTHS = [700, 900, 1200, 1000, 900, 2000, 1800];
  const headerLabels = ['순', '구분', '날짜', '학년 반', '차시', '교과명', '교과 담임'];

  const headerRow = new TableRow({
    height: { value: 500, rule: 'atLeast' },
    children: headerLabels.map((label, i) =>
      cell(label, { bold: true, size: 20, w: COL_WIDTHS[i] })
    ),
  });

  const dataRows = rows.map(row =>
    new TableRow({
      height: { value: 450, rule: 'atLeast' },
      children: [
        cell(String(row.seq ?? ''), { w: COL_WIDTHS[0] }),
        cell(row.type ?? '', { w: COL_WIDTHS[1] }),
        cell(row.dateStr ?? '', { w: COL_WIDTHS[2] }),
        cell(row.cls ?? '', { w: COL_WIDTHS[3] }),
        cell(row.period ?? '', { w: COL_WIDTHS[4] }),
        cell(row.subject ?? '', { w: COL_WIDTHS[5], align: AlignmentType.LEFT }),
        cell(row.teacher ?? '', { w: COL_WIDTHS[6] }),
      ],
    })
  );

  const padCount = Math.max(0, 5 - rows.length);
  const padRows = Array.from({ length: padCount }).map(() =>
    new TableRow({
      height: { value: 450, rule: 'atLeast' },
      children: COL_WIDTHS.map(w => cell('', { w })),
    })
  );

  return new Table({
    width: { size: 8500, type: WidthType.DXA },
    rows: [headerRow, ...dataRows, ...padRows],
  });
}

export async function generateSubstituteDoc({ rows, reason, teacherName, date, fileName }) {
  let yearStr = '', monthStr = '', dayStr = '';
  if (date) {
    const d = new Date(date);
    yearStr = d.getFullYear();
    monthStr = d.getMonth() + 1;
    dayStr = d.getDate();
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1080, bottom: 1080, left: 1440, right: 1080 },
        },
      },
      children: [
        // Title at the top
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 400 },
          children: [new TextRun({
            text: '보강  수업 계획서',
            size: 32,
            bold: true,
            font: { name: '굴림' },
          })],
        }),

        // Approval table floats to top-right (below title)
        makeApprovalTable(),

        makeDataTable(rows),

        // Reason
        new Paragraph({
          spacing: { before: 300, after: 200 },
          children: [new TextRun({
            text: `* 결강 사유 : ${reason || ''}`,
            size: 22,
            font: { name: '굴림' },
          })],
        }),

        // Date
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 400, after: 0 },
          children: [new TextRun({
            text: `${yearStr}년  ${monthStr}월  ${dayStr}일`,
            size: 22,
            font: { name: '굴림' },
          })],
        }),

        // Signature
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 200, after: 0 },
          children: [new TextRun({
            text: `교사 :  ${spacedName(teacherName)}  (인)`,
            size: 22,
            font: { name: '굴림' },
          })],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
