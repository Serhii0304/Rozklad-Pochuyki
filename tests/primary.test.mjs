import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {posterPdfFor,posterPagesFor} from '../poster-print.mjs';
import {schoolState} from '../time-core.mjs';
import {classWeekMarkup} from '../schedule-view.mjs';
const load=file=>{const box={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),box);return JSON.parse(JSON.stringify(box.window.SchoolScheduleConfig));};
// JSON copy: arrays from the vm context have a different prototype.
const C=load('primary-config.js'),MAIN=load('schedule-config.js');
const at=(day,lesson,grade)=>C.scheduleRows.find(r=>r.day===day&&r.lesson===lesson)?.classes[grade-1]||'';

test('Primary timetable has four classes and the weekly totals of the source photo',()=>{
  assert.deepEqual(C.classes,['1 клас','2 клас','3 клас','4 клас']);
  const totals=[1,2,3,4].map(g=>C.scheduleRows.filter(r=>r.classes[g-1]).length);
  assert.deepEqual(totals,[23,25,26,26]);
  for(const row of C.scheduleRows)assert.equal(row.classes.length,4);
});

test('Primary cells match spot checks from the photo',()=>{
  assert.equal(at('Понеділок',1,1),'Фізична культура');
  assert.equal(at('Понеділок',5,1),'Я досліджую світ');
  assert.equal(at('Вівторок',5,1),'Технології');
  assert.equal(at('Середа',5,1),'');
  assert.equal(at('Середа',6,3),'Я досліджую світ');
  assert.equal(at('Середа',6,4),'Технології');
  assert.equal(at('Четвер',3,1),'Мистецтво');
  assert.equal(at('П’ятниця',4,2),'Інформатика');
  assert.equal(at('П’ятниця',5,4),'Фізична культура');
  // Only Wednesday has a sixth lesson.
  assert.deepEqual(C.dayOrder.map(d=>Math.max(...C.scheduleRows.filter(r=>r.day===d.label).map(r=>r.lesson))),[5,5,6,5,5]);
});

test('Primary bells show six lessons but ring the full school day',()=>{
  assert.equal(C.bellSchedule.length,6);
  assert.deepEqual(C.ringSchedule,MAIN.bellSchedule);
  assert.deepEqual(C.bellSchedule,MAIN.bellSchedule.slice(0,6));
});

test('Every primary subject has an existing icon',()=>{
  const subjects=new Set(C.scheduleRows.flatMap(r=>r.classes).filter(Boolean));
  for(const s of subjects){const icon=C.subjectIcons[s];assert.ok(icon,s);assert.ok(fs.existsSync(new URL('../'+icon,import.meta.url)),icon);}
});

test('Every primary print poster file exists',()=>{
  const P=C.printPosters,posters=[...Object.values(P.classes),...Object.values(P.days),P.bells];
  assert.equal(posters.length,10);
  for(const p of posters)for(const key of ['image','pdf','printImage','preview'])assert.ok(fs.existsSync(new URL('../'+p[key],import.meta.url)),p[key]);
  assert.ok(fs.existsSync(new URL('../'+P.weekPdf,import.meta.url)));
});

test('Print requests choose the generated poster PDF',()=>{
  const req=o=>({section:'schedule',grade:'all',view:'week',day:0,printDay:null,...o});
  assert.equal(posterPdfFor(C,req({grade:'3'})),'assets/print-primary/class-3.pdf');
  assert.equal(posterPdfFor(C,req({grade:'2',view:'day'})),'assets/print-primary/class-2.pdf');
  assert.equal(posterPdfFor(C,req({})),'assets/print-primary/week-all-classes.pdf');
  assert.equal(posterPdfFor(C,req({view:'day',day:2})),'assets/print-primary/wednesday.pdf');
  assert.equal(posterPdfFor(C,req({printDay:4})),'assets/print-primary/friday.pdf');
  assert.equal(posterPdfFor(C,req({section:'bells'})),'assets/print-primary/bells.pdf');
  assert.equal((posterPagesFor(C,req({})).match(/poster-print-page/g)||[]).length,5);
  assert.match(posterPagesFor(C,req({section:'bells'})),/bells-print-page/);
  // The 5–9 timetable keeps its own HTML print layout.
  assert.equal(posterPdfFor(MAIN,req({grade:'7'})),null);
  assert.equal(posterPagesFor(MAIN,req({})),null);
});

test('Primary live state ends with the sixth lesson on Wednesday',()=>{
  const wed=Date.parse('2026-10-21T11:00:00Z');// 14:00 Kyiv
  assert.equal(schoolState(wed,C).lesson,6);
  const tue=Date.parse('2026-10-20T11:00:00Z');
  assert.equal(schoolState(tue,C).kind,'after');
});

test('Class week shows rows only up to the last lesson of the class',()=>{
  const rows=g=>(classWeekMarkup(C,String(g)).match(/data-week-row=/g)||[]).length;
  assert.deepEqual([1,2,3,4].map(rows),[5,5,6,6]);
});
