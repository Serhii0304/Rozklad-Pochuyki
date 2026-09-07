const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function classWeekMarkup(config,grade,today=-1){
  const index=Number(grade)-5;
  if(index<0||index>4)throw new Error('Unknown class');
  const days=config.dayOrder,bells=config.bellSchedule;
  return '<div class="table-wrap class-week-wrap" tabindex="0" role="region" aria-label="Тижневий розклад '+grade+' класу. Таблицю можна гортати вбік."><table class="schedule-table week-matrix"><caption class="sr-only">'+grade+' клас · Навчальний тиждень · І семестр 2026–2027</caption><thead><tr><th scope="col">Урок / час</th>'+days.map((d,i)=>'<th scope="col" data-day-head="'+i+'" class="'+(i===today?'is-today':'')+'">'+d.label+(i===today?'<small>СЬОГОДНІ</small>':'')+'</th>').join('')+'</tr></thead><tbody>'+bells.map(b=>'<tr data-week-row="'+b.lesson+'"><th scope="row"><span class="lesson-number">'+b.lesson+'</span><span class="lesson-time">'+b.start+'–'+b.end+'</span><span class="row-state"></span></th>'+days.map((d,i)=>{
    const name=config.scheduleRows.find(r=>r.day===d.label&&r.lesson===b.lesson)?.classes[index]||'';
    const icon=config.subjectIcons?.[name]||config.subjectIcons?.[name.replaceAll('’',"'")]||'📘';
    return '<td data-cell-day="'+i+'" data-cell-lesson="'+b.lesson+'">'+(name?'<button type="button" class="subject week-subject" data-subject="'+escapeHtml(name)+'" title="Виділити предмет: '+escapeHtml(name)+'"><span class="subject-symbol" aria-hidden="true">'+icon+'</span><span class="subject-name">'+escapeHtml(name)+'</span></button>':'<span class="empty" aria-label="Уроку немає">—</span>')+'</td>';
  }).join('')+'</tr>').join('')+'</tbody></table></div>';
}
