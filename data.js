// ============================================================
// Academia do Renê — data.js
// ============================================================

const API = 'https://script.google.com/macros/s/AKfycbz-Dt8HESvtIyCJfkMOJTEzb7lMc0cFfS7ui59Qtb2C_k-0pZ7iZawEgEBOXINjR5zY/exec';
const GH  = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

// Grade padrão (0=Dom … 6=Sáb) — sobrescrita pelo localStorage / Sheets
let SCHEDULE = JSON.parse(
  localStorage.getItem('rene_schedule') ||
  JSON.stringify({ 0:'rest', 1:'a', 2:'b', 3:'rest', 4:'a', 5:'b', 6:'c' })
);

const WN  = { a:'Superior / Core', b:'Inferior / Glúteos', c:'Full Body / Cardio', l:'Treino Livre' };
const WC  = { a:'var(--blue)', b:'var(--green)', c:'var(--purple)', l:'var(--orange)' };
const WBG = { a:'#e8f0fe',    b:'#e6f4ea',       c:'#f3e5f5',       l:'#fff3e0'       };

// ── BANCO DE EXERCÍCIOS ──────────────────────────────────────
// p = nome do exercício no repositório yuhonas/free-exercise-db (usado para buscar imagem)
// f = fallback alternativo no mesmo repositório
const EX = {
  // ── TREINO A — Superior / Core ───────────────────────────
  a1:  { name:'Puxada Frontal na Polia',         cat:'a', sets:'4 séries', reps:'10–12 reps',      p:'WidePulldown',                    f:'PulldownsWithResistanceBand',       muscles:['Latíssimo','Romboides','Bíceps']          },
  a2:  { name:'Remada Sentada na Polia',          cat:'a', sets:'4 séries', reps:'10–12 reps',      p:'SeatedCableRow',                  f:'CableSeatedRow',                    muscles:['Romboides','Trapézio','Costas']           },
  a3:  { name:'Supino com Halteres',              cat:'a', sets:'4 séries', reps:'10–12 reps',      p:'DumbbellBenchPress',              f:'BarbellBenchPress',                 muscles:['Peitoral','Deltóide','Tríceps']           },
  a4:  { name:'Desenvolvimento com Halteres',     cat:'a', sets:'3 séries', reps:'10–12 reps',      p:'DumbbellShoulderPress',           f:'SeatedDumbbellShoulderPress',       muscles:['Deltóide','Trapézio','Tríceps']           },
  a5:  { name:'Rosca Direta com Haltere',         cat:'a', sets:'3 séries', reps:'12–15 reps',      p:'DumbbellCurl',                    f:'DumbbellBicepCurl',                 muscles:['Bíceps','Braquial']                       },
  a6:  { name:'Tríceps Pulley Pushdown',          cat:'a', sets:'3 séries', reps:'12–15 reps',      p:'CablePushdown',                   f:'TricepsPushdown',                   muscles:['Tríceps','Antebraço']                    },
  a7:  { name:'Bird Dog (Cão-Pássaro)',           cat:'a', sets:'3 séries', reps:'12x cada lado',   p:'BirdDog',                         f:'QuadrupedAlternatingArmandLegRaise',muscles:['Core','Lombar','Glúteos']                },
  a8:  { name:'Prancha Isométrica',               cat:'a', sets:'3 séries', reps:'30–45 seg',        p:'Plank',                           f:'PlankOnKnees',                      muscles:['Core','Abdômen','Ombros']                },
  xa1: { name:'Crucifixo com Halteres',           cat:'a', sets:'3 séries', reps:'12 reps',          p:'DumbbellFly',                     f:'DumbbellFlyes',                     muscles:['Peitoral','Ombros']                      },
  xa2: { name:'Pull Over com Haltere',            cat:'a', sets:'3 séries', reps:'12 reps',          p:'DumbbellPullover',                f:'Pullover',                          muscles:['Serrátil','Latíssimo','Tríceps']         },
  xa3: { name:'Elevação Lateral',                 cat:'a', sets:'3 séries', reps:'12–15 reps',       p:'DumbbellLateralRaise',            f:'SideLateralRaise',                  muscles:['Deltóide Médio']                         },
  xa4: { name:'Rosca Martelo',                    cat:'a', sets:'3 séries', reps:'12 reps',          p:'HammerCurl',                      f:'AlternateHammerCurl',               muscles:['Bíceps','Braquiorradial']                },
  xa5: { name:'Tríceps Testa com Haltere',        cat:'a', sets:'3 séries', reps:'12 reps',          p:'SkullCrusher',                    f:'LyingTricepsExtension',             muscles:['Tríceps']                                },
  xa6: { name:'Face Pull na Polia',               cat:'a', sets:'3 séries', reps:'15 reps',          p:'FacePull',                        f:'CableFacePull',                     muscles:['Deltóide Posterior','Romboides']         },
  xa7: { name:'Prancha Lateral',                  cat:'a', sets:'3 séries', reps:'30–45s cada lado', p:'SidePlank',                       f:'SideBridge',                        muscles:['Oblíquos','Quadrado Lombar']             },
  xa8: { name:'Abdominal Bicicleta',              cat:'a', sets:'3 séries', reps:'20 reps',          p:'BicycleCrunch',                   f:'Crunch',                            muscles:['Reto Abdominal','Oblíquos']              },

  // ── TREINO B — Inferior / Glúteos ────────────────────────
  b1:  { name:'Leg Press 45°',                    cat:'b', sets:'4 séries', reps:'12–15 reps',       p:'LegPress',                        f:'HorizontalLegPress',                muscles:['Quadríceps','Glúteos','Ísquios']         },
  b2:  { name:'Extensão de Joelhos (Cadeira)',    cat:'b', sets:'3 séries', reps:'12–15 reps',       p:'LegExtension',                    f:'LegExtensions',                     muscles:['Quadríceps']                             },
  b3:  { name:'Mesa Flexora (Leg Curl)',           cat:'b', sets:'3 séries', reps:'12–15 reps',       p:'LegCurl',                         f:'LyingLegCurl',                      muscles:['Isquiotibiais','Panturrilha']            },
  b4:  { name:'Elevação Pélvica (Glute Bridge)',  cat:'b', sets:'4 séries', reps:'15 reps',           p:'GluteBridge',                     f:'HipRaiseBridges',                   muscles:['Glúteos','Lombar','Ísquios']             },
  b5:  { name:'Abdução no Cabo / Máquina',        cat:'b', sets:'3 séries', reps:'15x cada',         p:'HipAbduction',                    f:'LyingGluteKickback',                muscles:['Glúteo Médio','Abdutores']               },
  b6:  { name:'Panturrilha em Pé',                cat:'b', sets:'4 séries', reps:'15–20 reps',        p:'StandingCalfRaise',               f:'CalfRaise',                         muscles:['Gastrocnêmio','Sóleo']                   },
  b7:  { name:'Dead Bug (Inseto Morto)',           cat:'b', sets:'3 séries', reps:'10x cada lado',    p:'DeadBug',                         f:'LyingLegRaise',                     muscles:['Core Profundo','Transverso','Lombar']    },
  xb1: { name:'Agachamento Goblet / Sumô',        cat:'b', sets:'3 séries', reps:'12 reps',           p:'GobletSquat',                     f:'SumoSquat',                         muscles:['Adutores','Glúteos','Quadríceps']        },
  xb2: { name:'Stiff com Halteres',               cat:'b', sets:'3 séries', reps:'10–12 reps',        p:'RomanianDeadlift',                f:'StiffLegDeadlift',                  muscles:['Isquiotibiais','Glúteos']                },
  xb3: { name:'Avanço com Halteres',              cat:'b', sets:'3 séries', reps:'10x cada',          p:'DumbbellLunge',                   f:'BarbellLunge',                      muscles:['Quadríceps','Glúteos','Equilíbrio']      },
  xb4: { name:'Hip Thrust com Haltere',           cat:'b', sets:'4 séries', reps:'12 reps',           p:'HipThrust',                       f:'WeightedGluteBridge',               muscles:['Glúteos','Ísquios','Lombar']             },
  xb5: { name:'Cadeira Abdutora',                 cat:'b', sets:'3 séries', reps:'15–20 reps',        p:'HipAbduction',                    f:'SeatedHipAbduction',                muscles:['Abdutores','Glúteos']                    },
  xb6: { name:'Afundo com Halteres',              cat:'b', sets:'3 séries', reps:'12 reps cada perna',p:'DumbbellLunge',                   f:'BarbellLunge',                      muscles:['Quadríceps','Glúteos','Ísquios']         },

  // ── TREINO C — Full Body / Cardio ────────────────────────
  c1:  { name:'Goblet Squat com Haltere',         cat:'c', sets:'3 séries', reps:'12 reps',           p:'GobletSquat',                     f:'DumbbellSquat',                     muscles:['Quadríceps','Glúteos','Core']            },
  c2:  { name:'Flexão de Braços (Push-up)',        cat:'c', sets:'3 séries', reps:'10–15 reps',        p:'PushUp',                          f:'KneePushUp',                        muscles:['Peito','Tríceps','Ombros']               },
  c3:  { name:'Remada Unilateral com Haltere',    cat:'c', sets:'3 séries', reps:'10x cada',          p:'OneArmDumbbellRow',               f:'DumbbellRow',                       muscles:['Costas','Bíceps','Core']                 },
  c4:  { name:'Step Up com Halteres',             cat:'c', sets:'3 séries', reps:'12x cada',          p:'StepUp',                          f:'DumbbellStepUp',                    muscles:['Quadríceps','Glúteos','Equilíbrio']      },
  c5:  { name:'Prancha Lateral',                  cat:'c', sets:'3 séries', reps:'25–30s cada',       p:'SidePlank',                       f:'SideBridge',                        muscles:['Oblíquos','Quadrado Lombar','Core']      },
  c6:  { name:'Superman Alternado',               cat:'c', sets:'3 séries', reps:'12x cada',          p:'Superman',                        f:'BackExtension',                     muscles:['Lombar','Glúteos','Extensores']          },
  c7:  { name:'Elíptico / Bicicleta Ergométrica', cat:'c', sets:'20–30 min',reps:'60–70% FCM',        p:null,                              f:null,                                muscles:['Cardiovascular','Corpo Todo']            },
  xc1: { name:'Burpee Modificado',                cat:'c', sets:'3 séries', reps:'10 reps',           p:'Burpee',                          f:'SquatThrust',                       muscles:['Corpo Todo','Cardio']                    },
  xc2: { name:'Mountain Climber Lento',           cat:'c', sets:'3 séries', reps:'20 reps',           p:'MountainClimber',                 f:'CrossBodyMountainClimber',          muscles:['Core','Cardio','Ombros']                 },
  xc3: { name:'Kettlebell Swing',                 cat:'c', sets:'3 séries', reps:'15 reps',           p:'KettlebellSwing',                 f:'TwoArmKettlebellSwing',             muscles:['Glúteos','Ísquios','Core']               },
  xc4: { name:'Box Jump',                         cat:'c', sets:'3 séries', reps:'10 reps',           p:'BoxJump',                         f:'JumpSquat',                         muscles:['Quadríceps','Glúteos']                   },

  // ── TREINO L — Livre ─────────────────────────────────────
  l1:  { name:'Corrida (Esteira)',                cat:'l', sets:'1 sessão', reps:'20–60 min', p:null, f:null, muscles:['Cardio','Pernas']           },
  l2:  { name:'Corrida ao Ar Livre',              cat:'l', sets:'1 sessão', reps:'20–60 min', p:null, f:null, muscles:['Cardio','Pernas']           },
  l3:  { name:'Caminhada',                        cat:'l', sets:'1 sessão', reps:'30–60 min', p:null, f:null, muscles:['Cardio','Pernas']           },
  l4:  { name:'Bicicleta Ergométrica',            cat:'l', sets:'1 sessão', reps:'30–45 min', p:null, f:null, muscles:['Cardio','Quadríceps']       },
  l5:  { name:'Elíptico',                         cat:'l', sets:'1 sessão', reps:'30–45 min', p:null, f:null, muscles:['Cardio','Full Body']        },
  l6:  { name:'Natação',                          cat:'l', sets:'1 sessão', reps:'30–60 min', p:null, f:null, muscles:['Cardio','Full Body']        },
  l7:  { name:'Remo Ergômetro',                   cat:'l', sets:'1 sessão', reps:'20–30 min', p:null, f:null, muscles:['Cardio','Costas','Pernas']  },
  l8:  { name:'Yoga Vinyasa',                     cat:'l', sets:'1 sessão', reps:'45–60 min', p:null, f:null, muscles:['Mobilidade','Core']         },
  l9:  { name:'Yoga Yin',                         cat:'l', sets:'1 sessão', reps:'45–60 min', p:null, f:null, muscles:['Mobilidade','Flexibilidade']},
  l10: { name:'Pilates',                          cat:'l', sets:'1 sessão', reps:'45–60 min', p:null, f:null, muscles:['Core','Postura']            },
  l11: { name:'Alongamento Geral',                cat:'l', sets:'1 sessão', reps:'20–30 min', p:null, f:null, muscles:['Mobilidade','Flexibilidade']},
  l12: { name:'Muay Thai',                        cat:'l', sets:'1 sessão', reps:'60–90 min', p:null, f:null, muscles:['Full Body','Cardio']        },
  l13: { name:'Jiu-Jitsu',                        cat:'l', sets:'1 sessão', reps:'60–90 min', p:null, f:null, muscles:['Full Body','Core']          },
  l14: { name:'Boxe',                             cat:'l', sets:'1 sessão', reps:'60 min',    p:null, f:null, muscles:['Full Body','Cardio']        },
  l15: { name:'Funcional / CrossFit',             cat:'l', sets:'1 sessão', reps:'45–60 min', p:null, f:null, muscles:['Full Body']                },
  l16: { name:'HIIT',                             cat:'l', sets:'1 sessão', reps:'20–30 min', p:null, f:null, muscles:['Cardio','Full Body']        },
  l17: { name:'Futebol / Esporte Coletivo',       cat:'l', sets:'1 sessão', reps:'60–90 min', p:null, f:null, muscles:['Cardio','Pernas']           },
  l18: { name:'Jump (Cama Elástica)',             cat:'l', sets:'1 sessão', reps:'30–45 min', p:null, f:null, muscles:['Cardio','Pernas']           },
  l19: { name:'Treino de Mobilidade',             cat:'l', sets:'1 sessão', reps:'20–30 min', p:null, f:null, muscles:['Mobilidade']               },
};
