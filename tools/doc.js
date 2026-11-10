// PDF document definition for one object type (pdfmake). Mirrors the editor's in-browser export.
'use strict';
const C = { ink: '#1f1e1c', mute: '#77726a', line: '#ddd6ca', acc: '#9c4f27', no: '#b3261e', ok: '#2f6b4f' };

function helpers(S) {
  const TYPES = S.types.map(([key, num, name, short]) => ({ key, num, name, short }));
  const TYPE = Object.fromEntries(TYPES.map(t => [t.key, t]));
  const applies = (r, type) => !type || r.ty.includes('all') || r.ty.includes(type);
  const secList = type => S.sections.filter(s => !s.key.startsWith('6.') || !type || s.key === '6.' + type);
  const secNum = s => (!s.key.startsWith('6.') ? s.key : TYPE[s.key.slice(2)].num);
  const chapterOf = s => s.key.split('.')[0];
  const rulesOf = (k, type) => S.rules.filter(r => r.s === k && applies(r, type));
  return { TYPES, TYPE, applies, secList, secNum, chapterOf, rulesOf };
}

function marker(k) {
  if (k === 'must') return { canvas: [{ type: 'rect', x: 0, y: 2.5, w: 7, h: 7, color: C.ink }], width: 14 };
  if (k === 'rec') return { canvas: [{ type: 'rect', x: 0.5, y: 3, w: 6, h: 6, lineColor: C.ink, lineWidth: 1 }], width: 14 };
  return { canvas: [{ type: 'line', x1: 0, y1: 2.5, x2: 7, y2: 9.5, lineColor: C.no, lineWidth: 1.4 }, { type: 'line', x1: 7, y1: 2.5, x2: 0, y2: 9.5, lineColor: C.no, lineWidth: 1.4 }], width: 14 };
}

function buildDoc(S, typeKey) {
  const H = helpers(S);
  const t = H.TYPE[typeKey];
  const title = 'Райдер на проектирование';
  const content = [];
  content.push({ canvas: [{ type: 'rect', x: 0, y: 0, w: 495, h: 4, color: C.ink }], margin: [0, 40, 0, 26] });
  content.push({ text: 'ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ', style: 'kicker' });
  content.push({ text: title, fontSize: 30, bold: true, margin: [0, 6, 0, 10], lineHeight: 1.05 });
  content.push({ text: [{ text: t.num + '  ', color: C.acc, bold: true }, t.name], fontSize: 15, margin: [0, 0, 0, 14] });
  content.push({ text: 'Общие требования разделов 2–5 и специальные требования раздела 6 для объектов этого типа. В райдер вносятся только принципиальные решения.', fontSize: 11, color: '#4b4740', margin: [0, 0, 0, 300] });
  content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1, lineColor: C.ink }] });
  content.push({ columns: [{ width: 100, text: 'Редакция', bold: true }, { text: S.meta.version }], margin: [0, 8, 0, 2], fontSize: 9 });
  content.push({ columns: [{ width: 100, text: 'Дата', bold: true }, { text: S.meta.date }], fontSize: 9, pageBreak: 'after' });
  content.push({ text: 'КАК ПОЛЬЗОВАТЬСЯ', style: 'kicker' });
  content.push({ text: 'Порядок чтения', fontSize: 20, bold: true, margin: [0, 2, 0, 12] });
  const lg = (k, h, p) => ({ columns: [marker(k), { stack: [{ text: h, bold: true, fontSize: 10.5 }, { text: p, color: '#4b4740', fontSize: 9.5 }] }], columnGap: 6, margin: [0, 0, 0, 8] });
  content.push(lg('must', 'Обязательно', 'Требование выполняется на всех объектах этого типа без исключений.'));
  content.push(lg('rec', 'Рекомендуется', 'Применяется, если позволяют участок, бюджет и функция; отказ обосновывается.'));
  content.push(lg('no', 'Не допускается', 'Решение не применяется. Исключение — только по письменному согласованию с Заказчиком.'));
  content.push({ text: 'Номер пункта: раздел.подраздел.пункт. Схемы даны в единой графике, размеры — в миллиметрах. Фото с пометкой «используем» — образцы для подбора, «не используем» — антипримеры. Подчёркнутый текст — активная ссылка.', fontSize: 9.5, color: '#4b4740', margin: [0, 6, 0, 18] });
  content.push({ toc: { title: { text: 'Содержание', fontSize: 13, bold: true, margin: [0, 0, 0, 8] }, numberStyle: { color: C.mute }, textStyle: { fontSize: 10.5 } }, pageBreak: 'after' });
  let lastCh = '';
  for (const s of H.secList(typeKey)) {
    const ch = H.chapterOf(s);
    const rules = H.rulesOf(s.key, s.key.startsWith('6.') ? null : typeKey);
    if (ch !== lastCh) {
      const c = S.chapters.find(c => c[0] === ch);
      content.push({ columns: [{ text: ch, fontSize: 40, bold: true, color: C.acc, width: 52 }, { stack: [{ text: 'РАЗДЕЛ ' + ch, style: 'kicker' }, { text: c[1], fontSize: 19, bold: true, tocItem: true, tocStyle: { bold: true }, tocMargin: [0, 6, 0, 0] }] }], pageBreak: lastCh ? 'before' : undefined, margin: [0, 0, 0, 4] });
      content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 1.2, lineColor: C.ink }], margin: [0, 2, 0, 6] });
      lastCh = ch;
    }
    const num = H.secNum(s);
    const stitle = s.key.startsWith('6.') ? t.name : s.title;
    content.push({ text: [{ text: num + '   ', color: C.acc }, stitle], fontSize: 12, bold: true, margin: [0, 12, 0, 4], tocItem: true, tocMargin: [14, 0, 0, 0] });
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: .5, lineColor: C.line }], margin: [0, 0, 0, 4] });
    if (!rules.length) content.push({ text: 'Требований этого раздела для данного типа объектов нет.', color: C.mute, fontSize: 9.5, margin: [0, 2, 0, 4] });
    rules.forEach((r, i) => {
      const txt = [r.t];
      (r.l || []).forEach(l => txt.push('  ', { text: l.t, link: l.u, color: C.acc, decoration: 'underline' }));
      content.push({ columns: [marker(r.k), { text: num + '.' + (i + 1), width: 44, color: r.k === 'no' ? C.no : C.mute, fontSize: 9, bold: true, margin: [0, 1, 0, 0] }, { text: txt, fontSize: 10, lineHeight: 1.2 }], columnGap: 4, margin: [0, 3, 0, 3], unbreakable: true });
      for (const f of r.f || []) {
        if (f.t === 's') {
          const sc = S.sch[f.k]; if (!sc) continue;
          content.push({ stack: [{ text: [{ text: 'Схема  ', color: C.acc, bold: true }, sc.title], fontSize: 8.5, margin: [0, 0, 0, 3] }, { image: sc.png, fit: [480, 260] }], margin: [18, 4, 0, 8], unbreakable: true });
        } else {
          const ids = (f.ids || []).filter(id => S.img[id]); if (!ids.length) continue;
          const w = Math.min(160, Math.floor((470 - (ids.length - 1) * 6) / ids.length));
          content.push({ stack: [{ columns: ids.map(id => ({ image: S.img[id], fit: [w, ids.length > 2 ? 105 : 140], width: w })), columnGap: 6 },
            { text: [{ text: f.k === 'no' ? ' НЕ ИСПОЛЬЗУЕМ ' : ' ИСПОЛЬЗУЕМ ', color: '#ffffff', background: f.k === 'no' ? C.no : C.ok, bold: true, fontSize: 7.5 }, '  ', f.c || ''], fontSize: 8.5, margin: [0, 3, 0, 0], color: '#4b4740' }], margin: [18, 4, 0, 8], unbreakable: true });
        }
      }
    });
  }
  content.push({ text: 'ПРИЛОЖЕНИЕ', style: 'kicker', pageBreak: 'before' });
  content.push({ text: 'Ориентировочный перечень растений', fontSize: 19, bold: true, tocItem: true, margin: [0, 2, 0, 8] });
  content.push({ text: 'Прорабатывать недорогие аналоги из местных питомников; подбирать по климатической зоне участка.', fontSize: 9.5, color: '#4b4740', margin: [0, 0, 0, 8] });
  for (const g of S.plants || []) {
    content.push({ text: g.h, bold: true, color: C.acc, fontSize: 11, margin: [0, 8, 0, 3] });
    g.items.forEach(([h, b]) => content.push({ text: h ? [{ text: h + ': ', bold: true }, b] : b, fontSize: 9, margin: [0, 0, 0, 4] }));
  }
  return {
    pageSize: 'A4', pageMargins: [50, 58, 50, 52], content,
    info: { title: `${title} — ${t.name}` },
    defaultStyle: { font: 'Roboto', fontSize: 10, color: C.ink },
    styles: { kicker: { fontSize: 8, bold: true, color: C.acc, characterSpacing: 1.2 } },
    header: p => (p === 1 ? null : { columns: [{ text: `РАЙДЕР НА ПРОЕКТИРОВАНИЕ · ${t.num} ${t.short.toUpperCase()}`, alignment: 'left' }, { text: 'ИНСТРУКЦИЯ ПО ПРИМЕНЕНИЮ', alignment: 'right' }], fontSize: 7, color: C.mute, margin: [50, 26, 50, 0], characterSpacing: .6 }),
    footer: (p, n) => ({ text: p + ' / ' + n, alignment: 'right', fontSize: 7.5, color: C.mute, margin: [50, 16, 50, 0] })
  };
}

module.exports = { buildDoc, helpers };
