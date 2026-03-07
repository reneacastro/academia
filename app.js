/* ═══════════════════════════════════════════════
   app.js  — LÓGICA COMPLETA
   Academia do Renê
═══════════════════════════════════════════════ */

/* ── UTILS ── */
function todayStr() {
  return new Date().toISOString().split('T')[0];
}
function parseDate(raw) {
  if (!raw) return null;
  var s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    var p = s.split('/'); return p[2]+'-'+p[1]+'-'+p[0];
  }
  var dt = new Date(s);
  return isNaN(dt) ? null : dt.toISOString().split('T')[0];
}
function fmtDate(raw) {
  var s = parseDate(raw); if (!s) return '—';
  return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});
}
function fmtDateShort(raw) {
  var s = parseDate(raw); if (!s) return '—';
  return new Date(s+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
}

/* ── CACHE ── */
var hist = JSON.parse(localStorage.getItem('rene_hist') || '[]');
var sw   = JSON.parse(localStorage.getItem('rene_sw')   || '[]');
function cacheHist() { localStorage.setItem('rene_hist', JSON.stringify(hist)); }
function cacheSW()   { localStorage.setItem('rene_sw',   JSON.stringify(sw));   }

/* ── AUTH ── */
var currentUser = null;

function checkStoredLogin() {
  var u = localStorage.getItem('rene_user');
  if (u) { currentUser = JSON.parse(u); }
  else {
    currentUser = { uid: 'rene_default', email: 'rene@local', name: 'Renê' };
    localStorage.setItem('rene_user', JSON.stringify(currentUser));
  }
  afterLogin();
}
function signInWithGoogle() {
  // Login simplificado: sem OAuth, usa nome local
  var name = prompt('Qual é o seu nome?', 'Renê');
  if (!name) name = 'Renê';
  var uid = btoa(name.toLowerCase().trim()).replace(/[^a-z0-9]/gi,'');
  currentUser = { uid: uid, email: name.toLowerCase().replace(/\s+/g,'')+'@local', name: name };
  localStorage.setItem('rene_user', JSON.stringify(currentUser));
  afterLogin();
}
function autoLogin() {
  // Chamado quando não há sessão — cria sessão automática
  var u = localStorage.getItem('rene_user');
  if (u) { currentUser = JSON.parse(u); afterLogin(); return; }
  currentUser = { uid: 'rene_default', email: 'rene@local', name: 'Renê' };
  localStorage.setItem('rene_user', JSON.stringify(currentUser));
  afterLogin();
}
function logout() {
  localStorage.clear();
  location.reload();
}
function afterLogin() {
  try {
    var el = document.getElementById('bar-user');
    if (el) { el.textContent = currentUser.name || currentUser.email.split('@')[0]; el.style.display = 'block'; }
    var lo = document.getElementById('btn-logout');
    if (lo) lo.style.display = 'flex';
    initDefaultWorkouts();
    showScreen('home');
    renderSchedUI();
    renderHomeSavedWorkouts();
    initHome();
    loadFromSheets();
  } catch(e) {
    console.error('afterLogin error:', e);
    showScreen('home');
  }
}
function showLogin() {
  // Sem tela de login — vai direto pra home
  showScreen('home');
}

/* ── SYNC ── */
function setSyncStatus(state, msg) {
  var dot = document.getElementById('sync-dot');
  var txt = document.getElementById('sync-txt');
  if (!dot) return;
  dot.className = 'sync-dot ' + state;
  txt.textContent = msg;
}
async function apiPost(payload) {
  if (!currentUser) return;
  payload.uid = currentUser.uid;
  setSyncStatus('syncing', 'Salvando...');
  try {
    const postBody = JSON.stringify(payload);
    // Tenta fetch normal; Apps Script redireciona para URL de execução
    try {
      await fetch(API, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain' },
        body: postBody
      });
    } catch(_) {
      // fallback no-cors (não lê resposta mas o Apps Script recebe)
      await fetch(API, { method:'POST', mode:'no-cors', body: postBody });
    }
    setSyncStatus('ok', 'Salvo ✓');
  } catch(e) {
    setSyncStatus('err', 'Salvo localmente');
  }
}
async function loadFromSheets() {
  if (!currentUser) return;
  setSyncStatus('syncing', 'Sincronizando...');
  var syncTimeout = setTimeout(function(){ setSyncStatus('err', 'Sem conexão — dados locais'); }, 8000);
  try {
    var uid = encodeURIComponent(currentUser.uid);
    var [hRes, wRes, sRes] = await Promise.all([
      fetch(API + '?action=getHistory&uid='  + uid),
      fetch(API + '?action=getWorkouts&uid=' + uid),
      fetch(API + '?action=getSchedule&uid=' + uid)
    ]);
    var hData = [], wData = [], sData = null;
    try { hData = JSON.parse(await hRes.text()); } catch(_) {}
    try { wData = JSON.parse(await wRes.text()); } catch(_) {}
    try { sData = JSON.parse(await sRes.text()); } catch(_) {}
    if (Array.isArray(hData)) {
      hist = hData.map(function(r){ return Object.assign({}, r, { date: parseDate(r.date) || r.date }); })
                  .filter(function(r){ return r.date; });
      cacheHist();
    }
    if (Array.isArray(wData) && wData.length) { sw = wData; cacheSW(); }
    if (sData && typeof sData === 'object' && !Array.isArray(sData)) {
      SCHEDULE = sData;
      localStorage.setItem('rene_schedule', JSON.stringify(sData));
    }
    clearTimeout(syncTimeout); setSyncStatus('ok', 'Sincronizado ✓');
    initDefaultWorkouts();
    initHome(); renderSchedUI(); renderHomeSavedWorkouts(); renderHist(); renderCalWorkouts();
    if (document.getElementById('s-dashboard').classList.contains('active')) renderDash();
    if (document.getElementById('s-bank').classList.contains('active')) renderSW();
  } catch(e) {
    clearTimeout(syncTimeout); setSyncStatus('err', 'Offline — dados locais');
  }
}

/* ── SCREENS ── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  document.getElementById('s-' + id).classList.add('active');
  var bb = document.getElementById('back-btn');
  bb.style.display = id === 'home' ? 'none' : 'flex';
  var labels = {
    home:      'Hub de Treinos',
    workout:   'Treino em andamento',
    calendar:  'Registro de Treino',
    dashboard: 'Meu progresso',
    bank:      'Banco de exercícios',
    congrats:  'Treino concluído!'
  };
  document.getElementById('bar-sub').textContent = labels[id] || '';
  if (id === 'dashboard') { initDashDates(); renderDash(); }
  if (id === 'calendar')  { renderHist(); initCal(); renderCalWorkouts(); }
  if (id === 'bank')      { renderSW(); }
  window.scrollTo(0, 0);
}

/* ── HOME ── */
function initHome() {
  try {
  var h = new Date().getHours();
  var g = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  var name = currentUser ? (currentUser.name || currentUser.email.split('@')[0]) : 'Renê';
  document.getElementById('h-greeting').textContent = g + ', ' + name + '! 👋';
  var t = SCHEDULE[new Date().getDay()];
  ['a','b','c','l'].forEach(function(x){
    var el = document.getElementById('badge-'+x);
    if (el) el.style.display = (t === x) ? 'block' : 'none';
  });
  var today = todayStr();
  var td = hist.find(function(i){ return parseDate(i.date) === today; });
  var subEl = document.getElementById('h-sub');
  if (td) subEl.textContent = 'Treino de hoje: ' + td.name + ' ✅';
  else if (t === 'rest') subEl.textContent = 'Dia de descanso hoje 😌';
  else subEl.textContent = 'Sugerido hoje: ' + (WN[t] || t);
  /* cards treinos salvos */
  var cc = document.getElementById('cw-card');
  if (cc) { cc.style.display = 'none'; } // oculta card antigo single
  renderHomeSavedWorkouts();
}


/* ── HOME: TREINOS SALVOS ── */
function renderHomeSavedWorkouts() {
  var grid = document.getElementById('home-sw-grid'); if (!grid) return;
  if (!sw.length) { grid.innerHTML = ''; return; }
  var catColors = { a:'var(--blue)', b:'var(--green)', c:'var(--purple)', l:'var(--orange)' };
  var catBg     = { a:'#e8f0fe',    b:'#e6f4ea',      c:'#f3e5f5',      l:'#fff3e0'       };
  var catIcon   = { a:'💪', b:'🦵', c:'🔥', l:'🏃' };
  grid.innerHTML = sw.map(function(w){
    var cat = w.category || 'l';
    var col = catColors[cat] || 'var(--blue)';
    var bg  = catBg[cat]     || '#e8f0fe';
    var ico = catIcon[cat]   || '⭐';
    return '<div class="menu-card" onclick="startSavedWorkout(''+w.id+'')">'
      + '<div class="mc-icon" style="background:'+col+'">'
      + '<span style="font-size:20px">'+ico+'</span></div>'
      + '<div class="mc-name">'+w.name+'</div>'
      + '<div class="mc-sub">'+(w.exercises||[]).length+' exercícios</div>'
      + '</div>';
  }).join('');
}

/* ── GRADE SEMANAL (editável) ── */
var DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
function renderSchedUI() {
  var wrap = document.getElementById('sched-edit-wrap'); if (!wrap) return;
  // Montar opções: Descanso + Leve + cada treino salvo
  var catColors = { rest:'var(--sub)', l:'var(--orange)' };
  var catBg     = { rest:'#f8f9fa',    l:'#fff3e0' };
  // Adicionar cores dos treinos salvos
  var wColors = ['var(--blue)','var(--green)','var(--purple)','var(--orange)','#e91e63','#607d8b'];
  var wBgs    = ['#e8f0fe','#e6f4ea','#f3e5f5','#fff3e0','#fce4ec','#f8f9fa'];
  sw.forEach(function(w, i){
    catColors[String(w.id)] = wColors[i % wColors.length];
    catBg[String(w.id)]     = wBgs[i % wBgs.length];
  });

  wrap.innerHTML = DAY_NAMES.map(function(dn, idx){
    var cur = String(SCHEDULE[idx] || 'rest');
    var col = catColors[cur] || 'var(--blue)';
    var bg  = catBg[cur]     || '#e8f0fe';
    var opts = '<option value="rest"'+(cur==='rest'?' selected':'')+'>Desc</option>'
             + '<option value="l"'+(cur==='l'?' selected':'')+'>🏃 Livre</option>';
    sw.forEach(function(w){
      var wid = String(w.id);
      var short = w.name.length > 10 ? w.name.slice(0,10)+'…' : w.name;
      opts += '<option value="'+wid+'"'+(cur===wid?' selected':'')+'>'+short+'</option>';
    });
    return '<div class="sched-edit-day">'
      + '<div class="dn">'+dn+'</div>'
      + '<select class="sched-sel" onchange="setSchedDay('+idx+',this.value)"'
      + ' style="color:'+col+';background:'+bg+'">'
      + opts + '</select></div>';
  }).join('');
}
function setSchedDay(day, val) {
  SCHEDULE[day] = val;
  renderSchedUI();  // re-renderiza para atualizar cores
}
function saveSchedEdit() {
  localStorage.setItem('rene_schedule', JSON.stringify(SCHEDULE));
  apiPost({ action:'saveSchedule', schedule: JSON.stringify(SCHEDULE) });
  var btn = document.getElementById('sched-save-btn');
  if (btn) {
    btn.textContent = 'Grade salva! ✓';
    setTimeout(function(){ btn.innerHTML='<span class="mi">save</span> Salvar Grade'; }, 2000);
  }
  initHome();
}

/* ── TREINOS PADRÃO ── */
function initDefaultWorkouts() {
  if (sw.length > 0) return;
  sw = [
    { id:'default_a', name:'Retomada A', category:'a', exercises:Object.keys(EX).filter(function(k){ return EX[k].cat==='a'; }), created: todayStr() },
    { id:'default_b', name:'Retomada B', category:'b', exercises:Object.keys(EX).filter(function(k){ return EX[k].cat==='b'; }), created: todayStr() },
    { id:'default_c', name:'Retomada C', category:'c', exercises:Object.keys(EX).filter(function(k){ return EX[k].cat==='c'; }), created: todayStr() }
  ];
  cacheSW();
}

/* ── WORKOUT ── */
var activeType = 'a', checked = new Set(), wIds = [];

function startWorkout(type) {
  activeType = type; checked = new Set();
  showScreen('workout');
  var badge = document.getElementById('w-badge');
  badge.textContent = type.toUpperCase();
  badge.style.background = WBG[type]; badge.style.color = WC[type];
  document.getElementById('w-title').textContent = WN[type] || type;
  document.getElementById('w-sub').textContent = 'Treino de Retomada';
  ['a','b','c','custom'].forEach(function(t){
    document.getElementById('wg-'+t).style.display = t === type ? 'grid' : 'none';
  });
  wIds = Array.from(document.querySelectorAll('#wg-'+type+' .ex-card')).map(function(c){ return c.id.replace('card-',''); });
  wIds.forEach(function(id){
    var btn  = document.getElementById('check-'+id);
    var card = document.getElementById('card-'+id);
    if (btn)  { btn.classList.remove('checked'); btn.innerHTML='<span class="mi">radio_button_unchecked</span> Concluir exercício'; btn.disabled=false; }
    if (card) card.classList.remove('done');
  });
  updateProg(); startAnim();
}

function startSavedWorkout(id) {
  var w = sw.find(function(x){ return String(x.id)===String(id); }); if (!w) return;
  checked = new Set();
  var cg = document.getElementById('wg-custom'); cg.innerHTML = '';
  showScreen('workout');
  var cat = w.category || 'l';
  document.getElementById('w-badge').textContent = cat.toUpperCase();
  document.getElementById('w-badge').style.background = WBG[cat] || '#fff3e0';
  document.getElementById('w-badge').style.color = WC[cat] || 'var(--orange)';
  document.getElementById('w-title').textContent = w.name;
  document.getElementById('w-sub').textContent = 'Treino Personalizado';
  ['a','b','c'].forEach(function(t){ document.getElementById('wg-'+t).style.display='none'; });
  cg.style.display = 'grid';
  (w.exercises||[]).forEach(function(eid){
    var ex = EX[eid]; if (!ex) return;
    var imgA = '<div id="fb-'+eid+'" class="img-fb" style="display:flex"><span class="mi">fitness_center</span><span>'+ex.name+'</span></div>';
    if (ex.p) {
      imgA = '<img id="img-'+eid+'-0" src="'+GH+'/'+ex.p+'/0.jpg" onerror="tryFb(\''+eid+'\',\''+GH+'/'+ex.f+'/0.jpg\',\''+GH+'/'+ex.f+'/1.jpg\')">'
           + '<img id="img-'+eid+'-1" src="'+GH+'/'+ex.p+'/1.jpg" class="img-b">'
           + '<div id="fb-'+eid+'" class="img-fb"><span class="mi">fitness_center</span><span>'+ex.name+'</span></div>';
    }
    var mp = (ex.muscles||[]).map(function(m){ return '<span class="mpill">'+m+'</span>'; }).join('');
    cg.innerHTML += '<div class="ex-card" id="card-'+eid+'">'
      + '<div class="img-wrap">'+imgA+'<div class="mpills">'+mp+'</div></div>'
      + '<div class="ex-body"><span class="ex-num">Exercício</span><div class="ex-name">'+ex.name+'</div>'
      + '<div class="chips">'
      + '<div class="chip" style="background:#fff3e0;color:var(--orange)"><span class="mi">repeat</span>'+ex.sets+'</div>'
      + '<div class="chip" style="background:#fff3e0;color:var(--orange)"><span class="mi">fitness_center</span>'+ex.reps+'</div>'
      + '</div>'
      + '<button class="check-btn" id="check-'+eid+'" onclick="checkEx(\''+eid+'\')">'
      + '<span class="mi">radio_button_unchecked</span> Concluir exercício</button></div></div>';
  });
  wIds = w.exercises || [];
  activeType = w.category || 'l';
  updateProg(); startAnim();
}

function checkEx(id) {
  checked.add(id);
  var btn  = document.getElementById('check-'+id);
  var card = document.getElementById('card-'+id);
  if (btn)  { btn.classList.add('checked'); btn.innerHTML='<span class="mi">check_circle</span> Concluído!'; btn.disabled=true; }
  if (card) card.classList.add('done');
  updateProg();
  if (checked.size >= wIds.length) setTimeout(finishWorkout, 600);
}
function updateProg() {
  var t = wIds.length, d = checked.size, pct = t ? Math.round(d/t*100) : 0;
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-txt').textContent = d + ' / ' + t + ' exercícios';
}
function finishWorkout() {
  var today = todayStr();
  var entry = { date: today, type: activeType, name: WN[activeType] || 'Personalizado', calories: 0 };
  var i = hist.findIndex(function(x){ return parseDate(x.date) === today; });
  if (i >= 0) hist[i] = entry; else hist.unshift(entry);
  cacheHist();
  document.getElementById('cg-cal').value = '';
  showScreen('congrats');
}
function saveCongrats() {
  var cal = parseInt(document.getElementById('cg-cal').value) || 0;
  var today = todayStr();
  var i = hist.findIndex(function(x){ return parseDate(x.date) === today; });
  if (i >= 0) { hist[i].calories = cal; cacheHist(); apiPost({ action:'saveHistory', date:hist[i].date, type:hist[i].type, name:hist[i].name, calories:cal }); }
  showScreen('home'); initHome();
}

/* ── CALENDAR ── */
var selCalWorkoutId = null, selCalType = '';

function initCal() {
  document.getElementById('cal-date').value = todayStr();
  updateSuggest();
}
function updateSuggest() {
  var v = document.getElementById('cal-date').value; if (!v) return;
  var dow = new Date(v+'T12:00:00').getDay();
  var s   = SCHEDULE[dow];
  var box = document.getElementById('sug-box');
  if (s === 'rest') {
    box.style.display='block';
    box.innerHTML='<strong>💤 Dia de descanso</strong> Pela grade semanal, hoje é dia de recuperação.';
  } else {
    box.style.display='block';
    box.innerHTML='<strong>💡 Sugestão: '+(WN[s]||s)+'</strong> Mas você decide qual treino fazer!';
  }
}

function renderCalWorkouts() {
  var grid = document.getElementById('cal-workout-grid'); if (!grid) return;
  var catColors = { a:'var(--blue)', b:'var(--green)', c:'var(--purple)', l:'var(--orange)' };
  var catBg     = { a:'#e8f0fe',    b:'#e6f4ea',      c:'#f3e5f5',      l:'#fff3e0'       };
  var catLabel  = { a:'Superior+Core', b:'Inferior+Glút', c:'Full Body', l:'Livre' };
  if (!sw.length) {
    grid.innerHTML = '<div style="color:var(--sub);font-size:13px;padding:8px">Crie treinos no Banco para selecionar aqui.</div>';
    return;
  }
  grid.innerHTML = sw.map(function(w){
    var cat = w.category || 'l';
    var sel = selCalWorkoutId === String(w.id);
    return '<div class="cal-w-btn" onclick="selCalWorkout(\''+w.id+'\',\''+cat+'\')"'
      + ' style="border:2px solid '+(sel?catColors[cat]:'var(--border)')+';background:'+(sel?catBg[cat]:'var(--surface)')+';">'
      + '<div style="font-size:11px;font-weight:700;color:'+catColors[cat]+'">'+catLabel[cat]+'</div>'
      + '<div style="font-size:14px;font-weight:600;margin-top:2px">'+w.name+'</div>'
      + '<div style="font-size:11px;color:var(--sub)">'+(w.exercises||[]).length+' exerc.</div></div>';
  }).join('');
}
function selCalWorkout(id, cat) {
  selCalWorkoutId = String(id); selCalType = cat || 'l';
  renderCalWorkouts();
  var w = sw.find(function(x){ return String(x.id)===String(id); });
  var prev = document.getElementById('cal-name-preview');
  if (prev && w) prev.textContent = 'Selecionado: ' + w.name;
}

async function saveActivity() {
  var date = parseDate(document.getElementById('cal-date').value) || todayStr();
  var cal  = parseInt(document.getElementById('cal-cal').value) || 0;
  if (!selCalWorkoutId) { alert('Selecione um treino acima.'); return; }
  var _type = selCalType || 'l';
  var _name = WN[_type] || _type;
  var w = sw.find(function(x){ return String(x.id)===String(selCalWorkoutId); });
  if (w) _name = w.name;
  var entry = { date: date, type: _type, name: _name, calories: cal };
  var i = hist.findIndex(function(x){ return parseDate(x.date) === date; });
  if (i >= 0) hist[i] = entry; else hist.unshift(entry);
  hist.sort(function(a,b){ return (parseDate(b.date)||'').localeCompare(parseDate(a.date)||''); });
  cacheHist(); renderHist(); initHome();
  await apiPost({ action:'saveHistory', date:entry.date, type:entry.type, name:entry.name, calories:entry.calories });
  selCalWorkoutId = null; selCalType = '';
  renderCalWorkouts();
  document.getElementById('cal-cal').value = '';
  document.getElementById('cal-name-preview').textContent = '';
  var sb = document.getElementById('sug-box');
  sb.style.display='block'; sb.style.background='#e6f4ea'; sb.style.color='var(--green)';
  sb.innerHTML='<strong>✅ Registrado!</strong>';
  setTimeout(function(){ sb.style.background='#e8f0fe'; sb.style.color='var(--blue)'; updateSuggest(); }, 2500);
}

function renderHist() {
  var list = document.getElementById('hist-list');
  if (!hist.length) {
    list.innerHTML='<div class="empty"><span class="mi">event_available</span>Nenhum treino registrado ainda</div>';
    return;
  }
  var catColors = { a:'var(--blue)', b:'var(--green)', c:'var(--purple)', l:'var(--orange)' };
  list.innerHTML = hist.slice(0,40).map(function(i){
    var lbl = fmtDate(i.date);
    var c   = catColors[i.type] || 'var(--sub)';
    return '<div class="hist-item" style="border-left:4px solid '+c+'">'
      + '<div class="hist-date">'+lbl+'</div>'
      + '<div class="hist-name">'+i.name+'</div>'
      + '<div class="hist-cal">'+(i.calories ? '🔥 '+i.calories+' kcal' : '')+'</div></div>';
  }).join('');
}

/* ── DASHBOARD ── */
var dashPeriod = 7, dashCharts = {};
function setPeriod(days, btn) {
  document.querySelectorAll('.p-btn').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  var cw = document.getElementById('custom-wrap');
  if (days === 'custom') cw.classList.add('show');
  else { cw.classList.remove('show'); dashPeriod = days; renderDash(); }
}
function applyCustom() {
  var f = document.getElementById('df').value, t = document.getElementById('dt').value;
  if (f && t) renderDash(f, t);
}
function renderDash(from, to) {
  var filtered;
  if (from && to) {
    filtered = hist.filter(function(i){ var d=parseDate(i.date); return d && d>=from && d<=to; });
  } else {
    var c = new Date(); c.setDate(c.getDate() - dashPeriod);
    var cutoff = c.toISOString().split('T')[0];
    filtered = hist.filter(function(i){ var d=parseDate(i.date); return d && d>=cutoff; });
  }
  var total    = filtered.length;
  var totalCal = filtered.reduce(function(s,i){ return s + (Number(i.calories)||0); }, 0);
  var fc = {};
  filtered.forEach(function(i){ fc[i.type] = (fc[i.type]||0) + 1; });
  var fav    = Object.entries(fc).sort(function(a,b){ return b[1]-a[1]; })[0];
  var favLbl = fav ? ({a:'A Superior',b:'B Inferior',c:'C Full Body',l:'Livre'}[fav[0]] || fav[0]) : '—';
  var streak = 0;
  var hd = new Set(hist.map(function(i){ return parseDate(i.date); }).filter(Boolean));
  for (var si=0; si<365; si++) {
    var dd=new Date(); dd.setDate(dd.getDate()-si);
    if (hd.has(dd.toISOString().split('T')[0])) streak++; else break;
  }
  document.getElementById('st-total').textContent  = total;
  document.getElementById('st-cal').textContent    = totalCal.toLocaleString();
  document.getElementById('st-streak').textContent = streak;
  document.getElementById('st-fav').textContent    = favLbl;

  /* Top 5 calorias */
  var top5el = document.getElementById('top5-list');
  if (top5el) {
    var top5 = filtered.filter(function(i){ return Number(i.calories)>0; })
                       .sort(function(a,b){ return Number(b.calories)-Number(a.calories); })
                       .slice(0,5);
    top5el.innerHTML = top5.length ? top5.map(function(i,idx){
      return '<div class="top5-row"><span class="top5-rank">#'+(idx+1)+'</span>'
        + '<div style="flex:1"><div style="font-weight:600;font-size:13px">'+i.name+'</div>'
        + '<div style="font-size:11px;color:var(--sub)">'+fmtDate(i.date)+'</div></div>'
        + '<span class="top5-cal">'+Number(i.calories).toLocaleString()+' kcal</span></div>';
    }).join('')
    : '<div class="empty" style="padding:16px">Registre atividades com calorias para ver o ranking.</div>';
  }

  /* Gráficos */
  var days = Math.min(typeof dashPeriod==='number' ? dashPeriod : 30, 60);
  var lbls=[], comp=[], calD=[];
  for (var gi=days-1; gi>=0; gi--) {
    var gd=new Date(); gd.setDate(gd.getDate()-gi);
    var gs=gd.toISOString().split('T')[0];
    var ent=filtered.find(function(x){ return parseDate(x.date)===gs; });
    lbls.push(gd.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}));
    comp.push(ent?1:0); calD.push(ent ? Number(ent.calories)||0 : 0);
  }
  var cA=filtered.filter(function(i){return i.type==='a';}).length;
  var cB=filtered.filter(function(i){return i.type==='b';}).length;
  var cC=filtered.filter(function(i){return i.type==='c';}).length;
  var cL=filtered.filter(function(i){return i.type==='l';}).length;
  ['cc','ck','ct','cr'].forEach(function(k){ if(dashCharts[k]){dashCharts[k].destroy();delete dashCharts[k];} });
  var base = {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}};
  dashCharts.cc = new Chart(document.getElementById('ch-compliance'),{type:'bar',
    data:{labels:lbls,datasets:[{data:comp,backgroundColor:comp.map(function(v){return v?'#1a73e8':'#e8eaed';}),borderRadius:6}]},
    options:Object.assign({},base,{scales:{y:{max:1,ticks:{callback:function(v){return v?'✅':''}},stepSize:1,grid:{display:false}},x:{ticks:{font:{size:10},maxTicksLimit:10}}}})});
  dashCharts.ck = new Chart(document.getElementById('ch-calories'),{type:'line',
    data:{labels:lbls,datasets:[{data:calD,borderColor:'#e65100',backgroundColor:'rgba(230,101,0,.1)',fill:true,tension:.35,pointRadius:4,pointBackgroundColor:'#e65100'}]},
    options:Object.assign({},base,{scales:{y:{ticks:{callback:function(v){return v?v+' kcal':''}},grid:{color:'#f1f3f4'}},x:{ticks:{font:{size:10},maxTicksLimit:10}}}})});
  var mx = Math.max(cA,cB,cC,cL,1);
  dashCharts.ct = new Chart(document.getElementById('ch-types'),{type:'doughnut',
    data:{labels:['Treino A','Treino B','Treino C','Livre'],datasets:[{data:[cA,cB,cC,cL],backgroundColor:['#1a73e8','#0f9d58','#9c27b0','#e65100'],borderWidth:0}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'bottom',labels:{font:{size:12},padding:12}}}}});
  dashCharts.cr = new Chart(document.getElementById('ch-radar'),{type:'radar',
    data:{labels:['Superior (A)','Inferior (B)','Full Body (C)','Livre (L)'],datasets:[{data:[cA,cB,cC,cL],backgroundColor:'rgba(26,115,232,.2)',borderColor:'#1a73e8',pointBackgroundColor:'#1a73e8',pointRadius:5,borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,scales:{r:{min:0,max:mx,ticks:{stepSize:Math.max(1,Math.ceil(mx/4)),font:{size:10}},grid:{color:'#e8eaed'},angleLines:{color:'#dadce0'}}}}});
}

/* ── BANK ── */
var selBank = new Set();
var editingWorkoutId = null;
var swShowAll = false;

function switchBankTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('on'); });
  document.getElementById('bp-'+tab).classList.add('on');
  if (tab === 'saved') renderSW();
}
function toggleBank(id) {
  var btn = document.getElementById('bank-'+id);
  if (selBank.has(id)) {
    selBank.delete(id);
    btn.innerHTML='<span class="mi">add_circle_outline</span> Adicionar';
    btn.style.opacity='1';
  } else {
    selBank.add(id);
    btn.innerHTML='<span class="mi">check_circle</span> Adicionado ✓';
    btn.style.opacity='.7';
  }
  document.getElementById('sel-count').textContent = selBank.size + ' selecionados';
}
async function saveCustomWorkout() {
  var name = document.getElementById('cw-inp').value.trim();
  if (!name) { alert('Dê um nome ao treino.'); return; }
  if (!selBank.size) { alert('Selecione pelo menos um exercício.'); return; }
  var exArr = Array.from(selBank);
  var cat   = EX[exArr[0]] ? EX[exArr[0]].cat : 'l';
  if (editingWorkoutId) {
    sw = sw.filter(function(x){ return String(x.id) !== editingWorkoutId; });
    editingWorkoutId = null;
  }
  var w = { id: Date.now(), name: name, category: cat, exercises: exArr, created: todayStr() };
  sw.push(w); cacheSW();
  await apiPost({ action:'saveWorkout', id:w.id, name:w.name, category:w.category, exercises:JSON.stringify(exArr), created:w.created });
  selBank.clear();
  document.getElementById('cw-inp').value = '';
  document.getElementById('sel-count').textContent = '0 selecionados';
  document.querySelectorAll('.bank-btn').forEach(function(b){
    b.innerHTML='<span class="mi">add_circle_outline</span> Adicionar'; b.style.opacity='1';
  });
  renderSW(); renderCalWorkouts(); initHome(); renderHomeSavedWorkouts(); renderSchedUI();
  showScreen('home');
}
function renderSW() {
  var list = document.getElementById('sw-list');
  if (!sw.length) {
    list.innerHTML='<div class="empty"><span class="mi">folder_open</span>Nenhum treino salvo ainda.</div>';
    return;
  }
  var catColors = { a:'var(--blue)', b:'var(--green)', c:'var(--purple)', l:'var(--orange)' };
  var catLabel  = { a:'Superior+Core', b:'Inferior+Glút', c:'Full Body', l:'Livre' };
  var items = swShowAll ? sw.slice().reverse() : sw.slice(-6).reverse();
  list.innerHTML = items.map(function(w){
    var cat = w.category || 'l';
    return '<div class="sw-item">'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:11px;font-weight:700;color:'+catColors[cat]+'">'+catLabel[cat]+'</div>'
      + '<div class="sw-name">'+w.name+'</div>'
      + '<div class="sw-meta">'+(w.exercises||[]).length+' exerc. · '+fmtDateShort(w.created)+'</div>'
      + '</div><div class="sw-actions">'
      + '<button class="sw-btn" onclick="startSavedWorkout(\''+w.id+'\')">Treinar</button>'
      + '<button class="sw-btn" onclick="viewWorkout(\''+w.id+'\')">Exibir</button>'
      + '<button class="sw-btn" onclick="editWorkout(\''+w.id+'\')">Editar</button>'
      + '<button class="sw-btn del" onclick="delSW(\''+w.id+'\')">Excluir</button>'
      + '</div></div>';
  }).join('');
  if (sw.length > 6) {
    list.innerHTML += !swShowAll
      ? '<button class="primary-btn" style="margin-top:12px;font-size:13px" onclick="swShowAll=true;renderSW()">Ver todos os '+sw.length+' treinos</button>'
      : '<button class="primary-btn" style="margin-top:12px;font-size:13px;background:var(--sub)" onclick="swShowAll=false;renderSW()">Mostrar menos</button>';
  }
}
async function delSW(id) {
  if (!confirm('Excluir este treino?')) return;
  sw = sw.filter(function(x){ return String(x.id)!==String(id); }); cacheSW();
  await apiPost({ action:'deleteWorkout', id: String(id) });
  renderSW(); renderCalWorkouts(); initHome();
}
function showSavedWorkouts() { showScreen('bank'); switchBankTab('saved', document.querySelectorAll('.tab-btn')[3]); }
function editWorkout(id) {
  var w = sw.find(function(x){ return String(x.id)===String(id); }); if (!w) return;
  selBank = new Set(w.exercises||[]);
  editingWorkoutId = String(id);
  document.getElementById('cw-inp').value = w.name;
  document.getElementById('sel-count').textContent = selBank.size + ' selecionados';
  document.querySelectorAll('[id^="bank-"]').forEach(function(btn){
    var eid = btn.id.replace('bank-','');
    if (selBank.has(eid)) { btn.innerHTML='<span class="mi">check_circle</span> Adicionado ✓'; btn.style.opacity='.7'; }
    else { btn.innerHTML='<span class="mi">add_circle_outline</span> Adicionar'; btn.style.opacity='1'; }
  });
  showScreen('bank');
  switchBankTab('build', document.querySelectorAll('.tab-btn')[0]);
}

/* ── MODAL VISUALIZAR TREINO ── */
function viewWorkout(id) {
  var w = sw.find(function(x){ return String(x.id)===String(id); }); if (!w) return;
  document.getElementById('vwm-title').textContent = w.name;
  var catLabel  = { a:'Superior+Core', b:'Inferior+Glúteos', c:'Full Body', l:'Livre' };
  var catColors = { a:'var(--blue)', b:'var(--green)', c:'var(--purple)', l:'var(--orange)' };
  var cat = w.category || 'l';
  document.getElementById('vwm-cat').textContent = catLabel[cat] || cat;
  document.getElementById('vwm-cat').style.color = catColors[cat];
  document.getElementById('vwm-body').innerHTML = (w.exercises||[]).map(function(eid,i){
    var ex = EX[eid]; if (!ex) return '';
    var c = catColors[ex.cat] || 'var(--sub)';
    return '<div class="view-ex-row"><span class="view-ex-num">'+(i+1)+'</span>'
      + '<div style="flex:1"><div style="font-weight:600;font-size:14px">'+ex.name+'</div>'
      + '<div style="font-size:12px;color:var(--sub)">'+ex.sets+' · '+ex.reps+'</div>'
      + '<div style="font-size:11px;color:'+c+';margin-top:2px">'+ex.muscles.join(', ')+'</div></div></div>';
  }).join('') || '<div class="empty">Sem exercícios</div>';
  document.getElementById('vwm-start-btn').onclick = function(){ closeViewModal(); startSavedWorkout(id); };
  document.getElementById('view-workout-modal').classList.add('open');
}
function closeViewModal() { document.getElementById('view-workout-modal').classList.remove('open'); }

/* ── IMAGENS ── */
function tryFb(eid, f0, f1) {
  var i0 = document.getElementById('img-'+eid+'-0');
  if (i0 && !i0.dataset.fb) {
    i0.dataset.fb='1'; i0.onerror=function(){ showFb(eid); }; i0.src=f0;
    var i1=document.getElementById('img-'+eid+'-1'); if(i1){i1.onerror=null;i1.src=f1;}
  } else showFb(eid);
}
function showFb(eid) {
  var fb=document.getElementById('fb-'+eid);
  var i0=document.getElementById('img-'+eid+'-0');
  var i1=document.getElementById('img-'+eid+'-1');
  if(fb)fb.style.display='flex'; if(i0)i0.style.display='none'; if(i1)i1.style.display='none';
}
function startAnim() {
  var seen=new Set();
  document.querySelectorAll('[id^="img-"]').forEach(function(el){
    var m=el.id.match(/^img-([a-z0-9]+)-0$/); if(m) seen.add(m[1]);
  });
  seen.forEach(function(eid){
    var st=false;
    setInterval(function(){
      var fb=document.getElementById('fb-'+eid); if(fb&&fb.style.display==='flex') return;
      var i0=document.getElementById('img-'+eid+'-0'); var i1=document.getElementById('img-'+eid+'-1');
      if(!i0||!i1) return; st=!st;
      if(st){i0.style.opacity='0';i1.style.opacity='1';}else{i0.style.opacity='1';i1.style.opacity='0';}
    },1400);
  });
}

/* ── INIT ── */
window.addEventListener('DOMContentLoaded', function(){
  try { checkStoredLogin(); } catch(e) { console.error('init error:', e); }
  startAnim();
});

function initDashDates() {
  var td = todayStr();
  var wd = new Date(); wd.setDate(wd.getDate()-7);
  var dtEl = document.getElementById('dt');
  var dfEl = document.getElementById('df');
  if (dtEl) dtEl.value = td;
  if (dfEl) dfEl.value = wd.toISOString().split('T')[0];
}
