import { useState, useEffect } from 'react';
import * as xlsx from 'xlsx';

function getGradeBg(className) {
  if (typeof className !== 'string') return '#ffffff';
  if (className.startsWith('1-')) return '#e8f5e8';
  if (className.startsWith('2-')) return '#e8f0fe';
  if (className.startsWith('3-')) return '#fef9e7';
  return '#ffffff';
}

export default function ClassTimetable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExcel = async () => {
      try {
        const response = await fetch('/class_timetable.xlsx');
        if (!response.ok) throw new Error('Excel 파일을 찾을 수 없습니다.');
        const arrayBuffer = await response.arrayBuffer();
        
        const workbook = xlsx.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        
        const daysRow = jsonData[1];
        const periodsRow = jsonData[2];
        const classRows = jsonData.slice(3).filter(row => row && row.length > 0 && row[0] && row[0] !== '\r\r\n');
        
        setData({ daysRow, periodsRow, classRows });
      } catch (err) {
        console.error(err);
        setError('시간표 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchExcel();
  }, []);

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>시간표 로딩 중...</div>;
  }

  if (error) {
    return <div style={{ padding: 20, textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  if (!data) return null;

  const { daysRow, periodsRow, classRows } = data;

  const getColSpanForDay = (dayIndex) => {
    if (dayIndex === 1) return 7;
    if (dayIndex === 8) return 7;
    if (dayIndex === 15) return 6;
    if (dayIndex === 21) return 7;
    if (dayIndex === 28) return 7;
    return 1;
  };

  const dayIndices = [1, 8, 15, 21, 28];
  
  return (
    <div style={{ padding: '0', width: '100%', height: '100%', overflow: 'auto', background: '#fff' }}>
      <div style={{ display: 'flex', gap: 16, padding: '8px 16px', fontSize: 13, alignItems: 'center', borderBottom: '1px solid #e0e0e0', position: 'sticky', top: 0, left: 0, background: '#fff', zIndex: 20 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 14, height: 14, background: '#e8f5e8', border: '1px solid #ccc', display: 'inline-block' }} />
          1학년
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 14, height: 14, background: '#e8f0fe', border: '1px solid #ccc', display: 'inline-block' }} />
          2학년
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 14, height: 14, background: '#fef9e7', border: '1px solid #ccc', display: 'inline-block' }} />
          3학년
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 14, height: 14, background: '#fff', border: '1px solid #ccc', display: 'inline-block' }} />
          일반
        </span>
      </div>
      
      <div style={{ minWidth: 'max-content' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ ...stickyHeaderCell, left: 0, zIndex: 10, minWidth: 40, top: 35 }}>학급</th>
              {dayIndices.map((idx, i) => (
                <th key={`day-${i}`} colSpan={getColSpanForDay(idx)} style={{ ...headerCell, top: 35 }}>
                  {daysRow[idx]}
                </th>
              ))}
            </tr>
            <tr>
              <th style={{ ...stickyHeaderCell, left: 0, zIndex: 10, top: 62 }}>교시</th>
              {periodsRow.slice(1).map((period, i) => (
                <th key={`period-${i}`} style={{ ...headerCell, top: 62, minWidth: 50, fontWeight: 400, background: '#f8f9fa' }}>
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classRows.map((row, rowIndex) => {
              const className = String(row[0]);
              const rowBg = getGradeBg(className);
              
              return (
                <tr key={`class-${rowIndex}`}>
                  <td style={{ ...stickyCell, left: 0, fontWeight: 700, background: '#f0f0f0', zIndex: 5 }}>
                    {className}
                  </td>
                  {periodsRow.slice(1).map((_, i) => {
                    const cellData = row[i + 1] || '';
                    const parts = String(cellData).split(/\r\r\n|\r\n|\n/g).filter(Boolean);
                    
                    return (
                      <td key={`cell-${rowIndex}-${i}`} style={{ ...cellStyle, background: rowBg }}>
                        {parts.length > 0 ? (
                          <>
                            <div style={{ fontWeight: 600 }}>{parts[0]}</div>
                            {parts[1] && <div style={{ color: '#555' }}>{parts[1]}</div>}
                          </>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const headerCell = {
  padding: '6px 5px',
  textAlign: 'center',
  border: '1px solid #ddd',
  background: '#e9ecef',
  position: 'sticky',
  whiteSpace: 'nowrap',
  zIndex: 1,
};

const stickyHeaderCell = {
  ...headerCell,
  position: 'sticky',
  background: '#e9ecef',
};

const cellStyle = {
  border: '1px solid #e0e0e0',
  padding: '3px 5px',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  minWidth: 50,
  height: 38,
};

const stickyCell = {
  border: '1px solid #ddd',
  padding: '4px 5px',
  textAlign: 'center',
  position: 'sticky',
  whiteSpace: 'nowrap',
};
