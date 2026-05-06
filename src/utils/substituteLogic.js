export function parseCell(value) {
  if (!value) return null;
  const [cls, subj] = value.split('\n');
  return { cls: cls?.trim(), subj: subj?.trim() };
}

export function getGrade(cls) {
  if (!cls) return 0;
  return parseInt(cls[0], 10);
}

export function getTeacherGroup(teacher, groups) {
  for (const [group, members] of Object.entries(groups)) {
    if (members.includes(teacher)) return group;
  }
  return '미분류';
}

export function findSwapCandidates(absentTeacher, absentSlot, absentCls, schedule) {
  const absentSchedule = schedule[absentTeacher] || {};
  const results = [];

  for (const [teacher, slots] of Object.entries(schedule)) {
    if (teacher === absentTeacher) continue;
    if (slots[absentSlot]) continue;

    for (const [slot, cellValue] of Object.entries(slots)) {
      if (slot === absentSlot) continue;
      const parsed = parseCell(cellValue);
      if (!parsed || parsed.cls !== absentCls) continue;
      if (absentSchedule[slot]) continue;

      results.push({
        swapTeacher: teacher,
        swapSlot: slot,
        swapCls: parsed.cls,
        swapSubj: parsed.subj,
      });
    }
  }

  const absentDay = absentSlot.replace(/\d+$/, '');
  results.sort((a, b) => {
    const aDay = a.swapSlot.replace(/\d+$/, '');
    const bDay = b.swapSlot.replace(/\d+$/, '');
    if (aDay === absentDay && bDay !== absentDay) return -1;
    if (bDay === absentDay && aDay !== absentDay) return 1;
    return 0;
  });

  return results;
}

export function findCoverCandidates(absentTeacher, absentSlot, schedule, groups) {
  const absentGroup = getTeacherGroup(absentTeacher, groups);
  const sameGroup = [];
  const otherGroups = {};

  for (const [teacher, slots] of Object.entries(schedule)) {
    if (teacher === absentTeacher) continue;
    if (slots[absentSlot]) continue;

    const group = getTeacherGroup(teacher, groups);
    if (group === absentGroup) {
      sameGroup.push(teacher);
    } else {
      if (!otherGroups[group]) otherGroups[group] = [];
      otherGroups[group].push(teacher);
    }
  }

  return { sameGroup, otherGroups };
}
