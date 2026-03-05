import { FIXTURES } from './constants';



const preferWebpAsset = (webpLoader, fallbackLoader) => {

  try {

    return webpLoader();

  } catch (error) {

    return fallbackLoader();

  }

};



export const INVENTORY_UNITS = {

  PIEZA: 'pieza',

  PAR: 'par',

  ROLLO: 'rollo',

};



export const INVENTORY_CATEGORIES = {

  GRIP: 'grip',

  ELECTRICO: 'electrico',

  MEDICION: 'medición',

  CONSUMO: 'consumo',

  PPE: 'ppe',

  LUMINARIA: 'luminaria',

  MODIFIERS: 'modificadores',

};



export const CATEGORY_LABELS = {

  [INVENTORY_CATEGORIES.GRIP]: 'GRIP',

  [INVENTORY_CATEGORIES.ELECTRICO]: 'EL\u00c9CTRICO',

  [INVENTORY_CATEGORIES.MEDICION]: 'MEDICIÓN',

  [INVENTORY_CATEGORIES.CONSUMO]: 'CONSUMO',

  [INVENTORY_CATEGORIES.PPE]: 'PPE',

  [INVENTORY_CATEGORIES.LUMINARIA]: 'LUMINARIA',

  [INVENTORY_CATEGORIES.MODIFIERS]: 'MODIFICADORES DE LUZ',

};



export const CATEGORY_NOTES = {

  [INVENTORY_CATEGORIES.PPE]: 'Equipo de Protecci\u00f3n Personal',

};



export const UNIT_LABELS = {

  [INVENTORY_UNITS.PIEZA]: 'pieza',

  [INVENTORY_UNITS.PAR]: 'par',

  [INVENTORY_UNITS.ROLLO]: 'rollo',

};



const INVENTORY_ICON_SPRITES = {

  pinzas: preferWebpAsset(

    () => require('../Art/Inventario/Pinzas_Tool.png'),

    () => require('../Art/Inventario/Pinzas_Tool.png'),

  ),

  aClamp: preferWebpAsset(

    () => require('../Art/Inventario/A_Clamp_Tool.png'),

    () => require('../Art/Inventario/A_Clamp_Tool.png'),

  ),

  bongoTies: preferWebpAsset(

    () => require('../Art/Inventario/Bongo_Ties_Tool.png'),

    () => require('../Art/Inventario/Bongo_Ties_Tool.png'),

  ),

  bridas: preferWebpAsset(

    () => require('../Art/Inventario/Bridas_abrazaderas_Tool.png'),

    () => require('../Art/Inventario/Bridas_abrazaderas_Tool.png'),

  ),

  gafferTape: preferWebpAsset(

    () => require('../Art/Inventario/Cintas_Tool.png'),

    () => require('../Art/Inventario/Cintas_Tool.png'),

  ),

  cableSeguridad: preferWebpAsset(

    () => require('../Art/Inventario/Cable_de_Seguridad_Tool.png'),

    () => require('../Art/Inventario/Cable_de_Seguridad_Tool.png'),

  ),

  bolsaArena: preferWebpAsset(

    () => require('../Art/Inventario/Bolsa_de_arena_Tool.png'),

    () => require('../Art/Inventario/Bolsa_de_arena_Tool.png'),

  ),

  brochaLimpieza: preferWebpAsset(

    () => require('../Art/Inventario/Brocha_Limpieza_Tool.png'),

    () => require('../Art/Inventario/Brocha_Limpieza_Tool.png'),

  ),

  cameraMultitool: preferWebpAsset(

    () => require('../Art/Inventario/Camera_Multitool_Tool.png'),

    () => require('../Art/Inventario/Camera_Multitool_Tool.png'),

  ),

  cartaColor: preferWebpAsset(

    () => require('../Art/Inventario/Carta_de_Color_Tool.png'),

    () => require('../Art/Inventario/Carta_de_Color_Tool.png'),

  ),

  cartaFoco: preferWebpAsset(

    () => require('../Art/Inventario/Carta_Foco_Tools.png'),

    () => require('../Art/Inventario/Carta_Foco_Tools.png'),

  ),

  cinefoil: preferWebpAsset(

    () => require('../Art/Inventario/Cinefoil_Tool.png'),

    () => require('../Art/Inventario/Cinefoil_Tool.png'),

  ),

  cintaMedicion: preferWebpAsset(

    () => require('../Art/Inventario/Cinta_Medicion_Tool.png'),

    () => require('../Art/Inventario/Cinta_Medicion_Tool.png'),

  ),

  claqueta: preferWebpAsset(

    () => require('../Art/Inventario/Claqueta_Tool.png'),

    () => require('../Art/Inventario/Claqueta_Tool.png'),

  ),

  cuboEnchufes: preferWebpAsset(

    () => require('../Art/Inventario/Cubo_Enchufes_Tool.png'),

    () => require('../Art/Inventario/Cubo_Enchufes_Tool.png'),

  ),

  dimmerLinea: preferWebpAsset(

    () => require('../Art/Inventario/Dimmer_Linea_Tool.png'),

    () => require('../Art/Inventario/Dimmer_Linea_Tool.png'),

  ),

  filtrosCct: preferWebpAsset(

    () => require('../Art/Inventario/Filtros_CCT_Tools.png'),

    () => require('../Art/Inventario/Filtros_CCT_Tools.png'),

  ),

  fotometro: preferWebpAsset(

    () => require('../Art/Inventario/Fotometro_Tool.png'),

    () => require('../Art/Inventario/Fotometro_Tool.png'),

  ),

  guantes: preferWebpAsset(

    () => require('../Art/Inventario/Guantes_Tool.png'),

    () => require('../Art/Inventario/Guantes_Tool.png'),

  ),

  headlamp: preferWebpAsset(

    () => require('../Art/Inventario/Headlight_Tool.png'),

    () => require('../Art/Inventario/Headlight_Tool.png'),

  ),

  liquidoLentes: preferWebpAsset(

    () => require('../Art/Inventario/Liquido_Limpieza_Lentes_Tool.png'),

    () => require('../Art/Inventario/Liquido_Limpieza_Lentes_Tool.png'),

  ),

  llavesAllen: preferWebpAsset(

    () => require('../Art/Inventario/Llaves_Allen_Tool.png'),

    () => require('../Art/Inventario/Llaves_Allen_Tool.png'),

  ),

  lupaContraste: preferWebpAsset(

    () => require('../Art/Inventario/Lupa_de_Contraste_Tool.png'),

    () => require('../Art/Inventario/Lupa_de_Contraste_Tool.png'),

  ),

  magicArm: preferWebpAsset(

    () => require('../Art/Inventario/Magic_Arm_Tool.png'),

    () => require('../Art/Inventario/Magic_Arm_Tool.png'),

  ),

  multitool: preferWebpAsset(

    () => require('../Art/Inventario/Multitool_Tool.png'),

    () => require('../Art/Inventario/Multitool_Tool.png'),

  ),

  panoMicrofibra: preferWebpAsset(

    () => require('../Art/Inventario/Pano_Microfibra_Tool.png'),

    () => require('../Art/Inventario/Pano_Microfibra_Tool.png'),

  ),

  peraLimpieza: preferWebpAsset(

    () => require('../Art/Inventario/Pera_Limpieza_Tool.png'),

    () => require('../Art/Inventario/Pera_Limpieza_Tool.png'),

  ),

  pinzaMadera: preferWebpAsset(

    () => require('../Art/Inventario/Pinza_Madera_Tool.png'),

    () => require('../Art/Inventario/Pinza_Madera_Tool.png'),

  ),

  rinonera: preferWebpAsset(

    () => require('../Art/Inventario/Rinonera_Storage.png'),

    () => require('../Art/Inventario/Rinonera_Storage.png'),

  ),

  sargentoPrensa: preferWebpAsset(

    () => require('../Art/Inventario/Sargento_Prensa_C_Tool.png'),

    () => require('../Art/Inventario/Sargento_Prensa_C_Tool.png'),

  ),

  swatchbook: preferWebpAsset(

    () => require('../Art/Inventario/Swatchbook_Geles_Tool.png'),

    () => require('../Art/Inventario/Swatchbook_Geles_Tool.png'),

  ),

  testerTomas: preferWebpAsset(

    () => require('../Art/Inventario/Tester_de_Tomas_Tool.png'),

    () => require('../Art/Inventario/Tester_de_Tomas_Tool.png'),

  ),

  walkies: preferWebpAsset(

    () => require('../Art/Inventario/Walkie_Talkies_Tool.png'),

    () => require('../Art/Inventario/Walkie_Talkies_Tool.png'),

  ),

  scouting: preferWebpAsset(

    () => require('../Art/Inventario/Scouting_Module.png'),

    () => require('../Art/Inventario/Scouting_Module.png'),

  ),

};



const GRIP_ICON_SPRITES = {

  avenger: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Avenger_Tripod_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Avenger_Tripod_Grip.png'),

  ),

  rotula: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Rotula_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Rotula_Grip.png'),

  ),

  espada: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Espada_Ceferino_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Espada_Ceferino_Grip.png'),

  ),

  cstand: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/C_Stand_Grip.png'),

    () => require('../Art/Inventario adicional Grip/C_Stand_Grip.png'),

  ),

  cardellini: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Cardellini_Clamp_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Cardellini_Clamp_Grip.png'),

  ),

  jirafa: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Jirafa_Avenger_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Jirafa_Avenger_Grip.png'),

  ),

  viaTravelling: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Via_Travelling_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Via_Travelling_Grip.png'),

  ),

  carroTravelling: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Carro_Travelling_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Carro_Travelling_Grip.png'),

  ),

  carMount: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Car_Mount_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Car_Mount_Grip.png'),

  ),

  tripodeCamara: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Tripode_Camara_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Tripode_Camara_Grip.png'),

  ),

  gimbal: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Gimbal_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Gimbal_Grip.png'),

  ),

  steadicam: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Steadicam_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Steadicam_Grip.png'),

  ),

  cincha: preferWebpAsset(

    () => require('../Art/Inventario adicional Grip/Cincha_Grip.png'),

    () => require('../Art/Inventario adicional Grip/Cincha_Grip.png'),

  ),

};



const LIGHT_MODIFIER_ICONS = {

  bandera: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/Bandera_Light_Modifier.png'),

    () => require('../Art/Inventario Light modifiers/Bandera_Light_Modifier.png'),

  ),

  globo: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/Globo_Light_Modifier.png'),

    () => require('../Art/Inventario Light modifiers/Globo_Light_Modifier.png'),

  ),

  octabox: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/Octabox_Light_Modifier.png'),

    () => require('../Art/Inventario Light modifiers/Octabox_Light_Modifier.png'),

  ),

  softbox: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/Softbox_Light_Modifier.png'),

    () => require('../Art/Inventario Light modifiers/Softbox_Light_Modifier.png'),

  ),

  textureProjector: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/Texture_Projector_Light_Canon_Modifier.png'),

    () => require('../Art/Inventario Light modifiers/Texture_Projector_Light_Canon_Modifier.png'),

  ),

  filtroDifusionFull: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/Filtro_Difusion_Full_-1st.png'),

    () => require('../Art/Inventario Light modifiers/Filtro_Difusion_Full_-1st.png'),

  ),

  filtroDifusionHalf: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/Filtro_Difusion_Half_-0.5st.png'),

    () => require('../Art/Inventario Light modifiers/Filtro_Difusion_Half_-0.5st.png'),

  ),

  filtroDifusionQuarter: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/Filtro_Difusion_Quarter_-0.3st.png'),

    () => require('../Art/Inventario Light modifiers/Filtro_Difusion_Quarter_-0.3st.png'),

  ),

  ctoFull: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/CTO_Full_Filtro.png'),

    () => require('../Art/Inventario Light modifiers/CTO_Full_Filtro.png'),

  ),

  ctoHalf: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/CTO_Half_Filtro.png'),

    () => require('../Art/Inventario Light modifiers/CTO_Half_Filtro.png'),

  ),

  ctoQuarter: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/CTO_Quarter_Filtro .png'),

    () => require('../Art/Inventario Light modifiers/CTO_Quarter_Filtro .png'),

  ),

  ctbFull: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/CTB_Full_Filtro.png'),

    () => require('../Art/Inventario Light modifiers/CTB_Full_Filtro.png'),

  ),

  ctbHalf: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/CTB_Half_Filtro.png'),

    () => require('../Art/Inventario Light modifiers/CTB_Half_Filtro.png'),

  ),

  ctbQuarter: preferWebpAsset(

    () => require('../Art/Inventario Light modifiers/CTB_Quarter_Filtro.png'),

    () => require('../Art/Inventario Light modifiers/CTB_Quarter_Filtro.png'),

  ),

};



const FIXTURE_ART = {

  luminaria1: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_1.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_1.png'),

  ),

  luminaria2: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_2.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_2.png'),

  ),

  luminaria3: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_3.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_3.png'),

  ),

  luminaria4: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_4.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_4.png'),

  ),

  luminaria5: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_5.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_5.png'),

  ),

  luminaria6: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_6.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_6.png'),

  ),

  luminaria7: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_7.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_7.png'),

  ),

  luminaria8: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_8.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_8.png'),

  ),

  luminaria9: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_9.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Luminaria_9.png'),

  ),

  aputure: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Aputure_Fixtures.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Aputure_Fixtures.png'),

  ),

  arri: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Arri_fixtures.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Arri_fixtures.png'),

  ),

  astera: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Astera_Fixtures.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Astera_Fixtures.png'),

  ),

  godox: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Godox_Fixtures.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Godox_Fixtures.png'),

  ),

  nanlite: preferWebpAsset(

    () => require('../Art/Inventrario Aparatos de Luz/Nanlite_Fixtures.png'),

    () => require('../Art/Inventrario Aparatos de Luz/Nanlite_Fixtures.png'),

  ),

};



const BASE_ITEMS = {

  pinzas: {

    id: 'pinzas',

    name: 'Pinzas',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.pinzas,

  },

  a_clamp: {

    id: 'a_clamp',

    name: 'A clamp',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.aClamp,

  },

  bongo_ties: {

    id: 'bongo_ties',

    name: 'Bongo ties',

    category: INVENTORY_CATEGORIES.CONSUMO,

    unit: INVENTORY_UNITS.ROLLO,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.bongoTies,

  },

  bridas_abrazaderas: {

    id: 'bridas_abrazaderas',

    name: 'Bridas',

    category: INVENTORY_CATEGORIES.CONSUMO,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.bridas,

  },

  gaffer_tape: {

    id: 'gaffer_tape',

    name: 'Cinta gaffer',

    category: INVENTORY_CATEGORIES.CONSUMO,

    unit: INVENTORY_UNITS.ROLLO,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.gafferTape,

  },

  cable_seguridad: {

    id: 'cable_seguridad',

    name: 'Cable seguridad',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.cableSeguridad,

  },

  bolsa_arena: {

    id: 'bolsa_arena',

    name: 'Bolsa de arena',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.bolsaArena,

  },

  brocha_limpieza: {

    id: 'brocha_limpieza',

    name: 'Brocha limpieza',

    category: INVENTORY_CATEGORIES.CONSUMO,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.brochaLimpieza,

  },

  camera_multitool: {

    id: 'camera_multitool',

    name: 'Multitool c\u00E1mara',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.cameraMultitool,

  },

  carta_color: {

    id: 'carta_color',

    name: 'Carta de color',

    category: INVENTORY_CATEGORIES.MEDICION,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.cartaColor,

  },

  carta_foco: {

    id: 'carta_foco',

    name: 'Carta de foco',

    category: INVENTORY_CATEGORIES.MEDICION,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.cartaFoco,

  },

  cinefoil: {

    id: 'cinefoil',

    name: 'Cinefoil',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.ROLLO,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.cinefoil,

  },

  cinta_medicion: {

    id: 'cinta_medicion',

    name: 'Cinta medici\u00F3n',

    category: INVENTORY_CATEGORIES.MEDICION,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.cintaMedicion,

  },

  claqueta: {

    id: 'claqueta',

    name: 'Claqueta',

    category: INVENTORY_CATEGORIES.MEDICION,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.claqueta,

  },

  cubo_enchufes: {

    id: 'cubo_enchufes',

    name: 'Cubo enchufes',

    category: INVENTORY_CATEGORIES.ELECTRICO,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.cuboEnchufes,

  },

  dimmer_linea: {

    id: 'dimmer_linea',

    name: 'Dimmer l\u00EDnea',

    category: INVENTORY_CATEGORIES.ELECTRICO,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.dimmerLinea,

  },

  filtros_cct: {

    id: 'filtros_cct',

    name: 'Filtros CCT',

    category: INVENTORY_CATEGORIES.MEDICION,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.filtrosCct,

  },

  fotometro: {

    id: 'fotómetro',

    name: 'Fot\u00F3metro',

    category: INVENTORY_CATEGORIES.MEDICION,

    unit: INVENTORY_UNITS.PIEZA,

    availability: 1,

    icon: INVENTORY_ICON_SPRITES.fotometro,

  },

  guantes: {

    id: 'guantes',

    name: 'Guantes',

    category: INVENTORY_CATEGORIES.PPE,

    unit: INVENTORY_UNITS.PAR,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.guantes,

  },

  headlamp: {

    id: 'headlamp',

    name: 'Headlamp',

    category: INVENTORY_CATEGORIES.PPE,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.headlamp,

  },

  liquido_limpieza_lentes: {

    id: 'liquido_limpieza_lentes',

    name: 'L\u00EDquido lentes',

    category: INVENTORY_CATEGORIES.CONSUMO,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.liquidoLentes,

  },

  llaves_allen: {

    id: 'llaves_allen',

    name: 'Llaves allen',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.llavesAllen,

  },

  lupa_contraste: {

    id: 'lupa_contraste',

    name: 'Lupa contraste',

    category: INVENTORY_CATEGORIES.MEDICION,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.lupaContraste,

  },

  magic_arm: {

    id: 'magic_arm',

    name: 'Magic arm',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.magicArm,

  },

  multitool: {

    id: 'multitool',

    name: 'Multitool',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.multitool,

  },

  pano_microfibra: {

    id: 'pano_microfibra',

    name: 'Pa\u00F1o microfibra',

    category: INVENTORY_CATEGORIES.CONSUMO,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.panoMicrofibra,

  },

  pera_limpieza: {

    id: 'pera_limpieza',

    name: 'Pera limpieza',

    category: INVENTORY_CATEGORIES.MEDICION,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.peraLimpieza,

  },

  pinza_madera: {

    id: 'pinza_madera',

    name: 'Pinza madera',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.pinzaMadera,

  },

  bandera_negra: {

    id: 'bandera_negra',

    name: 'Bandera 4x4',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.bandera,

  },

  globo_difusion: {

    id: 'globo_difusion',

    name: 'Globo difusion',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.globo,

  },

  octabox: {

    id: 'octabox',

    name: 'Octabox',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.octabox,

  },

  softbox: {

    id: 'softbox',

    name: 'Softbox',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.softbox,

  },

  texture_projector: {

    id: 'texture_projector',

    name: 'Texture projector',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.textureProjector,

  },

  filtro_difusion_full: {

    id: 'filtro_difusion_full',

    name: 'Difusion full (-1st)',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.filtroDifusionFull,

  },

  filtro_difusion_half: {

    id: 'filtro_difusion_half',

    name: 'Difusion half (-0.5st)',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.filtroDifusionHalf,

  },

  filtro_difusion_quarter: {

    id: 'filtro_difusion_quarter',

    name: 'Difusion quarter (-0.3st)',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.filtroDifusionQuarter,

  },

  cto_full: {

    id: 'cto_full',

    name: 'CTO full',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.ctoFull,

  },

  cto_half: {

    id: 'cto_half',

    name: 'CTO half',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.ctoHalf,

  },

  cto_quarter: {

    id: 'cto_quarter',

    name: 'CTO quarter',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.ctoQuarter,

  },

  ctb_full: {

    id: 'ctb_full',

    name: 'CTB full',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.ctbFull,

  },

  ctb_half: {

    id: 'ctb_half',

    name: 'CTB half',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.ctbHalf,

  },

  ctb_quarter: {

    id: 'ctb_quarter',

    name: 'CTB quarter',

    category: INVENTORY_CATEGORIES.MODIFIERS,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: LIGHT_MODIFIER_ICONS.ctbQuarter,

  },

  avenger_grip: {

    id: 'avenger_grip',

    name: 'Tr\u00EDpode Avenger',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.avenger,

  },

  rotula_grip: {

    id: 'rotula_grip',

    name: 'R\u00F3tula grip',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.rotula,

  },

  espada_ceferino: {

    id: 'espada_ceferino',

    name: 'Espada Ceferino',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.espada,

  },

  cstand_grip: {

    id: 'cstand_grip',

    name: 'C-stand',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.cstand,

  },

  cardellini_clamp: {

    id: 'cardellini_clamp',

    name: 'Cardellini clamp',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.cardellini,

  },

  jirafa_avenger: {

    id: 'jirafa_avenger',

    name: 'Jirafa Avenger',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.jirafa,

  },

  via_travelling_120: {

    id: 'via_travelling_120',

    name: 'V\u00EDa travelling 120 cm',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.viaTravelling,

  },

  carro_travelling: {

    id: 'carro_travelling',

    name: 'Carro travelling',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.carroTravelling,

  },

  car_mount_grip: {

    id: 'car_mount_grip',

    name: 'Car mount',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.carMount,

  },

  tripode_camara: {

    id: 'tripode_camara',

    name: 'Trípode cámara',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.tripodeCamara,

  },

  gimbal_grip: {

    id: 'gimbal_grip',

    name: 'Gimbal',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.gimbal,

  },

  steadicam_grip: {

    id: 'steadicam_grip',

    name: 'Steadicam',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.steadicam,

  },

  cincha_grip: {

    id: 'cincha_grip',

    name: 'Cincha',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: GRIP_ICON_SPRITES.cincha,

  },

  rinonera_storage: {

    id: 'rinonera_storage',

    name: 'Ri\u00F1onera',

    category: INVENTORY_CATEGORIES.PPE,

    unit: INVENTORY_UNITS.PIEZA,

    availability: 1,

    icon: INVENTORY_ICON_SPRITES.rinonera,

  },

  sargento_prensa: {

    id: 'sargento_prensa',

    name: 'Sargento prensa',

    category: INVENTORY_CATEGORIES.GRIP,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.sargentoPrensa,

  },

  swatchbook_geles: {

    id: 'swatchbook_geles',

    name: 'Swatchbook geles',

    category: INVENTORY_CATEGORIES.MEDICION,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.swatchbook,

  },

  tester_tomas: {

    id: 'tester_tomas',

    name: 'Tester tomas',

    category: INVENTORY_CATEGORIES.ELECTRICO,

    unit: INVENTORY_UNITS.PIEZA,

    availability: 1,

    icon: INVENTORY_ICON_SPRITES.testerTomas,

  },

  walkie_talkies: {

    id: 'walkie_talkies',

    name: 'Walkie talkies',

    category: INVENTORY_CATEGORIES.ELECTRICO,

    unit: INVENTORY_UNITS.PIEZA,

    availability: null,

    icon: INVENTORY_ICON_SPRITES.walkies,

  },

};



export const FIXTURE_ICON_POOL = [

  FIXTURE_ART.luminaria1,

  FIXTURE_ART.luminaria2,

  FIXTURE_ART.luminaria3,

  FIXTURE_ART.luminaria4,

  FIXTURE_ART.luminaria5,

  FIXTURE_ART.luminaria6,

  FIXTURE_ART.luminaria7,

  FIXTURE_ART.luminaria8,

  FIXTURE_ART.luminaria9,

];



const PANEL_ICON = FIXTURE_ART.luminaria4;

const TUNGSTEN_ICON = FIXTURE_ART.luminaria6;



const FIXTURE_BRAND_ICONS = {

  Aputure: FIXTURE_ART.aputure,

  ARRI: FIXTURE_ART.arri,

  Astera: FIXTURE_ART.astera,

  Godox: FIXTURE_ART.godox,

  Nanlite: FIXTURE_ART.nanlite,

  Litepanels: PANEL_ICON,

  Philips: PANEL_ICON,

  BudgetLED: PANEL_ICON,

  Manual: PANEL_ICON,

  Tungsten: TUNGSTEN_ICON,

};



const slugifyFixtureId = (value) =>

  (value || 'fixture')

    .toString()

    .toLowerCase()

    .normalize('NFD')

    .replace(/[\u0300-\u036f]/g, '')

    .replace(/[^a-z0-9]+/g, '-')

    .replace(/(^-|-$)/g, '') || 'fixture';



const buildFixtureCatalogItems = () => {

  const entries = {};

  let iconIndex = 0;

  Object.entries(FIXTURES).forEach(([brand, fixtures]) => {

    const brandKey = brand.trim();

    fixtures.forEach((fixture) => {

      const slug = slugifyFixtureId(`${brand}-${fixture.name}`);

      const id = `fixture_${slug}`;

      if (entries[id]) return;

      const brandIcon = FIXTURE_BRAND_ICONS[brandKey];

      const icon = brandIcon || FIXTURE_ICON_POOL[iconIndex % FIXTURE_ICON_POOL.length];

      iconIndex += 1;

      entries[id] = {

        id,

        name: `${brandKey} - ${fixture.name}`,

        category: INVENTORY_CATEGORIES.LUMINARIA,

        unit: INVENTORY_UNITS.PIEZA,

        availability: null,

        icon,

        description: `${fixture.lux} lx @ ${fixture.dist} m`,

      };

    });

  });

  return entries;

};



const FIXTURE_CATALOG_ITEMS = buildFixtureCatalogItems();



export const ITEMS_MASTER = {

  ...BASE_ITEMS,

  ...FIXTURE_CATALOG_ITEMS,

};



export const pickFixtureIconFromSeed = (seed = '') => {

  if (!FIXTURE_ICON_POOL || FIXTURE_ICON_POOL.length === 0) return null;

  const hash = seed

    .toString()

    .split('')

    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const index = Math.abs(hash) % FIXTURE_ICON_POOL.length;

  return FIXTURE_ICON_POOL[index];

};



export const normalizeCustomInventoryItems = (items = {}) =>

  Object.entries(items || {}).reduce((acc, [id, item]) => {

    if (!item) return acc;

    const safeId = item.id || id;

    const isLuminaria = item.category === INVENTORY_CATEGORIES.LUMINARIA;

    if (isLuminaria && ITEMS_MASTER[safeId]) {

      // Prefer catalogo oficial cuando existe la misma luminaria.

      return acc;

    }

    const iconSeed = item.iconSeed || safeId;

    acc[safeId] = {

      ...item,

      id: safeId,

      iconSeed,

      icon: isLuminaria ? pickFixtureIconFromSeed(iconSeed) : item.icon,
    };

    return acc;

  }, {});



const DEFAULT_STOCK = Object.keys(ITEMS_MASTER).reduce((acc, id) => {

  const availability = ITEMS_MASTER[id].availability;

  acc[id] = availability ?? null;
  return acc;

}, {});



export const createInitialInventory = () => ({

  catalogStock: { ...DEFAULT_STOCK },

  inventory: {},

  customItems: {},

  lastUpdated: Date.now(),

});




