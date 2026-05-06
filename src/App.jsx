import { useState, useEffect } from 'react';
import { DEFAULT_GROUPS } from './data/defaultGroups';
import Timetable from './components/Timetable';
import SubstitutePanel from './components/SubstitutePanel';
import GroupEditor from './components/GroupEditor';

const STORAGE_KEY = 'substitute_groups';

export default function App() {
  const [groups, setGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_GROUPS;
    } catch {
      return DEFAULT_GROUPS;
    }
  });
  const [selectedCell, setSelectedCell] = useState(null);
  const [highlightedCandidate, setHighlightedCandidate] = useState(null);
  const [showGroupEditor, setShowGroupEditor] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  const handleCellClick = (teacher, slot) => {
    if (selectedCell?.teacher === teacher && selectedCell?.slot === slot) {
      setSelectedCell(null);
      setHighlightedCandidate(null);
    } else {
      setSelectedCell({ teacher, slot });
      setHighlightedCandidate(null);
    }
  };

  const handlePanelClose = () => {
    setSelectedCell(null);
    setHighlightedCandidate(null);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f6fa' }}>
      <header style={{
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#1a1d2e',
        color: '#fff',
        padding: '0 20px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
          2026-1학기 자동 보강 시스템
        </span>
        <button
          onClick={() => setShowGroupEditor(true)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            borderRadius: 6,
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          교과 계열 편집
        </button>
      </header>

      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          <Timetable
            groups={groups}
            selectedCell={selectedCell}
            highlightedCandidate={highlightedCandidate}
            onCellClick={handleCellClick}
          />
        </div>

        {selectedCell && (
          <SubstitutePanel
            teacher={selectedCell.teacher}
            slot={selectedCell.slot}
            groups={groups}
            highlightedCandidate={highlightedCandidate}
            onSelectCandidate={setHighlightedCandidate}
            onClose={handlePanelClose}
          />
        )}
      </main>

      {showGroupEditor && (
        <GroupEditor
          groups={groups}
          onSave={setGroups}
          onClose={() => setShowGroupEditor(false)}
        />
      )}
    </div>
  );
}
