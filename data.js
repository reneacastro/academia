// ============================================================
// Academia do Renê — data.js
// ============================================================
// IMPORTANTE: após criar novo deploy no Apps Script,
// substitua a URL abaixo pela URL gerada.
// ============================================================

const API = 'https://script.google.com/macros/s/AKfycbwOCH-J3SHMpDGqrpB3mBMvGR-GkRpPCxLK8gAbpwiCsWEXBwebNgS7FNrjjhupPC2/exec';
const GH  = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// Grade padrão (0=Dom … 6=Sáb) — sobrescrita pelo localStorage/Sheets
let SCHEDULE = JSON.parse(
  localStorage.getItem('reneschedule') ||
  JSON.stringify({ 0:'rest', 1:'a', 2:'b', 3:'rest', 4:'a', 5:'b', 6:'c' })
);

const WN  = { a:'Superior / Core', b:'Inferior / Glúteos', c:'Full Body / Cardio', l:'Treino Livre' };
const WC  = { a:'var(--blue)', b:'var(--green)', c:'var(--purple)', l:'var(--orange)' };
const WBG = { a:'#e8f0fe', b:'#e6f4ea', c:'#f3e5f5', l:'#fff3e0' };

// ── BANCO DE EXERCÍCIOS ──────────────────────────────────────
const EX = {
  // ── TREINO A — Superior / Core ───────────────────────────
  a1:  { name:'Puxada Frontal na Polia',         cat:'a', sets:'4 séries', reps:'10–12 reps', img:'Lat_Pulldown_With_V_Bar', img2:'Pulldown',                     muscles:['Latíssimo','Romboides','Bíceps'] },
  a2:  { name:'Remada Sentada na Polia',          cat:'a', sets:'4 séries', reps:'10–12 reps', img:'Cable_Seated_Row', img2:'Seated_Cable_Rows',                  muscles:['Romboides','Trapézio','Costas'] },
  a3:  { name:'Supino com Halteres',              cat:'a', sets:'4 séries', reps:'10–12 reps', img:'Dumbbell_Bench_Press', img2:'Barbell_Bench_Press',               muscles:['Peitoral','Deltóide','Tríceps'] },
  a4:  { name:'Desenvolvimento com Halteres',     cat:'a', sets:'3 séries', reps:'10–12 reps', img:'Dumbbell_Shoulder_Press', img2:'Seated_Dumbbell_Shoulder_Press',     muscles:['Deltóide','Trapézio','Tríceps'] },
  a5:  { name:'Rosca Direta com Haltere',         cat:'a', sets:'3 séries', reps:'12–15 reps', img:'Dumbbell_Bicep_Curl', img2:'Alternate_Dumbbell_Curl',             muscles:['Bíceps','Braquial'] },
  a6:  { name:'Tríceps Pulley Pushdown',          cat:'a', sets:'3 séries', reps:'12–15 reps', img:'Tricep_Pushdown', img2:'Pushdowns',                 muscles:['Tríceps','Antebraço'] },
  a7:  { name:'Bird Dog (Cão-Pássaro)',           cat:'a', sets:'3 séries', reps:'12x cada lado', img:'Bird_Dog', img2:null,                    muscles:['Core','Lombar','Glúteos'] },
  a8:  { name:'Prancha Isométrica',               cat:'a', sets:'3 séries', reps:'30–45 seg',  img:'Plank', img2:'Front_Plank',           muscles:['Core','Abdômen','Ombros'] },
  xa1: { name:'Crucifixo com Halteres',           cat:'a', sets:'3 séries', reps:'12 reps',    img:'Dumbbell_Flyes', img2:'Incline_Dumbbell_Flyes',            muscles:['Peitoral','Ombros'] },
  xa2: { name:'Pull Over com Haltere',            cat:'a', sets:'3 séries', reps:'12 reps',    img:'Dumbbell_Pullover', img2:null,                        muscles:['Serrátil','Latíssimo','Tríceps'] },
  xa3: { name:'Elevação Lateral',                 cat:'a', sets:'3 séries', reps:'12–15 reps', img:'Side_Lateral_Raise', img2:'Dumbbell_Lateral_Raise',                muscles:['Deltóide Médio'] },
  xa4: { name:'Rosca Martelo',                    cat:'a', sets:'3 séries', reps:'12 reps',    img:'Hammer_Curls', img2:'Alternate_Hammer_Curl',             muscles:['Bíceps','Braquiorradial'] },
  xa5: { name:'Tríceps Testa com Haltere',        cat:'a', sets:'3 séries', reps:'12 reps',    img:'Lying_Triceps_Extension', img2:'EZ-Bar_Skull_Crusher',           muscles:['Tríceps'] },
  xa6: { name:'Face Pull na Polia',               cat:'a', sets:'3 séries', reps:'15 reps',    img:null, img2:null,                              muscles:['Deltóide Posterior','Romboides'] },
  xa7: { name:'Prancha Lateral',                  cat:'a', sets:'3 séries', reps:'30–45s cada lado', img:'Side_Plank', img2:'Side_Bridge',                      muscles:['Oblíquos','Quadrado Lombar'] },
  xa8: { name:'Abdominal Bicicleta',              cat:'a', sets:'3 séries', reps:'20 reps',    img:'Bicycle_Crunch', img2:null,                              muscles:['Reto Abdominal','Oblíquos'] },

  // ── TREINO B — Inferior / Glúteos ────────────────────────
  b1:  { name:'Leg Press 45°',                    cat:'b', sets:'4 séries', reps:'12–15 reps', img:'Leg_Press', img2:'Horizontal_Leg_Press',              muscles:['Quadríceps','Glúteos','Ísquios'] },
  b2:  { name:'Extensão de Joelhos (Cadeira)',    cat:'b', sets:'3 séries', reps:'12–15 reps', img:'Leg_Extensions', img2:null,                    muscles:['Quadríceps'] },
  b3:  { name:'Mesa Flexora (Leg Curl)',          cat:'b', sets:'3 séries', reps:'12–15 reps', img:'Lying_Leg_Curls', img2:'Leg_Curl',                         muscles:['Isquiotibiais','Panturrilha'] },
  b4:  { name:'Elevação Pélvica (Glute Bridge)',  cat:'b', sets:'4 séries', reps:'15 reps',    img:'Glute_Bridge', img2:'Hip_Raise_-_Bridges',                 muscles:['Glúteos','Lombar','Ísquios'] },
  b5:  { name:'Abdução no Cabo / Máquina',        cat:'b', sets:'3 séries', reps:'15x cada',   img:'Hip_Abduction', img2:null,              muscles:['Glúteo Médio','Abdutores'] },
  b6:  { name:'Panturrilha em Pé',               cat:'b', sets:'4 séries', reps:'15–20 reps', img:'Standing_Calf_Raises', img2:'Calf_Raise',                       muscles:['Gastrocnêmio','Sóleo'] },
  b7:  { name:'Dead Bug (Inseto Morto)',          cat:'b', sets:'3 séries', reps:'10x cada lado', img:'Dead_Bug', img2:null,                   muscles:['Core Profundo','Transverso','Lombar'] },
  xb1: { name:'Agachamento Goblet / Sumô',       cat:'b', sets:'3 séries', reps:'12 reps',    img:'Goblet_Squat', img2:'Wide-Stance_Barbell_Squat',          muscles:['Adutores','Glúteos','Quadríceps'] },
  xb2: { name:'Stiff com Halteres',              cat:'b', sets:'3 séries', reps:'10–12 reps', img:'Romanian_Deadlift', img2:'Stiff-Legged_Barbell_Deadlift',               muscles:['Isquiotibiais','Glúteos'] },
  xb3: { name:'Avanço com Halteres',             cat:'b', sets:'3 séries', reps:'10x cada',   img:'Dumbbell_Lunges', img2:'Barbell_Lunge',                    muscles:['Quadríceps','Glúteos','Equilíbrio'] },
  xb4: { name:'Hip Thrust com Haltere',          cat:'b', sets:'4 séries', reps:'12 reps',    img:'Barbell_Hip_Thrust', img2:'Glute_Bridge',             muscles:['Glúteos','Ísquios','Lombar'] },
  xb5: { name:'Cadeira Abdutora',                cat:'b', sets:'3 séries', reps:'15–20 reps', img:null, img2:null,                              muscles:['Abdutores','Glúteos'] },
  xb6: { name:'Afundo com Halteres',             cat:'b', sets:'3 séries', reps:'12 reps cada perna', img:'Dumbbell_Lunges', img2:null,                              muscles:['Quadríceps','Glúteos','Ísquios'] },

  // ── TREINO C — Full Body / Cardio ────────────────────────
  c1:  { name:'Goblet Squat com Haltere',        cat:'c', sets:'3 séries', reps:'12 reps',    img:'Goblet_Squat', img2:'Dumbbell_Squat',                   muscles:['Quadríceps','Glúteos','Core'] },
  c2:  { name:'Flexão de Braços (Push-up)',       cat:'c', sets:'3 séries', reps:'10–15 reps', img:'Push-Up', img2:'Wide-Grip_Push-Up',                         muscles:['Peito','Tríceps','Ombros'] },
  c3:  { name:'Remada Unilateral com Haltere',   cat:'c', sets:'3 séries', reps:'10x cada',   img:'One-Arm_Dumbbell_Row', img2:'Bent_Over_Two-Dumbbell_Row',                     muscles:['Costas','Bíceps','Core'] },
  c4:  { name:'Step Up com Halteres',            cat:'c', sets:'3 séries', reps:'12x cada',   img:'Dumbbell_Step_Ups', img2:'Step-up',                        muscles:['Quadríceps','Glúteos','Equilíbrio'] },
  c5:  { name:'Prancha Lateral',                 cat:'c', sets:'3 séries', reps:'25–30s cada', img:'Side_Plank', img2:'Side_Bridge',                      muscles:['Oblíquos','Quadrado Lombar','Core'] },
  c6:  { name:'Superman Alternado',              cat:'c', sets:'3 séries', reps:'12x cada',   img:'Superman', img2:'Back_Extension',              muscles:['Lombar','Glúteos','Extensores'] },
  c7:  { name:'Elíptico / Bicicleta Ergométrica',cat:'c', sets:'20–30 min', reps:'60–70% FCM', img:null, img2:null,                              muscles:['Cardiovascular','Corpo Todo'] },
  xc1: { name:'Burpee Modificado',               cat:'c', sets:'3 séries', reps:'10 reps',    img:'Burpee', img2:'Squat_Thrusts',                    muscles:['Corpo Todo','Cardio'] },
  xc2: { name:'Mountain Climber Lento',          cat:'c', sets:'3 séries', reps:'20 reps',    img:'Mountain_Climber', img2:null,                muscles:['Core','Cardio','Ombros'] },
  xc3: { name:'Kettlebell Swing',                cat:'c', sets:'3 séries', reps:'15 reps',    img:'Kettlebell_Sumo_High_Pull', img2:'Two-Arm_Kettlebell_Swing',          muscles:['Glúteos','Ísquios','Core'] },
  xc4: { name:'Box Jump',                        cat:'c', sets:'3 séries', reps:'10 reps',    img:null, img2:null,                              muscles:['Quadríceps','Glúteos'] },

  // ── TREINO L — Livre ─────────────────────────────────────
  l1:  { name:'Corrida (Esteira)',                cat:'l', sets:'1 sessão', reps:'20–60 min',  p:null, f:null, muscles:['Cardio','Pernas'] },
  l2:  { name:'Corrida ao Ar Livre',             cat:'l', sets:'1 sessão', reps:'20–60 min',  p:null, f:null, muscles:['Cardio','Pernas'] },
  l3:  { name:'Caminhada',                        cat:'l', sets:'1 sessão', reps:'30–60 min',  p:null, f:null, muscles:['Cardio','Pernas'] },
  l4:  { name:'Bicicleta Ergométrica',            cat:'l', sets:'1 sessão', reps:'30–45 min',  p:null, f:null, muscles:['Cardio','Quadríceps'] },
  l5:  { name:'Elíptico',                         cat:'l', sets:'1 sessão', reps:'30–45 min',  p:null, f:null, muscles:['Cardio','Full Body'] },
  l6:  { name:'Natação',                          cat:'l', sets:'1 sessão', reps:'30–60 min',  p:null, f:null, muscles:['Cardio','Full Body'] },
  l7:  { name:'Remo Ergômetro',                   cat:'l', sets:'1 sessão', reps:'20–30 min',  p:null, f:null, muscles:['Cardio','Costas','Pernas'] },
  l8:  { name:'Yoga Vinyasa',                     cat:'l', sets:'1 sessão', reps:'45–60 min',  p:null, f:null, muscles:['Mobilidade','Core'] },
  l9:  { name:'Yoga Yin',                         cat:'l', sets:'1 sessão', reps:'45–60 min',  p:null, f:null, muscles:['Mobilidade','Flexibilidade'] },
  l10: { name:'Pilates',                           cat:'l', sets:'1 sessão', reps:'45–60 min',  p:null, f:null, muscles:['Core','Postura'] },
  l11: { name:'Alongamento Geral',                cat:'l', sets:'1 sessão', reps:'20–30 min',  p:null, f:null, muscles:['Mobilidade','Flexibilidade'] },
  l12: { name:'Muay Thai',                        cat:'l', sets:'1 sessão', reps:'60–90 min',  p:null, f:null, muscles:['Full Body','Cardio'] },
  l13: { name:'Jiu-Jitsu',                        cat:'l', sets:'1 sessão', reps:'60–90 min',  p:null, f:null, muscles:['Full Body','Core'] },
  l14: { name:'Boxe',                             cat:'l', sets:'1 sessão', reps:'60 min',     p:null, f:null, muscles:['Full Body','Cardio'] },
  l15: { name:'Funcional / CrossFit',             cat:'l', sets:'1 sessão', reps:'45–60 min',  p:null, f:null, muscles:['Full Body'] },
  l16: { name:'HIIT',                             cat:'l', sets:'1 sessão', reps:'20–30 min',  p:null, f:null, muscles:['Cardio','Full Body'] },
  l17: { name:'Futebol / Esporte Coletivo',       cat:'l', sets:'1 sessão', reps:'60–90 min',  p:null, f:null, muscles:['Cardio','Pernas'] },
  l18: { name:'Jump (Cama Elástica)',             cat:'l', sets:'1 sessão', reps:'30–45 min',  p:null, f:null, muscles:['Cardio','Pernas'] },
  l19: { name:'Treino de Mobilidade',             cat:'l', sets:'1 sessão', reps:'20–30 min',  p:null, f:null, muscles:['Mobilidade'] },
};
