import { SCHEDULE_DATA } from '../data/scheduleData';
import { GROUP_COLORS } from '../data/defaultGroups';
import { parseCell, getGrade, getTeacherGroup, findSwapCandidates, findCoverCandidates } from '../utils/substituteLogic';

function slotLabel(slot) {
  const day = slot.replace(/\d+$/, '');
  const period = slot.replace(/[^\d]/g, '');
  return `${day}요일 ${period}교시`;
}

export default function SubstitutePanel({ teacher, slot, groups, highlightedCandidate, onSelectCandidate, onClose }) {
  const cellValue = SCHEDULE_DATA[teacher]?.[slot];
  const parsed = parseCell(cellValue);
  const grade = parsed ? getGrade(parsed.cls) : 0;

  if (!parsed) return null;

  const swapCandidates = grade === 1
    ? findSwapCandidates(teacher, slot, parsed.cls, SCHEDULE_DATA)
    : [];
  const coverResult = findCoverCandidates(teacher, slot, SCHEDULE_DATA, groups);

  const handleSwapSelect = (c) => {
    const isSame =
      highlightedCandidate?.type === 'swap' &&
      highlightedCandidate?.swapTeacher === c.swapTeacher &&
      highlightedCandidate?.swapSlot === c.swapSlot;
    onSelectCandidate(isSame ? null : { type: 'swap', swapTeacher: c.swapTeacher, swapSlot: c.swapSlot });
  };

  const handleCoverSelect = (t) => {
    const isSame =
      highlightedCandidate?.type === 'cover' &&
      highlightedCandidate?.coverTeacher === t;
    onSelectCandidate(isSame ? null : { type: 'cover', coverTeacher: t });
  };

  return (
    <div style={{
      width: 380,
      minWidth: 380,
      borderLeft: '1px solid #ddd',
      boxShadow: '-4px 0 16px rgba(0,0,0,0.12)',
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      overflow: 'hidden',
    }}>
      <div style={{
        background: '#1a1d2e',
        color: '#fff',
        padding: '14px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{teacher} 선생님</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 3 }}>
            {slotLabel(slot)} &nbsp;·&nbsp; {parsed.cls}반 {parsed.subj} 결강
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 0, marginTop: -2 }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1 }}>
        {highlightedCandidate && (
          <div style={{
            background: '#fff8e1',
            border: '1px solid #ffe082',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 12,
            color: '#795548',
          }}>
            {highlightedCandidate.type === 'swap'
              ? `시간표에서 ${highlightedCandidate.swapTeacher} 선생님의 ${slotLabel(highlightedCandidate.swapSlot)} 강조 표시 중`
              : `시간표에서 ${highlightedCandidate.coverTeacher} 선생님의 공강 강조 표시 중`}
            &nbsp;
            <button
              onClick={() => onSelectCandidate(null)}
              style={{ background: 'none', border: 'none', color: '#e65100', cursor: 'pointer', fontSize: 12, padding: 0, fontWeight: 600 }}
            >
              해제
            </button>
          </div>
        )}

        {grade === 1 ? (
          <Grade1Section
            teacher={teacher}
            slot={slot}
            parsed={parsed}
            swapCandidates={swapCandidates}
            coverResult={coverResult}
            groups={groups}
            highlightedCandidate={highlightedCandidate}
            onSwapSelect={handleSwapSelect}
            onCoverSelect={handleCoverSelect}
          />
        ) : (
          <Grade23Section
            coverResult={coverResult}
            groups={groups}
            highlightedCandidate={highlightedCandidate}
            onCoverSelect={handleCoverSelect}
          />
        )}
      </div>
    </div>
  );
}

function Grade1Section({ teacher, slot, parsed, swapCandidates, coverResult, groups, highlightedCandidate, onSwapSelect, onCoverSelect }) {
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
          {swapCandidates.map((c, i) => {
            const isSelected =
              highlightedCandidate?.type === 'swap' &&
              highlightedCandidate?.swapTeacher === c.swapTeacher &&
              highlightedCandidate?.swapSlot === c.swapSlot;
            return (
              <SwapCard
                key={i}
                item={c}
                absentTeacher={teacher}
                absentSlot={slot}
                absentSubj={parsed.subj}
                isSelected={isSelected}
                onClick={() => onSwapSelect(c)}
              />
            );
          })}
        </div>
      )}

      <SectionHeader style={{ marginTop: 20 }}>보강 가능 교사 (교체 불가 시)</SectionHeader>
      <CoverSection
        coverResult={coverResult}
        groups={groups}
        highlightedCandidate={highlightedCandidate}
        onCoverSelect={onCoverSelect}
      />
    </>
  );
}

function Grade23Section({ coverResult, groups, highlightedCandidate, onCoverSelect }) {
  return (
    <>
      <PrincipleBox>
        <strong>이동 수업 — 보강 원칙</strong><br />
        2·3학년은 교체 없이 보강 교사를 지정합니다.
      </PrincipleBox>
      <CoverSection
        coverResult={coverResult}
        groups={groups}
        highlightedCandidate={highlightedCandidate}
        onCoverSelect={onCoverSelect}
      />
    </>
  );
}

function CoverSection({ coverResult, groups, highlightedCandidate, onCoverSelect }) {
  const { sameGroup, otherGroups } = coverResult;
  return (
    <>
      <SectionHeader>동교과 계열 공강 교사 (우선)</SectionHeader>
      {sameGroup.length === 0 ? (
        <EmptyMsg>동교과 공강 교사가 없습니다.</EmptyMsg>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sameGroup.map(t => (
            <TeacherChip
              key={t}
              teacher={t}
              groups={groups}
              isSelected={highlightedCandidate?.type === 'cover' && highlightedCandidate?.coverTeacher === t}
              onClick={() => onCoverSelect(t)}
            />
          ))}
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
              {teachers.map(t => (
                <TeacherChip
                  key={t}
                  teacher={t}
                  groups={groups}
                  isSelected={highlightedCandidate?.type === 'cover' && highlightedCandidate?.coverTeacher === t}
                  onClick={() => onCoverSelect(t)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}

function SwapCard({ item, absentTeacher, absentSlot, absentSubj, isSelected, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${isSelected ? '#1976d2' : '#d0d0d0'}`,
        borderRadius: 6,
        padding: '10px 14px',
        background: isSelected ? '#e3f2fd' : '#f9f9f9',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
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
      {isSelected && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#1976d2', fontWeight: 600 }}>
          ✓ 시간표에 강조 표시 중 — 다시 클릭하면 해제
        </div>
      )}
    </div>
  );
}

function TeacherChip({ teacher, groups, isSelected, onClick }) {
  const group = getTeacherGroup(teacher, groups);
  const color = GROUP_COLORS[group] || '#7f8c8d';
  return (
    <span
      onClick={onClick}
      style={{
        border: `2px solid ${isSelected ? '#388e3c' : color}`,
        borderRadius: 20,
        padding: '3px 10px',
        fontSize: 13,
        color: isSelected ? '#fff' : color,
        background: isSelected ? '#388e3c' : color + '18',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontWeight: isSelected ? 700 : 400,
      }}
    >
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
