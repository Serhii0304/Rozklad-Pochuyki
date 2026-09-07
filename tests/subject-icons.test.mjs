import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {classWeekMarkup} from '../schedule-view.mjs';
import {subjectIconMarkup} from '../subject-icons.mjs';
const root=new URL('../',import.meta.url),box={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('schedule-config.js',root),'utf8'),box);
const config=box.window.SchoolScheduleConfig;
test('All 26 subjects have distinct portable SVG artwork shipped locally',()=>{
 const names=Object.keys(config.subjectIcons),paths=new Set(),hashes=new Set();
 for(const used of config.scheduleRows.flatMap(r=>r.classes).filter(Boolean))assert.ok(subjectIconMarkup(config,used),used);
 assert.equal(names.length,26);
 for(const name of names){
  const asset=/src="([^"]+)"/.exec(subjectIconMarkup(config,name))?.[1];assert.ok(asset,'Missing icon: '+name);
  const svg=fs.readFileSync(new URL(asset,root),'utf8');
  assert.match(svg,/viewBox="0 0 64 64"/);assert.match(svg,/<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.doesNotMatch(svg,/<(?:script|text|foreignObject|image|filter)\b|(?:href|onload)=/);
  paths.add(asset);hashes.add(createHash('sha256').update(svg).digest('hex'));
 }
 assert.equal(paths.size,26);assert.equal(hashes.size,26);
 for(let grade=5;grade<=9;grade++){
  const html=classWeekMarkup(config,grade);
  assert.equal((html.match(/class="subject-icon"/g)||[]).length,(html.match(/data-subject=/g)||[]).length);
 }
});
test('Unknown subjects and unsafe asset paths do not inject markup',()=>{
 assert.equal(subjectIconMarkup(config,'Unknown'),'');
 assert.equal(subjectIconMarkup({subjectIcons:{Bad:'https://example.test/a.svg'}},'Bad'),'');
 assert.equal(subjectIconMarkup({subjectIcons:{Bad:'assets/subjects/a.svg" onerror="x'}},'Bad'),'');
 assert.equal(subjectIconMarkup(config,'Основи здоров’я'),subjectIconMarkup(config,"Основи здоров'я"));
});
