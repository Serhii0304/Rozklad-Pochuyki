// Generated print posters (ChatGPT Image) for timetables whose config lists them in printPosters.
// Without printPosters the page keeps its own HTML print layout.
const VERSION='?v=20261020-primary';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function postersFor(config,{section='schedule',grade='all',view='week',day=0,printDay=null}={}){
  const P=config.printPosters;
  if(!P)return null;
  const dayPoster=index=>P.days?.[config.dayOrder[index]?.id];
  if(section==='bells')return P.bells?[P.bells]:null;
  if(printDay!==null)return dayPoster(printDay)?[dayPoster(printDay)]:null;
  if(grade!=='all')return P.classes?.[grade]?[P.classes[grade]]:null;
  if(view==='week')return config.dayOrder.map((_,i)=>dayPoster(i)).filter(Boolean);
  return dayPoster(day)?[dayPoster(day)]:null;
}

export function posterPdfFor(config,request){
  const P=config.printPosters,posters=postersFor(config,request);
  if(!posters?.length)return null;
  // The whole general week is one five-page PDF.
  if(posters.length>1)return P.weekPdf||null;
  return posters[0].pdf||null;
}

export function posterPagesFor(config,request){
  const posters=postersFor(config,request);
  if(!posters?.length)return null;
  return posters.map(poster=>'<section class="print-page poster-print-page'+(poster.portrait?' bells-print-page':'')+'"><div class="print-sheet poster-print-sheet"><img class="class-print-poster" src="'+esc(poster.image)+VERSION+'" alt="'+esc(poster.title)+'"></div></section>').join('');
}

export function downloadPosterPdf(path){
  // A same-origin download works without PDF popups; printing the file adds no page URL or date.
  const link=document.createElement('a');
  link.href=path+VERSION;
  link.download=path.split('/').at(-1);
  document.body.append(link);
  link.click();
  link.remove();
}
