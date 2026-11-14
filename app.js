const $=s=>document.querySelector(s),app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let lang=localStorage.getItem('ssc:lang')||'en',timer,exams=[],cur=()=>{};
const N=x=>{x=String(x);return lang==='bn'?x.replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]):x};
const fmt=s=>N(String(s/60|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0'));
const K=v=>v&&typeof v==='object'?(v.en??v.bn??Object.values(v)[0]):v; // language-independent key
const X=v=>v&&typeof v==='object'?(v[lang]??v.en??v.bn??Object.values(v)[0]):v; // text in current language
const L=()=>lang==='bn'?'কখগঘ':'abcd';
const when=x=>new Date(x).toLocaleString(lang==='bn'?'bn-BD':undefined);
const D={
 en:{title:'SSC MCQ Practice',sub:'Choose a subject, a lesson, then a test. Each question gets one minute and carries one mark.',root:'All subjects',open:'Open',subInfo:(l,t)=>`${l} lessons, ${t} tests`,lesInfo:t=>`${t} tests`,load:'Loading tests…',
  err:'Could not load the test list. If you opened index.html directly, run a local server (python3 -m http.server) or use GitHub Pages.',
  skipped:'These files could not be loaded:',none:'No tests yet. Add a JSON file to the exams folder.',
  info:n=>`${n} questions, ${n} minutes, ${n} marks`,
  tries:(c,b,n)=>`${c} attempt(s), best score ${b}/${n}`,fresh:'Not attempted yet',start:'Start test',submit:'Submit',left:'Time left ',
  meta:n=>`Time: ${n} minutes. Full marks: ${n}`,ask:'Submit your answers?',score:'Your score',
  pct:(p,s)=>`${p}% in ${fmt(s)}`,pdf:'Download PDF',again:'Retake',all:'Back to tests',hist:'Your attempts',mine:' (your answer)',
  na:'Not answered',ok:'Correct',bad:'Wrong',pScore:'Score:',pTime:'Time used:',pYour:'Your answer:',pRight:'Correct answer:',pExp:'Explanation:',nil:'none'},
 bn:{title:'এসএসসি এমসিকিউ অনুশীলন',sub:'বিষয়, অধ্যায় ও পরীক্ষা বেছে নিন। প্রতিটি প্রশ্নের জন্য ১ মিনিট সময় এবং ১ নম্বর।',root:'সব বিষয়',open:'খুলুন',subInfo:(l,t)=>`${N(l)}টি অধ্যায়, ${N(t)}টি পরীক্ষা`,lesInfo:t=>`${N(t)}টি পরীক্ষা`,load:'পরীক্ষা লোড হচ্ছে…',
  err:'পরীক্ষার তালিকা লোড করা যায়নি। index.html সরাসরি খুলে থাকলে একটি লোকাল সার্ভার (python3 -m http.server) অথবা GitHub Pages ব্যবহার করুন।',
  skipped:'এই ফাইলগুলো লোড করা যায়নি:',none:'এখনও কোনো পরীক্ষা নেই। exams ফোল্ডারে একটি JSON ফাইল যোগ করুন।',
  info:n=>`${N(n)}টি প্রশ্ন, ${N(n)} মিনিট, ${N(n)} নম্বর`,
  tries:(c,b,n)=>`${N(c)} বার দেওয়া হয়েছে, সর্বোচ্চ স্কোর ${N(b)}/${N(n)}`,fresh:'এখনও দেওয়া হয়নি',start:'পরীক্ষা শুরু করুন',submit:'জমা দিন',left:'বাকি সময় ',
  meta:n=>`সময়: ${N(n)} মিনিট। পূর্ণমান: ${N(n)}`,ask:'উত্তর জমা দিতে চান?',score:'আপনার স্কোর',
  pct:(p,s)=>`${N(p)}%, সময় লেগেছে ${fmt(s)}`,pdf:'পিডিএফ ডাউনলোড',again:'আবার দিন',all:'পরীক্ষার তালিকা',hist:'আপনার চেষ্টাসমূহ',mine:' (আপনার উত্তর)',
  na:'উত্তর দেননি',ok:'সঠিক',bad:'ভুল',pScore:'স্কোর:',pTime:'সময় লেগেছে:',pYour:'আপনার উত্তর:',pRight:'সঠিক উত্তর:',pExp:'ব্যাখ্যা:',nil:'নেই'}
};
const T=(k,...a)=>{const v=D[lang][k];return typeof v==='function'?v(...a):v};
const store={
  get(k){try{return JSON.parse(localStorage.getItem('ssc:'+k))||[]}catch{return[]}},
  add(k,v){try{localStorage.setItem('ssc:'+k,JSON.stringify([v,...this.get(k)].slice(0,50)))}catch{}}
};

function setLang(l){
  lang=l;try{localStorage.setItem('ssc:lang',l)}catch{}
  document.documentElement.lang=l;document.title=T('title');
  $('#h1').textContent=T('title');$('#subtitle').textContent=T('sub');$('#lang').checked=l==='bn';
}

// Finds exams/*.json automatically: GitHub API (github.io), then folder listing (local server), then exams/index.json
async function listExams(){
  const m=location.hostname.match(/^(.+)\.github\.io$/);
  if(m){try{
    const repo=location.pathname.split('/')[1]||location.hostname;
    const r=await fetch(`https://api.github.com/repos/${m[1]}/${repo}/contents/exams`);
    if(r.ok){const f=(await r.json()).map(x=>x.name).filter(n=>n.endsWith('.json')&&n!=='index.json');if(f.length)return f}
  }catch{}}
  try{
    const r=await fetch('exams/');
    if(r.ok){
      const f=[...new DOMParser().parseFromString(await r.text(),'text/html').querySelectorAll('a')]
        .map(a=>decodeURIComponent((a.getAttribute('href')||'').split('/').pop()))
        .filter(n=>n.endsWith('.json')&&n!=='index.json');
      if(f.length)return [...new Set(f)];
    }
  }catch{}
  return (await fetch('exams/index.json')).json();
}

let bad=[],nav=[]; // nav holds language-independent keys: [] subjects, [subject] lessons, [subject, lesson] tests
function check(d){
  if(!d||typeof d!=='object'||Array.isArray(d))return 'not an exam object';
  for(const k of['subject','lesson','name'])if(!d[k])return `missing "${k}"`;
  if(!Array.isArray(d.questions)||!d.questions.length)return 'missing "questions" list';
  for(const[i,q]of d.questions.entries()){
    if(!q.q)return `question ${i+1}: missing "q"`;
    if(!Array.isArray(q.options)||q.options.length<2||q.options.length>4)return `question ${i+1}: "options" needs 2 to 4 items`;
    if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length)return `question ${i+1}: "answer" must be the index of an option (0 = first)`;
  }
}

async function home(){
  clearInterval(timer);app.onclick=null;cur=home;bad=[];
  app.innerHTML=`<p class="muted">${T('load')}</p>`;
  let files;
  try{files=await listExams()}catch{app.innerHTML=`<div class="card">${T('err')}</div>`;return}
  exams=(await Promise.all(files.map(async f=>{
    try{
      const r=await fetch('exams/'+encodeURIComponent(f),{cache:'no-cache'});
      if(!r.ok)throw Error('HTTP '+r.status);
      const d=await r.json(),m=check(d);if(m)throw Error(m);
      return {...d,file:f};
    }catch(x){bad.push(f+': '+x.message);return null}
  }))).filter(Boolean);
  cur=list;list();
}

function list(){
  clearInterval(timer);
  const [s,l]=nav,cmp=(a,b)=>String(a).localeCompare(String(b),lang==='bn'?'bn':undefined,{numeric:true});
  const card=(title,info,attr)=>`<article class="card"><h3>${esc(title)}</h3><p class="muted">${info}</p><button ${attr}>${T('open')}</button></article>`;
  const ofS=k=>exams.filter(e=>K(e.subject)===k),uniq=(ex,f)=>[...new Set(ex.map(e=>K(e[f])))];
  const path=[T('root'),...(s?[X(ofS(s)[0].subject)]:[]),...(l?[X(ofS(s).find(e=>K(e.lesson)===l).lesson)]:[])];
  const crumbs=nav.length?'<nav class="crumbs">'+path.map((p,i)=>i===path.length-1?`<b>${esc(p)}</b>`:`<a href="#" data-n="${i}">${esc(p)}</a>`).join(' / ')+'</nav>':'';
  const warn=!nav.length&&bad.length?`<div class="card warn"><b>${T('skipped')}</b><br>${bad.map(esc).join('<br>')}</div>`:'';
  let body;
  if(!exams.length)body=`<div class="card">${T('none')}</div>`;
  else if(!s)body=uniq(exams,'subject').map(k=>[k,X(ofS(k)[0].subject)]).sort((a,b)=>cmp(a[1],b[1])).map(([k,t])=>
    card(t,T('subInfo',uniq(ofS(k),'lesson').length,ofS(k).length),`data-s="${esc(k)}"`)).join('');
  else if(!l)body=uniq(ofS(s),'lesson').map(k=>[k,X(ofS(s).find(e=>K(e.lesson)===k).lesson)]).sort((a,b)=>cmp(a[1],b[1])).map(([k,t])=>
    card(t,T('lesInfo',ofS(s).filter(e=>K(e.lesson)===k).length),`data-l="${esc(k)}"`)).join('');
  else body=ofS(s).filter(e=>K(e.lesson)===l).sort((a,b)=>cmp(X(a.name),X(b.name))).map(e=>{
    const at=store.get(e.file),n=e.questions.length;
    return `<article class="card"><h3>${esc(X(e.name))}</h3><p>${T('info',n)}</p>
    <p class="muted">${at.length?T('tries',at.length,Math.max(...at.map(a=>a.score)),n):T('fresh')}</p>
    <button data-i="${exams.indexOf(e)}">${T('start')}</button></article>`}).join('');
  app.innerHTML=crumbs+warn+body;
  const go=n=>{nav=n;list();scrollTo(0,0)};
  app.onclick=ev=>{
    const a=ev.target.closest('a[data-n]');if(a){ev.preventDefault();return go(nav.slice(0,+a.dataset.n))}
    const d=(ev.target.closest('button')||{}).dataset;if(!d)return;
    if(d.s!==undefined)go([d.s]);else if(d.l!==undefined)go([nav[0],d.l]);else if(d.i!==undefined)start(exams[d.i]);
  };
}

function start(e,keep){
  clearInterval(timer);
  const n=e.questions.length,t0=keep?keep.t0:Date.now(),end=t0+n*60000;
  app.innerHTML=`<div class="bar"><span id="t"></span><button id="sub">${T('submit')}</button></div>
  <section class="paper"><h2>${esc(X(e.name))}</h2>
  <p class="meta">${esc(X(e.subject))}, ${esc(X(e.lesson))}<br>${T('meta',n)}</p><hr>
  ${e.questions.map((q,i)=>`<div class="q"><p><b>${N(i+1)}.</b> ${esc(X(q.q))}</p>${q.options.map((o,j)=>`<label><input type="radio" name="q${i}" value="${j}"> (${L()[j]}) ${esc(X(o))}</label>`).join('')}</div>`).join('')}</section>`;
  if(keep)keep.ans.forEach((v,i)=>{if(v!==null){const r=document.querySelector(`input[name=q${i}][value="${v}"]`);if(r)r.checked=true}});
  else scrollTo(0,0);
  const collect=()=>e.questions.map((_,i)=>{const c=document.querySelector(`input[name=q${i}]:checked`);return c?+c.value:null});
  cur=()=>start(e,{t0,ans:collect()});
  const finish=()=>{
    clearInterval(timer);
    const ans=collect(),score=ans.filter((a,i)=>a===e.questions[i].answer).length;
    const a={t:Date.now(),score,ans,used:Math.min(n*60,Math.round((Date.now()-t0)/1000))};
    store.add(e.file,a);result(e,a);
  };
  const tick=()=>{const l=Math.max(0,Math.round((end-Date.now())/1000));$('#t').textContent=T('left')+fmt(l);$('#t').classList.toggle('low',l<=60);if(!l)finish()};
  timer=setInterval(tick,500);tick();
  app.onclick=ev=>{if(ev.target.id==='sub'&&confirm(T('ask')))finish()};
}

function result(e,a){
  const n=e.questions.length,at=store.get(e.file);
  cur=()=>result(e,a);
  app.innerHTML=`<div class="card score"><small>${esc(X(e.name))}</small><p>${T('score')}</p><b>${N(a.score)} / ${N(n)}</b>
  <p>${T('pct',Math.round(a.score/n*100),a.used)}</p>
  <button id="pdfb">${T('pdf')}</button><button id="re" class="alt">${T('again')}</button><button id="hm" class="alt">${T('all')}</button></div>
  <div class="card hist"><b>${T('hist')}</b>${at.map((x,i)=>`<p><a href="#" data-a="${i}">${when(x.t)}</a>: ${N(x.score)}/${N(n)}</p>`).join('')}</div>
  <section class="paper">${e.questions.map((q,i)=>{const g=a.ans[i];
    return `<div class="q"><p><b>${N(i+1)}.</b> ${esc(X(q.q))}</p>${q.options.map((o,j)=>`<label class="${j===q.answer?'ok':j===g?'bad':''}">(${L()[j]}) ${esc(X(o))}${j===g?T('mine'):''}</label>`).join('')}
    <p class="exp"><b>${g===null?T('na'):g===q.answer?T('ok'):T('bad')}.</b> ${esc(X(q.explanation)||'')}</p></div>`}).join('')}</section>`;
  app.onclick=ev=>{const x=ev.target;
    if(x.id==='pdfb')pdf(e,a);
    else if(x.id==='re')start(e);
    else if(x.id==='hm')list();
    else if(x.dataset.a){ev.preventDefault();result(e,at[x.dataset.a]);scrollTo(0,0)}};
}

// LaTeX-style report: browser print dialog -> "Save as PDF" (handles Bangla text too)
function pdf(e,a){
  const n=e.questions.length;
  $('#pdf').innerHTML=`<h1>${esc(X(e.name))}</h1><p class="c">${esc(X(e.subject))}, ${esc(X(e.lesson))}<br>${when(a.t)}</p><hr>
  <p><b>${T('pScore')}</b> ${N(a.score)}/${N(n)} (${N(Math.round(a.score/n*100))}%) &emsp; <b>${T('pTime')}</b> ${fmt(a.used)}</p><hr>`+
  e.questions.map((q,i)=>{const g=a.ans[i];
    return `<div class="q"><p><b>${N(i+1)}.</b> ${esc(X(q.q))}</p><p>${q.options.map((o,j)=>`(${L()[j]}) ${esc(X(o))}`).join(' &emsp; ')}</p>
    <p><i>${T('pYour')}</i> ${g===null?T('nil'):L()[g]} &emsp; <i>${T('pRight')}</i> ${L()[q.answer]}</p>
    <p><i>${T('pExp')}</i> ${esc(X(q.explanation)||'')}</p></div>`}).join('');
  const old=document.title;document.title=X(e.name).replace(/[\/\\:*?"<>|]+/g,'_');
  window.print();document.title=old;
}

setLang(lang);
$('#lang').onchange=ev=>{const y=scrollY;setLang(ev.target.checked?'bn':'en');cur();scrollTo(0,y)};
home();
