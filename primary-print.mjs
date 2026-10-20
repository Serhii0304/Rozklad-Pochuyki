// Галерея згенерованих плакатів початкової школи: вибір за адресою #class-1, #monday, #bells.
const C=window.SchoolScheduleConfig,P=C.printPosters,VERSION='?v=20261020-primary';
const $=selector=>document.querySelector(selector);
const items=[
  ...Object.entries(P.classes).map(([grade,poster])=>({id:'class-'+grade,label:grade+' клас',group:'#poster-classes',name:grade+' клас · тиждень',poster})),
  ...C.dayOrder.map((day,i)=>({id:day.id,label:day.label,short:['Пн','Вт','Ср','Чт','Пт'][i],group:'#poster-days',name:day.label+' · 1–4 класи',poster:P.days[day.id]})),
  {id:'bells',label:'Розклад дзвінків',group:'#poster-bells',name:'Розклад дзвінків',poster:P.bells}
];
for(const item of items){
  const link=document.createElement('a');
  link.href='#'+item.id;link.dataset.poster=item.id;
  link.innerHTML='<span class="tab-full"></span>'+(item.short?'<span class="tab-short" aria-hidden="true"></span>':'');
  link.querySelector('.tab-full').textContent=item.label;
  if(item.short)link.querySelector('.tab-short').textContent=item.short;
  $(item.group).append(link);
}
function show(){
  const item=items.find(x=>x.id===location.hash.slice(1))||items[0];
  const {poster}=item;
  document.title=item.name+' · Плакати для друку · Почуйки';
  $('#poster-title').textContent=item.name;
  document.querySelectorAll('[data-poster]').forEach(link=>link.toggleAttribute('aria-current',link.dataset.poster===item.id));
  document.querySelectorAll('[data-poster][aria-current]').forEach(link=>link.setAttribute('aria-current','page'));
  $('#poster-pdf').href=poster.pdf+VERSION;$('#poster-pdf').download='Почуйки — '+item.name+' — 2026-2027.pdf';
  $('#poster-png').href=poster.printImage+VERSION;$('#poster-png').download='Почуйки — '+item.name+' — 2026-2027.png';
  $('#poster-frame').classList.toggle('is-portrait',Boolean(poster.portrait));
  document.body.classList.toggle('print-portrait',Boolean(poster.portrait));
  const preview=$('#poster-preview');
  preview.alt=poster.title;preview.width=poster.portrait?990:1400;preview.height=poster.portrait?1400:990;
  preview.src=poster.preview+VERSION;
  const original=$('#poster-original');
  original.alt=poster.title;$('#poster-status').textContent='';
  original.src=poster.image+VERSION;
}
$('#poster-original').addEventListener('error',()=>{$('#poster-status').textContent='Не вдалося завантажити зображення. Оновіть сторінку.';});
$('#week-pdf').href=P.weekPdf+VERSION;
window.addEventListener('hashchange',show);
show();
