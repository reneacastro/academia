/* ═══════════════════════════════════════════════
   app.js  — LÓGICA COMPLETA
   Academia do Renê
═══════════════════════════════════════════════ */

/* ── UTILS ── */
function todayStr() { return new Date().toISOString().split('T')[0]; }
function parseDate(raw) {
  if (!raw) return null;
  var s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) { var p=s.split('/'); return p[2]+'-'+p[1]+'-'+p[0]; }
  var dt = new Date(s); return isNaN(dt) ? null : dt.toISOString().split('T')[0];
}
function fmtDate(raw) {
  var s=parseDate(raw); if (!s) return '—';
  return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});
}
function fmtDateShort(raw) {
  var s=parseDate(raw); if (!s) return '—';
  return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
}
function setTxt(id, v) { var el=document.getElementById(id); if(el) el.textContent=v; }
function setVal(id, v) { var el=document.getElementById(id); if(el) el.value=v; }

/* ── CACHE ── */
var hist = JSON.parse(localStorage.getItem('rene_hist') || '[]');
var sw   = JSON.parse(localStorage.getItem('rene_sw')   || '[]');
function cacheHist() { localStorage.setItem('rene_hist', JSON.stringify(hist)); }
function cacheSW()   { localStorage.setItem('rene_sw',   JSON.stringify(sw));   }

/* ── PERFIL / AVATARES ── */
var AVATARS = ['🏋️‍♂️','🤸‍♀️','💪','🧘‍♀️','🏃‍♂️','🏃‍♀️','🦾','🧗‍♀️','🥊','⚡'];
var selectedAvatar = '🏋️‍♂️';
var selectedGoals  = [];

function initProfile() {
  var raw = localStorage.getItem('rene_profile');
  if (!raw) { renderAvatarPicker(); return; }
  var p = JSON.parse(raw);
  setVal('pf-name',    p.name    || '');
  setVal('pf-surname', p.surname || '');
  setVal('pf-height',  p.height  || '');
  setVal('pf-weight',  p.weight  || '');
  selectedAvatar = p.avatar || '🏋️‍♂️';
  selectedGoals  = p.goals  || [];
  renderAvatarPicker();
  renderGoalOpts();
}

function renderAvatarPicker() {
  var grid = document.getElementById('avatar-grid'); if (!grid) return;
  grid.innerHTML = AVATARS.map(function(a) {
    return '<div class="av-opt'+(a===selectedAvatar?' av-sel':'')+'" onclick="selectAvatar(\''+a+'\')" title="'+a+'">'+a+'</div>';
  }).join('');
  var hd = document.getElementById('avatar-display'); if (hd) hd.textContent = selectedAvatar;
}

function selectAvatar(a) {
  selectedAvatar = a; renderAvatarPicker();
}

function renderGoalOpts() {
  document.querySelectorAll('.goal-opt').forEach(function(el) {
    el.classList.toggle('selected', selectedGoals.indexOf(el.dataset.goal) >= 0);
  });
}

function toggleGoal(g) {
  var i = selectedGoals.indexOf(g);
  if (i >= 0) selectedGoals.splice(i,1); else selectedGoals.push(g);
  renderGoalOpts();
}

function saveProfile() {
  var name    = (document.getElementById('pf-name').value    || '').trim();
  var surname = (document.getElementById('pf-surname').value || '').trim();
  var height  = document.getElementById('pf-height').value   || '';
  var weight  = parseFloat(document.getElementById('pf-weight').value) || null;
  if (!name) { alert('Preencha seu nome para continuar.'); return; }

  var profile = { name:name, surname:surname, height:height, weight:weight,
                  avatar:selectedAvatar, goals:selectedGoals };
  localStorage.setItem('rene_profile', JSON.stringify(profile));

  var uid = btoa(name.toLowerCase().trim()).replace(/[^a-z0-9]/gi,'');
  currentUser = { uid:uid, email:name.toLowerCase().replace(/\s+/g,'')+'@local',
                  name:name+(surname?' '+surname:''), avatar:selectedAvatar };
  localStorage.setItem('rene_user', JSON.stringify(currentUser));

  if (weight) {
    var today = todayStr();
    var wi = hist.findIndex(function(x){ return parseDate(x.date)===today && x.type==='peso'; });
    if (wi>=0) hist[wi].peso=weight;
    else hist.unshift({ date:today, type:'peso', name:'Peso registrado', calories:0, peso:weight });
    cacheHist();
  }
  afterLogin();
}

/* ── AUTH ── */
var currentUser = null;
function checkStoredLogin() {
  var u = localStorage.getItem('rene_user');
  if (u) {
    currentUser = JSON.parse(u);
    var raw = localStorage.getItem('rene_profile');
    if (raw) { var p=JSON.parse(raw); currentUser.avatar=p.avatar||'🏋️‍♂️'; }
    afterLogin();
  } else {
    showScreen('profile');
    initProfile();
  }
}
function logout() { localStorage.clear(); location.reload(); }

function afterLogin() {
  try {
    var el = document.getElementById('bar-user');
    if (el) { el.textContent=(currentUser.avatar||'💪')+' '+(currentUser.name||currentUser.email.split('@')[0]); el.style.display='block'; }
    var lo = document.getElementById('btn-logout'); if (lo) lo.style.display='flex';
    initDefaultWorkouts();
    showScreen('home');
    renderSchedUI();
    renderHomeSavedWorkouts();
    initHome();
    loadFromSheets();
  } catch(e) { console.error('afterLogin error:', e); showScreen('home'); }
}

/* ── SYNC ── */
function setSyncStatus(state, msg) {
  var dot=document.getElementById('sync-dot'), txt=document.getElementById('sync-txt');
  if (!dot) return;
  dot.className='sync-dot '+state; txt.textContent=msg;
}
async function apiPost(payload) {
  if (!currentUser) return;
  payload.uid = currentUser.uid;
  setSyncStatus('syncing','Salvando...');
  try {
    try { await fetch(API,{method:'POST',redirect:'follow',headers:{'Content-Type':'text/plain'},body:JSON.stringify(payload)}); }
    catch(_) { await fetch(API,{method:'POST',mode:'no-cors',body:JSON.stringify(payload)}); }
    setSyncStatus('ok','Salvo ✓');
  } catch(e) { setSyncStatus('err','Salvo localmente'); }
}
async function loadFromSheets() {
  if (!currentUser) return;
  setSyncStatus('syncing','Sincronizando...');
  var t = setTimeout(function(){ setSyncStatus('err','Sem conexão — dados locais'); }, 10000);
  try {
    var uid = encodeURIComponent(currentUser.uid);
    var [hRes, wRes, sRes] = await Promise.all([
      fetch(API+'?action=getHistory&uid='+uid),
      fetch(API+'?action=getWorkouts&uid='+uid),
      fetch(API+'?action=getSchedule&uid='+uid)
    ]);
    var hText=await hRes.text(), wText=await wRes.text(), sText=await sRes.text();
    var hData=[], wData=[], sData=null;
    try { hData=JSON.parse(hText); } catch(e){ console.warn('[Sheets] hData inválido:', hText.slice(0,300)); }
    try { wData=JSON.parse(wText); } catch(e){ console.warn('[Sheets] wData inválido:', wText.slice(0,300)); }
    try { sData=JSON.parse(sText); } catch(e){ console.warn('[Sheets] sData inválido:', sText.slice(0,300)); }

    // só sobrescreve local se vier dados reais do servidor
    if (Array.isArray(hData) && hData.length) {
      hist=hData.map(function(r){return Object.assign({},r,{date:parseDate(r.date)||r.date});}).filter(function(r){return r.date;});
      cacheHist();
    }
    if (Array.isArray(wData) && wData.length) { sw=wData; cacheSW(); }
    if (sData && typeof sData==='object' && !Array.isArray(sData)) {
      SCHEDULE=sData; localStorage.setItem('reneschedule',JSON.stringify(sData));
    }
    clearTimeout(t); setSyncStatus('ok','Sincronizado ✓');
    initDefaultWorkouts(); initHome(); renderSchedUI(); renderHomeSavedWorkouts();
    renderHist(); renderCalWorkouts();
    if (document.getElementById('s-dashboard').classList.contains('active')) renderDash();
    if (document.getElementById('s-bank').classList.contains('active')) renderSW();
  } catch(e) {
    clearTimeout(t);
    console.error('[Sheets] loadFromSheets falhou:', e);
    setSyncStatus('err','Offline — dados locais');
  }
}

/* ── SCREENS ── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  document.getElementById('s-'+id).classList.add('active');
  var bb = document.getElementById('back-btn');
  bb.style.display = (id==='home'||id==='profile') ? 'none' : 'flex';
  var labels = { home:'Hub de Treinos', workout:'Treino em andamento', calendar:'Registro de Treino',
    dashboard:'Meu Progresso', bank:'Banco de Exercícios', congrats:'Treino Concluído!', profile:'Meu Perfil' };
  document.getElementById('bar-sub').textContent = labels[id]||'';
  if (id==='dashboard') { initDashDates(); renderDash(); }
  if (id==='calendar')  { renderHist(); initCal(); renderCalWorkouts(); }
  if (id==='bank')      { renderBank(); renderSW(); }
  if (id==='profile')   { initProfile(); }
  window.scrollTo(0,0);
}

/* ── HOME ── */
function initHome() {
  try {
    var h=new Date().getHours();
    var g=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
    var name=currentUser?(currentUser.name||currentUser.email.split('@')[0]):'Renê';
    setTxt('h-greeting', g+', '+name+'! 👋');
    var t=SCHEDULE[new Date().getDay()];
    ['a','b','c','l'].forEach(function(x){
      var el=document.getElementById('badge-'+x); if(el) el.style.display=(t===x)?'block':'none';
    });
    var today=todayStr();
    var td=hist.find(function(i){ return parseDate(i.date)===today&&i.type!=='peso'; });
    var subEl=document.getElementById('h-sub');
    if(td) subEl.textContent='Treino de hoje: '+td.name+' ✅';
    else if(t==='rest') subEl.textContent='Dia de descanso hoje 😌';
    else subEl.textContent='Sugerido hoje: '+(WN[t]||t);
    renderHomeSavedWorkouts();
  } catch(e) { console.error('initHome',e); }
}

function renderHomeSavedWorkouts() {
  var grid=document.getElementById('home-sw-grid'); if(!grid) return;
  if(!sw.length){ grid.innerHTML=''; return; }
  var catColors={a:'var(--blue)',b:'var(--green)',c:'var(--purple)',l:'var(--orange)'};
  var catBg={a:'#e8f0fe',b:'#e6f4ea',c:'#f3e5f5',l:'#fff3e0'};
  grid.innerHTML = sw.map(function(w){
    var cat=w.category||'l',col=catColors[cat]||'var(--blue)',bg=catBg[cat]||'#e8f0fe',ico=CAT_EMOJI[cat]||'⭐';
    return '<button class="menu-card" style="border-left:4px solid '+col+';background:'+bg+'" onclick="startSavedWorkout('+w.id+')">'
      +'<div class="mc-icon" style="background:'+col+'"><span style="font-size:24px">'+ico+'</span></div>'
      +'<div class="mc-name">'+w.name+'</div>'
      +'<div class="mc-sub">'+(w.exercises||[]).length+' exercícios</div>'
      +'</button>';
  }).join('');
}

/* ── GRADE SEMANAL ── */
var DAYNAMES=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
function renderSchedUI() {
  var wrap=document.getElementById('sched-edit-wrap'); if(!wrap) return;
  var wColors=['var(--blue)','var(--green)','var(--purple)','var(--orange)','#e91e63','#607d8b'];
  var wBgs=['#e8f0fe','#e6f4ea','#f3e5f5','#fff3e0','#fce4ec','#f8f9fa'];
  var cCol={rest:'var(--sub)',l:'var(--orange)'}, cBg={rest:'#f8f9fa',l:'#fff3e0'};
  sw.forEach(function(w,i){ cCol[String(w.id)]=wColors[i%6]; cBg[String(w.id)]=wBgs[i%6]; });
  wrap.innerHTML = DAYNAMES.map(function(dn,idx){
    var cur=String(SCHEDULE[idx]||'rest'), col=cCol[cur]||'var(--blue)', bg=cBg[cur]||'#e8f0fe';
    var opts='<option value="rest">🛌 Descanso</option><option value="l">🏃 Treino Livre</option>';
    sw.forEach(function(w){ opts+='<option value="'+w.id+'">'+(CAT_EMOJI[w.category]||'⭐')+' '+w.name+'</option>'; });
    opts=opts.replace('value="'+cur+'"','value="'+cur+'" selected');
    return '<div class="sched-edit-day"><div class="dn">'+dn+'</div>'
      +'<select class="sched-sel" data-day="'+idx+'" onchange="updSchedColor(this)"'
      +' style="background:'+bg+';color:'+col+';border-color:'+col+'">'+opts+'</select></div>';
  }).join('');
}
function updSchedColor(sel) {
  var cCol={rest:'var(--sub)',l:'var(--orange)',a:'var(--blue)',b:'var(--green)',c:'var(--purple)'};
  var cBg={rest:'#f8f9fa',l:'#fff3e0',a:'#e8f0fe',b:'#e6f4ea',c:'#f3e5f5'};
  var v=sel.value, col=cCol[v]||'var(--blue)', bg=cBg[v]||'#e8f0fe';
  sel.style.background=bg; sel.style.color=col; sel.style.borderColor=col;
}
function saveSched() {
  document.querySelectorAll('.sched-sel').forEach(function(s){ SCHEDULE[parseInt(s.dataset.day)]=s.value; });
  localStorage.setItem('reneschedule',JSON.stringify(SCHEDULE));
  apiPost({action:'saveSchedule',schedule:SCHEDULE});
  initHome();
  var btn=document.getElementById('sched-save-btn');
  if(btn){btn.textContent='✓ Salvo!'; setTimeout(function(){btn.textContent='Salvar Grade';},2000);}
}

/* ── TREINOS PADRÃO ── */
function initDefaultWorkouts() {
  if(sw.length) return;
  sw=[
    {id:1,name:'Treino A — Superior/Core',  category:'a',exercises:['a1','a2','a3','a4','a5','a6','a7','a8'],created:new Date().toLocaleDateString('pt-BR')},
    {id:2,name:'Treino B — Inferior/Glúteos',category:'b',exercises:['b1','b2','b3','b4','b5','b6','b7'],  created:new Date().toLocaleDateString('pt-BR')},
    {id:3,name:'Treino C — Full Body/Cardio', category:'c',exercises:['c1','c2','c3','c4','c5','c6','c7'], created:new Date().toLocaleDateString('pt-BR')}
  ];
  cacheSW();
}

/* ── WORKOUT ── */
var activeType='', wIds=[], checked=new Set(), activeExPesos={};

function startSavedWorkout(id) {
  var w=sw.find(function(x){ return String(x.id)===String(id); });
  if(!w) return;
  activeType=w.category||'l'; wIds=w.exercises||[]; checked=new Set(); activeExPesos={};
  var badge=document.getElementById('w-badge');
  badge.textContent=WN[activeType]||w.name;
  badge.style.background=WBG[activeType]||'#e8f0fe';
  badge.style.color=WC[activeType]||'var(--blue)';
  setTxt('w-title',w.name);
  setTxt('w-sub',wIds.length+' exercícios · '+(WN[w.category]||''));
  updateProg();

  var html='';
  wIds.forEach(function(eid,i){
    var ex=EX[eid]; if(!ex) return;
    var imgBlock = ex.img
      ? '<img id="img-'+eid+'" class="img-a" src="'+ex.img+'" onerror="showFb(\''+eid+'\')">'
        +'<div id="fb-'+eid+'" class="img-fb"><span style="font-size:36px">'+(CAT_EMOJI[ex.cat]||'🏋️')+'</span><span>'+ex.name+'</span></div>'
      : '<div id="fb-'+eid+'" class="img-fb" style="display:flex"><span style="font-size:36px">'+(CAT_EMOJI[ex.cat]||'🏋️')+'</span><span>'+ex.name+'</span></div>';
    var muscles=(ex.muscles||[]).map(function(m){return '<span class="mpill">'+m+'</span>';}).join('');
    html+='<div class="ex-card" id="card-'+eid+'">'
      +'<div class="img-wrap">'+imgBlock
      +'<div class="mpills">'+muscles+'</div>'
      +(ex.img?'<button class="img-view-btn" onclick="viewExImg(\''+eid+'\')" title="Ampliar"><span class="mi">fullscreen</span></button>':'')
      +'</div>'
      +'<div class="ex-body">'
      +'<div class="ex-num">Exercício '+(i+1)+'</div>'
      +'<div class="ex-name">'+ex.name+'</div>'
      +'<div class="chips">'
      +'<span class="chip" style="background:#e8f0fe;color:var(--blue)"><span class="mi">repeat</span>'+ex.sets+'</span>'
      +'<span class="chip" style="background:#fce4ec;color:#c2185b"><span class="mi">fitness_center</span>'+ex.reps+'</span>'
      +'</div>'
      +'<div class="peso-row">'
      +'<label class="peso-label">Carga utilizada (opcional)</label>'
      +'<div class="peso-inp-wrap"><input type="number" id="peso-'+eid+'" class="peso-inp" placeholder="0" min="0" step="0.5"><span class="peso-unit">kg</span></div>'
      +'</div>'
      +'<button class="check-btn" id="check-'+eid+'" onclick="checkEx(\''+eid+'\')">'
      +'<span class="mi">radio_button_unchecked</span> Concluir exercício</button>'
      +'</div></div>';
  });
  document.getElementById('ex-grid').innerHTML=html;
  showScreen('workout');
}

function viewExImg(eid) {
  var ex=EX[eid]; if(!ex||!ex.img) return;
  var modal=document.getElementById('img-modal'); if(!modal) return;
  document.getElementById('img-modal-src').src=ex.img;
  setTxt('img-modal-name',ex.name);
  modal.style.display='flex';
}
function closeImgModal() {
  var m=document.getElementById('img-modal'); if(m) m.style.display='none';
}

function checkEx(id) {
  var pesoEl=document.getElementById('peso-'+id);
  var peso=pesoEl?parseFloat(pesoEl.value)||null:null;
  if(peso) activeExPesos[id]=peso;
  checked.add(id);
  var btn=document.getElementById('check-'+id), card=document.getElementById('card-'+id);
  if(btn){btn.classList.add('checked');btn.innerHTML='<span class="mi">check_circle</span> Concluído!';btn.disabled=true;}
  if(card) card.classList.add('done');
  updateProg();
  if(checked.size>=wIds.length) setTimeout(finishWorkout,600);
}
function updateProg() {
  var t=wIds.length,d=checked.size,pct=t?Math.round(d/t*100):0;
  document.getElementById('prog-fill').style.width=pct+'%';
  setTxt('prog-txt',d+' / '+t+' exercícios');
}
function finishWorkout() {
  var today=todayStr();
  var entry={date:today,type:activeType,name:WN[activeType]||'Personalizado',calories:0,pesos:activeExPesos};
  var i=hist.findIndex(function(x){return parseDate(x.date)===today&&x.type!=='peso';});
  if(i>=0) hist[i]=entry; else hist.unshift(entry);
  cacheHist();
  setVal('cg-cal',''); setVal('cg-peso','');
  showScreen('congrats');
}
function saveCongrats() {
  var cal  = parseInt(document.getElementById('cg-cal').value)||0;
  var peso = parseFloat(document.getElementById('cg-peso').value)||null;
  var today = todayStr();
  var i = hist.findIndex(function(x){ return parseDate(x.date)===today && x.type!=='peso'; });
  if (i >= 0) {
    hist[i].calories = cal;
    if (peso) hist[i].peso = peso;
    cacheHist();
    apiPost({ action:'saveHistory', date:hist[i].date, type:hist[i].type,
              name:hist[i].name, calories:cal, peso:peso });
  }
  if (peso) {
    var pi = hist.findIndex(function(x){ return parseDate(x.date)===today && x.type==='peso'; });
    if (pi >= 0) hist[pi].peso = peso;
    else hist.unshift({ date:today, type:'peso', name:'Peso registrado', calories:0, peso:peso });
    cacheHist();
  }
  showScreen('home'); initHome();
}

/* ── CALENDAR ── */
var selCalWorkoutId=null;
function initCal() {
  var d=document.getElementById('cal-date'); if(d&&!d.value) d.value=todayStr();
}
function renderCalWorkouts() {
  var grid=document.getElementById('cal-workout-grid'); if(!grid) return;
  var opts=[{id:'a',label:'Treino A',icon:'💪',col:'var(--blue)',bg:'#e8f0fe'},
            {id:'b',label:'Treino B',icon:'🦵',col:'var(--green)',bg:'#e6f4ea'},
            {id:'c',label:'Treino C',icon:'🔥',col:'var(--purple)',bg:'#f3e5f5'},
            {id:'l',label:'Treino Livre',icon:'🏃',col:'var(--orange)',bg:'#fff3e0'}];
  sw.forEach(function(w){
    opts.push({id:String(w.id),label:w.name,icon:CAT_EMOJI[w.category]||'⭐',
               col:'var(--blue)',bg:'#e8f0fe'});
  });
  grid.innerHTML=opts.map(function(o){
    return '<button class="cal-w-btn" id="calw-'+o.id+'" onclick="selCalWT(\''+o.id+'\')"'
      +' style="background:'+o.bg+';color:'+o.col+';border:2px solid transparent">'
      +'<div style="font-size:22px">'+o.icon+'</div><div style="font-size:12px;font-weight:700;margin-top:4px">'+o.label+'</div></button>';
  }).join('');
}
function selCalWT(id) {
  selCalWorkoutId=id;
  document.querySelectorAll('.cal-w-btn').forEach(function(b){
    b.style.border='2px solid transparent';
    b.style.boxShadow='';
  });
  var el=document.getElementById('calw-'+id);
  if(el){ el.style.border='2px solid currentColor'; el.style.boxShadow='0 2px 8px rgba(0,0,0,.15)'; }
  var name=WN[id]||((sw.find(function(w){return String(w.id)===id;}))||{}).name||id;
  setTxt('cal-sel-name','✓ Selecionado: '+name);
}
function saveActivity() {
  var date = document.getElementById('cal-date').value;
  if(!date){ alert('Selecione a data do treino.'); return; }
  if(!selCalWorkoutId){ alert('Selecione o tipo de treino.'); return; }
  var cal  = parseInt(document.getElementById('cal-cal').value)||0;
  var peso = parseFloat(document.getElementById('cal-peso').value)||null;
  var wObj = sw.find(function(w){return String(w.id)===selCalWorkoutId;});
  var type = wObj?wObj.category:selCalWorkoutId;
  var name = WN[type]||wObj&&wObj.name||selCalWorkoutId;
  var entry= {date:parseDate(date)||date, type:type, name:name, calories:cal};
  if(peso) entry.peso=peso;
  var i=hist.findIndex(function(x){return parseDate(x.date)===parseDate(date)&&x.type!=='peso';});
  if(i>=0) hist[i]=entry; else hist.unshift(entry);
  cacheHist();
  if(peso){
    var pi=hist.findIndex(function(x){return parseDate(x.date)===parseDate(date)&&x.type==='peso';});
    if(pi>=0) hist[pi].peso=peso; else hist.push({date:parseDate(date)||date,type:'peso',name:'Peso registrado',calories:0,peso:peso});
    cacheHist();
  }
  apiPost({action:'saveHistory',date:entry.date,type:entry.type,name:entry.name,calories:cal,peso:peso});
  setVal('cal-cal',''); setVal('cal-peso','');
  selCalWorkoutId=null;
  document.querySelectorAll('.cal-w-btn').forEach(function(b){b.style.border='2px solid transparent';});
  setTxt('cal-sel-name','');
  renderHist();
  var btn=document.getElementById('cal-save-btn');
  if(btn){btn.textContent='✓ Registrado!';setTimeout(function(){btn.innerHTML='<span class="mi">save</span> Salvar Registro';},2000);}
}
function renderHist() {
  var list=document.getElementById('cal-hist'); if(!list) return;
  var items=hist.filter(function(x){return x.type!=='peso';}).slice(0,20);
  if(!items.length){list.innerHTML='<div class="empty"><span class="mi">event_available</span>Nenhum treino registrado ainda</div>';return;}
  list.innerHTML=items.map(function(h){
    var ico=CAT_EMOJI[h.type]||'⭐';
    return '<div class="hist-item">'
      +'<div style="font-size:20px">'+ico+'</div>'
      +'<div style="flex:1"><div class="hist-name">'+h.name+'</div><div class="hist-date">'+fmtDate(h.date)+'</div></div>'
      +(h.calories?'<div class="hist-cal">🔥 '+h.calories+' kcal</div>':'')
      +(h.peso?'<div class="hist-peso">⚖️ '+h.peso+' kg</div>':'')
      +'</div>';
  }).join('');
}

/* ── DASHBOARD ── */
var dashPeriod=7, dashFrom=null, dashTo=null;
var chWeek=null, chCal=null, chTypes=null, chPeso=null;

function initDashDates() {
  var td=todayStr(), wd=new Date(); wd.setDate(wd.getDate()-7);
  setVal('dt',td); setVal('df',wd.toISOString().split('T')[0]);
}
function setPeriod(p,btn) {
  document.querySelectorAll('.p-btn').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
  var cw=document.getElementById('custom-wrap'); if(cw) cw.classList.remove('show');
  if(p==='custom'){ if(cw) cw.classList.add('show'); return; }
  dashPeriod=p; dashFrom=null; dashTo=null; renderDash();
}
function applyCustom() {
  dashFrom=document.getElementById('df').value;
  dashTo=document.getElementById('dt').value;
  renderDash();
}
function getDashHist() {
  if(dashFrom&&dashTo) return hist.filter(function(h){return h.date>=dashFrom&&h.date<=dashTo;});
  var cutoff=new Date(); cutoff.setDate(cutoff.getDate()-dashPeriod);
  var cs=cutoff.toISOString().split('T')[0];
  return hist.filter(function(h){return h.date>=cs;});
}
function renderDash() {
  var items=getDashHist().filter(function(x){return x.type!=='peso';});
  var all  =getDashHist();

  /* stats */
  var total=items.length;
  var totalCal=items.reduce(function(s,x){return s+(x.calories||0);},0);
  var streak=calcStreak();
  var typeCount={};
  items.forEach(function(h){typeCount[h.type]=(typeCount[h.type]||0)+1;});
  var fav=Object.keys(typeCount).sort(function(a,b){return typeCount[b]-typeCount[a];})[0];
  setTxt('st-total',total); setTxt('st-cal',totalCal||'—');
  setTxt('st-streak',streak+'d'); setTxt('st-fav',fav?CAT_EMOJI[fav]+(WN[fav]||fav):'—');

  /* gráfico semana */
  var days=[]; var now=new Date();
  for(var i=Math.min(dashPeriod,30)-1;i>=0;i--){
    var d=new Date(now); d.setDate(d.getDate()-i);
    days.push(d.toISOString().split('T')[0]);
  }
  var weekCounts=days.map(function(d){return items.filter(function(h){return parseDate(h.date)===d;}).length;});
  var calByDay  =days.map(function(d){return items.filter(function(h){return parseDate(h.date)===d;}).reduce(function(s,x){return s+(x.calories||0);},0);});

  /* gráfico tipos */
  var typeLabels=Object.keys(typeCount).map(function(k){return (WN[k]||k);});
  var typeVals  =Object.keys(typeCount).map(function(k){return typeCount[k];});

  /* gráfico peso */
  var pesoItems=all.filter(function(x){return x.peso&&x.type==='peso';}).sort(function(a,b){return a.date<b.date?-1:1;});
  var pesoLabels=pesoItems.map(function(x){return fmtDateShort(x.date);});
  var pesoVals  =pesoItems.map(function(x){return x.peso;});

  /* destruir charts antigos */
  if(chWeek) {chWeek.destroy();chWeek=null;}
  if(chCal)  {chCal.destroy(); chCal=null;}
  if(chTypes){chTypes.destroy();chTypes=null;}
  if(chPeso) {chPeso.destroy();chPeso=null;}

  var ctx1=document.getElementById('ch-week');
  var ctx2=document.getElementById('ch-cal');
  var ctx3=document.getElementById('ch-types');
  var ctx4=document.getElementById('ch-peso');

  var dayLabels=days.map(function(d){return fmtDateShort(d);});

  if(ctx1) chWeek=new Chart(ctx1,{type:'bar',data:{labels:dayLabels,datasets:[{label:'Treinos',data:weekCounts,backgroundColor:'rgba(26,115,232,.7)',borderRadius:6}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}}}}});
  if(ctx2) chCal =new Chart(ctx2,{type:'line',data:{labels:dayLabels,datasets:[{label:'Kcal',data:calByDay,borderColor:'var(--orange)',backgroundColor:'rgba(245,124,0,.12)',fill:true,tension:.4,pointRadius:3}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});
  if(ctx3) chTypes=new Chart(ctx3,{type:'doughnut',data:{labels:typeLabels,datasets:[{data:typeVals,backgroundColor:['#1a73e8','#0f9d58','#9c27b0','#f57c00']}]},options:{responsive:true,plugins:{legend:{position:'bottom'}}}});
  if(ctx4){
    if(pesoVals.length>=1){
      chPeso=new Chart(ctx4,{type:'line',data:{labels:pesoLabels,datasets:[{label:'Peso (kg)',data:pesoVals,borderColor:'#e91e63',backgroundColor:'rgba(233,30,99,.1)',fill:true,tension:.4,pointRadius:4,pointBackgroundColor:'#e91e63'}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{title:{display:true,text:'kg'}}}}});
    } else {
      ctx4.getContext('2d');
      document.getElementById('peso-chart-empty').style.display='block';
    }
  }
}
function calcStreak() {
  var days=hist.filter(function(x){return x.type!=='peso';}).map(function(x){return parseDate(x.date);}).filter(Boolean);
  var unique=[...new Set(days)].sort().reverse();
  var streak=0, cur=todayStr();
  for(var i=0;i<unique.length;i++){
    if(unique[i]===cur){streak++;var d=new Date(cur);d.setDate(d.getDate()-1);cur=d.toISOString().split('T')[0];}
    else break;
  }
  return streak;
}

/* ── BANK ── */
var selBank=new Set();
function renderBank() {
  var cats=[{id:'a',label:'Treino A — Superior/Core'},{id:'b',label:'Treino B — Inferior/Glúteos'},
            {id:'c',label:'Treino C — Full Body/Cardio'},{id:'l',label:'Treino Livre'}];
  cats.forEach(function(cat){
    var panel=document.getElementById('bp-'+cat.id); if(!panel) return;
    var exList=Object.keys(EX).filter(function(k){return EX[k].cat===cat.id;});
    panel.innerHTML='<div class="bank-section">'+exList.map(function(eid){
      var ex=EX[eid];
      return '<div class="bank-card">'
        +(ex.img?'<button class="bank-view-btn" onclick="viewExImg(\''+eid+'\')" title="Ver imagem"><span class="mi">image</span></button>':'')
        +'<div class="bank-info"><div class="bank-name">'+ex.name+'</div>'
        +'<div class="bank-meta">'+ex.sets+' · '+ex.reps+'</div>'
        +'<div class="bank-muscles">'+(ex.muscles||[]).join(', ')+'</div></div>'
        +'<button class="bank-btn" id="bb-'+eid+'" onclick="toggleBank(\''+eid+'\')">'
        +'<span class="mi">add_circle_outline</span> Adicionar</button>'
        +'</div>';
    }).join('')+'</div>';
  });
}
function toggleBank(eid) {
  var btn=document.getElementById('bb-'+eid);
  if(selBank.has(eid)){
    selBank.delete(eid);
    if(btn){btn.innerHTML='<span class="mi">add_circle_outline</span> Adicionar';btn.style.background='';}
  } else {
    selBank.add(eid);
    if(btn){btn.innerHTML='<span class="mi">check_circle</span> Adicionado';btn.style.background='#e6f4ea';}
  }
  setTxt('sel-count',selBank.size+' selecionado'+(selBank.size!==1?'s':''));
}
function switchBankTab(id,btn) {
  document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('on');});
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('on');});
  var panel=document.getElementById('bp-'+id); if(panel) panel.classList.add('on');
  if(btn) btn.classList.add('on');
}
async function saveWorkout() {
  var name=(document.getElementById('cw-inp').value||'').trim();
  if(!name){alert('Dê um nome ao treino.');return;}
  if(!selBank.size){alert('Selecione pelo menos 1 exercício.');return;}
  var exArr=Array.from(selBank);
  var cats=exArr.map(function(e){return EX[e]?EX[e].cat:null;}).filter(Boolean);
  var catCount={};
  cats.forEach(function(c){catCount[c]=(catCount[c]||0)+1;});
  var dominantCat=Object.keys(catCount).sort(function(a,b){return catCount[b]-catCount[a];})[0]||'l';
  var w={id:Date.now(),name:name,category:dominantCat,exercises:exArr,created:new Date().toLocaleDateString('pt-BR')};
  sw.push(w); cacheSW();
  await apiPost({action:'saveWorkout',...w});
  selBank.clear();
  setVal('cw-inp','');
  setTxt('sel-count','0 selecionados');
  document.querySelectorAll('.bank-btn').forEach(function(b){b.innerHTML='<span class="mi">add_circle_outline</span> Adicionar';b.style.background='';});
  renderBank(); renderSW(); initHome();
  switchBankTab('saved',document.querySelectorAll('.tab-btn')[4]);
}
function renderSW() {
  var list=document.getElementById('sw-list'); if(!list) return;
  if(!sw.length){list.innerHTML='<div class="empty"><span class="mi">folder_open</span>Nenhum treino personalizado salvo ainda.</div>';return;}
  list.innerHTML=sw.map(function(w){
    return '<div class="sw-item">'
      +'<div><div class="sw-name">'+(CAT_EMOJI[w.category]||'⭐')+' '+w.name+'</div>'
      +'<div class="sw-meta">'+(w.exercises||[]).length+' exercícios · Criado '+w.created+'</div></div>'
      +'<div class="sw-actions">'
      +'<button class="sw-btn" onclick="startSavedWorkout('+w.id+')"><span class="mi">play_arrow</span> Treinar</button>'
      +'<button class="sw-btn del" onclick="delSW('+w.id+')"><span class="mi">delete</span></button>'
      +'</div></div>';
  }).join('');
}
async function delSW(id) {
  sw=sw.filter(function(x){return String(x.id)!==String(id);}); cacheSW();
  await apiPost({action:'deleteWorkout',id:String(id)});
  renderSW(); initHome();
}

/* ── IMAGENS ── */
function showFb(eid) {
  var fb=document.getElementById('fb-'+eid), im=document.getElementById('img-'+eid);
  if(fb) fb.style.display='flex';
  if(im) im.style.display='none';
}

/* ── INIT ── */
window.addEventListener('DOMContentLoaded', function(){
  try { checkStoredLogin(); } catch(e){ console.error('init error:',e); }
  initDashDates();
});

