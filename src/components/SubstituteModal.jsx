import { useEffect } from 'react';
import { SCHEDULE_DATA } from '../data/scheduleData';
import { GROUP_COLORS } from '../data/defaultGroups';
import { parseCell, getGrade, getTeacherGroup, findSwapCandidates, findCoverCandidates } from '../utils/substituteLogic';

const DAY_MAP = { 월: '월', 화: '화', 수: '수', 목: '목', 금: '금' };

function slotLabel(slot) {
  const day = slot.replace(/\d+$/, '');
  const period = slot.replace(/[^\d]/g, '');
  return `${DAY_MAP[day] || day}요일 ${period}교시`;
}

export default function SubstituteModal({ teacher, slot, groups, onClose }) {
  const cellValue = SCHEDULE_DATA[teacher]?.[slot];
  const parsed = parseCell(cellValue);
  const grade = parsed ? getGrade(parsed.cls) : 0;

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!parsed) return null;

  const swapCandidates = grade === 1
    ? findSwapCandidates(teacher, slot, parsed.cls, SCHEDULE_DATA)
    : [];
  const coverResult = findCoverCandidates(teacher, slot, SCHEDULE_DATA, groups);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 10,
          width: '95%',
          maxWidth: 620,
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ background: '#1a1d2e', color: '#fff', padding: '14px 20px', borderRadius: '10px 10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{teacher}</span>
            <span style={{ margin: '0 10px', opacity: 0.5 }}>|</span>
            <span>{slotLabel(slot)}</span>
            <span style={{ margin: '0 10px', opacity: 0.5 }}>|</span>
            <span style={{ fontWeight: 600 }}>{parsed.cls}반 {parsed.subj}</span>
            <span style={{ marginLeft: 8, fontSize: 12, opacity: 0.7 }}>결강</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {grade === 1 ? (
            <Grade1Section
              teacher={teacher}
              slot={slot}
              parsed={parsed}
              swapCandidates={swapCandidates}
              coverResult={coverResult}
              groups={groups}
            />
          ) : (
            <Grade23Section
              coverResult={coverResult}
              groups={groups}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Grade1Section({ teacher, slot, parsed, swapCandidates, coverResult, groups }) {
  return (
    <>
      <PrincipleBox>
        <strong>1학년 교체 우선 원칙</strong><br />
        동 반(동일 교사 아님)의 수업을 서로 맞교환합니다. 교체 불가 시 보강으로 처리합니다.
      </PrincipleBox>

      <SectionHeader>교체 가능한 수업 ({swapCandidates.length}건)</SectionHeader>
      {swapCandidates.length === 0 ? (
        <EmptyMsg>교체 가능한 수업이 없습니다. 아래 보강 옵션을 사용하세요.</EmptyMsg>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {swapCandidates.map((c, i) => (
            <SwapCard key={i} item={c} absentTeacher={teacher} absentSlot={slot} absentSubj={parsed.subj} />
          ))}
        </div>
      )}

      <SectionHeader style={{ marginTop: 20 }}>보강 가능 교사 (교체 불가 시)</SectionHeader>
      <CoverSection coverResult={coverResult} groups={groups} />
    </>
  );
}

function Grade23Section({ coverResult, groups }) {
  return (
    <>
      <PrincipleBox>
        <strong>이동 수업 — 보강 원칙</strong><br />
        2·3학년은 교체 없이 보강 교사를 지정합니다.
      </PrincipleBox>
      <CoverSection coverResult={coverResult} groups={groups} />
    </>
  );
}

function CoverSection({ coverResult, groups }) {
  const { sameGroup, otherGroups } = coverResult;
  return (
    <>
      <SectionHeader>동교과 계열 공강 교사 (우선)</SectionHeader>
      {sameGroup.length === 0 ? (
        <EmptyMsg>동교과 공강 교사가 없습니다.</EmptyMsg>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sameGroup.map(t => <TeacherChip key={t} teacher={t} groups={groups} />)}
        </div>
      )}

      <SectionHeader style={{ marginTop: 16 }}>타 교과군 공강 교사</SectionHeader>
      {Object.keys(otherGroups).length === 0 ? (
        <EmptyMsg>타 교과군 공강 교사가 없습니다.</EmptyMsg>
      ) : (
        Object.entries(otherGroups).map(([group, teachers]) => (
          <div key={group} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600, color: GROUP_COLORS[group] || '#555', marginBottom: 4, fontSize: 13 }}>{group}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {teachers.map(t => <TeacherChip key={t} teacher={t} groups={groups} />)}
            </div>
          </div>
        ))
      )}
    </>
  );
}

function SwapCard({ item, absentTeacher, absentSlot, absentSubj }) {
  return (
    <div style={{ border: '1px solid #d0d0d0', borderRadius: 6, padding: '10px 14px', background: '#f9f9f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <strong>{item.swapTeacher}</strong>
        <span style={{ color: '#888' }}>↔</span>
        <span>{slotLabel(item.swapSlot)}</span>
        <span style={{ background: '#e0f0ff', borderRadius: 4, padding: '1px 6px', fontSize: 12 }}>{item.swapCls}</span>
        <span style={{ fontSize: 12, color: '#555' }}>{item.swapSubj}</span>
      </div>
      <div style={{ fontSize: 12, color: '#666' }}>
        교체 방식: <strong>{item.swapTeacher}</strong>가 {slotLabel(absentSlot)}에 {item.swapCls}반 수업 →
        <strong> {absentTeacher}</strong>가 {slotLabel(item.swapSlot)}에 {item.swapCls}반 수업
      </div>
    </div>
  );
}

function TeacherChip({ teacher, groups }) {
  const group = getTeacherGroup(teacher, groups);
  const color = GROUP_COLORS[group] || '#7f8c8d';
  return (
    <span style={{
      border: `1px solid ${color}`,
      borderRadius: 20,
      padding: '3px 10px',
      fontSize: 13,
      color,
      background: color + '18',
      whiteSpace: 'nowrap',
    }}>
      {teacher}
    </span>
  );
}

function PrincipleBox({ children }) {
  return (
    <div style={{ background: '#f0f4ff', border: '1px solid #c5d3f5', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 13, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function SectionHeader({ children, style }) {
  return (
    <div style={{ fontWeight: 700, fontSize: 13, color: '#333', borderBottom: '2px solid #eee', paddingBottom: 4, marginBottom: 8, ...style }}>
      {children}
    </div>
  );
}

function EmptyMsg({ children }) {
  return <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{children}</div>;
}
