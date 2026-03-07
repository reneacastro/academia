/* ================================================================
   app.js - Academia do Rene
   ================================================================ */

/* -- UTILS ------------------------------------------------------ */
function todayStr() { return new Date().toISOString().split('T')[0]; }
function parseDate(raw) {
  if (!raw) return null;
  var s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) { var p=s.split('/'); return p[2]+'-'+p[1]+'-'+p[0]; }
  var dt = new Date(s); return isNaN(dt) ? null : dt.toISOString().split('T')[0];
}
function fmtDate(raw) {
  var s=parseDate(raw); if(!s) return '--';
  return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});
}
function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) { return String(s||'').replace(/'/g,'&#39;').replace(/"/g,'&quot;'); }

/* -- CACHE ------------------------------------------------------ */
var hist = JSON.parse(localStorage.getItem('rene_hist') || '[]');
var sw   = JSON.parse(localStorage.getItem('rene_sw')   || '[]');
function cacheHist() { localStorage.setItem('rene_hist', JSON.stringify(hist)); }
function cacheSW()   { localStorage.setItem('rene_sw',   JSON.stringify(sw));   }

/* -- AUTH ------------------------------------------------------- */
var currentUser = null;

function checkStoredLogin() {
  var u = localStorage.getItem('rene_user');
  if (u) { currentUser = JSON.parse(u); afterLogin(); }
  else   { loadProfilesForLogin(); showScreen('profile'); }
}

function logout() { localStorage.clear(); location.reload(); }

function afterLogin() {
  var el = document.getElementById('bar-user');
  if (el) { el.textContent = currentUser.name || ''; el.style.display = 'block'; }
  var lo = document.getElementById('btn-logout'); if (lo) lo.style.display = 'flex';
  initDefaultWorkouts();
  showScreen('home');
  renderSchedUI();
  renderHomeSavedWorkouts();
  initHome();
  loadFromSheets();
}

/* -- PERFIS SALVOS (acesso rapido) ----------------------------- */
function loadProfilesForLogin() {
  // Busca profiles salvos no Sheets para exibir acesso rapido
  fetch(API + '?action=listProfiles', { redirect: 'follow' })
    .then(function(r) { return r.text(); })
    .then(function(t) {
      try {
        var list = JSON.parse(t);
        if (Array.isArray(list) && list.length) renderProfileList(list);
      } catch(e) {}
    })
    .catch(function() {});
}

function renderProfileList(list) {
  var wrap = document.getElementById('profile-list-wrap');
  if (!wrap) return;
  wrap.style.display = 'block';
  wrap.innerHTML = '<div class="plist-title">Acessar como</div>'
    + list.map(function(p) {
      var initials = ((p.nome||'').charAt(0) + (p.sobrenome||'').charAt(0)).toUpperCase() || '?';
      var goal = { emagrecimento:'Emagrecimento', massa:'Ganho de Massa', qualidade:'Qualidade de Vida', lesao:'Recuperacao de Lesao' }[p.objetivo] || '';
      return '<button class="plist-item" onclick="quickLogin(' + "'" + escAttr(JSON.stringify(p)) + "'" + ')">'
        + '<div class="plist-avatar">' + initials + '</div>'
        + '<div class="plist-info"><div class="plist-name">' + escHtml(p.nome + (p.sobrenome?' '+p.sobrenome:'')) + '</div>'
        + (goal ? '<div class="plist-goal">' + escHtml(goal) + '</div>' : '')
        + '</div><span class="mi">chevron_right</span></button>';
    }).join('');
}

function quickLogin(profileJson) {
  var p = JSON.parse(profileJson);
  currentUser = {
    uid:      p.uid,
    name:     p.nome + (p.sobrenome ? ' ' + p.sobrenome : ''),
    email:    (p.nome||'user').toLowerCase() + '@local',
    altura:   p.altura || '',
    peso:     p.peso   || '',
    objetivo: p.objetivo || ''
  };
  localStorage.setItem('rene_user', JSON.stringify(currentUser));
  afterLogin();
}

/* -- PERFIL ---------------------------------------------------- */
function saveProfile() {
  var nome      = (document.getElementById('prf-nome')      || {}).value || '';
  var sobrenome = (document.getElementById('prf-sobrenome') || {}).value || '';
  var altura    = (document.getElementById('prf-altura')    || {}).value || '';
  var peso      = (document.getElementById('prf-peso')      || {}).value || '';
  var objetivo  = (document.getElementById('prf-objetivo')  || {}).value || '';
  if (!nome.trim()) { alert('Informe pelo menos seu nome.'); return; }
  var uid = btoa((nome + sobrenome).toLowerCase().replace(/\s+/g,''))
              .replace(/[^a-z0-9]/gi,'').slice(0,20) || 'user' + Date.now();
  currentUser = {
    uid: uid, name: nome.trim() + (sobrenome.trim() ? ' '+sobrenome.trim() : ''),
    email: nome.toLowerCase().replace(/\s+/g,'') + '@local',
    altura: altura, peso: peso, objetivo: objetivo
  };
  localStorage.setItem('rene_user', JSON.stringify(currentUser));
  apiPost({ action:'saveProfile', nome:nome, sobrenome:sobrenome, altura:altura, peso:peso, objetivo:objetivo });
  afterLogin();
}

function openProfile() {
  if (currentUser) {
    var parts = (currentUser.name||'').split(' ');
    var el;
    if ((el=document.getElementById('prf-nome')))      el.value = parts[0]||'';
    if ((el=document.getElementById('prf-sobrenome'))) el.value = parts.slice(1).join(' ')||'';
    if ((el=document.getElementById('prf-altura')))    el.value = currentUser.altura||'';
    if ((el=document.getElementById('prf-peso')))      el.value = currentUser.peso||'';
    if ((el=document.getElementById('prf-objetivo')))  el.value = currentUser.objetivo||'';
    // marca objetivo visual
    document.querySelectorAll('.goal-opt').forEach(function(o){
      o.classList.toggle('selected', o.dataset.goal === currentUser.objetivo);
    });
  }
  showScreen('profile');
}

function selectGoal(el, val) {
  document.querySelectorAll('.goal-opt').forEach(function(o){ o.classList.remove('selected'); });
  el.classList.add('selected');
  document.getElementById('prf-objetivo').value = val;
}

/* -- SYNC ------------------------------------------------------ */
function setSyncStatus(state, msg) {
  var dot=document.getElementById('sync-dot'), txt=document.getElementById('sync-txt');
  if (!dot||!txt) return;
  dot.className = 'sync-dot ' + state;
  txt.textContent = msg;
}

async function apiPost(payload) {
  if (!currentUser) return;
  payload.uid = currentUser.uid;
  var body = JSON.stringify(payload);
  try {
    try { await fetch(API, { method:'POST', redirect:'follow', headers:{'Content-Type':'text/plain'}, body:body }); }
    catch(_) { await fetch(API, { method:'POST', mode:'no-cors', body:body }); }
  } catch(e) { console.warn('apiPost falhou:', e); }
}

async function loadFromSheets() {
  if (!currentUser) return;
  setSyncStatus('syncing','Sincronizando...');
  var timer = setTimeout(function(){ setSyncStatus('err','Sem conexao - dados locais'); }, 9000);
  try {
    var uid = encodeURIComponent(currentUser.uid);
    var [hRes,wRes,sRes,pRes] = await Promise.all([
      fetch(API+'?action=getHistory&uid='+uid,  { redirect:'follow' }),
      fetch(API+'?action=getWorkouts&uid='+uid, { redirect:'follow' }),
      fetch(API+'?action=getSchedule&uid='+uid, { redirect:'follow' }),
      fetch(API+'?action=getProfile&uid='+uid,  { redirect:'follow' })
    ]);
    var hData=[],wData=[],sData=null,pData=null;
    try { hData = JSON.parse(await hRes.text()); } catch(_){}
    try { wData = JSON.parse(await wRes.text()); } catch(_){}
    try { sData = JSON.parse(await sRes.text()); } catch(_){}
    try { pData = JSON.parse(await pRes.text()); } catch(_){}

    if (Array.isArray(hData)) {
      hist = hData.map(function(r){ return Object.assign({},r,{date:parseDate(r.date)||r.date}); })
                  .filter(function(r){ return r.date; });
      cacheHist();
    }
    if (Array.isArray(wData) && wData.length) { sw = wData; cacheSW(); }
    if (sData && typeof sData==='object' && !Array.isArray(sData)) {
      SCHEDULE = sData; localStorage.setItem('rene_schedule', JSON.stringify(sData));
    }
    if (pData && typeof pData==='object' && !pData.error) {
      if (!currentUser.altura && pData.altura) currentUser.altura = pData.altura;
      if (!currentUser.peso   && pData.peso)   currentUser.peso   = pData.peso;
      if (!currentUser.objetivo && pData.objetivo) currentUser.objetivo = pData.objetivo;
      localStorage.setItem('rene_user', JSON.stringify(currentUser));
    }
    clearTimeout(timer);
    setSyncStatus('ok','Sincronizado');
    initDefaultWorkouts(); initHome(); renderSchedUI(); renderHomeSavedWorkouts();
    renderHist(); renderCalWorkouts();
    if (document.getElementById('s-dashboard').classList.contains('active')) renderDash();
    if (document.getElementById('s-bank').classList.contains('active'))      renderSW();
  } catch(e) {
    clearTimeout(timer);
    setSyncStatus('err','Offline - dados locais');
    console.error('loadFromSheets:', e);
  }
}

/* -- SCREENS --------------------------------------------------- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  var target = document.getElementById('s-'+id); if (!target) return;
  target.classList.add('active');
  var bb = document.getElementById('back-btn');
  if (bb) bb.style.display = (id==='home'||id==='profile') ? 'none' : 'flex';
  var labels = {
    home:'Hub de Treinos', workout:'Treino em andamento',
    calendar:'Registro de Treino', dashboard:'Meu progresso',
    bank:'Banco de exercicios', congrats:'Treino concluido!',
    profile: currentUser ? 'Meu Perfil' : 'Bem-vindo!'
  };
  var sub = document.getElementById('bar-sub'); if (sub) sub.textContent = labels[id]||'';
  if (id==='dashboard') { initDashDates(); renderDash(); }
  if (id==='calendar')  { renderHist(); initCal(); renderCalWorkouts(); }
  if (id==='bank')      { renderSW(); renderBank(); }
  window.scrollTo(0,0);
}

/* -- HOME ------------------------------------------------------ */
function initHome() {
  var h = new Date().getHours();
  var g = h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  var name = currentUser ? (currentUser.name||'').split(' ')[0] : 'Rene';
  var grEl = document.getElementById('h-greeting'); if (grEl) grEl.textContent = g + ', ' + name + '! 👋';
  var t = SCHEDULE[new Date().getDay()];
  ['a','b','c','l'].forEach(function(x){
    var el = document.getElementById('badge-'+x);
    if (el) el.style.display = (t===x) ? 'inline-block' : 'none';
  });
  var today = todayStr();
  var td = hist.find(function(i){ return parseDate(i.date)===today; });
  var subEl = document.getElementById('h-sub');
  if (subEl) {
    if (td)              subEl.textContent = 'Treino de hoje: ' + td.name + ' OK';
    else if (t==='rest') subEl.textContent = 'Dia de descanso hoje';
    else                 subEl.textContent = 'Sugerido hoje: ' + (WN[t]||t);
  }
  renderHomeSavedWorkouts();
}

function renderHomeSavedWorkouts() {
  var grid = document.getElementById('home-sw-grid'); if (!grid) return;
  if (!sw.length) { grid.innerHTML=''; return; }
  var catColors = {a:'var(--blue)',b:'var(--green)',c:'var(--purple)',l:'var(--orange)'};
  var catEmoji  = {a:'💪',b:'🦵',c:'🔥',l:'🏃'};
  grid.innerHTML = sw.map(function(w){
    var col = catColors[w.category||'l']||'var(--blue)';
    var ico = catEmoji[w.category||'l']||'⭐';
    return '<button class="menu-card" onclick="startWorkout(\''+escAttr(w.id)+'\')">'
      +'<div class="mc-icon" style="background:'+col+'"><span style="font-size:20px;">'+ico+'</span></div>'
      +'<div class="mc-name">'+escHtml(w.name)+'</div>'
      +'<div class="mc-sub">'+(WN[w.category]||'Treino')+'</div>'
      +'</button>';
  }).join('');
}

/* -- GRADE SEMANAL --------------------------------------------- */
var DAYNAMES  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];
var CAT_COLORS = {rest:'var(--sub)',l:'var(--orange)',a:'var(--blue)',b:'var(--green)',c:'var(--purple)'};
var CAT_BG     = {rest:'#f8f9fa',l:'#fff3e0',a:'#e8f0fe',b:'#e6f4ea',c:'#f3e5f5'};

function renderSchedUI() {
  var wrap = document.getElementById('sched-edit-wrap'); if (!wrap) return;
  var wColors = ['var(--blue)','var(--green)','var(--purple)','var(--orange)','#e91e63','#607d8b'];
  var wBgs    = ['#e8f0fe','#e6f4ea','#f3e5f5','#fff3e0','#fce4ec','#f8f9fa'];
  var cc = Object.assign({},CAT_COLORS), cb = Object.assign({},CAT_BG);
  sw.forEach(function(w,i){ cc[String(w.id)]=wColors[i%6]; cb[String(w.id)]=wBgs[i%6]; });
  wrap.innerHTML = DAYNAMES.map(function(dn,idx){
    var cur = String(SCHEDULE[idx]||'rest');
    var opts = '<option value="rest">Descanso</option><option value="l">Livre</option>';
    sw.forEach(function(w){
      var short = w.name.length>10 ? w.name.slice(0,10)+'...' : w.name;
      opts += '<option value="'+escAttr(String(w.id))+'">'+escHtml(short)+'</option>';
    });
    return '<div class="sched-edit-day"><span class="dn">'+dn+'</span>'
      +'<select class="sched-sel" data-idx="'+idx+'" onchange="schedSelChange(this)">'+opts+'</select></div>';
  }).join('');
  wrap.querySelectorAll('.sched-sel').forEach(function(sel){
    var idx = parseInt(sel.dataset.idx), val = String(SCHEDULE[idx]||'rest');
    sel.value = val; applySchedSelStyle(sel,val,cc,cb);
  });
}

function applySchedSelStyle(sel,val,cc,cb) {
  if (!cc) {
    cc=Object.assign({},CAT_COLORS); cb=Object.assign({},CAT_BG);
    var wC=['var(--blue)','var(--green)','var(--purple)','var(--orange)'];
    var wB=['#e8f0fe','#e6f4ea','#f3e5f5','#fff3e0'];
    sw.forEach(function(w,i){ cc[String(w.id)]=wC[i%4]; cb[String(w.id)]=wB[i%4]; });
  }
  sel.style.background  = cb[val]||'#e8f0fe';
  sel.style.color       = cc[val]||'var(--blue)';
  sel.style.borderColor = cc[val]||'var(--blue)';
}

function schedSelChange(sel) {
  SCHEDULE[parseInt(sel.dataset.idx)] = sel.value;
  applySchedSelStyle(sel, sel.value);
  saveSched(); initHome();
}
function saveSched() {
  localStorage.setItem('rene_schedule', JSON.stringify(SCHEDULE));
  apiPost({ action:'saveSchedule', schedule:SCHEDULE });
  setSyncStatus('ok','Salvo');
}

/* -- WORKOUTS PADRAO ------------------------------------------- */
var DEFAULT_WORKOUTS = [
  { id:'default_a', name:'Treino A - Superior', category:'a', exercises:['a1','a2','a3','a4','a5','a6','a7','a8'] },
  { id:'default_b', name:'Treino B - Inferior',  category:'b', exercises:['b1','b2','b3','b4','b5','b6','b7']     },
  { id:'default_c', name:'Treino C - Full Body', category:'c', exercises:['c1','c2','c3','c4','c5','c6','c7']     },
  { id:'default_l', name:'Treino Livre',          category:'l', exercises:['l1','l2','l3']                         }
];

function initDefaultWorkouts() {
  if (!sw.length) {
    sw = DEFAULT_WORKOUTS.map(function(d){ return Object.assign({},d,{created:todayStr()}); });
    cacheSW();
    sw.forEach(function(d){ apiPost(Object.assign({action:'saveWorkout'},d)); });
  }
}

/* -- IMAGENS via wger.de --------------------------------------- */
// Busca imagem pela API publica do wger.de e coloca no card
// Usa cache em memoria para nao repetir requests
function loadExerciseImage(wgerId, imgEl, fallbackEl) {
  if (!wgerId) { showImgFallback(imgEl, fallbackEl); return; }
  if (IMG_CACHE[wgerId] !== undefined) {
    if (IMG_CACHE[wgerId]) { imgEl.src = IMG_CACHE[wgerId]; imgEl.style.display='block'; }
    else showImgFallback(imgEl, fallbackEl);
    return;
  }
  fetch(WGER + wgerId + '/?format=json', { mode:'cors' })
    .then(function(r){ return r.json(); })
    .then(function(data){
      var imgs = data.images || [];
      if (imgs.length) {
        IMG_CACHE[wgerId] = imgs[0].image;
        imgEl.src = imgs[0].image;
        imgEl.style.display = 'block';
      } else {
        IMG_CACHE[wgerId] = null;
        showImgFallback(imgEl, fallbackEl);
      }
    })
    .catch(function(){
      IMG_CACHE[wgerId] = null;
      showImgFallback(imgEl, fallbackEl);
    });
}

function showImgFallback(imgEl, fallbackEl) {
  if (imgEl)     imgEl.style.display = 'none';
  if (fallbackEl) fallbackEl.classList.add('show');
}

/* -- INICIAR TREINO -------------------------------------------- */
var currentWorkout = null, checkedExs = {};

function startWorkout(wid) {
  var found = sw.find(function(w){ return String(w.id)===String(wid); });
  if (!found) { alert('Treino nao encontrado.'); return; }
  currentWorkout = found; checkedExs = {};
  var exIds = Array.isArray(found.exercises) ? found.exercises : [];
  var col   = WC[found.category]||'var(--blue)', bg = WBG[found.category]||'#e8f0fe';
  document.querySelector('.w-badge').textContent = WN[found.category]||found.category;
  document.querySelector('.w-badge').style.cssText = 'background:'+bg+';color:'+col+';';
  document.querySelector('.w-title').textContent = found.name;
  document.querySelector('.w-sub').textContent   = exIds.length + ' exercicios';
  updateProg(0, exIds.length);
  renderExGrid(exIds, col, bg);
  showScreen('workout');
}

function updateProg(done, total) {
  var pct = total ? Math.round(done/total*100) : 0;
  document.querySelector('.prog-fill').style.width = pct+'%';
  document.getElementById('prog-txt').textContent  = done+' / '+total+' exercicios concluidos';
}

function renderExGrid(exIds, col, bg) {
  var grid = document.querySelector('.ex-grid'); grid.innerHTML = '';
  exIds.forEach(function(eid, i) {
    var ex = EX[eid]; if (!ex) return;
    var card = document.createElement('div');
    card.className = 'ex-card'; card.id = 'ex-' + eid;
    var musclesPills = (ex.muscles||[]).map(function(m){ return '<span class="mpill">'+escHtml(m)+'</span>'; }).join('');
    var catEmoji = CAT_EMOJI[ex.cat] || '🏋';
    card.innerHTML =
      '<div class="img-wrap">'
      + (ex.wger_id
          ? '<img class="img-a" id="img-'+eid+'" style="display:none;" alt="'+escAttr(ex.name)+'">'
          : '')
      + '<div class="img-fb" id="fb-'+eid+'">'
      + '<span style="font-size:40px;">'+catEmoji+'</span>'
      + '<span>'+escHtml(ex.name)+'</span>'
      + '</div>'
      + '<div class="mpills">'+musclesPills+'</div>'
      + '</div>'
      + '<div class="ex-body">'
      + '<div class="ex-num">Exercicio '+(i+1)+'</div>'
      + '<div class="ex-name">'+escHtml(ex.name)+'</div>'
      + '<div class="chips">'
      + '<span class="chip" style="background:'+bg+';color:'+col+';"><span class="mi">fitness_center</span>'+escHtml(ex.sets)+'</span>'
      + '<span class="chip" style="background:#f1f3f4;color:var(--text);"><span class="mi">repeat</span>'+escHtml(ex.reps)+'</span>'
      + '</div>'
      + '<button class="check-btn" id="chk-'+eid+'" onclick="toggleEx(\''+eid+'\')">'
      + '<span class="mi">radio_button_unchecked</span>Marcar como feito</button>'
      + '</div>';
    grid.appendChild(card);
    // Carrega imagem de forma assincrona
    if (ex.wger_id) {
      var imgEl = document.getElementById('img-'+eid);
      var fbEl  = document.getElementById('fb-'+eid);
      loadExerciseImage(ex.wger_id, imgEl, fbEl);
    }
  });
}

function toggleEx(eid) {
  var exIds = currentWorkout ? (Array.isArray(currentWorkout.exercises)?currentWorkout.exercises:[]) : [];
  checkedExs[eid] = !checkedExs[eid];
  var card = document.getElementById('ex-'+eid), btn = document.getElementById('chk-'+eid);
  if (checkedExs[eid]) {
    if (card) card.classList.add('done');
    if (btn)  { btn.classList.add('checked'); btn.innerHTML='<span class="mi">check_circle</span>Feito!'; }
  } else {
    if (card) card.classList.remove('done');
    if (btn)  { btn.classList.remove('checked'); btn.innerHTML='<span class="mi">radio_button_unchecked</span>Marcar como feito'; }
  }
  var done = Object.values(checkedExs).filter(Boolean).length;
  updateProg(done, exIds.length);
  if (done===exIds.length && exIds.length>0) showCongrats();
}

function showCongrats() {
  if (!currentWorkout) return;
  var calEl = document.getElementById('congrats-cal-inp'); if (calEl) calEl.value='';
  var nameEl = document.getElementById('congrats-workout-name'); if (nameEl) nameEl.textContent = currentWorkout.name;
  showScreen('congrats');
}

function saveCongrats() {
  var calEl = document.getElementById('congrats-cal-inp');
  var cal = calEl ? (parseInt(calEl.value)||0) : 0;
  if (!currentWorkout) return;
  var entry = { date:todayStr(), type:currentWorkout.category, name:currentWorkout.name, calories:cal };
  var idx = hist.findIndex(function(h){ return parseDate(h.date)===entry.date; });
  if (idx>=0) hist[idx]=entry; else hist.unshift(entry);
  cacheHist();
  setSyncStatus('syncing','Salvando...');
  apiPost(Object.assign({action:'saveHistory'},entry)).then(function(){ setSyncStatus('ok','Salvo'); });
  showScreen('home'); initHome();
}

/* -- CALENDAR -------------------------------------------------- */
var calSelWorkoutId=null, calSelWorkoutName='';

function initCal() {
  var inp = document.getElementById('cal-date-inp');
  if (inp && !inp.value) inp.value = todayStr();
  onCalDateChange();
}

function onCalDateChange() {
  var val  = document.getElementById('cal-date-inp').value;
  var date = parseDate(val);
  var sug  = document.getElementById('cal-sug');
  if (date && sug) {
    var d=new Date(date+'T12:00:00').getDay(), sc=SCHEDULE[d];
    if (sc && sc!=='rest') {
      var wFound = sw.find(function(w){ return String(w.id)===String(sc); });
      var wname  = wFound ? wFound.name : (WN[sc]||sc);
      sug.innerHTML = '<strong>Sugestao para '+fmtDate(date)+'</strong>' + wname;
      sug.classList.add('show');
    } else { sug.innerHTML=''; sug.classList.remove('show'); }
  } else if (sug) { sug.innerHTML=''; sug.classList.remove('show'); }
}

function renderCalWorkouts() {
  var grid = document.getElementById('cal-workout-grid'); if (!grid) return;
  grid.innerHTML = sw.map(function(w) {
    var col = WC[w.category]||'var(--blue)', bg = WBG[w.category]||'#e8f0fe';
    return '<button class="cal-w-btn" style="background:'+bg+';color:'+col+';border:2px solid '+col+';"'
      +' onclick="selectCalWorkout(\''+escAttr(w.id)+'\',\''+escAttr(w.name)+'\',event)">'+escHtml(w.name)+'</button>';
  }).join('');
}

function selectCalWorkout(wid, wname, ev) {
  calSelWorkoutId = wid; calSelWorkoutName = wname;
  var el = document.getElementById('cal-name-preview'); if (el) el.textContent = 'Selecionado: ' + wname;
  document.querySelectorAll('.cal-w-btn').forEach(function(b){ b.style.opacity='.5'; });
  if (ev && ev.currentTarget) ev.currentTarget.style.opacity='1';
}

function saveCalEntry() {
  var dateEl = document.getElementById('cal-date-inp'), calEl = document.getElementById('cal-cal-inp');
  var date   = parseDate(dateEl ? dateEl.value : '');
  if (!date)            { alert('Selecione uma data valida.'); return; }
  if (!calSelWorkoutId) { alert('Selecione um treino.'); return; }
  var cal    = calEl ? (parseInt(calEl.value)||0) : 0;
  var wFound = sw.find(function(w){ return String(w.id)===String(calSelWorkoutId); });
  var entry  = { date:date, type:wFound?wFound.category:'l', name:calSelWorkoutName, calories:cal };
  var idx    = hist.findIndex(function(h){ return parseDate(h.date)===date; });
  if (idx>=0) hist[idx]=entry; else hist.unshift(entry);
  cacheHist();
  setSyncStatus('syncing','Salvando...');
  apiPost(Object.assign({action:'saveHistory'},entry)).then(function(){ setSyncStatus('ok','Salvo'); });
  renderHist();
  if (dateEl) dateEl.value=''; if (calEl) calEl.value='';
  calSelWorkoutId=null; calSelWorkoutName='';
  var prev = document.getElementById('cal-name-preview'); if (prev) prev.textContent='';
  document.querySelectorAll('.cal-w-btn').forEach(function(b){ b.style.opacity='1'; });
}

function renderHist() {
  var list = document.getElementById('hist-list'); if (!list) return;
  if (!hist.length) { list.innerHTML='<div class="empty"><span class="mi">history</span>Nenhum treino registrado</div>'; return; }
  var sorted = hist.slice().sort(function(a,b){ return b.date>a.date?1:-1; });
  list.innerHTML = sorted.slice(0,30).map(function(e){
    return '<div class="hist-item"><span class="hist-date">'+fmtDate(e.date)+'</span>'
      +'<span class="hist-name">'+escHtml(e.name)+'</span>'
      +(e.calories?'<span class="hist-cal">Calorias: '+e.calories+' kcal</span>':'')+'</div>';
  }).join('');
}

/* -- DASHBOARD ------------------------------------------------- */
var dashStart='', dashEnd='';

function initDashDates() {
  document.querySelectorAll('.p-btn').forEach(function(b){ b.classList.remove('on'); });
  var b = document.querySelector('.p-btn[data-p="30"]'); if (b) b.classList.add('on');
  setPeriod(30);
}

function setPeriod(days) {
  var end=new Date(), start=new Date(); start.setDate(start.getDate()-(days-1));
  dashEnd   = end.toISOString().split('T')[0];
  dashStart = start.toISOString().split('T')[0];
  document.querySelectorAll('.p-btn').forEach(function(b){ b.classList.remove('on'); });
  var btn = document.querySelector('.p-btn[data-p="'+days+'"]'); if (btn) btn.classList.add('on');
  var cw  = document.querySelector('.custom-wrap'); if (cw) cw.classList.remove('show');
  renderDash();
}

function setCustomPeriod() {
  var s=document.getElementById('dash-start').value, e=document.getElementById('dash-end').value;
  if (!s||!e) return; dashStart=s; dashEnd=e; renderDash();
}

function renderDash() {
  var filtered = hist.filter(function(h){ var d=parseDate(h.date); return d&&d>=dashStart&&d<=dashEnd; });
  var totalDays = filtered.length;
  var totalCal  = filtered.reduce(function(s,h){ return s+(h.calories||0); }, 0);
  var avgCal    = totalDays ? Math.round(totalCal/totalDays) : 0;
  document.getElementById('stat-days').textContent = totalDays;
  document.getElementById('stat-cal').textContent  = totalCal ? totalCal.toLocaleString('pt-BR') : '--';
  document.getElementById('stat-avg').textContent  = avgCal   ? avgCal.toLocaleString('pt-BR')   : '--';
  var freq = {}; filtered.forEach(function(h){ freq[h.type]=(freq[h.type]||0)+1; });
  var best = Object.entries(freq).sort(function(a,b){ return b[1]-a[1]; });
  document.getElementById('stat-best').textContent = best.length ? (WN[best[0][0]]||best[0][0]) : '--';
  renderBarChart(filtered); renderTop5(filtered);
}

function renderBarChart(data) {
  var canvas = document.getElementById('chart-canvas'); if (!canvas) return;
  var ctx = canvas.getContext('2d'), W=canvas.parentElement.offsetWidth-32||300, H=160;
  canvas.width=W; canvas.height=H; ctx.clearRect(0,0,W,H);
  if (!data.length) return;
  var weeks={};
  data.forEach(function(h){
    var d=new Date(h.date+'T12:00:00'), mon=new Date(d);
    mon.setDate(d.getDate()-d.getDay()+1);
    var key=mon.toISOString().split('T')[0]; weeks[key]=(weeks[key]||0)+1;
  });
  var keys=Object.keys(weeks).sort(), vals=keys.map(function(k){ return weeks[k]; });
  var maxV=Math.max.apply(null,vals)||1, barW=Math.max(8,Math.floor((W-40)/keys.length)-4);
  ctx.fillStyle='#e8f0fe';
  vals.forEach(function(v,i){ var h=Math.round((v/maxV)*(H-30)),x=20+i*((W-40)/keys.length); ctx.fillRect(x,H-20-h,barW,h); });
  ctx.fillStyle='#5f6368'; ctx.font='10px Roboto'; ctx.textAlign='center';
  vals.forEach(function(v,i){ ctx.fillText(v,20+i*((W-40)/keys.length)+barW/2,H-22); });
}

function renderTop5(data) {
  var wrap = document.getElementById('top5-list'); if (!wrap) return;
  var cnt  = {}; data.forEach(function(h){ cnt[h.name]=(cnt[h.name]||0)+(h.calories||0); });
  var sorted = Object.entries(cnt).sort(function(a,b){ return b[1]-a[1]; }).slice(0,5);
  if (!sorted.length) { wrap.innerHTML='<div class="empty"><span class="mi">emoji_events</span>Sem dados</div>'; return; }
  wrap.innerHTML = sorted.map(function(e,i){
    return '<div class="top5-row"><span class="top5-rank">'+(i+1)+'</span>'
      +'<span style="flex:1;font-size:13px;font-weight:600;">'+escHtml(e[0])+'</span>'
      +(e[1]?'<span class="top5-cal">'+e[1].toLocaleString('pt-BR')+' kcal</span>':'')+'</div>';
  }).join('');
}

/* -- BANCO DE EXERCICIOS --------------------------------------- */
var bankTab='a', bankSel={}, cwEditId=null;

function renderBank() {
  var cats={a:[],b:[],c:[],l:[]}, extras={a:[],b:[],c:[],l:[]};
  Object.entries(EX).forEach(function(e){
    var id=e[0], ex=e[1]; if (!cats[ex.cat]) return;
    (id.startsWith('x') ? extras : cats)[ex.cat].push(Object.assign({id:id},ex));
  });
  ['a','b','c','l'].forEach(function(cat){
    var panel = document.getElementById('tab-'+cat); if (!panel) return;
    var html = '';
    if (cats[cat].length)   html += '<div class="bank-section"><div class="bank-sec-title">Principal</div>'+renderBankList(cats[cat])+'</div>';
    if (extras[cat].length) html += '<div class="bank-section"><div class="bank-sec-title">Extras</div>'+renderBankList(extras[cat])+'</div>';
    panel.innerHTML = html;
  });
  updateSelCount();
}

function renderBankList(list) {
  return list.map(function(ex){
    var sel = bankSel[ex.id];
    return '<div class="bank-card" id="bk-'+ex.id+'">'
      +'<div class="bank-info"><div class="bank-name">'+escHtml(ex.name)+'</div>'
      +'<div class="bank-meta">'+escHtml(ex.sets)+' - '+escHtml(ex.reps)+'</div>'
      +'<div class="bank-muscles">'+escHtml((ex.muscles||[]).join(', '))+'</div></div>'
      +'<button class="bank-btn" id="bb-'+ex.id+'" onclick="toggleBankSel(\''+ex.id+'\')">'
      +'<span class="mi">'+(sel?'check_box':'add_box')+'</span>'+(sel?'Adicionado':'Adicionar')+'</button></div>';
  }).join('');
}

function toggleBankSel(eid) {
  bankSel[eid] = !bankSel[eid];
  var btn = document.getElementById('bb-'+eid);
  if (btn) btn.innerHTML = '<span class="mi">'+(bankSel[eid]?'check_box':'add_box')+'</span>'+(bankSel[eid]?'Adicionado':'Adicionar');
  updateSelCount();
}

function updateSelCount() {
  var n  = Object.values(bankSel).filter(Boolean).length;
  var el = document.getElementById('sel-count'); if (el) el.textContent = n ? n+' exercicio(s) selecionado(s)' : '';
}

function switchBankTab(cat) {
  bankTab = cat;
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('on'); });
  var tb = document.getElementById('tabbtn-'+cat); if (tb) tb.classList.add('on');
  document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('on'); });
  var tp = document.getElementById('tab-'+cat); if (tp) tp.classList.add('on');
}

function openCreateWorkout() {
  bankSel = {}; cwEditId = null;
  var inp = document.getElementById('cw-name-inp'); if (inp) inp.value='';
  renderBank();
  var sec = document.getElementById('bank-create-section'); if (sec) sec.style.display='block';
}

function saveNewWorkout() {
  var inp  = document.getElementById('cw-name-inp'), name = inp ? inp.value.trim() : '';
  if (!name) { alert('Digite um nome para o treino.'); return; }
  var exIds = Object.keys(bankSel).filter(function(k){ return bankSel[k]; });
  if (!exIds.length) { alert('Selecione pelo menos 1 exercicio.'); return; }
  var cat     = (EX[exIds[0]] && EX[exIds[0]].cat) || 'l';
  var wid     = cwEditId || ('w' + Date.now());
  var old     = sw.find(function(w){ return String(w.id)===String(wid); });
  var workout = { id:wid, name:name, category:cat, exercises:exIds, created:old?old.created:todayStr() };
  var idx     = sw.findIndex(function(w){ return String(w.id)===String(wid); });
  if (idx>=0) sw[idx]=workout; else sw.push(workout);
  cacheSW();
  setSyncStatus('syncing','Salvando...');
  apiPost(Object.assign({action:'saveWorkout'},workout)).then(function(){ setSyncStatus('ok','Salvo'); });
  bankSel={}; cwEditId=null; renderSW(); renderSchedUI(); renderHomeSavedWorkouts();
  var sec = document.getElementById('bank-create-section'); if (sec) sec.style.display='none';
}

function renderSW() {
  var wrap = document.getElementById('sw-list'); if (!wrap) return;
  if (!sw.length) { wrap.innerHTML='<div class="empty"><span class="mi">fitness_center</span>Nenhum treino salvo</div>'; return; }
  wrap.innerHTML = sw.map(function(w){
    return '<div class="sw-item">'
      +'<div style="flex:1;min-width:0;"><div class="sw-name">'+escHtml(w.name)+'</div>'
      +'<div class="sw-meta">'+(WN[w.category]||w.category)+' - '+(Array.isArray(w.exercises)?w.exercises.length:0)+' ex.</div></div>'
      +'<div class="sw-actions">'
      +'<button class="sw-btn" onclick="viewWorkout(\''+escAttr(w.id)+'\')"><span class="mi">visibility</span></button>'
      +'<button class="sw-btn" onclick="editWorkout(\''+escAttr(w.id)+'\')"><span class="mi">edit</span></button>'
      +'<button class="sw-btn" onclick="startWorkout(\''+escAttr(w.id)+'\')"><span class="mi">play_arrow</span></button>'
      +'<button class="sw-btn del" onclick="deleteWorkout(\''+escAttr(w.id)+'\')"><span class="mi">delete</span></button>'
      +'</div></div>';
  }).join('');
}

function viewWorkout(wid) {
  var w = sw.find(function(x){ return String(x.id)===String(wid); }); if (!w) return;
  var modal = document.getElementById('view-workout-modal'); if (!modal) return;
  var title = modal.querySelector('.vwm-title'), body = document.getElementById('vwm-body');
  if (title) title.textContent = w.name;
  if (body) {
    var exIds = Array.isArray(w.exercises) ? w.exercises : [];
    body.innerHTML = exIds.map(function(eid,i){
      var ex = EX[eid]; if (!ex) return '';
      return '<div class="view-ex-row"><div class="view-ex-num">'+(i+1)+'</div>'
        +'<div><div style="font-weight:700;font-size:14px;">'+escHtml(ex.name)+'</div>'
        +'<div style="font-size:12px;color:var(--sub);margin-top:2px;">'+escHtml(ex.sets)+' - '+escHtml(ex.reps)+'</div></div></div>';
    }).join('');
  }
  modal.classList.add('open');
}

function closeViewWorkout() { var m=document.getElementById('view-workout-modal'); if(m) m.classList.remove('open'); }

function editWorkout(wid) {
  var w = sw.find(function(x){ return String(x.id)===String(wid); }); if (!w) return;
  cwEditId = wid; bankSel = {};
  (Array.isArray(w.exercises)?w.exercises:[]).forEach(function(eid){ bankSel[eid]=true; });
  var inp = document.getElementById('cw-name-inp'); if (inp) inp.value = w.name;
  renderBank();
  var sec = document.getElementById('bank-create-section'); if (sec) sec.style.display='block';
  showScreen('bank'); switchBankTab(w.category||'a');
}

function deleteWorkout(wid) {
  if (!confirm('Excluir este treino?')) return;
  sw = sw.filter(function(w){ return String(w.id)!==String(wid); }); cacheSW();
  setSyncStatus('syncing','Salvando...');
  apiPost({ action:'deleteWorkout', id:wid }).then(function(){ setSyncStatus('ok','Salvo'); });
  renderSW(); renderSchedUI(); renderHomeSavedWorkouts();
}

/* -- INIT ------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', function(){
  checkStoredLogin();
  var modal = document.getElementById('view-workout-modal');
  if (modal) modal.addEventListener('click', function(e){ if(e.target===modal) closeViewWorkout(); });
});
