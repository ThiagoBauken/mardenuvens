import type { Mountain } from '../types.js';

/**
 * Catálogo de destinos brasileiros com potencial para mar de nuvens.
 *
 * Coordenadas e altitudes são valores de referência aproximados (Wikipedia,
 * OpenStreetMap, ICMBio). Como a Open-Meteo trabalha em grid de ~25 km,
 * pequenos desvios na coordenada do cume não afetam materialmente a previsão.
 */
export const MOUNTAINS: Mountain[] = [
  // ─── Norte ────────────────────────────────────────────────────────────────
  // AM
  { id: 'pico-da-neblina', name: 'Pico da Neblina', city: 'São Gabriel da Cachoeira', state: 'AM', lat: 0.8025, lon: -66.0153, elevationM: 2995, type: 'pico', climate: 'equatorial-amazonico', tags: ['ponto-mais-alto-brasil', 'expedição'] },
  { id: 'pico-31-de-marco', name: 'Pico 31 de Março', city: 'São Gabriel da Cachoeira', state: 'AM', lat: 0.8167, lon: -66.0167, elevationM: 2972, type: 'pico', climate: 'equatorial-amazonico', tags: ['expedição'] },
  { id: 'serra-do-araca', name: 'Serra do Aracá', city: 'Barcelos', state: 'AM', lat: 0.8500, lon: -63.4000, elevationM: 1900, type: 'serra', climate: 'equatorial-amazonico' },
  { id: 'serra-da-mocidade', name: 'Serra da Mocidade', city: 'Caracaraí', state: 'AM', lat: 1.7000, lon: -61.7833, elevationM: 1500, type: 'serra', climate: 'equatorial-amazonico' },

  // RR
  { id: 'monte-roraima', name: 'Monte Roraima', city: 'Pacaraima', state: 'RR', lat: 5.1430, lon: -60.7620, elevationM: 2810, type: 'tepui', climate: 'equatorial-amazonico', tags: ['tepui', 'expedição'] },
  { id: 'serra-do-tepequem', name: 'Serra do Tepequém', city: 'Amajari', state: 'RR', lat: 3.7500, lon: -61.7167, elevationM: 1100, type: 'serra', climate: 'equatorial-amazonico' },
  { id: 'serra-pacaraima', name: 'Serra Pacaraima', city: 'Pacaraima', state: 'RR', lat: 4.4833, lon: -61.1500, elevationM: 1400, type: 'serra', climate: 'equatorial-amazonico' },
  { id: 'pico-do-caburai', name: 'Monte Caburaí', city: 'Uiramutã', state: 'RR', lat: 5.2719, lon: -60.2122, elevationM: 1456, type: 'pico', climate: 'equatorial-amazonico', tags: ['extremo-norte'] },

  // AC
  { id: 'serra-do-divisor', name: 'Serra do Divisor', city: 'Cruzeiro do Sul', state: 'AC', lat: -7.4500, lon: -73.6833, elevationM: 600, type: 'serra', climate: 'equatorial-amazonico' },
  { id: 'serra-do-moa', name: 'Serra do Moa', city: 'Mâncio Lima', state: 'AC', lat: -7.5667, lon: -73.6500, elevationM: 700, type: 'serra', climate: 'equatorial-amazonico' },

  // PA
  { id: 'serra-das-andorinhas', name: 'Serra das Andorinhas', city: 'São Geraldo do Araguaia', state: 'PA', lat: -6.4000, lon: -48.5500, elevationM: 600, type: 'serra', climate: 'equatorial-amazonico' },
  { id: 'serra-dos-carajas', name: 'Serra dos Carajás', city: 'Parauapebas', state: 'PA', lat: -6.0667, lon: -50.1500, elevationM: 750, type: 'serra', climate: 'equatorial-amazonico' },

  // RO
  { id: 'serra-dos-pacaas-novos', name: 'Serra dos Pacaás Novos', city: 'Guajará-Mirim', state: 'RO', lat: -10.7833, lon: -64.1500, elevationM: 1126, type: 'serra', climate: 'equatorial-amazonico' },
  { id: 'serra-dos-parecis', name: 'Serra dos Parecis', city: 'Vilhena', state: 'RO', lat: -12.6500, lon: -60.6500, elevationM: 800, type: 'serra', climate: 'cerrado-altitude' },

  // AP
  { id: 'serra-do-tumucumaque', name: 'Serra do Tumucumaque', city: 'Oiapoque', state: 'AP', lat: 2.4500, lon: -54.6000, elevationM: 700, type: 'serra', climate: 'equatorial-amazonico' },
  { id: 'pedra-do-bode', name: 'Pedra do Bode', city: 'Macapá', state: 'AP', lat: 0.0356, lon: -51.0700, elevationM: 200, type: 'pedra', climate: 'equatorial-amazonico' },

  // TO
  { id: 'morro-espirito-santo', name: 'Morro do Espírito Santo', city: 'Mateiros', state: 'TO', lat: -10.5500, lon: -46.4167, elevationM: 700, type: 'morro', climate: 'cerrado-altitude' },
  { id: 'serra-geral-tocantins', name: 'Serra Geral do Tocantins', city: 'Mateiros', state: 'TO', lat: -10.4167, lon: -46.6000, elevationM: 850, type: 'serra', climate: 'cerrado-altitude' },
  { id: 'pedra-furada-jalapao', name: 'Pedra Furada do Jalapão', city: 'Mateiros', state: 'TO', lat: -10.5333, lon: -46.4000, elevationM: 650, type: 'pedra', climate: 'cerrado-altitude' },
  { id: 'serra-do-estrondo', name: 'Serra do Estrondo', city: 'Pequizeiro', state: 'TO', lat: -8.5500, lon: -48.5500, elevationM: 600, type: 'serra', climate: 'cerrado-altitude' },

  // ─── Nordeste ─────────────────────────────────────────────────────────────
  // MA
  { id: 'morro-do-chapeu-mesas', name: 'Morro do Chapéu (Chapada das Mesas)', city: 'Carolina', state: 'MA', lat: -7.0833, lon: -47.2667, elevationM: 540, type: 'morro', climate: 'cerrado-altitude' },
  { id: 'pedra-caida', name: 'Pedra Caída', city: 'Carolina', state: 'MA', lat: -7.0500, lon: -47.3500, elevationM: 450, type: 'pedra', climate: 'cerrado-altitude' },
  { id: 'mirante-de-carolina', name: 'Mirante de Carolina', city: 'Carolina', state: 'MA', lat: -7.3358, lon: -47.4647, elevationM: 350, type: 'mirante', climate: 'cerrado-altitude' },

  // PI
  { id: 'sete-cidades', name: 'Parque Nacional de Sete Cidades', city: 'Piracuruca', state: 'PI', lat: -4.0833, lon: -41.7167, elevationM: 250, type: 'chapada', climate: 'semiarido' },
  { id: 'serra-da-capivara', name: 'Serra da Capivara', city: 'São Raimundo Nonato', state: 'PI', lat: -8.7500, lon: -42.5500, elevationM: 600, type: 'serra', climate: 'semiarido' },
  { id: 'pedra-do-castelo-pi', name: 'Pedra do Castelo', city: 'Castelo do Piauí', state: 'PI', lat: -5.3333, lon: -41.5500, elevationM: 350, type: 'pedra', climate: 'semiarido' },

  // CE
  { id: 'pico-alto-guaramiranga', name: 'Pico Alto de Guaramiranga', city: 'Guaramiranga', state: 'CE', lat: -4.2667, lon: -38.9667, elevationM: 1115, type: 'pico', climate: 'tropical-de-altitude', tags: ['serra-de-baturite'] },
  { id: 'serra-de-baturite', name: 'Serra de Baturité', city: 'Pacoti', state: 'CE', lat: -4.2333, lon: -38.9167, elevationM: 1000, type: 'serra', climate: 'tropical-de-altitude' },
  { id: 'pedra-galinha-choca', name: 'Pedra da Galinha Choca', city: 'Quixadá', state: 'CE', lat: -4.9667, lon: -39.0167, elevationM: 600, type: 'pedra', climate: 'semiarido' },
  { id: 'morro-branco-ce', name: 'Morro Branco', city: 'Beberibe', state: 'CE', lat: -4.1667, lon: -38.0167, elevationM: 50, type: 'morro', climate: 'tropical-litoraneo' },
  { id: 'chapada-do-araripe', name: 'Chapada do Araripe', city: 'Crato', state: 'CE', lat: -7.3833, lon: -39.4167, elevationM: 950, type: 'chapada', climate: 'semiarido' },

  // RN
  { id: 'pico-do-cabugi', name: 'Pico do Cabugi', city: 'Lajes', state: 'RN', lat: -5.6917, lon: -36.3097, elevationM: 590, type: 'pico', climate: 'semiarido' },
  { id: 'morro-do-careca', name: 'Morro do Careca', city: 'Natal', state: 'RN', lat: -5.8833, lon: -35.1667, elevationM: 100, type: 'morro', climate: 'tropical-litoraneo' },

  // PB
  { id: 'pico-do-jabre', name: 'Pico do Jabre', city: 'Maturéia', state: 'PB', lat: -7.2667, lon: -37.3833, elevationM: 1197, type: 'pico', climate: 'tropical-de-altitude', tags: ['mais-alto-pb'] },
  { id: 'pedra-do-cruzeiro-areia', name: 'Pedra do Cruzeiro', city: 'Areia', state: 'PB', lat: -6.9667, lon: -35.7000, elevationM: 600, type: 'pedra', climate: 'tropical-de-altitude' },

  // PE
  { id: 'pico-do-papagaio-triunfo', name: 'Pico do Papagaio (Triunfo)', city: 'Triunfo', state: 'PE', lat: -7.8333, lon: -38.1000, elevationM: 1260, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'pedra-furada-triunfo', name: 'Pedra Furada de Triunfo', city: 'Triunfo', state: 'PE', lat: -7.8500, lon: -38.1167, elevationM: 1100, type: 'pedra', climate: 'tropical-de-altitude' },
  { id: 'pedra-do-cachorro-catimbau', name: 'Pedra do Cachorro (Catimbau)', city: 'Buíque', state: 'PE', lat: -8.5167, lon: -37.2500, elevationM: 800, type: 'pedra', climate: 'semiarido' },

  // AL
  { id: 'serra-da-barriga', name: 'Serra da Barriga', city: 'União dos Palmares', state: 'AL', lat: -9.1500, lon: -36.0333, elevationM: 500, type: 'serra', climate: 'tropical-litoraneo' },

  // SE
  { id: 'morro-do-urubu-aracaju', name: 'Morro do Urubu', city: 'Aracaju', state: 'SE', lat: -10.8833, lon: -37.0667, elevationM: 130, type: 'morro', climate: 'tropical-litoraneo' },
  { id: 'serra-de-itabaiana', name: 'Serra de Itabaiana', city: 'Itabaiana', state: 'SE', lat: -10.7500, lon: -37.3500, elevationM: 670, type: 'serra', climate: 'tropical-litoraneo' },

  // BA
  { id: 'morro-pai-inacio', name: 'Morro do Pai Inácio', city: 'Palmeiras', state: 'BA', lat: -12.4639, lon: -41.4717, elevationM: 1120, type: 'morro', climate: 'cerrado-altitude', tags: ['chapada-diamantina'] },
  { id: 'pico-do-barbado', name: 'Pico do Barbado', city: 'Abaíra', state: 'BA', lat: -13.1833, lon: -41.8500, elevationM: 2080, type: 'pico', climate: 'tropical-de-altitude', tags: ['mais-alto-nordeste'] },
  { id: 'cachoeira-da-fumaca', name: 'Mirante da Cachoeira da Fumaça', city: 'Palmeiras', state: 'BA', lat: -12.6000, lon: -41.5167, elevationM: 1100, type: 'mirante', climate: 'cerrado-altitude' },
  { id: 'vale-do-capao', name: 'Vale do Capão', city: 'Palmeiras', state: 'BA', lat: -12.5833, lon: -41.5167, elevationM: 950, type: 'mirante', climate: 'cerrado-altitude' },
  { id: 'morro-do-castelo-andarai', name: 'Morro do Castelo', city: 'Andaraí', state: 'BA', lat: -12.8000, lon: -41.3167, elevationM: 800, type: 'morro', climate: 'cerrado-altitude' },
  { id: 'morro-branco-ba', name: 'Morro Branco', city: 'Mucugê', state: 'BA', lat: -13.0000, lon: -41.3667, elevationM: 1300, type: 'morro', climate: 'cerrado-altitude' },
  { id: 'morro-do-camelo', name: 'Morro do Camelo', city: 'Palmeiras', state: 'BA', lat: -12.4500, lon: -41.4500, elevationM: 1100, type: 'morro', climate: 'cerrado-altitude' },
  { id: 'pico-das-almas', name: 'Pico das Almas', city: 'Rio de Contas', state: 'BA', lat: -13.5333, lon: -41.9000, elevationM: 1958, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'morrao-diamantina', name: 'Morrão (Chapada Diamantina)', city: 'Mucugê', state: 'BA', lat: -13.0167, lon: -41.4000, elevationM: 1400, type: 'morro', climate: 'cerrado-altitude' },

  // ─── Centro-Oeste ─────────────────────────────────────────────────────────
  // DF
  { id: 'morro-da-capelinha', name: 'Morro da Capelinha', city: 'Planaltina', state: 'DF', lat: -15.6167, lon: -47.6500, elevationM: 1230, type: 'morro', climate: 'cerrado-altitude' },
  { id: 'pedreira-pnb', name: 'Pedreira (PN de Brasília)', city: 'Brasília', state: 'DF', lat: -15.7167, lon: -48.0833, elevationM: 1170, type: 'pedra', climate: 'cerrado-altitude' },

  // GO
  { id: 'mirante-da-janela', name: 'Mirante da Janela', city: 'Alto Paraíso de Goiás', state: 'GO', lat: -14.1167, lon: -47.7500, elevationM: 1400, type: 'mirante', climate: 'cerrado-altitude', tags: ['veadeiros'] },
  { id: 'pedra-de-baliza', name: 'Pedra de Baliza', city: 'Alto Paraíso de Goiás', state: 'GO', lat: -14.1333, lon: -47.5167, elevationM: 1500, type: 'pedra', climate: 'cerrado-altitude' },
  { id: 'morro-da-baleia-veadeiros', name: 'Morro da Baleia', city: 'São Jorge', state: 'GO', lat: -14.1667, lon: -47.7833, elevationM: 1100, type: 'morro', climate: 'cerrado-altitude' },
  { id: 'vale-da-lua', name: 'Vale da Lua', city: 'Alto Paraíso de Goiás', state: 'GO', lat: -14.1500, lon: -47.7833, elevationM: 950, type: 'mirante', climate: 'cerrado-altitude' },
  { id: 'morro-do-buracao', name: 'Morro do Buracão', city: 'Cavalcante', state: 'GO', lat: -13.7833, lon: -47.4500, elevationM: 1100, type: 'morro', climate: 'cerrado-altitude' },
  { id: 'serra-dourada', name: 'Serra Dourada', city: 'Goiás', state: 'GO', lat: -16.1833, lon: -50.1167, elevationM: 1080, type: 'serra', climate: 'cerrado-altitude' },
  { id: 'salto-do-itiquira', name: 'Salto do Itiquira', city: 'Formosa', state: 'GO', lat: -15.4000, lon: -47.4000, elevationM: 850, type: 'mirante', climate: 'cerrado-altitude' },

  // MT
  { id: 'mirante-centro-geodesico', name: 'Mirante do Centro Geodésico', city: 'Chapada dos Guimarães', state: 'MT', lat: -15.4500, lon: -55.8167, elevationM: 800, type: 'mirante', climate: 'cerrado-altitude' },
  { id: 'morro-de-sao-jeronimo', name: 'Morro de São Jerônimo', city: 'Chapada dos Guimarães', state: 'MT', lat: -15.3667, lon: -55.7500, elevationM: 850, type: 'morro', climate: 'cerrado-altitude' },
  { id: 'cidade-de-pedra', name: 'Cidade de Pedra', city: 'Chapada dos Guimarães', state: 'MT', lat: -15.2167, lon: -55.7333, elevationM: 700, type: 'mirante', climate: 'cerrado-altitude' },
  { id: 'veu-de-noiva-mt', name: 'Cachoeira Véu de Noiva', city: 'Chapada dos Guimarães', state: 'MT', lat: -15.4000, lon: -55.8333, elevationM: 750, type: 'mirante', climate: 'cerrado-altitude' },
  { id: 'serra-do-roncador', name: 'Serra do Roncador', city: 'Barra do Garças', state: 'MT', lat: -15.0167, lon: -52.2667, elevationM: 850, type: 'serra', climate: 'cerrado-altitude' },

  // MS
  { id: 'serra-da-bodoquena', name: 'Serra da Bodoquena', city: 'Bodoquena', state: 'MS', lat: -20.5333, lon: -56.7000, elevationM: 700, type: 'serra', climate: 'cerrado-altitude' },
  { id: 'morro-azul-bonito', name: 'Morro Azul', city: 'Bonito', state: 'MS', lat: -21.1333, lon: -56.4833, elevationM: 600, type: 'morro', climate: 'cerrado-altitude' },
  { id: 'serra-de-maracaju', name: 'Serra de Maracaju', city: 'Maracaju', state: 'MS', lat: -21.6167, lon: -55.1667, elevationM: 600, type: 'serra', climate: 'cerrado-altitude' },

  // ─── Sudeste ──────────────────────────────────────────────────────────────
  // MG
  { id: 'pico-da-bandeira', name: 'Pico da Bandeira', city: 'Alto Caparaó', state: 'MG', lat: -20.4317, lon: -41.7917, elevationM: 2892, type: 'pico', climate: 'tropical-de-altitude', tags: ['caparao', 'mais-alto-mg'] },
  { id: 'pico-do-cristal', name: 'Pico do Cristal', city: 'Alto Caparaó', state: 'MG', lat: -20.4333, lon: -41.8000, elevationM: 2770, type: 'pico', climate: 'tropical-de-altitude', tags: ['caparao'] },
  { id: 'pico-do-calcado', name: 'Pico do Calçado', city: 'Alto Caparaó', state: 'MG', lat: -20.4500, lon: -41.8167, elevationM: 2766, type: 'pico', climate: 'tropical-de-altitude', tags: ['caparao'] },
  { id: 'pico-do-sol-caraca', name: 'Pico do Sol (Caraça)', city: 'Catas Altas', state: 'MG', lat: -20.0833, lon: -43.4833, elevationM: 2070, type: 'pico', climate: 'tropical-de-altitude', tags: ['caraca'] },
  { id: 'pico-do-itacolomi', name: 'Pico do Itacolomi', city: 'Ouro Preto', state: 'MG', lat: -20.4167, lon: -43.4833, elevationM: 1772, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'pico-do-itambe', name: 'Pico do Itambé', city: 'Santo Antônio do Itambé', state: 'MG', lat: -18.4000, lon: -43.3167, elevationM: 2062, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'pico-do-inficionado', name: 'Pico do Inficionado', city: 'Catas Altas', state: 'MG', lat: -20.1167, lon: -43.4833, elevationM: 2068, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'serra-do-caraca', name: 'Serra do Caraça', city: 'Catas Altas', state: 'MG', lat: -20.1000, lon: -43.4833, elevationM: 2000, type: 'serra', climate: 'tropical-de-altitude' },
  { id: 'serra-da-canastra', name: 'Serra da Canastra (Casca d\'Anta)', city: 'São Roque de Minas', state: 'MG', lat: -20.2667, lon: -46.5167, elevationM: 1500, type: 'serra', climate: 'tropical-de-altitude' },
  { id: 'canion-do-funil', name: 'Cânion do Funil', city: 'Capitólio', state: 'MG', lat: -20.6167, lon: -46.0500, elevationM: 800, type: 'canion', climate: 'tropical-de-altitude' },
  { id: 'serra-da-moeda', name: 'Serra da Moeda', city: 'Moeda', state: 'MG', lat: -20.3333, lon: -43.9667, elevationM: 1500, type: 'serra', climate: 'tropical-de-altitude' },
  { id: 'lapinha-da-serra', name: 'Lapinha da Serra', city: 'Santana do Riacho', state: 'MG', lat: -19.2500, lon: -43.7000, elevationM: 1100, type: 'mirante', climate: 'tropical-de-altitude' },
  { id: 'morro-do-pilar', name: 'Morro do Pilar', city: 'Morro do Pilar', state: 'MG', lat: -19.2167, lon: -43.3833, elevationM: 1200, type: 'morro', climate: 'tropical-de-altitude' },
  { id: 'pedra-do-bau-aiuruoca', name: 'Pedra do Baú (Aiuruoca)', city: 'Aiuruoca', state: 'MG', lat: -22.0000, lon: -44.6000, elevationM: 1700, type: 'pedra', climate: 'tropical-de-altitude' },

  // ES
  { id: 'pedra-azul', name: 'Pedra Azul', city: 'Domingos Martins', state: 'ES', lat: -20.4133, lon: -41.0067, elevationM: 1822, type: 'pedra', climate: 'tropical-de-altitude' },
  { id: 'pedra-do-lagarto', name: 'Pedra do Lagarto', city: 'Pedro Canário', state: 'ES', lat: -20.4500, lon: -41.0000, elevationM: 1500, type: 'pedra', climate: 'tropical-de-altitude' },
  { id: 'forno-grande', name: 'Forno Grande', city: 'Castelo', state: 'ES', lat: -20.5167, lon: -41.1000, elevationM: 2039, type: 'pico', climate: 'tropical-de-altitude' },

  // RJ
  { id: 'agulhas-negras', name: 'Pico das Agulhas Negras', city: 'Itatiaia', state: 'RJ', lat: -22.3739, lon: -44.6422, elevationM: 2792, type: 'pico', climate: 'tropical-de-altitude', tags: ['itatiaia'] },
  { id: 'prateleiras', name: 'Prateleiras', city: 'Itatiaia', state: 'RJ', lat: -22.3833, lon: -44.6500, elevationM: 2548, type: 'pico', climate: 'tropical-de-altitude', tags: ['itatiaia'] },
  { id: 'pedra-do-sino', name: 'Pedra do Sino', city: 'Teresópolis', state: 'RJ', lat: -22.4167, lon: -42.9833, elevationM: 2263, type: 'pedra', climate: 'tropical-de-altitude', tags: ['serra-orgaos'] },
  { id: 'dedo-de-deus', name: 'Dedo de Deus', city: 'Teresópolis', state: 'RJ', lat: -22.4833, lon: -42.9833, elevationM: 1692, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'travessia-petropolis-teresopolis', name: 'Travessia Petrópolis–Teresópolis', city: 'Teresópolis', state: 'RJ', lat: -22.4500, lon: -43.0500, elevationM: 2200, type: 'serra', climate: 'tropical-de-altitude' },
  { id: 'pedra-da-gavea', name: 'Pedra da Gávea', city: 'Rio de Janeiro', state: 'RJ', lat: -22.9978, lon: -43.2856, elevationM: 844, type: 'pedra', climate: 'tropical-litoraneo' },
  { id: 'pedra-bonita', name: 'Pedra Bonita', city: 'Rio de Janeiro', state: 'RJ', lat: -22.9917, lon: -43.2783, elevationM: 696, type: 'pedra', climate: 'tropical-litoraneo' },
  { id: 'pao-de-acucar', name: 'Pão de Açúcar', city: 'Rio de Janeiro', state: 'RJ', lat: -22.9492, lon: -43.1547, elevationM: 396, type: 'morro', climate: 'tropical-litoraneo' },
  { id: 'corcovado', name: 'Corcovado', city: 'Rio de Janeiro', state: 'RJ', lat: -22.9519, lon: -43.2105, elevationM: 710, type: 'morro', climate: 'tropical-litoraneo' },
  { id: 'pico-da-tijuca', name: 'Pico da Tijuca', city: 'Rio de Janeiro', state: 'RJ', lat: -22.9389, lon: -43.2806, elevationM: 1022, type: 'pico', climate: 'tropical-litoraneo' },
  { id: 'bico-do-papagaio-rj', name: 'Bico do Papagaio (Tijuca)', city: 'Rio de Janeiro', state: 'RJ', lat: -22.9583, lon: -43.2750, elevationM: 989, type: 'pico', climate: 'tropical-litoraneo' },
  { id: 'pedra-do-elefante-friburgo', name: 'Pedra do Elefante', city: 'Nova Friburgo', state: 'RJ', lat: -22.2833, lon: -42.5333, elevationM: 1400, type: 'pedra', climate: 'tropical-de-altitude' },
  { id: 'trilha-do-cobicado', name: 'Trilha do Cobiçado', city: 'Visconde de Mauá', state: 'RJ', lat: -22.3500, lon: -44.5167, elevationM: 1700, type: 'mirante', climate: 'tropical-de-altitude' },

  // SP
  { id: 'pedra-do-bau', name: 'Pedra do Baú', city: 'São Bento do Sapucaí', state: 'SP', lat: -22.7222, lon: -45.7333, elevationM: 1950, type: 'pedra', climate: 'tropical-de-altitude' },
  { id: 'pico-dos-marins', name: 'Pico dos Marins', city: 'Piquete', state: 'SP', lat: -22.5833, lon: -45.1667, elevationM: 2420, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'pico-do-itaguare', name: 'Pico do Itaguaré', city: 'Passa Quatro', state: 'SP', lat: -22.4167, lon: -44.9667, elevationM: 2310, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'pico-do-itapeva', name: 'Pico do Itapeva', city: 'Campos do Jordão', state: 'SP', lat: -22.7500, lon: -45.5500, elevationM: 2030, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'pedra-grande-atibaia', name: 'Pedra Grande de Atibaia', city: 'Atibaia', state: 'SP', lat: -23.1000, lon: -46.5500, elevationM: 1450, type: 'pedra', climate: 'tropical-de-altitude' },
  { id: 'pico-do-lopo', name: 'Pico do Lopo', city: 'Extrema', state: 'MG', lat: -22.8833, lon: -46.3000, elevationM: 1840, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'pico-agudo-sap', name: 'Pico Agudo', city: 'Santo Antônio do Pinhal', state: 'SP', lat: -22.8333, lon: -45.6667, elevationM: 1700, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'pedra-do-forno', name: 'Pedra do Forno', city: 'Joanópolis', state: 'SP', lat: -22.9333, lon: -46.2667, elevationM: 1580, type: 'pedra', climate: 'tropical-de-altitude' },
  { id: 'pico-do-papagaio-ubatuba', name: 'Pico do Papagaio (Ubatuba)', city: 'Ubatuba', state: 'SP', lat: -23.4500, lon: -45.0833, elevationM: 990, type: 'pico', climate: 'tropical-litoraneo' },
  { id: 'pico-do-corisco', name: 'Pico do Corisco', city: 'Cunha', state: 'SP', lat: -23.0833, lon: -44.9167, elevationM: 2220, type: 'pico', climate: 'tropical-de-altitude' },

  // ─── Sul ──────────────────────────────────────────────────────────────────
  // PR
  { id: 'pico-parana', name: 'Pico Paraná', city: 'Antonina', state: 'PR', lat: -25.2536, lon: -48.8108, elevationM: 1877, type: 'pico', climate: 'tropical-de-altitude', tags: ['mais-alto-sul'] },
  { id: 'pico-do-marumbi', name: 'Pico do Marumbi', city: 'Morretes', state: 'PR', lat: -25.4500, lon: -48.9167, elevationM: 1539, type: 'pico', climate: 'tropical-litoraneo' },
  { id: 'pico-caratuva', name: 'Pico Caratuva', city: 'Antonina', state: 'PR', lat: -25.2333, lon: -48.7833, elevationM: 1850, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'morro-anhangava', name: 'Morro Anhangava', city: 'Quatro Barras', state: 'PR', lat: -25.3333, lon: -49.0833, elevationM: 1430, type: 'morro', climate: 'subtropical-umido' },
  { id: 'morro-do-canal', name: 'Morro do Canal', city: 'Piraquara', state: 'PR', lat: -25.4500, lon: -49.0500, elevationM: 1490, type: 'morro', climate: 'subtropical-umido' },
  { id: 'morro-mae-catira', name: 'Morro Mãe Catira', city: 'Quatro Barras', state: 'PR', lat: -25.3667, lon: -49.0500, elevationM: 1428, type: 'morro', climate: 'subtropical-umido' },
  { id: 'pedra-branca-araraquara', name: 'Pedra Branca do Araraquara', city: 'Tijucas do Sul', state: 'PR', lat: -25.9333, lon: -49.1833, elevationM: 1430, type: 'pedra', climate: 'subtropical-umido' },
  { id: 'salto-sao-francisco', name: 'Salto São Francisco', city: 'Prudentópolis', state: 'PR', lat: -25.1500, lon: -50.9167, elevationM: 700, type: 'mirante', climate: 'subtropical-umido' },

  // SC
  { id: 'cambirela', name: 'Morro do Cambirela', city: 'Palhoça', state: 'SC', lat: -27.6920, lon: -48.6420, elevationM: 880, type: 'morro', climate: 'subtropical-umido', tags: ['mar-de-nuvens-classico'] },
  { id: 'morro-da-igreja', name: 'Morro da Igreja', city: 'Urubici', state: 'SC', lat: -28.1167, lon: -49.5000, elevationM: 1822, type: 'morro', climate: 'subtropical-umido', tags: ['serra-catarinense'] },
  { id: 'pedra-furada-urubici', name: 'Pedra Furada de Urubici', city: 'Urubici', state: 'SC', lat: -28.1333, lon: -49.4833, elevationM: 1762, type: 'pedra', climate: 'subtropical-umido' },
  { id: 'pedra-do-avencal', name: 'Pedra do Avencal', city: 'Urubici', state: 'SC', lat: -28.0667, lon: -49.6000, elevationM: 1300, type: 'pedra', climate: 'subtropical-umido' },
  { id: 'canion-espraiado', name: 'Cânion Espraiado', city: 'Urubici', state: 'SC', lat: -28.0500, lon: -49.4500, elevationM: 1400, type: 'canion', climate: 'subtropical-canion' },
  { id: 'serra-do-corvo-branco', name: 'Serra do Corvo Branco', city: 'Grão-Pará', state: 'SC', lat: -28.0500, lon: -49.3500, elevationM: 1460, type: 'serra', climate: 'subtropical-umido' },
  { id: 'serra-do-rio-do-rastro', name: 'Serra do Rio do Rastro', city: 'Bom Jardim da Serra', state: 'SC', lat: -28.3833, lon: -49.5500, elevationM: 1460, type: 'serra', climate: 'subtropical-umido', tags: ['mirante'] },
  { id: 'morro-da-cruz-floripa', name: 'Morro da Cruz', city: 'Florianópolis', state: 'SC', lat: -27.5950, lon: -48.5350, elevationM: 287, type: 'morro', climate: 'tropical-litoraneo' },
  { id: 'pedra-do-frade-sbs', name: 'Pedra do Frade', city: 'São Bento do Sul', state: 'SC', lat: -26.2500, lon: -49.3833, elevationM: 1320, type: 'pedra', climate: 'subtropical-umido' },

  // RS
  { id: 'canion-itaimbezinho', name: 'Cânion Itaimbezinho', city: 'Cambará do Sul', state: 'RS', lat: -29.1500, lon: -50.0833, elevationM: 1000, type: 'canion', climate: 'subtropical-canion', tags: ['aparados-da-serra'] },
  { id: 'canion-fortaleza', name: 'Cânion Fortaleza', city: 'Cambará do Sul', state: 'RS', lat: -29.0833, lon: -50.0667, elevationM: 1100, type: 'canion', climate: 'subtropical-canion' },
  { id: 'canion-malacara', name: 'Cânion Malacara', city: 'Praia Grande', state: 'SC', lat: -29.2000, lon: -50.1167, elevationM: 1000, type: 'canion', climate: 'subtropical-canion' },
  { id: 'canion-monte-negro', name: 'Cânion Monte Negro', city: 'São José dos Ausentes', state: 'RS', lat: -28.7500, lon: -49.9167, elevationM: 1350, type: 'canion', climate: 'subtropical-canion' },
  { id: 'canion-da-ronda', name: 'Cânion da Ronda', city: 'São José dos Ausentes', state: 'RS', lat: -28.7333, lon: -49.9833, elevationM: 1300, type: 'canion', climate: 'subtropical-canion' },
  { id: 'pico-do-monte-negro', name: 'Pico do Monte Negro', city: 'São José dos Ausentes', state: 'RS', lat: -28.7000, lon: -49.7833, elevationM: 1403, type: 'pico', climate: 'subtropical-umido', tags: ['mais-alto-rs'] },
  { id: 'pedra-do-segredo', name: 'Pedra do Segredo', city: 'Caçapava do Sul', state: 'RS', lat: -30.5167, lon: -53.4833, elevationM: 380, type: 'pedra', climate: 'subtropical-umido' },
  { id: 'morro-pelado-bj', name: 'Morro Pelado', city: 'Bom Jesus', state: 'RS', lat: -28.6500, lon: -50.4333, elevationM: 1300, type: 'morro', climate: 'subtropical-umido' },
  { id: 'salto-do-yucuma', name: 'Salto do Yucumã', city: 'Derrubadas', state: 'RS', lat: -27.1500, lon: -53.8500, elevationM: 250, type: 'mirante', climate: 'subtropical-umido' },
  { id: 'cerro-do-jarau', name: 'Cerro do Jarau', city: 'Quaraí', state: 'RS', lat: -30.2167, lon: -56.5333, elevationM: 290, type: 'morro', climate: 'subtropical-umido' },

  // ─── Adições recentes ────────────────────────────────────────────────────
  // SP
  { id: 'pico-do-jaragua-sp', name: 'Pico do Jaraguá', city: 'São Paulo', state: 'SP', lat: -23.4583, lon: -46.7611, elevationM: 1135, type: 'pico', climate: 'tropical-de-altitude', tags: ['capital'] },
  { id: 'pico-das-cabras', name: 'Pico das Cabras', city: 'Campinas', state: 'SP', lat: -22.7333, lon: -46.9000, elevationM: 1080, type: 'pico', climate: 'tropical-de-altitude' },
  { id: 'pedra-do-sino-botucatu', name: 'Pedra do Sino (Botucatu)', city: 'Botucatu', state: 'SP', lat: -22.8500, lon: -48.4667, elevationM: 805, type: 'pedra', climate: 'tropical-de-altitude' },
  { id: 'morro-do-cuscuzeiro', name: 'Morro do Cuscuzeiro', city: 'Analândia', state: 'SP', lat: -22.1333, lon: -47.6667, elevationM: 760, type: 'morro', climate: 'tropical-de-altitude' },

  // RJ
  { id: 'pico-maior-friburgo', name: 'Pico Maior de Friburgo', city: 'Nova Friburgo', state: 'RJ', lat: -22.2667, lon: -42.6500, elevationM: 2316, type: 'pico', climate: 'tropical-de-altitude', tags: ['mais-alto-rj'] },
  { id: 'pedra-do-cao-sentado', name: 'Pedra do Cão Sentado', city: 'Nova Friburgo', state: 'RJ', lat: -22.3000, lon: -42.5500, elevationM: 1420, type: 'pedra', climate: 'tropical-de-altitude' },
  { id: 'pedra-do-colegio', name: 'Pedra do Colégio', city: 'Cachoeiras de Macacu', state: 'RJ', lat: -22.4333, lon: -42.7167, elevationM: 1175, type: 'pedra', climate: 'tropical-de-altitude' },

  // MG
  { id: 'pico-do-ibituruna', name: 'Pico do Ibituruna', city: 'Governador Valadares', state: 'MG', lat: -18.8833, lon: -41.9833, elevationM: 1131, type: 'pico', climate: 'tropical-de-altitude', tags: ['voo-livre'] },
  { id: 'mirante-serra-do-curral', name: 'Mirante da Serra do Curral', city: 'Belo Horizonte', state: 'MG', lat: -19.9500, lon: -43.9333, elevationM: 1390, type: 'mirante', climate: 'tropical-de-altitude' },
  { id: 'serra-do-cipo-travessao', name: 'Serra do Cipó (Travessão)', city: 'Santana do Riacho', state: 'MG', lat: -19.3667, lon: -43.5833, elevationM: 1450, type: 'serra', climate: 'tropical-de-altitude' },
  { id: 'serra-do-brigadeiro', name: 'Serra do Brigadeiro', city: 'Araponga', state: 'MG', lat: -20.7167, lon: -42.4833, elevationM: 1990, type: 'serra', climate: 'tropical-de-altitude' },
  { id: 'pedra-do-pinico-caxambu', name: 'Pedra do Pinico', city: 'Caxambu', state: 'MG', lat: -21.9667, lon: -44.9333, elevationM: 1320, type: 'pedra', climate: 'tropical-de-altitude' },

  // SC
  { id: 'morro-da-boa-vista-brusque', name: 'Morro da Boa Vista', city: 'Brusque', state: 'SC', lat: -27.1167, lon: -48.9000, elevationM: 700, type: 'morro', climate: 'subtropical-umido' },
  { id: 'morro-do-macaco-bombinhas', name: 'Morro do Macaco', city: 'Bombinhas', state: 'SC', lat: -27.1500, lon: -48.4833, elevationM: 110, type: 'morro', climate: 'tropical-litoraneo' },
  { id: 'morro-careca-bombinhas', name: 'Morro do Careca (Bombinhas)', city: 'Bombinhas', state: 'SC', lat: -27.1450, lon: -48.5050, elevationM: 80, type: 'morro', climate: 'tropical-litoraneo' },

  // BA
  { id: 'cachoeira-do-buracao', name: 'Cachoeira do Buracão (mirante)', city: 'Ibicoara', state: 'BA', lat: -13.4167, lon: -41.2833, elevationM: 1100, type: 'mirante', climate: 'cerrado-altitude', tags: ['chapada-diamantina'] },
  { id: 'vale-do-pati-mirante', name: 'Mirante do Vale do Pati', city: 'Andaraí', state: 'BA', lat: -12.9000, lon: -41.4500, elevationM: 1500, type: 'mirante', climate: 'cerrado-altitude' },

  // PR
  { id: 'buraco-do-padre', name: 'Buraco do Padre', city: 'Ponta Grossa', state: 'PR', lat: -25.1500, lon: -49.9667, elevationM: 920, type: 'mirante', climate: 'subtropical-umido' },
  { id: 'salto-saudade', name: 'Salto Saudade', city: 'Prudentópolis', state: 'PR', lat: -25.2167, lon: -50.9667, elevationM: 750, type: 'mirante', climate: 'subtropical-umido' },

  // AM
  { id: 'cachoeira-santuario-am', name: 'Cachoeira do Santuário', city: 'Presidente Figueiredo', state: 'AM', lat: -2.0833, lon: -60.0167, elevationM: 100, type: 'mirante', climate: 'equatorial-amazonico' },
];

export function getMountainById(id: string): Mountain | undefined {
  return MOUNTAINS.find((m) => m.id === id);
}
