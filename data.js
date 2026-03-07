// ============================================================
// Academia do Rene - data.js
// ============================================================

const API = 'https://script.google.com/macros/s/AKfycbz-Dt8HESvtIyCJfkMOJTEzb7lMc0cFfS7ui59Qtb2C_k-0pZ7iZawEgEBOXINjR5zY/exec';

// wger.de - API publica de exercicios com imagens estaveis
// Endpoint: https://wger.de/api/v2/exerciseinfo/{id}/?format=json&language=8
// Imagens:  response.images[0].url  (URL absoluta, CDN do wger)
const WGER = 'https://wger.de/api/v2/exerciseinfo/';

// Grade padrao (0=Dom ... 6=Sab) - sobrescrita pelo localStorage / Sheets
let SCHEDULE = JSON.parse(
  localStorage.getItem('rene_schedule') ||
  JSON.stringify({ 0:'rest', 1:'a', 2:'b', 3:'rest', 4:'a', 5:'b', 6:'c' })
);

const WN  = { a:'Superior / Core', b:'Inferior / Gluteos', c:'Full Body / Cardio', l:'Treino Livre' };
const WC  = { a:'var(--blue)', b:'var(--green)', c:'var(--purple)', l:'var(--orange)' };
const WBG = { a:'#e8f0fe',    b:'#e6f4ea',       c:'#f3e5f5',       l:'#fff3e0'       };

// Emojis de fallback por grupo muscular (usado quando nao ha imagem)
const CAT_EMOJI = { a:'💪', b:'🦵', c:'🔥', l:'🏃' };

// ============================================================
// BANCO DE EXERCICIOS
// wger_id: ID do exercicio na API wger.de (https://wger.de/en/exercise/overview/)
//          null = sem imagem disponivel na API (cardio livre, etc.)
// ============================================================
const EX = {
  // TREINO A - Superior / Core
  a1:  { name:'Puxada Frontal na Polia',         cat:'a', sets:'4 series', reps:'10-12 reps',      wger_id: 75,  muscles:['Latissimo','Romboides','Biceps']          },
  a2:  { name:'Remada Sentada na Polia',          cat:'a', sets:'4 series', reps:'10-12 reps',      wger_id: 61,  muscles:['Romboides','Trapezio','Costas']           },
  a3:  { name:'Supino com Halteres',              cat:'a', sets:'4 series', reps:'10-12 reps',      wger_id: 192, muscles:['Peitoral','Deltoide','Triceps']           },
  a4:  { name:'Desenvolvimento com Halteres',     cat:'a', sets:'3 series', reps:'10-12 reps',      wger_id: 79,  muscles:['Deltoide','Trapezio','Triceps']           },
  a5:  { name:'Rosca Direta com Haltere',         cat:'a', sets:'3 series', reps:'12-15 reps',      wger_id: 72,  muscles:['Biceps','Braquial']                       },
  a6:  { name:'Triceps Pulley Pushdown',          cat:'a', sets:'3 series', reps:'12-15 reps',      wger_id: 15,  muscles:['Triceps','Antebraco']                    },
  a7:  { name:'Bird Dog (Cao-Passaro)',           cat:'a', sets:'3 series', reps:'12x cada lado',   wger_id: 91,  muscles:['Core','Lombar','Gluteos']                },
  a8:  { name:'Prancha Isometrica',               cat:'a', sets:'3 series', reps:'30-45 seg',        wger_id: 155, muscles:['Core','Abdomen','Ombros']                },
  xa1: { name:'Crucifixo com Halteres',           cat:'a', sets:'3 series', reps:'12 reps',          wger_id: 122, muscles:['Peitoral','Ombros']                      },
  xa2: { name:'Pull Over com Haltere',            cat:'a', sets:'3 series', reps:'12 reps',          wger_id: 25,  muscles:['Serratil','Latissimo','Triceps']         },
  xa3: { name:'Elevacao Lateral',                 cat:'a', sets:'3 series', reps:'12-15 reps',       wger_id: 78,  muscles:['Deltoide Medio']                         },
  xa4: { name:'Rosca Martelo',                    cat:'a', sets:'3 series', reps:'12 reps',          wger_id: 206, muscles:['Biceps','Braquiorradial']                },
  xa5: { name:'Triceps Testa com Haltere',        cat:'a', sets:'3 series', reps:'12 reps',          wger_id: 18,  muscles:['Triceps']                                },
  xa6: { name:'Face Pull na Polia',               cat:'a', sets:'3 series', reps:'15 reps',          wger_id: 227, muscles:['Deltoide Posterior','Romboides']         },
  xa7: { name:'Prancha Lateral',                  cat:'a', sets:'3 series', reps:'30-45s cada lado', wger_id: 156, muscles:['Obliquos','Quadrado Lombar']             },
  xa8: { name:'Abdominal Bicicleta',              cat:'a', sets:'3 series', reps:'20 reps',          wger_id: 124, muscles:['Reto Abdominal','Obliquos']              },

  // TREINO B - Inferior / Gluteos
  b1:  { name:'Leg Press 45 graus',               cat:'b', sets:'4 series', reps:'12-15 reps',       wger_id: 284, muscles:['Quadriceps','Gluteos','Isquios']         },
  b2:  { name:'Extensao de Joelhos (Cadeira)',    cat:'b', sets:'3 series', reps:'12-15 reps',       wger_id: 1153,muscles:['Quadriceps']                             },
  b3:  { name:'Mesa Flexora (Leg Curl)',           cat:'b', sets:'3 series', reps:'12-15 reps',       wger_id: 1155,muscles:['Isquiotibiais','Panturrilha']            },
  b4:  { name:'Elevacao Pelvica (Glute Bridge)',  cat:'b', sets:'4 series', reps:'15 reps',           wger_id: 1201,muscles:['Gluteos','Lombar','Isquios']             },
  b5:  { name:'Abducao no Cabo / Maquina',        cat:'b', sets:'3 series', reps:'15x cada',         wger_id: 152, muscles:['Gluteo Medio','Abdutores']               },
  b6:  { name:'Panturrilha em Pe',                cat:'b', sets:'4 series', reps:'15-20 reps',        wger_id: 83,  muscles:['Gastrocnemio','Soleo']                   },
  b7:  { name:'Dead Bug (Inseto Morto)',           cat:'b', sets:'3 series', reps:'10x cada lado',    wger_id: 91,  muscles:['Core Profundo','Transverso','Lombar']    },
  xb1: { name:'Agachamento Goblet / Sumo',        cat:'b', sets:'3 series', reps:'12 reps',           wger_id: 69,  muscles:['Adutores','Gluteos','Quadriceps']        },
  xb2: { name:'Stiff com Halteres',               cat:'b', sets:'3 series', reps:'10-12 reps',        wger_id: 64,  muscles:['Isquiotibiais','Gluteos']                },
  xb3: { name:'Avanco com Halteres',              cat:'b', sets:'3 series', reps:'10x cada',          wger_id: 99,  muscles:['Quadriceps','Gluteos','Equilibrio']      },
  xb4: { name:'Hip Thrust com Haltere',           cat:'b', sets:'4 series', reps:'12 reps',           wger_id: 1201,muscles:['Gluteos','Isquios','Lombar']             },
  xb5: { name:'Cadeira Abdutora',                 cat:'b', sets:'3 series', reps:'15-20 reps',        wger_id: 152, muscles:['Abdutores','Gluteos']                    },
  xb6: { name:'Afundo com Halteres',              cat:'b', sets:'3 series', reps:'12 reps cada perna',wger_id: 99,  muscles:['Quadriceps','Gluteos','Isquios']         },

  // TREINO C - Full Body / Cardio
  c1:  { name:'Goblet Squat com Haltere',         cat:'c', sets:'3 series', reps:'12 reps',           wger_id: 69,  muscles:['Quadriceps','Gluteos','Core']            },
  c2:  { name:'Flexao de Bracos (Push-up)',        cat:'c', sets:'3 series', reps:'10-15 reps',        wger_id: 22,  muscles:['Peito','Triceps','Ombros']               },
  c3:  { name:'Remada Unilateral com Haltere',    cat:'c', sets:'3 series', reps:'10x cada',          wger_id: 62,  muscles:['Costas','Biceps','Core']                 },
  c4:  { name:'Step Up com Halteres',             cat:'c', sets:'3 series', reps:'12x cada',          wger_id: 1207,muscles:['Quadriceps','Gluteos','Equilibrio']      },
  c5:  { name:'Prancha Lateral',                  cat:'c', sets:'3 series', reps:'25-30s cada',       wger_id: 156, muscles:['Obliquos','Quadrado Lombar','Core']      },
  c6:  { name:'Superman Alternado',               cat:'c', sets:'3 series', reps:'12x cada',          wger_id: 165, muscles:['Lombar','Gluteos','Extensores']          },
  c7:  { name:'Eliptico / Bicicleta Ergometrica', cat:'c', sets:'20-30 min',reps:'60-70% FCM',        wger_id: null,muscles:['Cardiovascular','Corpo Todo']            },
  xc1: { name:'Burpee Modificado',                cat:'c', sets:'3 series', reps:'10 reps',           wger_id: 1192,muscles:['Corpo Todo','Cardio']                    },
  xc2: { name:'Mountain Climber Lento',           cat:'c', sets:'3 series', reps:'20 reps',           wger_id: 1195,muscles:['Core','Cardio','Ombros']                 },
  xc3: { name:'Kettlebell Swing',                 cat:'c', sets:'3 series', reps:'15 reps',           wger_id: 228, muscles:['Gluteos','Isquios','Core']               },
  xc4: { name:'Box Jump',                         cat:'c', sets:'3 series', reps:'10 reps',           wger_id: 1194,muscles:['Quadriceps','Gluteos']                   },

  // TREINO L - Livre
  l1:  { name:'Corrida (Esteira)',              cat:'l', sets:'1 sessao', reps:'20-60 min', wger_id:null, muscles:['Cardio','Pernas']           },
  l2:  { name:'Corrida ao Ar Livre',            cat:'l', sets:'1 sessao', reps:'20-60 min', wger_id:null, muscles:['Cardio','Pernas']           },
  l3:  { name:'Caminhada',                      cat:'l', sets:'1 sessao', reps:'30-60 min', wger_id:null, muscles:['Cardio','Pernas']           },
  l4:  { name:'Bicicleta Ergometrica',          cat:'l', sets:'1 sessao', reps:'30-45 min', wger_id:null, muscles:['Cardio','Quadriceps']       },
  l5:  { name:'Eliptico',                       cat:'l', sets:'1 sessao', reps:'30-45 min', wger_id:null, muscles:['Cardio','Full Body']        },
  l6:  { name:'Natacao',                        cat:'l', sets:'1 sessao', reps:'30-60 min', wger_id:null, muscles:['Cardio','Full Body']        },
  l7:  { name:'Remo Ergometro',                 cat:'l', sets:'1 sessao', reps:'20-30 min', wger_id:null, muscles:['Cardio','Costas','Pernas']  },
  l8:  { name:'Yoga Vinyasa',                   cat:'l', sets:'1 sessao', reps:'45-60 min', wger_id:null, muscles:['Mobilidade','Core']         },
  l9:  { name:'Yoga Yin',                       cat:'l', sets:'1 sessao', reps:'45-60 min', wger_id:null, muscles:['Mobilidade','Flexibilidade']},
  l10: { name:'Pilates',                        cat:'l', sets:'1 sessao', reps:'45-60 min', wger_id:null, muscles:['Core','Postura']            },
  l11: { name:'Alongamento Geral',              cat:'l', sets:'1 sessao', reps:'20-30 min', wger_id:null, muscles:['Mobilidade','Flexibilidade']},
  l12: { name:'Muay Thai',                      cat:'l', sets:'1 sessao', reps:'60-90 min', wger_id:null, muscles:['Full Body','Cardio']        },
  l13: { name:'Jiu-Jitsu',                      cat:'l', sets:'1 sessao', reps:'60-90 min', wger_id:null, muscles:['Full Body','Core']          },
  l14: { name:'Boxe',                           cat:'l', sets:'1 sessao', reps:'60 min',    wger_id:null, muscles:['Full Body','Cardio']        },
  l15: { name:'Funcional / CrossFit',           cat:'l', sets:'1 sessao', reps:'45-60 min', wger_id:null, muscles:['Full Body']                },
  l16: { name:'HIIT',                           cat:'l', sets:'1 sessao', reps:'20-30 min', wger_id:null, muscles:['Cardio','Full Body']        },
  l17: { name:'Futebol / Esporte Coletivo',     cat:'l', sets:'1 sessao', reps:'60-90 min', wger_id:null, muscles:['Cardio','Pernas']           },
  l18: { name:'Jump (Cama Elastica)',           cat:'l', sets:'1 sessao', reps:'30-45 min', wger_id:null, muscles:['Cardio','Pernas']           },
  l19: { name:'Treino de Mobilidade',           cat:'l', sets:'1 sessao', reps:'20-30 min', wger_id:null, muscles:['Mobilidade']               },
};

// Cache de imagens ja buscadas (evita requests repetidos)
const IMG_CACHE = {};
