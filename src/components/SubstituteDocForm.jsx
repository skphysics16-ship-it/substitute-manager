import { useState, useMemo } from 'react';
import { TEACHER_ORDER, SCHEDULE_DATA } from '../data/scheduleData';
import { GROUP_COLORS } from '../data/defaultGroups';
import { findSwapCandidates, findCoverCandidates, getTeacherGroup } from '../utils/substituteLogic';
import { generateSubstituteDoc } from '../utils/generateSubstituteDoc';

const DAY_CODES = ['', '월', '화', '수', '목', '금', ''];
const DAY_NUM = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5 };
const DAY_KR = ['일', '월', '화', '수', '목', '금', '토'];

function getTeacherName(key) {
  return key.replace(/\([^)]*\)$/, '').trim();
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getSwapDates(baseDate, slotDayCode) {
  const baseDay = baseDate.getDay();
  const targetDay = DAY_NUM[slotDayCode];
  const diff = targetDay - baseDay;
  const first = new Date(baseDate);
  first.setDate(baseDate.getDate() + diff);
  if (first < baseDate) first.setDate(first.getDate() + 7);
  const second = new Date(first);
  second.setDate(first.getDate() + 7);
  return [first, second];
}

function dateLabel(d) {
  return `${d.getMonth() + 1}/${d.getDate()}(${DAY_KR[d.getDay()]})`;
}

function slotToPeriod(slot) {
  return slot.replace(/[^\d]/g, '') + '교시';
}

function getNextItemIdx(rows) {
  if (rows.length === 0) return 1;
  const indices = rows.map(r => r.itemIdx).filter(n => typeof n === 'number');
  return indices.length > 0 ? Math.max(...indices) + 1 : 1;
}

let uid = Date.now();

export default function SubstituteDocForm({ groups = {} }) {
  const [teacherKey, setTeacherKey] = useState('');
  const [date, setDate] = useState(todayStr());
  const [reason, setReason] = useState('');
  const [expandedSlot, setExpandedSlot] = useState(null);
  const [tableRows, setTableRows] = useState([]);

  const absentName = teacherKey ? getTeacherName(teacherKey) : '';
  const baseDate = date ? new Date(date) : null;
  const dayCode = baseDate ? DAY_CODES[baseDate.getDay()] : '';

  const absentClasses = useMemo(() => {
    if (!teacherKey || !date || !dayCode) return [];
    const schedule = SCHEDULE_DATA[teacherKey] || {};
    return Object.entries(schedule)
      .filter(([slot]) => slot.startsWith(dayCode))
      .sort((a, b) => parseInt(a[0].slice(1)) - parseInt(b[0].slice(1)))
      .map(([slot, value]) => {
        const [cls, subj] = value.split('\n');
        const clsTrimmed = cls?.trim() || '';
        const subjTrimmed = subj?.trim() || '';
        const grade = parseInt(clsTrimmed[0] || '0');
        return {
          slot,
          cls: clsTrimmed,
          subj: subjTrimmed,
          grade,
          swapCandidates: grade === 1
            ? findSwapCandidates(teacherKey, slot, clsTrimmed, SCHEDULE_DATA)
            : [],
          coverResult: findCoverCandidates(teacherKey, slot, SCHEDULE_DATA, groups),
        };
      });
  }, [teacherKey, date, dayCode, groups]);

  const addSwap = (absentClass, swapCandidate, swapDate) => {
    const absentDate = new Date(date);
    setTableRows(prev => {
      const itemIdx = getNextItemIdx(prev);
      return [...prev,
        {
          id: ++uid, itemIdx,
          seq: String(itemIdx), type: '교체',
          month: String(absentDate.getMonth() + 1), day: String(absentDate.getDate()),
          cls: absentClass.cls, period: slotToPeriod(absentClass.slot),
          subject: absentClass.subj, teacher: absentName,
        },
        {
          id: ++uid, itemIdx,
          seq: '', type: '교체',
          month: String(swapDate.getMonth() + 1), day: String(swapDate.getDate()),
          cls: swapCandidate.swapCls, period: slotToPeriod(swapCandidate.swapSlot),
          subject: swapCandidate.swapSubj, teacher: getTeacherName(swapCandidate.swapTeacher),
        },
      ];
    });
  };

  const addCover = (absentClass, coverTeacherKey) => {
    const absentDate = new Date(date);
    setTableRows(prev => {
      const itemIdx = getNextItemIdx(prev);
      return [...prev, {
        id: ++uid, itemIdx,
        seq: String(itemIdx), type: '보강',
        month: String(absentDate.getMonth() + 1), day: String(absentDate.getDate()),
        cls: absentClass.cls, period: slotToPeriod(absentClass.slot),
        subject: absentClass.subj, teacher: absentName,
      }];
    });
  };

  const removeItem = (itemIdx) => {
    setTableRows(prev => prev.filter(r => r.itemIdx !== itemIdx));
  };

  const updateRow = (id, field, value) => {
    setTableRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleReset = () => {
    setTeacherKey('');
    setDate(todayStr());
    setReason('');
    setExpandedSlot(null);
    setTableRows([]);
  };

  const handleCopy = () => {
    const header = ['순', '구분', '월', '일', '학년반', '교시', '교과명', '교과담임'].join('\t');
    const body = tableRows.map(r =>
      [r.seq, r.type,
        r.month ? r.month + '월' : '',
        r.day ? r.day + '일' : '',
        r.cls, r.period, r.subject, r.teacher,
      ].join('\t')
    ).join('\n');
    navigator.clipboard.writeText(header + '\n' + body);
  };

  const handleDownload = async () => {
    const dateCompact = date ? date.replace(/-/g, '') : '';
    await generateSubstituteDoc({
      rows: tableRows,
      reason,
      teacherName: absentName,
      date,
      fileName: `결보강계획서(${absentName}${dateCompact})`,
    });
  };

  const canDownload = teacherKey && tableRows.length > 0;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 980, margin: '0 auto', fontFamily: 'inherit' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1a1d2e', letterSpacing: '-0.3px' }}>
        결보강 계획서 작성
      </h2>

      {/* Search controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>결강 교사</label>
          <select
            value={teacherKey}
            onChange={e => { setTeacherKey(e.target.value); setExpandedSlot(null); setTableRows([]); }}
            style={selectStyle}
          >
            <option value="">교사 선택</option>
            {TEACHER_ORDER.map(key => (
              <option key={key} value={key}>{getTeacherName(key)}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>결강 날짜</label>
          <input
            type="date"
            value={date}
            onChange={e => { setDate(e.target.value); setExpandedSlot(null); setTableRows([]); }}
            style={inputStyle}
          />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>결강 사유</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="예: 출장, 병가, 조퇴"
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Period cards */}
      {teacherKey && !dayCode && (
        <div style={{ color: '#999', fontSize: 14, marginBottom: 24 }}>
          선택한 날짜는 주말입니다. 평일 날짜를 선택해주세요.
        </div>
      )}
      {teacherKey && dayCode && absentClasses.length === 0 && (
        <div style={{ color: '#999', fontSize: 14, marginBottom: 24 }}>
          {absentName} 선생님의 {dayCode}요일 수업이 없습니다.
        </div>
      )}
      {teacherKey && dayCode && absentClasses.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 10, letterSpacing: '-0.2px' }}>
            {absentName} 선생님 {dayCode}요일 수업 ({absentClasses.length}교시)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {absentClasses.map(ac => (
              <PeriodCard
                key={ac.slot}
                absentClass={ac}
                baseDate={baseDate}
                isExpanded={expandedSlot === ac.slot}
                onToggle={() => setExpandedSlot(prev => prev === ac.slot ? null : ac.slot)}
                onAddSwap={(candidate, swapDate) => addSwap(ac, candidate, swapDate)}
                onAddCover={(tk) => addCover(ac, tk)}
                groups={groups}
              />
            ))}
          </div>
        </div>
      )}

      {/* Result table */}
      <div style={{ border: '1px solid #dde', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <colgroup>
            <col style={{ width: 40 }} />
            <col style={{ width: 68 }} />
            <col style={{ width: 48 }} />
            <col style={{ width: 48 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 68 }} />
            <col />
            <col style={{ width: 110 }} />
            <col style={{ width: 36 }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#1a1d2e', color: '#fff' }}>
              {['순', '구분', '월', '일', '학년반', '교시', '교과명', '교과담임', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center', fontSize: 13, borderRight: '1px solid rgba(255,255,255,0.15)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '28px', color: '#aaa', fontSize: 13 }}>
                  위에서 교시를 클릭하고 보강/교체를 선택하면 여기에 반영됩니다
                </td>
              </tr>
            ) : (
              tableRows.map((row, idx) => (
                <tr key={row.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={tdStyle}>
                    <input value={row.seq} onChange={e => updateRow(row.id, 'seq', e.target.value)} style={cellInputStyle} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600, fontSize: 12, color: row.type === '교체' ? '#1565c0' : '#2e7d32' }}>
                    {row.type}
                  </td>
                  <td style={tdStyle}>
                    <input value={row.month} onChange={e => updateRow(row.id, 'month', e.target.value)} style={cellInputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <input value={row.day} onChange={e => updateRow(row.id, 'day', e.target.value)} style={cellInputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <input value={row.cls} onChange={e => updateRow(row.id, 'cls', e.target.value)} style={cellInputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <input value={row.period} onChange={e => updateRow(row.id, 'period', e.target.value)} style={cellInputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <input value={row.subject} onChange={e => updateRow(row.id, 'subject', e.target.value)} style={cellInputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <input value={row.teacher} onChange={e => updateRow(row.id, 'teacher', e.target.value)} style={cellInputStyle} />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', padding: '4px' }}>
                    <button
                      onClick={() => removeItem(row.itemIdx)}
                      title="항목 삭제"
                      style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
                    >×</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handleCopy}
          disabled={tableRows.length === 0}
          style={{
            padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: tableRows.length > 0 ? 'pointer' : 'default',
            background: tableRows.length > 0 ? '#e3f2fd' : '#f0f0f0',
            color: tableRows.length > 0 ? '#1565c0' : '#999',
            border: `1px solid ${tableRows.length > 0 ? '#90caf9' : '#ddd'}`,
          }}
        >
          표 복사
        </button>
        <button
          onClick={handleDownload}
          disabled={!canDownload}
          style={{
            padding: '8px 22px', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 700,
            background: canDownload ? '#1a1d2e' : '#bbb',
            color: '#fff',
            cursor: canDownload ? 'pointer' : 'default',
          }}
        >
          워드로 저장
        </button>
        <button
          onClick={handleReset}
          style={{ padding: '8px 14px', borderRadius: 6, fontSize: 14, cursor: 'pointer', background: 'transparent', color: '#888', border: '1px solid #ddd', fontWeight: 500 }}
        >
          초기화
        </button>
        {date && teacherKey && (
          <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>
            저장 파일명: 결보강계획서({absentName}{date.replace(/-/g, '')}).docx
          </span>
        )}
      </div>
    </div>
  );
}

function PeriodCard({ absentClass, baseDate, isExpanded, onToggle, onAddSwap, onAddCover, groups }) {
  const { slot, cls, subj, grade, swapCandidates, coverResult } = absentClass;
  const { sameGroup, otherGroups } = coverResult;
  const allCoverCount = sameGroup.length + Object.values(otherGroups).reduce((s, a) => s + a.length, 0);

  return (
    <div style={{ border: '1px solid #dde', borderRadius: 8, overflow: 'hidden' }}>
      {/* Card header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: isExpanded ? '#1a1d2e' : '#f8f9fd',
          color: isExpanded ? '#fff' : '#1a1d2e',
          cursor: 'pointer', userSelect: 'none',
          transition: 'background 0.15s',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, minWidth: 48 }}>{slotToPeriod(slot)}</span>
        <span style={{
          background: isExpanded ? 'rgba(255,255,255,0.18)' : '#e8ecf8',
          borderRadius: 4, padding: '2px 8px', fontSize: 13, fontWeight: 600,
          color: isExpanded ? '#fff' : '#3a4a8a',
        }}>{cls}</span>
        <span style={{ fontSize: 14, flex: 1 }}>{subj}</span>
        <span style={{ fontSize: 12, opacity: 0.65 }}>
          {grade === 1 && swapCandidates.length > 0 ? `교체 ${swapCandidates.length}건 · ` : ''}보강 {allCoverCount}명
        </span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>{isExpanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #eee' }}>

          {/* Swap candidates — 1학년 only */}
          {grade === 1 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#1565c0', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                교체 가능 ({swapCandidates.length}건)
              </div>
              {swapCandidates.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: 13 }}>교체 가능한 수업이 없습니다.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {swapCandidates.map((c, i) => {
                    const swapDayCode = c.swapSlot.replace(/\d+$/, '');
                    const [first, second] = getSwapDates(baseDate, swapDayCode);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0f4ff', borderRadius: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, minWidth: 60 }}>{getTeacherName(c.swapTeacher)}</span>
                        <span style={{ fontSize: 12, color: '#555', flex: 1 }}>
                          {slotToPeriod(c.swapSlot)} · {c.swapCls} · {c.swapSubj}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => onAddSwap(c, first)} style={swapDateBtnStyle}>
                            이번주 {dateLabel(first)}
                          </button>
                          <button onClick={() => onAddSwap(c, second)} style={swapDateBtnStyle}>
                            다음주 {dateLabel(second)}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Cover candidates */}
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: '#2e7d32', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              보강 가능 ({allCoverCount}명)
            </div>
            {allCoverCount === 0 ? (
              <div style={{ color: '#aaa', fontSize: 13 }}>공강 교사가 없습니다.</div>
            ) : (
              <div>
                {sameGroup.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#555', fontWeight: 600, marginRight: 8 }}>동교과</span>
                    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 5 }}>
                      {sameGroup.map(t => {
                        const group = getTeacherGroup(t, groups);
                        const color = GROUP_COLORS[group] || '#4caf50';
                        return (
                          <button key={t} onClick={() => onAddCover(t)} style={{ ...coverBtnStyle, borderColor: color, color, background: color + '14' }}>
                            {getTeacherName(t)}
                          </button>
                        );
                      })}
                    </span>
                  </div>
                )}
                {Object.entries(otherGroups).map(([group, teachers]) => (
                  <div key={group} style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: GROUP_COLORS[group] || '#888', fontWeight: 600, marginRight: 8 }}>{group}</span>
                    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 5 }}>
                      {teachers.map(t => (
                        <button key={t} onClick={() => onAddCover(t)} style={coverBtnStyle}>
                          {getTeacherName(t)}
                        </button>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#555' };
const selectStyle = { padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, minWidth: 160, background: '#fff' };
const inputStyle = { padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14 };
const tdStyle = { padding: '3px 5px', borderBottom: '1px solid #eee', borderRight: '1px solid #eee' };
const cellInputStyle = { width: '100%', border: '1px solid #e0e0e0', borderRadius: 3, padding: '4px 5px', fontSize: 13, boxSizing: 'border-box', background: 'transparent' };
const swapDateBtnStyle = { padding: '4px 10px', borderRadius: 4, border: '1px solid #90caf9', background: '#e3f2fd', color: '#1565c0', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' };
const coverBtnStyle = { padding: '3px 10px', borderRadius: 14, border: '1px solid #ccc', background: '#f5f5f5', color: '#555', cursor: 'pointer', fontSize: 13 };
