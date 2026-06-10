import { useState, useEffect } from 'react';
import { TEACHER_ORDER, SCHEDULE_DATA } from '../data/scheduleData';
import { generateSubstituteDoc } from '../utils/generateSubstituteDoc';

const DAY_CODES = ['', '월', '화', '수', '목', '금', ''];

function getTeacherName(key) {
  return key.replace(/\([^)]*\)$/, '').trim();
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SubstituteDocForm() {
  const [teacherKey, setTeacherKey] = useState('');
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!teacherKey || !date) return;
    const d = new Date(date);
    const dayCode = DAY_CODES[d.getDay()];
    if (!dayCode) { setRows([]); return; }

    const schedule = SCHEDULE_DATA[teacherKey] || {};
    const daySlots = Object.entries(schedule)
      .filter(([slot]) => slot.startsWith(dayCode))
      .sort((a, b) => parseInt(a[0].slice(1)) - parseInt(b[0].slice(1)));

    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const name = getTeacherName(teacherKey);

    setRows(daySlots.map(([slot, value], i) => {
      const [cls, subj] = value.split('\n');
      return {
        id: `auto-${slot}`,
        seq: i + 1,
        type: '보강',
        month: String(mm),
        day: String(dd),
        cls: cls?.trim() || '',
        period: slot.replace(/[^\d]/g, '') + '교시',
        subject: subj?.trim() || '',
        teacher: name,
      };
    }));
  }, [teacherKey, date]);

  const addRow = () => {
    const d = date ? new Date(date) : new Date();
    setRows(prev => [...prev, {
      id: Date.now(),
      seq: '',
      type: '교체',
      month: String(d.getMonth() + 1),
      day: String(d.getDate()),
      cls: '',
      period: '',
      subject: '',
      teacher: '',
    }]);
  };

  const removeRow = (id) => setRows(prev => prev.filter(r => r.id !== id));

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleDownload = async () => {
    const name = getTeacherName(teacherKey);
    const dateCompact = date ? date.replace(/-/g, '') : '';
    await generateSubstituteDoc({
      rows,
      reason,
      teacherName: name,
      date,
      fileName: `결보강계획서(${name}${dateCompact})`,
    });
  };

  const canDownload = teacherKey && rows.length > 0;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto', fontFamily: 'inherit' }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1a1d2e', letterSpacing: '-0.3px' }}>
        결보강 계획서 작성
      </h2>

      {/* Form controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>결강 교사</label>
          <select
            value={teacherKey}
            onChange={e => setTeacherKey(e.target.value)}
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
            onChange={e => setDate(e.target.value)}
            style={inputFieldStyle}
          />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>결강 사유</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="예: 출장, 병가, 조퇴"
            style={{ ...inputFieldStyle, width: '100%', boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Rows table */}
      <div style={{ border: '1px solid #dde', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <colgroup>
            <col style={{ width: 44 }} />
            <col style={{ width: 72 }} />
            <col style={{ width: 52 }} />
            <col style={{ width: 52 }} />
            <col style={{ width: 76 }} />
            <col style={{ width: 72 }} />
            <col />
            <col style={{ width: 110 }} />
            <col style={{ width: 36 }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#1a1d2e', color: '#fff' }}>
              {['순', '구분', '월', '일', '학년반', '교시', '교과명', '교과 담임', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'center', fontSize: 13, borderRight: '1px solid rgba(255,255,255,0.15)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '28px', color: '#aaa', fontSize: 13 }}>
                  교사와 날짜를 선택하면 해당 교시가 자동으로 채워집니다
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={row.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={tdStyle}>
                    <input value={row.seq} onChange={e => updateRow(row.id, 'seq', e.target.value)} style={cellInputStyle} />
                  </td>
                  <td style={tdStyle}>
                    <select value={row.type} onChange={e => updateRow(row.id, 'type', e.target.value)} style={{ ...cellInputStyle, padding: '3px 4px' }}>
                      <option value="보강">보강</option>
                      <option value="교체">교체</option>
                    </select>
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
                      onClick={() => removeRow(row.id)}
                      style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
                    >×</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={addRow} style={addBtnStyle}>+ 행 추가</button>
        <button
          onClick={handleDownload}
          disabled={!canDownload}
          style={{
            ...downloadBtnStyle,
            background: canDownload ? '#1a1d2e' : '#bbb',
            cursor: canDownload ? 'pointer' : 'default',
          }}
        >
          워드로 저장
        </button>
        {date && teacherKey && (
          <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>
            저장 파일명: 결보강계획서({getTeacherName(teacherKey)}{date.replace(/-/g, '')}).docx
          </span>
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 5, color: '#555' };
const selectStyle = { padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, minWidth: 160, background: '#fff' };
const inputFieldStyle = { padding: '8px 10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14 };
const tdStyle = { padding: '3px 5px', borderBottom: '1px solid #eee', borderRight: '1px solid #eee' };
const cellInputStyle = { width: '100%', border: '1px solid #e0e0e0', borderRadius: 3, padding: '4px 5px', fontSize: 13, boxSizing: 'border-box', background: 'transparent' };
const addBtnStyle = { padding: '8px 16px', background: '#f0f4ff', border: '1px solid #b0bef5', borderRadius: 6, cursor: 'pointer', fontSize: 14, color: '#1a1d2e', fontWeight: 600 };
const downloadBtnStyle = { padding: '8px 22px', border: 'none', borderRadius: 6, fontSize: 14, color: '#fff', fontWeight: 700 };
