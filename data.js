/* ═══════════════════════════════════════════════
   data.js  — CONFIG + BANCO DE EXERCÍCIOS
   Academia do Renê
═══════════════════════════════════════════════ */

const API = 'https://script.google.com/macros/s/AKfycbwOCH_-J3SHMpDGqrpB3mBMvGR-GkRpPCxLK8gAbpwiCsWEXBwebNgS7FNrjjhupPC2/exec';
const GH  = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

/* Grade padrão: 0=Dom … 6=Sáb — sobrescrita pelo localStorage */
let SCHEDULE = JSON.parse(
  localStorage.getItem('rene_schedule') ||
  '{"0":"rest","1":"a","2":"b","3":"rest","4":"a","5":"b","6":"c"}'
);

const WN = {
  a: 'Superior + Core',
  b: 'Inferior + Glúteos',
  c: 'Full Body + Cardio',
  l: 'Treino Livre'
};
const WC  = { a:'var(--blue)', b:'var(--green)', c:'var(--purple)', l:'var(--orange)' };
const WBG = { a:'#e8f0fe',    b:'#e6f4ea',      c:'#f3e5f5',      l:'#fff3e0'       };

/* ── BANCO DE EXERCÍCIOS ── */
const EX = {
  /* Treino A — Superior + Core */
  a1:  { name:'Puxada Frontal na Polia',     cat:'a', sets:'4 séries', reps:'10–12 reps', p:'Wide-Grip_Lat_Pulldown',          f:'Lat_Pulldown',                   muscles:['Latíssimo','Romboides','Bíceps'] },
  a2:  { name:'Remada Sentada na Polia',      cat:'a', sets:'4 séries', reps:'10–12 reps', p:'Seated_Cable_Rows',               f:'Cable_Seated_Row',                muscles:['Romboides','Trapézio','Costas'] },
  a3:  { name:'Supino com Halteres',          cat:'a', sets:'4 séries', reps:'10–12 reps', p:'Dumbbell_Bench_Press',            f:'Barbell_Bench_Press',             muscles:['Peitoral','Deltóide','Tríceps'] },
  a4:  { name:'Desenvolvimento com Halteres', cat:'a', sets:'3 séries', reps:'10–12 reps', p:'Dumbbell_Shoulder_Press',         f:'Seated_Dumbbell_Shoulder_Press',  muscles:['Deltóide','Trapézio','Tríceps'] },
  a5:  { name:'Rosca Direta com Haltere',     cat:'a', sets:'3 séries', reps:'12–15 reps', p:'Dumbbell_Bicep_Curl',             f:'Alternate_Hammer_Curl',           muscles:['Bíceps','Braquial'] },
  a6:  { name:'Tríceps Pulley (Pushdown)',    cat:'a', sets:'3 séries', reps:'12–15 reps', p:'Pushdown',                        f:'Triceps_Pushdown',                muscles:['Tríceps','Antebraço'] },
  a7:  { name:'Bird Dog (Cão-Pássaro)',       cat:'a', sets:'3 séries', reps:'12x cada lado', p:'Quadruped_Alternating_Arm_and_Leg_Raise', f:'Bird_Dog',           muscles:['Core','Lombar','Glúteos'] },
  a8:  { name:'Prancha Isométrica',           cat:'a', sets:'3 séries', reps:'30–45 seg',  p:'Plank',                           f:'Front_Plank_with_Arm_Lift',       muscles:['Core','Abdômen','Ombros'] },
  xa1: { name:'Crucifixo com Halteres',       cat:'a', sets:'3 séries', reps:'12 reps',    p:'Dumbbell_Flyes',                  f:'Incline_Dumbbell_Flyes',          muscles:['Peitoral','Ombros'] },
  xa2: { name:'Pull Over com Haltere',        cat:'a', sets:'3 séries', reps:'12 reps',    p:'Dumbbell_Pullover',               f:'Pullover',                        muscles:['Serrátil','Latíssimo','Tríceps'] },
  xa3: { name:'Elevação Lateral',             cat:'a', sets:'3 séries', reps:'12–15 reps', p:'Dumbbell_Lateral_Raise',          f:'Side_Lateral_Raise',              muscles:['Deltóide Médio'] },
  xa4: { name:'Rosca Martelo',                cat:'a', sets:'3 séries', reps:'12 reps',    p:'Hammer_Curls',                    f:'Alternate_Hammer_Curl',           muscles:['Bíceps','Braquioradial'] },
  xa5: { name:'Tríceps Testa com Haltere',    cat:'a', sets:'3 séries', reps:'12 reps',    p:'EZ-Bar_Skullcrusher',             f:'Lying_Triceps_Extension',         muscles:['Tríceps'] },
  xa6: { name:'Face Pull na Polia',           cat:'a', sets:'3 séries', reps:'15 reps',    p:null, f:null,                                                           muscles:['Deltóide Posterior','Romboides'] },
  xa7: { name:'Prancha Lateral',              cat:'a', sets:'3 séries', reps:'30–45s cada lado', p:'Side_Plank', f:'Side_Bridge',                                    muscles:['Oblíquos','Quadrado Lombar'] },
  xa8: { name:'Abdominal Bicicleta',          cat:'a', sets:'3 séries', reps:'20 reps',    p:null, f:null,                                                           muscles:['Reto Abdominal','Oblíquos'] },

  /* Treino B — Inferior + Glúteos */
  b1:  { name:'Leg Press 45°',               cat:'b', sets:'4 séries', reps:'12–15 reps', p:'Leg_Press',             f:'Horizontal_Leg_Press',        muscles:['Quadríceps','Glúteos','Isquios'] },
  b2:  { name:'Extensão de Joelhos (Cadeira)',cat:'b', sets:'3 séries', reps:'12–15 reps', p:'Leg_Extensions',        f:'Leg_Extension',               muscles:['Quadríceps'] },
  b3:  { name:'Mesa Flexora (Leg Curl)',      cat:'b', sets:'3 séries', reps:'12–15 reps', p:'Lying_Leg_Curl',        f:'Leg_Curl',                    muscles:['Isquiotibiais','Panturrilha'] },
  b4:  { name:'Elevação Pélvica (Glute Bridge)', cat:'b', sets:'4 séries', reps:'15 reps', p:'Glute_Bridge',          f:'Hip_Raise_(Bridges)',          muscles:['Glúteos','Lombar','Isquios'] },
  b5:  { name:'Abdução no Cabo/Máquina',      cat:'b', sets:'3 séries', reps:'15x cada',  p:'Hip_Abductors',         f:'Lying_Glute_Kickback',        muscles:['Glúteo Médio','Abdutores'] },
  b6:  { name:'Panturrilha em Pé',            cat:'b', sets:'4 séries', reps:'15–20 reps', p:'Standing_Calf_Raises',  f:'Calf_Raise',                  muscles:['Gastrocnêmio','Sóleo'] },
  b7:  { name:'Dead Bug (Inseto Morto)',       cat:'b', sets:'3 séries', reps:'10x cada lado', p:'Dead_Bug',           f:'Lying_Leg_Raise',             muscles:['Core Profundo','Transverso','Lombar'] },
  xb1: { name:'Agachamento Goblet Sumô',      cat:'b', sets:'3 séries', reps:'12 reps',   p:'Sumo_Squat',            f:'Wide_Stance_Barbell_Squat',   muscles:['Adutores','Glúteos','Quadríceps'] },
  xb2: { name:'Stiff com Halteres',           cat:'b', sets:'3 séries', reps:'10–12 reps', p:'Romanian_Deadlift',     f:'Stiff-Leg_Deadlift',          muscles:['Isquiotibiais','Glúteos'] },
  xb3: { name:'Avanço com Halteres',          cat:'b', sets:'3 séries', reps:'10x cada',  p:'Dumbbell_Lunges',        f:'Barbell_Lunge',               muscles:['Quadríceps','Glúteos','Equilíbrio'] },
  xb4: { name:'Hip Thrust com Haltere',       cat:'b', sets:'4 séries', reps:'12 reps',   p:'Hip_Thrust',             f:'Weighted_Glute_Bridge',       muscles:['Glúteos','Isquios','Lombar'] },
  xb5: { name:'Cadeira Abdutora',             cat:'b', sets:'3 séries', reps:'15–20 reps', p:null, f:null,                                             muscles:['Abdutores','Glúteos'] },
  xb6: { name:'Afundo com Halteres',          cat:'b', sets:'3 séries', reps:'12 reps cada perna', p:null, f:null,                                     muscles:['Quadríceps','Glúteos','Isquios'] },

  /* Treino C — Full Body + Cardio */
  c1:  { name:'Goblet Squat com Haltere',     cat:'c', sets:'3 séries', reps:'12 reps',   p:'Goblet_Squat',          f:'Dumbbell_Squat',              muscles:['Quadríceps','Glúteos','Core'] },
  c2:  { name:'Flexão de Braços (Push-up)',   cat:'c', sets:'3 séries', reps:'10–15 reps', p:'Push-Ups',              f:'Pushups',                     muscles:['Peito','Tríceps','Ombros'] },
  c3:  { name:'Remada Unilateral com Haltere',cat:'c', sets:'3 séries', reps:'10x cada',  p:'One_Arm_Dumbbell_Row',   f:'Dumbbell_Row',                muscles:['Costas','Bíceps','Core'] },
  c4:  { name:'Step Up com Halteres',         cat:'c', sets:'3 séries', reps:'12x cada',  p:'Dumbbell_Step_Ups',      f:'Step-ups',                    muscles:['Quadríceps','Glúteos','Equilíbrio'] },
  c5:  { name:'Prancha Lateral',              cat:'c', sets:'3 séries', reps:'25–30s cada', p:'Side_Plank',           f:'Side_Bridge',                 muscles:['Oblíquos','Quadrado Lombar','Core'] },
  c6:  { name:'Superman Alternado',           cat:'c', sets:'3 séries', reps:'12x cada',  p:'Superman',               f:'Back_Hyperextension',         muscles:['Lombar','Glúteos','Extensores'] },
  c7:  { name:'Elíptico / Bicicleta Ergométrica', cat:'c', sets:'20–30 min', reps:'60–70% FCM', p:null, f:null,                                       muscles:['Cardiovascular','Corpo Todo'] },
  xc1: { name:'Burpee Modificado',            cat:'c', sets:'3 séries', reps:'10 reps',   p:'Burpees',                f:'Squat_Thrusts',               muscles:['Corpo Todo','Cardio'] },
  xc2: { name:'Mountain Climber Lento',       cat:'c', sets:'3 séries', reps:'20 reps',   p:'Mountain_Climber_(Cross-Body)', f:'Mountain_Climbers',     muscles:['Core','Cardio','Ombros'] },
  xc3: { name:'Kettlebell Swing',             cat:'c', sets:'3 séries', reps:'15 reps',   p:'Kettlebell_Sumo_High_Pull', f:'Two-Arm_Kettlebell_Swing', muscles:['Glúteos','Isquios','Core'] },
  xc4: { name:'Box Jump',                     cat:'c', sets:'3 séries', reps:'10 reps',   p:null, f:null,                                             muscles:['Quadríceps','Glúteos'] },

  /* Treino L — Livre */
  l1:  { name:'Corrida (Esteira)',            cat:'l', sets:'1 sessão', reps:'20–60 min', p:null, f:null, muscles:['Cardio','Pernas'] },
  l2:  { name:'Corrida ao Ar Livre',          cat:'l', sets:'1 sessão', reps:'20–60 min', p:null, f:null, muscles:['Cardio','Pernas'] },
  l3:  { name:'Caminhada',                    cat:'l', sets:'1 sessão', reps:'30–60 min', p:null, f:null, muscles:['Cardio','Pernas'] },
  l4:  { name:'Bicicleta Ergométrica',        cat:'l', sets:'1 sessão', reps:'30–45 min', p:null, f:null, muscles:['Cardio','Quadríceps'] },
  l5:  { name:'Elíptico',                     cat:'l', sets:'1 sessão', reps:'30–45 min', p:null, f:null, muscles:['Cardio','Full Body'] },
  l6:  { name:'Natação',                      cat:'l', sets:'1 sessão', reps:'30–60 min', p:null, f:null, muscles:['Cardio','Full Body'] },
  l7:  { name:'Remo Ergômetro',               cat:'l', sets:'1 sessão', reps:'20–30 min', p:null, f:null, muscles:['Cardio','Costas','Pernas'] },
  l8:  { name:'Yoga Vinyasa',                 cat:'l', sets:'1 sessão', reps:'45–60 min', p:null, f:null, muscles:['Mobilidade','Core'] },
  l9:  { name:'Yoga Yin',                     cat:'l', sets:'1 sessão', reps:'45–60 min', p:null, f:null, muscles:['Mobilidade','Flexibilidade'] },
  l10: { name:'Pilates',                      cat:'l', sets:'1 sessão', reps:'45–60 min', p:null, f:null, muscles:['Core','Postura'] },
  l11: { name:'Alongamento Geral',            cat:'l', sets:'1 sessão', reps:'20–30 min', p:null, f:null, muscles:['Mobilidade','Flexibilidade'] },
  l12: { name:'Muay Thai',                    cat:'l', sets:'1 sessão', reps:'60–90 min', p:null, f:null, muscles:['Full Body','Cardio'] },
  l13: { name:'Jiu-Jitsu',                    cat:'l', sets:'1 sessão', reps:'60–90 min', p:null, f:null, muscles:['Full Body','Core'] },
  l14: { name:'Boxe',                         cat:'l', sets:'1 sessão', reps:'60 min',    p:null, f:null, muscles:['Full Body','Cardio'] },
  l15: { name:'Funcional / CrossFit',         cat:'l', sets:'1 sessão', reps:'45–60 min', p:null, f:null, muscles:['Full Body'] },
  l16: { name:'HIIT',                         cat:'l', sets:'1 sessão', reps:'20–30 min', p:null, f:null, muscles:['Cardio','Full Body'] },
  l17: { name:'Futebol / Esporte Coletivo',   cat:'l', sets:'1 sessão', reps:'60–90 min', p:null, f:null, muscles:['Cardio','Pernas'] },
  l18: { name:'Jump (Cama Elástica)',         cat:'l', sets:'1 sessão', reps:'30–45 min', p:null, f:null, muscles:['Cardio','Pernas'] },
  l19: { name:'Treino de Mobilidade',         cat:'l', sets:'1 sessão', reps:'20–30 min', p:null, f:null, muscles:['Mobilidade'] },
};
