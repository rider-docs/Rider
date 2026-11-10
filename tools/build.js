// Builds pdf/*.pdf and index.html from data/rider.json + data/changelog.json.
// Usage: node tools/build.js   (run `npm ci --prefix tools` once first)
'use strict';
const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const vfsMod = require('pdfmake/build/vfs_fonts');
const { buildDoc, helpers } = require('./doc');

const ROOT = path.join(__dirname, '..');
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/rider.json'), 'utf8'));
let LOG = [];
try { LOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/changelog.json'), 'utf8')); } catch (e) {}
const vfs = (vfsMod.pdfMake && vfsMod.pdfMake.vfs) || vfsMod.vfs || vfsMod;
const font = n => Buffer.from(vfs[n], 'base64');
const printer = new PdfPrinter({ Roboto: { normal: font('Roboto-Regular.ttf'), bold: font('Roboto-Medium.ttf'), italics: font('Roboto-Italic.ttf'), bolditalics: font('Roboto-MediumItalic.ttf') } });
const SLUG = { air: 'aerovokzaly', hotel: 'gostinicy', spa: 'spa', food: 'obshchepit', office: 'ofisy', sport: 'sport', edu: 'obrazovanie', temple: 'hramy', park: 'parki', mkd: 'zhk', res: 'izhs' };
const H = helpers(S);
let CFG = {}; try { CFG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')); } catch (e) {}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function pdf(def, file) {
  return new Promise((ok, bad) => {
    const doc = printer.createPdfKitDocument(def);
    const out = fs.createWriteStream(file);
    doc.pipe(out); out.on('finish', ok); out.on('error', bad); doc.end();
  });
}

(async () => {
  fs.mkdirSync(path.join(ROOT, 'pdf'), { recursive: true });
  const cards = [];
  for (const t of H.TYPES) {
    const file = `pdf/rider-${t.num.replace('.', '-')}-${SLUG[t.key]}.pdf`;
    await pdf(buildDoc(S, t.key), path.join(ROOT, file));
    const size = fs.statSync(path.join(ROOT, file)).size;
    let items = '', last = '';
    for (const s of H.secList(t.key)) {
      const ch = H.chapterOf(s);
      if (ch !== last) { const c = S.chapters.find(c => c[0] === ch); items += `<li class="ch"><span>${ch}</span>${esc(c[1])}</li>`; last = ch; }
      items += s.key.startsWith('6.') ? `<li class="sp"><span>${t.num}</span>${esc(t.name)}</li>` : `<li><span>${s.key}</span>${esc(s.title)}</li>`;
    }
    const n = S.rules.filter(r => H.applies(r, t.key) && (!r.s.startsWith('6.') || r.s === '6.' + t.key)).length;
    cards.push(`<article class="tcard"><div class="no">${t.num}</div><h2>${esc(t.name)}</h2>
<details><summary>Разделы документа</summary><ol>${items}</ol></details>
<div class="foot"><span class="cnt">${n} требований · PDF ${(size / 1048576).toFixed(1).replace('.', ',')} МБ</span><a class="btn" href="${file}" download>Скачать PDF</a></div></article>`);
    console.log('built', file);
  }
  const TAG = { 'Добавлено': 'add', 'Изменено': 'mod', 'Удалено': 'del' };
  const row = e => `<tr><td class="d">${esc(e.date)}</td><td><span class="tag ${TAG[e.action] || 'pub'}">${esc(e.action)}</span></td><td>${esc(e.text)}</td><td>${esc(e.section)}</td><td>${esc(e.types)}</td></tr>`;
  const head = '<thead><tr><th>Дата</th><th>Что</th><th>Требование</th><th>Раздел</th><th>Для объектов</th></tr></thead>';
  const recent = LOG.slice(0, 5).map(row).join('');
  const older = LOG.slice(5, 300).map(row).join('');
  const css = fs.readFileSync(path.join(__dirname, 'page.css'), 'utf8');
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Райдер на проектирование</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600&family=IBM+Plex+Mono:wght@400;600&display=swap">
<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}${css}</style></head><body>
<div class="wrap">
<header class="top"><div><div class="kicker">Райдер на проектирование · инструкция по применению</div><h1>Требования к проектированию объектов</h1><div class="meta">Редакция от ${esc(S.meta.date)}</div></div></header>
<p class="intro">Выберите тип объекта и скачайте PDF. В каждом документе — общие разделы 2–5 и специальные требования раздела 6 для выбранного типа. Файлы всегда актуальны и скачиваются без регистрации.</p>
<section class="log" id="log"><div class="loghead"><h2>Последние изменения</h2>${older ? '<button class="btn ghost sm" id="logbtn" aria-expanded="false">Весь журнал</button>' : ''}</div>
${recent ? `<div class="tw"><table>${head}<tbody>${recent}</tbody><tbody id="older" hidden>${older}</tbody></table></div>` : '<p>Изменений пока нет.</p>'}
</section>

<section class="propose" id="propose">
<div class="loghead"><h2>Предложить изменение</h2><button class="btn acc sm" id="propbtn" aria-expanded="false" aria-controls="propform">Открыть форму</button></div>
<p class="sub">Нашли неточность или хотите предложить решение? Опишите его и приложите материалы. Предложение не попадёт в райдер автоматически — его рассматривает Заказчик.</p>
<form id="propform" hidden ${CFG.form ? `action="https://formsubmit.co/${esc(CFG.form)}"` : ''} method="POST" enctype="multipart/form-data">
<input type="hidden" name="_subject" value="Райдер: предложение изменения">
<input type="hidden" name="_template" value="table">
<input type="text" name="_honey" style="display:none" tabindex="-1" autocomplete="off">
<div class="grid2">
<label>Имя<input type="text" name="Имя" id="f-name" required></label>
<label>Компания<input type="text" name="Компания" id="f-company"></label>
<label>Почта для ответа<input type="email" name="email" id="f-email" required></label>
<label>Тип объекта<select name="Тип объекта" id="f-type"><option>Все типы</option>${H.TYPES.map(t => `<option>${t.num} ${esc(t.name)}</option>`).join('')}</select></label>
<label class="wide">Раздел райдера<select name="Раздел" id="f-sec"><option>Новый раздел / не знаю</option>${S.sections.filter(x => !x.key.startsWith('6.')).map(x => `<option>${x.key} ${esc(x.title)}</option>`).join('')}<option>6 Специальные требования по типу объекта</option></select></label>
<label class="wide">Что предлагаете<textarea name="Предложение" id="f-text" required placeholder="Суть изменения и почему оно нужно"></textarea></label>
</div>
<div class="dz" id="dz"><p><b>Перетащите файлы сюда</b> или выберите их — фото, схемы, PDF. Лучше до 5 МБ на файл.</p>
<input type="file" name="attachment" id="f-files" multiple accept="image/*,.pdf,.dwg,.doc,.docx,.xls,.xlsx,.zip">
<ul id="flist"></ul></div>
<div class="factions"><button class="btn" type="submit" ${CFG.form ? '' : 'disabled'}>Отправить на согласование</button><span class="sub">${CFG.form ? 'Ответ придёт на указанную почту.' : 'Приём предложений откроется в ближайшее время.'}</span></div>
</form>
<p class="ok" id="sentmsg" hidden>Спасибо! Предложение отправлено на согласование.</p>
</section>
<div class="types">${cards.join('')}</div>
<p class="how" style="font-size:13.5px;color:var(--mute);margin:26px 0 0">Отступления от требований согласуются с Заказчиком письменно.</p>
</div>
<script>const b=document.getElementById('logbtn'),o=document.getElementById('older');if(b)b.onclick=()=>{o.hidden=!o.hidden;b.setAttribute('aria-expanded',String(!o.hidden));b.textContent=o.hidden?'Весь журнал':'Свернуть';};</script>
<script>(()=>{const b=document.getElementById('propbtn'),f=document.getElementById('propform');b.onclick=()=>{f.hidden=!f.hidden;b.setAttribute('aria-expanded',String(!f.hidden));b.textContent=f.hidden?'Открыть форму':'Скрыть форму';};
const dz=document.getElementById('dz'),inp=document.getElementById('f-files'),list=document.getElementById('flist');
const show=()=>{list.innerHTML='';[...inp.files].forEach(x=>{const li=document.createElement('li');li.textContent=x.name+' — '+(x.size/1048576).toFixed(1)+' МБ';list.appendChild(li);});};
inp.onchange=show;dz.ondragover=e=>{e.preventDefault();dz.classList.add('over');};dz.ondragleave=()=>dz.classList.remove('over');
dz.ondrop=e=>{e.preventDefault();dz.classList.remove('over');const dt=new DataTransfer();[...inp.files,...e.dataTransfer.files].forEach(x=>dt.items.add(x));inp.files=dt.files;show();};
if(location.hash==='#sent'){document.getElementById('sentmsg').hidden=false;document.getElementById('propose').scrollIntoView();}})();</script>
</body></html>`;
  fs.writeFileSync(path.join(ROOT, 'index.html'), html);
  console.log('index.html written,', LOG.length, 'log entries');
})().catch(e => { console.error(e); process.exit(1); });
