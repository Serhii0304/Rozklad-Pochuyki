// Пише запити для ChatGPT Image (assets/print-primary-generation/*-prompt.txt) з primary-config.js.
// Запуск із кореня сайту: node scripts/build-primary-prompts.mjs
import fs from 'node:fs';import vm from 'node:vm';
const box={window:{}};vm.runInNewContext(fs.readFileSync('primary-config.js','utf8'),box);const C=box.window.SchoolScheduleConfig;
const B=Object.fromEntries(C.bellSchedule.map(b=>[b.lesson,b.start+'–'+b.end]));
const STYLE=`STYLE: a joyful, bright, premium children's illustration for a Ukrainian primary school (Нова українська школа, grades 1–4). Soft watercolor and clean vector look; sky-blue and sunny-yellow Ukrainian palette with gentle rainbow accents; decorative border scenery made of sunflowers, wheat ears, colorful pencils, alphabet blocks, a small cozy village school building, paper airplanes, a smiling sun, butterflies and books. Decoration stays ONLY in the outer margins and around the title; the table itself is clean and calm. The attached image is a LAYOUT and QUALITY REFERENCE ONLY from a different school: copy its professional poster structure (centered title block, large rounded table with gold-trimmed blue header row, ivory cells, small icon + bold subject text per cell) but make the art more playful and childlike. Ignore every word and subject in the reference.`;
const ICONS=`Consistent subject icons, small tasteful accents no more than 20% of the cell width, same icon for the same subject only: Буквар = colorful ABC primer book with big letters «А Б В»; Письмо = pencil writing in a lined copybook; Математика = colorful counting blocks with digits 1 2 3; Українська мова = notebook with blue-yellow pen; Літературне читання = open fairy-tale book with a little star; Я досліджую світ = magnifying glass over a globe with a green leaf; Англійська мова = Big Ben with a UK flag; Фізична культура = sneaker and ball; Мистецтво = paint palette with brush and music note; Технології = scissors with colored paper; Інформатика = small laptop. Empty cells contain only a centered em dash «—» and no icon.`;
const RULES=`Generate the entire final poster — all grid lines, titles, cell text and illustrations — in ONE image. Not a template, not a blank background. A4 landscape, aspect ratio 1.414. No external white frame, no URL, no date stamp, no page number, no watermark, no extra captions or decorative words anywhere. Subject text must be bold, dark navy, large and very readable for children and parents; long labels may wrap at natural word boundaries, never truncated, never misspelled. Ukrainian spelling must match the data exactly (apostrophe in «П’ятниця»).`;
const write=(name,text)=>fs.writeFileSync('assets/print-primary-generation/'+name,text+'\n');
C.classes.forEach((label,ci)=>{
 const g=ci+1;const max=Math.max(...C.dayOrder.map(d=>Math.max(0,...C.scheduleRows.filter(r=>r.day===d.label&&r.classes[ci]).map(r=>r.lesson))));
 const rows=[];for(let n=1;n<=max;n++)rows.push(n+'  '+B[n]+' | '+C.dayOrder.map(d=>C.scheduleRows.find(r=>r.day===d.label&&r.lesson===n)?.classes[ci]||'—').join(' | '));
 const cells=max*5;
 write('class-'+g+'-prompt.txt',`Create a complete finished Ukrainian weekly school timetable print poster for grade ${g} of a primary school.

${STYLE}

Center the whole title block precisely over the table. Exact title text in these centered lines:
ПОЧУЙКІВСЬКА ФІЛІЯ КВІТНЕВОГО ЛІЦЕЮ
РОЗКЛАД УРОКІВ
${g} КЛАС
Початкова школа · І семестр · 2026–2027 навчальний рік

The table occupies most of the page. Exactly six columns: Урок / час | Понеділок | Вівторок | Середа | Четвер | П’ятниця. Exactly ${max} lesson rows numbered 1–${max}. Each lesson number is big and bold with its time range compact underneath, centered. Each subject label and its icon are centered together inside their own cell.${max>5?' All '+max+' rows have exactly the same height: the last row is a full-size row like the others, never squeezed, and no bottom decoration overlaps the table.':''}
${ICONS}

DATA (each line is one full row; the separator | delineates columns and is never printed):
Урок / час | Понеділок | Вівторок | Середа | Четвер | П’ятниця
${rows.join('\n')}

${RULES}
Check all ${cells} subject cells, all ${max} time ranges and every title word before finalizing. This is a functional timetable for young pupils: exact data and readable typography take priority over decoration. Output only the single finished full-color landscape poster.`);
});
C.dayOrder.forEach((d,di)=>{
 const max=Math.max(...C.scheduleRows.filter(r=>r.day===d.label&&r.classes.some(Boolean)).map(r=>r.lesson));
 const rows=[];for(let n=1;n<=max;n++)rows.push(n+'  '+B[n]+' | '+C.scheduleRows.find(r=>r.day===d.label&&r.lesson===n).classes.map(x=>x||'—').join(' | '));
 write(d.id+'-prompt.txt',`Create a complete finished Ukrainian school timetable print poster for one weekday of a primary school, all four classes.

${STYLE}

Center the whole title block precisely over the table. Exact title text in these centered lines:
ПОЧУЙКІВСЬКА ФІЛІЯ КВІТНЕВОГО ЛІЦЕЮ
РОЗКЛАД УРОКІВ — ${d.label.toLocaleUpperCase('uk')}
Початкова школа · 1–4 класи · І семестр · 2026–2027 навчальний рік

The table occupies most of the page. Exactly five columns: Урок / час | 1 клас | 2 клас | 3 клас | 4 клас; each class header has its own cheerful color (1 клас sky blue, 2 клас green, 3 клас purple, 4 клас orange) with white bold text. Exactly ${max} lesson rows numbered 1–${max}. Each lesson number is big and bold with its time range compact underneath, centered. Each subject label and its icon are centered together inside their own cell.
${ICONS}

DATA (each line is one full row; the separator | delineates columns and is never printed):
Урок / час | 1 клас | 2 клас | 3 клас | 4 клас
${rows.join('\n')}

${RULES}
Check all ${max*4} subject cells, all ${max} time ranges and every title word before finalizing. Output only the single finished full-color landscape poster.`);
});
