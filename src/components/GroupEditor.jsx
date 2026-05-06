import { useState } from 'react';
import { DEFAULT_GROUPS, GROUP_COLORS } from '../data/defaultGroups';
import { TEACHER_ORDER } from '../data/scheduleData';

export default function GroupEditor({ groups, onSave, onClose }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(groups)));
  const [editingName, setEditingName] = useState(null);
  const [nameInput, setNameInput] = useState('');

  const allAssigned = new Set(Object.values(draft).flat());
  const unassigned = TEACHER_ORDER.filter(t => !allAssigned.has(t));

  function removeTeacher(group, teacher) {
    setDraft(prev => ({
      ...prev,
      [group]: prev[group].filter(t => t !== teacher),
    }));
  }

  function addTeacher(group, teacher) {
    setDraft(prev => ({
      ...prev,
      [group]: [...(prev[group] || []), teacher],
    }));
  }

  function renameGroup(oldName, newName) {
    if (!newName.trim() || newName === oldName) { setEditingName(null); return; }
    setDraft(prev => {
      const next = {};
      for (const [k, v] of Object.entries(prev)) {
        next[k === oldName ? newName : k] = v;
      }
      return next;
    });
    setEditingName(null);
  }

  function addGroup() {
    const name = `새 계열 ${Date.now()}`;
    setDraft(prev => ({ ...prev, [name]: [] }));
    setEditingName(name);
    setNameInput(name);
  }

  function deleteGroup(group) {
    setDraft(prev => {
      const next = { ...prev };
      delete next[group];
      return next;
    });
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 10, width: '95%', maxWidth: 720, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
      >
        <div style={{ background: '#1a1d2e', color: '#fff', padding: '14px 20px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 16 }}>교과 계열 편집</strong>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: 20 }}>
          {Object.entries(draft).map(([group, members]) => {
            const color = GROUP_COLORS[group] || '#7f8c8d';
            const assignedSet = new Set(Object.values(draft).flat());
            const available = TEACHER_ORDER.filter(t => !assignedSet.has(t));

            return (
              <div key={group} style={{ border: `1px solid ${color}40`, borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ background: color + '20', borderBottom: `2px solid ${color}`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {editingName === group ? (
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      onBlur={() => renameGroup(group, nameInput)}
                      onKeyDown={e => { if (e.key === 'Enter') renameGroup(group, nameInput); if (e.key === 'Escape') setEditingName(null); }}
                      style={{ fontWeight: 700, fontSize: 14, color, border: `1px solid ${color}`, borderRadius: 4, padding: '2px 6px', width: 120 }}
                    />
                  ) : (
                    <span
                      onClick={() => { setEditingName(group); setNameInput(group); }}
                      title="클릭하여 이름 변경"
                      style={{ fontWeight: 700, color, cursor: 'pointer', fontSize: 14 }}
                    >
                      {group}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#888' }}>({members.length}명)</span>
                  <button
                    onClick={() => deleteGroup(group)}
                    style={{ marginLeft: 'auto', fontSize: 11, color: '#c0392b', background: 'none', border: '1px solid #c0392b', borderRadius: 4, cursor: 'pointer', padding: '1px 6px' }}
                  >
                    계열 삭제
                  </button>
                </div>
                <div style={{ padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {members.map(t => (
                    <span key={t} style={{ border: `1px solid ${color}`, borderRadius: 20, padding: '3px 8px', fontSize: 12, color, background: color + '15', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {t}
                      <button onClick={() => removeTeacher(group, t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                  {available.length > 0 && (
                    <select
                      value=""
                      onChange={e => { if (e.target.value) addTeacher(group, e.target.value); }}
                      style={{ fontSize: 12, border: '1px dashed #aaa', borderRadius: 4, padding: '2px 4px', cursor: 'pointer', color: '#555' }}
                    >
                      <option value="">+ 추가</option>
                      {available.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  )}
                </div>
              </div>
            );
          })}

          {unassigned.length > 0 && (
            <div style={{ border: '1px dashed #ccc', borderRadius: 8, marginBottom: 12, padding: '10px 12px' }}>
              <div style={{ fontWeight: 700, color: '#888', marginBottom: 6, fontSize: 13 }}>미분류 ({unassigned.length}명)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {unassigned.map(t => (
                  <span key={t} style={{ border: '1px solid #bbb', borderRadius: 20, padding: '3px 8px', fontSize: 12, color: '#666' }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <button onClick={addGroup} style={btnStyle('#1a5276')}>+ 계열 추가</button>
            <button onClick={() => setDraft(JSON.parse(JSON.stringify(DEFAULT_GROUPS)))} style={btnStyle('#7f8c8d')}>기본값으로 초기화</button>
            <button onClick={() => { onSave(draft); onClose(); }} style={{ ...btnStyle('#1e8449'), marginLeft: 'auto' }}>저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
  };
}
