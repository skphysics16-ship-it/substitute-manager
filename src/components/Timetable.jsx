import { TEACHER_ORDER, SCHEDULE_DATA } from '../data/scheduleData';
import { GROUP_COLORS } from '../data/defaultGroups';
import { parseCell, getGrade, getTeacherGroup } from '../utils/substituteLogic';

const DAYS = ['월', '화', '수', '목', '금'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

function getCellBg(cellValue) {
  if (!cellValue) return '#ffffff';
  const parsed = parseCell(cellValue);
  if (!parsed) return '#ffffff';
  const grade = getGrade(parsed.cls);
  if (grade === 1) return '#e8f5e8';
  if (grade === 2) return '#e8f0fe';
  if (grade === 3) return '#fef9e7';
  return '#ffffff';
}

export default function Timetable({ groups, selectedCell, highlightedCandidate, onCellClick }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 16, padding: '8px 16px', fontSize: 13, alignItems: 'center', borderBottom: '1px solid #e0e0e0' }}>
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
          공강
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', minWidth: 'max-content', fontSize: 12 }}>
          <thead>
            <tr>
              <th style={stickyHeaderCell({ left: 0, minWidth: 36, zIndex: 3 })}>요일</th>
              <th style={stickyHeaderCell({ left: 36, minWidth: 32, zIndex: 3 })}>교시</th>
              {TEACHER_ORDER.map(teacher => {
                const group = getTeacherGroup(teacher, groups);
                const color = GROUP_COLORS[group] || '#7f8c8d';
                return (
                  <th key={teacher} style={{
                    ...headerCell,
                    borderTop: `3px solid ${color}`,
                    position: 'sticky',
                    top: 0,
                    background: '#f8f9fa',
                    zIndex: 1,
                  }}>
                    <div style={{ fontWeight: 600 }}>{teacher}</div>
                    <div style={{ color, fontSize: 10, fontWeight: 400 }}>{group}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, di) =>
              PERIODS.map((period, pi) => {
                const slot = `${day}${period}`;
                const isBlankSlot =
                  (day === '월' && period === 1) ||
                  (day === '화' && period === 5) ||
                  (day === '목' && period === 4);
                const isFirstPeriodOfDay = pi === 0;

                return (
                  <tr key={slot} style={isFirstPeriodOfDay && di > 0 ? { borderTop: '2px solid #555' } : {}}>
                    {pi === 0 && (
                      <td rowSpan={7} style={{
                        ...stickyCell,
                        left: 0,
                        fontWeight: 700,
                        textAlign: 'center',
                        background: '#f0f0f0',
                        borderRight: '1px solid #ccc',
                        zIndex: 2,
                        minWidth: 36,
                      }}>
                        {day}
                      </td>
                    )}
                    <td style={{
                      ...stickyCell,
                      left: 36,
                      textAlign: 'center',
                      background: isBlankSlot ? '#f5f5f5' : '#f0f0f0',
                      borderRight: '1px solid #ccc',
                      zIndex: 2,
                      minWidth: 32,
                      color: isBlankSlot ? '#bbb' : undefined,
                    }}>
                      {period}
                    </td>
                    {TEACHER_ORDER.map(teacher => {
                      const cellValue = SCHEDULE_DATA[teacher]?.[slot];
                      const parsed = parseCell(cellValue);
                      const isSelected = selectedCell?.teacher === teacher && selectedCell?.slot === slot;
                      const canClick = !!cellValue && !isBlankSlot;

                      const isSwapHighlight =
                        highlightedCandidate?.type === 'swap' &&
                        highlightedCandidate?.swapTeacher === teacher &&
                        highlightedCandidate?.swapSlot === slot;

                      const isCoverHighlight =
                        highlightedCandidate?.type === 'cover' &&
                        highlightedCandidate?.coverTeacher === teacher &&
                        selectedCell?.slot === slot;

                      let cellBg;
                      if (isBlankSlot) cellBg = '#f5f5f5';
                      else if (isSelected) cellBg = '#ffe082';
                      else if (isSwapHighlight) cellBg = '#81d4fa';
                      else if (isCoverHighlight) cellBg = '#a5d6a7';
                      else cellBg = getCellBg(cellValue);

                      return (
                        <td
                          key={teacher}
                          onClick={canClick ? () => onCellClick(teacher, slot) : undefined}
                          style={{
                            background: cellBg,
                            border: '1px solid #e0e0e0',
                            padding: '3px 5px',
                            textAlign: 'center',
                            cursor: canClick ? 'pointer' : 'default',
                            minWidth: 60,
                            whiteSpace: 'nowrap',
                            transition: 'background 0.1s',
                          }}
                        >
                          {!isBlankSlot && parsed && (
                            <>
                              <div style={{ fontWeight: 600 }}>{parsed.cls}</div>
                              <div style={{ color: '#555' }}>{parsed.subj}</div>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
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
  background: '#f8f9fa',
  top: 0,
  whiteSpace: 'nowrap',
};

const stickyCell = {
  position: 'sticky',
  padding: '4px 5px',
  border: '1px solid #ddd',
};

function stickyHeaderCell({ left, minWidth, zIndex }) {
  return {
    ...headerCell,
    position: 'sticky',
    left,
    top: 0,
    minWidth,
    zIndex,
    background: '#e9ecef',
  };
}
