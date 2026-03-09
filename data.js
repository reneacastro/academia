// ============================================================
// Academia do Renê — data.js
// ============================================================
const API = 'https://script.google.com/macros/s/AKfycbwOCH-J3SHMpDGqrpB3mBMvGR-GkRpPCxLK8gAbpwiCsWEXBwebNgS7FNrjjhupPC2/exec';

const BASE = 'https://raw.githubusercontent.com/reneacastro/academia/refs/heads/main/';

let SCHEDULE = JSON.parse(
  localStorage.getItem('reneschedule') ||
  JSON.stringify({ 0:'rest', 1:'a', 2:'b', 3:'rest', 4:'a', 5:'b', 6:'c' })
);

const WN  = { a:'Superior / Core', b:'Inferior / Glúteos', c:'Full Body / Cardio', l:'Treino Livre' };
const WC  = { a:'var(--blue)', b:'var(--green)', c:'var(--purple)', l:'var(--orange)' };
const WBG = { a:'#e8f0fe', b:'#e6f4ea', c:'#f3e5f5', l:'#fff3e0' };

const CAT_EMOJI = { a:'💪', b:'🦵', c:'🔥', l:'🏃' };

// ── BANCO DE EXERCÍCIOS ──────────────────────────────────────
const EX = {
  // ── TREINO A — Superior / Core ───────────────────────────
  a1:  { name:'Puxada Frontal na Polia',          cat:'a', sets:'4 séries', reps:'10–12 reps', img: BASE+'puxada%20frontal%20com%20polia.gif',         muscles:['Latíssimo','Romboides','Bíceps'] },
  a2:  { name:'Remada Sentada na Polia',           cat:'a', sets:'4 séries', reps:'10–12 reps', img: BASE+'remada%20sentada%20na%20polia.gif',           muscles:['Romboides','Trapézio','Costas'] },
  a3:  { name:'Supino com Halteres',               cat:'a', sets:'4 séries', reps:'10–12 reps', img: BASE+'supino%20com%20halteres.gif',                 muscles:['Peitoral','Deltóide','Tríceps'] },
  a4:  { name:'Desenvolvimento com Halteres',      cat:'a', sets:'3 séries', reps:'10–12 reps', img: BASE+'desenvolvimento%20com%20halteres.gif',        muscles:['Deltóide','Trapézio','Tríceps'] },
  a5:  { name:'Rosca Direta com Haltere',          cat:'a', sets:'3 séries', reps:'12–15 reps', img: BASE+'rosca%20direta%20com%20halteres.gif',         muscles:['Bíceps','Braquial'] },
  a6:  { name:'Tríceps Pulley',                    cat:'a', sets:'3 séries', reps:'12–15 reps', img: BASE+'tri%CC%81ceps%20pulley.gif',                  muscles:['Tríceps','Antebraço'] },
  a7:  { name:'Bird Dog (Cão-Pássaro)',            cat:'a', sets:'3 séries', reps:'12x cada lado', img: BASE+'bird%20dog.gif',                           muscles:['Core','Lombar','Glúteos'] },
  a8:  { name:'Prancha Isométrica',                cat:'a', sets:'3 séries', reps:'30–45 seg',  img: BASE+'Prancha%20isome%CC%81trica.gif',              muscles:['Core','Abdômen','Ombros'] },
  xa1: { name:'Crucifixo com Halteres',            cat:'a', sets:'3 séries', reps:'12 reps',    img: BASE+'crucifixo%20com%20halteres.gif',              muscles:['Peitoral','Ombros'] },
  xa2: { name:'Pull Over com Haltere',             cat:'a', sets:'3 séries', reps:'12 reps',    img: BASE+'pull%20over%20com%20haltere.gif',             muscles:['Serrátil','Latíssimo','Tríceps'] },
  xa3: { name:'Elevação Lateral',                  cat:'a', sets:'3 séries', reps:'12–15 reps', img: BASE+'elevacao%20lateral.gif',                      muscles:['Deltóide Médio'] },
  xa4: { name:'Rosca Martelo',                     cat:'a', sets:'3 séries', reps:'12 reps',    img: BASE+'rosca%20martelo.gif',                         muscles:['Bíceps','Braquiorradial'] },
  xa5: { name:'Tríceps Testa com Haltere',         cat:'a', sets:'3 séries', reps:'12 reps',    img: BASE+'triceps%20testa%20com%20haltere.gif',         muscles:['Tríceps'] },
  xa6: { name:'Face Pull na Polia',                cat:'a', sets:'3 séries', reps:'15 reps',    img: BASE+'face%20pull%20na%20polia.gif',                muscles:['Deltóide Posterior','Romboides'] },
  xa7: { name:'Prancha Lateral',                   cat:'a', sets:'3 séries', reps:'30–45s cada lado', img: BASE+'prancha%20lateral.gif',                muscles:['Oblíquos','Quadrado Lombar'] },
  xa8: { name:'Abdominal Bicicleta',               cat:'a', sets:'3 séries', reps:'20 reps',    img: BASE+'abdominal%20bicicleta.gif',                   muscles:['Reto Abdominal','Oblíquos'] },

  // ── TREINO B — Inferior / Glúteos ────────────────────────
  b1:  { name:'Leg Press 45°',                     cat:'b', sets:'4 séries', reps:'12–15 reps', img: BASE+'leg%20press%2045.gif',                        muscles:['Quadríceps','Glúteos','Ísquios'] },
  b2:  { name:'Extensão de Joelhos (Cadeira)',     cat:'b', sets:'3 séries', reps:'12–15 reps', img: BASE+'extensa%CC%83o%20de%20joelhos.gif',           muscles:['Quadríceps'] },
  b3:  { name:'Mesa Flexora (Leg Curl)',           cat:'b', sets:'3 séries', reps:'12–15 reps', img: BASE+'mesa%20flexora.gif',                          muscles:['Isquiotibiais','Panturrilha'] },
  b4:  { name:'Elevação Pélvica (Glute Bridge)',   cat:'b', sets:'4 séries', reps:'15 reps',    img: BASE+'elevacao%20pelvica%20no%20banco.gif',         muscles:['Glúteos','Lombar','Ísquios'] },
  b5:  { name:'Abdução no Cabo / Máquina',         cat:'b', sets:'3 séries', reps:'15x cada',   img: BASE+'abducao%20no%20cabo.gif',                     muscles:['Glúteo Médio','Abdutores'] },
  b6:  { name:'Panturrilha em Pé',                 cat:'b', sets:'4 séries', reps:'15–20 reps', img: BASE+'panturilha%20em%20pe.gif',                    muscles:['Gastrocnêmio','Sóleo'] },
  b7:  { name:'Dead Bug (Inseto Morto)',           cat:'b', sets:'3 séries', reps:'10x cada lado', img: BASE+'Dead%20Bug.gif',                           muscles:['Core Profundo','Transverso','Lombar'] },
  xb1: { name:'Agachamento Goblet / Sumô',         cat:'b', sets:'3 séries', reps:'12 reps',    img: BASE+'agachamento%20sumo.gif',                      muscles:['Adutores','Glúteos','Quadríceps'] },
  xb2: { name:'Stiff com Halteres',                cat:'b', sets:'3 séries', reps:'10–12 reps', img: BASE+'stiff%20com%20halteres.gif',                  muscles:['Isquiotibiais','Glúteos'] },
  xb3: { name:'Avanço com Halteres',               cat:'b', sets:'3 séries', reps:'10x cada',   img: BASE+'avanco%20com%20halteres.gif',                 muscles:['Quadríceps','Glúteos','Equilíbrio'] },
  xb4: { name:'Hip Thrust com Haltere',            cat:'b', sets:'4 séries', reps:'12 reps',    img: BASE+'hip%20thrust%20com%20haltere.gif',            muscles:['Glúteos','Ísquios','Lombar'] },
  xb5: { name:'Cadeira Abdutora',                  cat:'b', sets:'3 séries', reps:'15–20 reps', img: BASE+'cadeira%20abdutora.gif',                      muscles:['Abdutores','Glúteos'] },
  xb6: { name:'Afundo com Halteres',               cat:'b', sets:'3 séries', reps:'12 reps cada perna', img: BASE+'afundo%20com%20halteres.gif',         muscles:['Quadríceps','Glúteos','Ísquios'] },

  // ── TREINO C — Full Body / Cardio ────────────────────────
  c1:  { name:'Goblet Squat com Haltere',          cat:'c', sets:'3 séries', reps:'12 reps',    img: BASE+'goblet%20squat%20com%20haltere.gif',          muscles:['Quadríceps','Glúteos','Core'] },
  c2:  { name:'Flexão de Braços (Push-up)',        cat:'c', sets:'3 séries', reps:'10–15 reps', img: BASE+'flexao%20de%20brac%CC%A7os.gif',             muscles:['Peito','Tríceps','Ombros'] },
  c3:  { name:'Remada Unilateral com Haltere',     cat:'c', sets:'3 séries', reps:'10x cada',   img: BASE+'remada%20unilateral%20com%20haltere.gif',     muscles:['Costas','Bíceps','Core'] },
  c4:  { name:'Step Up com Halteres',              cat:'c', sets:'3 séries', reps:'12x cada',   img: BASE+'step%20up%20com%20halteres.webp',             muscles:['Quadríceps','Glúteos','Equilíbrio'] },
  c5:  { name:'Prancha Lateral',                   cat:'c', sets:'3 séries', reps:'25–30s cada', img: BASE+'prancha%20lateral.gif',                      muscles:['Oblíquos','Quadrado Lombar','Core'] },
  c6:  { name:'Superman Alternado',                cat:'c', sets:'3 séries', reps:'12x cada',   img: BASE+'superman%20alternado.gif',                    muscles:['Lombar','Glúteos','Extensores'] },
  c7:  { name:'Elíptico / Bicicleta Ergométrica',  cat:'c', sets:'20–30 min', reps:'60–70% FCM', img: BASE+'eli%CC%81ptico.gif',                         muscles:['Cardiovascular','Corpo Todo'] },
  xc1: { name:'Burpee Modificado',                 cat:'c', sets:'3 séries', reps:'10 reps',    img: BASE+'burpee.gif',                                  muscles:['Corpo Todo','Cardio'] },
  xc2: { name:'Mountain Climber Lento',            cat:'c', sets:'3 séries', reps:'20 reps',    img: BASE+'mountain%20climber.gif',                      muscles:['Core','Cardio','Ombros'] },
  xc3: { name:'Kettlebell Swing',                  cat:'c', sets:'3 séries', reps:'15 reps',    img: BASE+'kettebell%20swing.gif',                       muscles:['Glúteos','Ísquios','Core'] },
  xc4: { name:'Box Jump',                          cat:'c', sets:'3 séries', reps:'10 reps',    img: BASE+'box%20jump.gif',                              muscles:['Quadríceps','Glúteos'] },

  // ── TREINO L — Livre ─────────────────────────────────────
  l1:  { name:'Corrida (Esteira)',              cat:'l', sets:'1 sessão', reps:'20–60 min', img: BASE+'corrida.gif',                   muscles:['Cardio','Pernas'] },
  l2:  { name:'Corrida ao Ar Livre',            cat:'l', sets:'1 sessão', reps:'20–60 min', img: null,                                muscles:['Cardio','Pernas'] },
  l3:  { name:'Caminhada',                      cat:'l', sets:'1 sessão', reps:'30–60 min', img: null,                                muscles:['Cardio','Pernas'] },
  l4:  { name:'Bicicleta Ergométrica',          cat:'l', sets:'1 sessão', reps:'30–45 min', img: null,                                muscles:['Cardio','Quadríceps'] },
  l5:  { name:'Elíptico',                       cat:'l', sets:'1 sessão', reps:'30–45 min', img: BASE+'eli%CC%81ptico.gif',            muscles:['Cardio','Corpo Todo'] },
  l6:  { name:'Natação',                        cat:'l', sets:'1 sessão', reps:'30–60 min', img: null,                                muscles:['Cardio','Corpo Todo'] },
  l7:  { name:'Remo Ergômetro',                 cat:'l', sets:'1 sessão', reps:'20–30 min', img: BASE+'remo%20ergometrico.webp',       muscles:['Cardio','Costas','Pernas'] },
  l8:  { name:'Yoga Vinyasa',                   cat:'l', sets:'1 sessão', reps:'45–60 min', img: null,                                muscles:['Mobilidade','Core'] },
  l9:  { name:'Yoga Yin',                       cat:'l', sets:'1 sessão', reps:'45–60 min', img: null,                                muscles:['Mobilidade','Flexibilidade'] },
  l10: { name:'Pilates',                        cat:'l', sets:'1 sessão', reps:'45–60 min', img: null,                                muscles:['Core','Postura'] },
  l11: { name:'Alongamento Geral',              cat:'l', sets:'1 sessão', reps:'20–30 min', img: null,                                muscles:['Mobilidade','Flexibilidade'] },
  l12: { name:'Muay Thai',                      cat:'l', sets:'1 sessão', reps:'60–90 min', img: null,                                muscles:['Corpo Todo','Cardio'] },
  l13: { name:'Jiu-Jitsu',                      cat:'l', sets:'1 sessão', reps:'60–90 min', img: null,                                muscles:['Corpo Todo','Core'] },
  l14: { name:'Boxe',                           cat:'l', sets:'1 sessão', reps:'60 min',    img: null,                                muscles:['Corpo Todo','Cardio'] },
  l15: { name:'Funcional / CrossFit',           cat:'l', sets:'1 sessão', reps:'45–60 min', img: null,                                muscles:['Corpo Todo'] },
  l16: { name:'HIIT',                           cat:'l', sets:'1 sessão', reps:'20–30 min', img: null,                                muscles:['Cardio','Corpo Todo'] },
  l17: { name:'Futebol / Esporte Coletivo',     cat:'l', sets:'1 sessão', reps:'60–90 min', img: null,                                muscles:['Cardio','Pernas'] },
  l18: { name:'Jump (Cama Elástica)',           cat:'l', sets:'1 sessão', reps:'30–45 min', img: null,                                muscles:['Cardio','Pernas'] },
  l19: { name:'Treino de Mobilidade',           cat:'l', sets:'1 sessão', reps:'20–30 min', img: null,                                muscles:['Mobilidade'] },
};
