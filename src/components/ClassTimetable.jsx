import { useState, useEffect } from 'react';
import * as xlsx from 'xlsx';

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
        
        // 데이터 전처리
        // jsonData[1]은 요일 (월, 화, 수, 목, 금)
        // jsonData[2]은 교시 (1~7 등)
        // jsonData[3]부터는 학급별 데이터
        
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
    if (dayIndex === 1) return 7; // 월 (1~7)
    if (dayIndex === 8) return 7; // 화 (1~7)
    if (dayIndex === 15) return 6; // 수 (1~6)
    if (dayIndex === 21) return 7; // 목 (1~7)
    if (dayIndex === 28) return 7; // 금 (1~7)
    return 1;
  };

  const dayIndices = [1, 8, 15, 21, 28];
  
  return (
    <div style={{ padding: '20px', width: '100%', height: '100%', overflow: 'auto', background: '#fff' }}>
      <div style={{ minWidth: 'max-content' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '13px', textAlign: 'center' }}>
          <thead>
            {/* 요일 행 */}
            <tr>
              <th style={{ ...headerStyle, width: '60px', position: 'sticky', left: 0, zIndex: 10 }}>학급</th>
              {dayIndices.map((idx, i) => (
                <th key={`day-${i}`} colSpan={getColSpanForDay(idx)} style={{ ...headerStyle }}>
                  {daysRow[idx]}
                </th>
              ))}
            </tr>
            {/* 교시 행 */}
            <tr>
              <th style={{ ...headerStyle, position: 'sticky', left: 0, zIndex: 10 }}>교시</th>
              {periodsRow.slice(1).map((period, i) => (
                <th key={`period-${i}`} style={{ ...headerStyle, width: '45px', fontWeight: 'normal', background: '#f8f9fa' }}>
                  {period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classRows.map((row, rowIndex) => (
              <tr key={`class-${rowIndex}`}>
                <th style={{ ...cellStyle, fontWeight: 'bold', position: 'sticky', left: 0, background: '#fff', zIndex: 5 }}>
                  {row[0]}
                </th>
                {periodsRow.slice(1).map((_, i) => {
                  const cellData = row[i + 1] || '';
                  const lines = String(cellData).replace(/\r\r\n|\r\n|\n/g, '<br/>');
                  return (
                    <td key={`cell-${rowIndex}-${i}`} style={{ ...cellStyle }}>
                      <div dangerouslySetInnerHTML={{ __html: lines }} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const headerStyle = {
  border: '1px solid #dee2e6',
  padding: '8px 4px',
  background: '#e9ecef',
  fontWeight: 'bold',
  color: '#495057'
};

const cellStyle = {
  border: '1px solid #dee2e6',
  padding: '6px 4px',
  color: '#212529',
  verticalAlign: 'middle',
  height: '45px'
};
