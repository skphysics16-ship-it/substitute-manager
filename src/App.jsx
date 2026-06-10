import { useState, useEffect } from 'react';
import { DEFAULT_GROUPS } from './data/defaultGroups';
import Timetable from './components/Timetable';
import SubstitutePanel from './components/SubstitutePanel';
import GroupEditor from './components/GroupEditor';
import ClassTimetable from './components/ClassTimetable';
import SubstituteDocForm from './components/SubstituteDocForm';

const STORAGE_KEY = 'substitute_groups';

export default function App() {
  const [activeTab, setActiveTab] = useState('substitute');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>
            2026-1학기 자동 보강 시스템
          </span>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('substitute')}
              style={{
                background: activeTab === 'substitute' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                color: activeTab === 'substitute' ? '#fff' : 'rgba(255,255,255,0.6)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              보강 관리
            </button>
            <button
              onClick={() => setActiveTab('class-timetable')}
              style={{
                background: activeTab === 'class-timetable' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                color: activeTab === 'class-timetable' ? '#fff' : 'rgba(255,255,255,0.6)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              전체 학급별 시간표
            </button>
            <button
              onClick={() => setActiveTab('doc-form')}
              style={{
                background: activeTab === 'doc-form' ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                color: activeTab === 'doc-form' ? '#fff' : 'rgba(255,255,255,0.6)',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              결보강 계획서
            </button>
          </div>
        </div>

        {activeTab === 'substitute' && (
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
        )}
      </header>

      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {activeTab === 'substitute' ? (
          <>
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
          </>
        ) : activeTab === 'class-timetable' ? (
          <ClassTimetable />
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SubstituteDocForm groups={groups} />
          </div>
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
