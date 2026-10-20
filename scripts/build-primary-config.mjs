// Будує primary-config.js (1–4 класи) з таблиці нижче; дзвінки й дні беруться з schedule-config.js.
// Запуск із кореня сайту: node scripts/build-primary-config.mjs
import fs from 'node:fs';import vm from 'node:vm';
const box={window:{}};vm.runInNewContext(fs.readFileSync('schedule-config.js','utf8'),box);const base=box.window.SchoolScheduleConfig;
const A={'Фіз-ра':'Фізична культура','Буквар':'Буквар','Матем':'Математика','Письмо':'Письмо','ЯДС':'Я досліджую світ','Укр':'Українська мова','Літ':'Літературне читання','Англ':'Англійська мова','Мист':'Мистецтво','Тех':'Технології','Інф':'Інформатика','':''};
// rows: day, then lessons; each lesson = [1 клас,2 клас,3 клас,4 клас] (transcribed from «Розклад уроків Почуйки 2026.jpg»)
const src={
'Понеділок':[['Фіз-ра','Укр','Матем','Літ'],['Буквар','Матем','Фіз-ра','Матем'],['Матем','Фіз-ра','Укр','Укр'],['Письмо','Літ','Літ','Мист'],['ЯДС','Англ','ЯДС','Мист']],
'Вівторок':[['Буквар','Укр','Літ','Англ'],['Матем','Матем','Матем','Матем'],['Англ','Літ','Укр','Фіз-ра'],['Письмо','Фіз-ра','Англ','Укр'],['Тех','Англ','ЯДС','Літ']],
'Середа':[['Буквар','Укр','Літ','Літ'],['Матем','Матем','Матем','Матем'],['Фіз-ра','Літ','Укр','Укр'],['Письмо','Мист','Мист','ЯДС'],['','Мист','Мист','Інф'],['','','ЯДС','Тех']],
'Четвер':[['Матем','Укр','Фіз-ра','Англ'],['Фіз-ра','ЯДС','Матем','Матем'],['Мист','Літ','Укр','Літ'],['Мист','Фіз-ра','Англ','ЯДС'],['','ЯДС','Літ','Фіз-ра']],
'П’ятниця':[['Англ','Матем','Фіз-ра','ЯДС'],['Буквар','ЯДС','Англ','Матем'],['Письмо','Англ','Матем','Укр'],['ЯДС','Інф','Тех','Англ'],['ЯДС','Тех','Інф','Фіз-ра']]};
const scheduleRows=[];
for(const d of base.dayOrder){const lessons=src[d.label];for(let n=1;n<=lessons.length;n++){const row=lessons[n-1];scheduleRows.push({day:d.label,lesson:n,classes:row.map(x=>{if(!(x in A))throw new Error(x);return A[x];})});}}
const icons={'Буквар':'assets/subjects/primer.svg','Письмо':'assets/subjects/handwriting.svg','Математика':base.subjectIcons['Математика'],'Українська мова':base.subjectIcons['Українська мова'],'Літературне читання':'assets/subjects/literary-reading.svg','Я досліджую світ':'assets/subjects/explore-world.svg','Англійська мова':base.subjectIcons['Англійська мова'],'Фізична культура':base.subjectIcons['Фізична культура'],'Мистецтво':base.subjectIcons['Мистецтво'],'Технології':base.subjectIcons['Технології'],'Інформатика':base.subjectIcons['Інформатика']};
const P='assets/print-primary/';
const poster=(name,title,extra={})=>({image:P+name+'.png',pdf:P+name+'.pdf',printImage:P+name+'-print.png',preview:P+name+'-preview.webp',title,...extra});
const printPosters={
 classes:Object.fromEntries([1,2,3,4].map(g=>[String(g),poster('class-'+g,g+' клас · тижневий розклад уроків, початкова школа')])),
 days:Object.fromEntries(base.dayOrder.map(d=>[d.id,poster(d.id,d.label+' · розклад уроків 1–4 класів')])),
 bells:poster('bells','Розклад дзвінків · початкова школа',{portrait:true}),
 weekPdf:P+'week-all-classes.pdf'};
const cfg={school:{name:base.school.name,mainTitle:'Розклад уроків на І семестр',semesterLabel:base.school.semesterLabel,levelTitle:'Початкова школа'},
classPagePath:'pochatkova-shkola.html',homePagePath:'pochatkova-shkola.html',bellsPagePath:'pochatkova-shkola.html',
classes:['1 клас','2 клас','3 клас','4 клас'],trimWeekRows:true,dayOrder:base.dayOrder,scheduleRows,
subjectAliasMap:{'буквар':'Буквар','письмо':'Письмо','матем':'Математика','фіз-ра':'Фізична культура','ядс':'Я досліджую світ','укр мова':'Українська мова','літ чит':'Літературне читання','англ мова':'Англійська мова','мистецтво':'Мистецтво','технології':'Технології','інформатика':'Інформатика'},
subjectIcons:icons,printPosters,bellSchedule:base.bellSchedule.filter(b=>b.lesson<=6),ringSchedule:base.bellSchedule};
fs.writeFileSync('primary-config.js','// Початкова школа (1–4 класи). Джерело: фото «Розклад уроків Почуйки 2026.jpg», стовпці 1–4.\n// bellSchedule — уроки початкової школи (1–6); ringSchedule — усі дзвінки школи, як у schedule-config.js.\nwindow.SchoolScheduleConfig = '+JSON.stringify(cfg,null,2)+';\n');
for(let c=0;c<4;c++){const t={};for(const r of scheduleRows){const s=r.classes[c];if(s)t[s]=(t[s]||0)+1;}console.log(cfg.classes[c],Object.values(t).reduce((a,b)=>a+b),JSON.stringify(t));}
