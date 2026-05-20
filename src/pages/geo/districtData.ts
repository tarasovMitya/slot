export interface DistrictData {
  slug: string;
  name: string;
  nameIn: string;
  okrug: string;
  okrugFull: string;
}

export const DISTRICTS: DistrictData[] = [
  { slug: "arbat",          name: "Арбат",          nameIn: "на Арбате",        okrug: "ЦАО", okrugFull: "Центральный округ" },
  { slug: "basmanny",       name: "Басманный",       nameIn: "в Басманном",      okrug: "ЦАО", okrugFull: "Центральный округ" },
  { slug: "zamoskvorechye", name: "Замоскворечье",   nameIn: "в Замоскворечье",  okrug: "ЦАО", okrugFull: "Центральный округ" },
  { slug: "presnensky",     name: "Пресненский",     nameIn: "в Пресненском",    okrug: "ЦАО", okrugFull: "Центральный округ" },
  { slug: "tagansky",       name: "Таганский",       nameIn: "в Таганском",      okrug: "ЦАО", okrugFull: "Центральный округ" },
  { slug: "tverskoy",       name: "Тверской",        nameIn: "в Тверском",       okrug: "ЦАО", okrugFull: "Центральный округ" },
  { slug: "hamovniki",      name: "Хамовники",       nameIn: "в Хамовниках",     okrug: "ЦАО", okrugFull: "Центральный округ" },
  { slug: "yakimanka",      name: "Якиманка",        nameIn: "в Якиманке",       okrug: "ЦАО", okrugFull: "Центральный округ" },
  { slug: "sokolniki",      name: "Сокольники",      nameIn: "в Сокольниках",    okrug: "СВАО", okrugFull: "Северо-Восточный округ" },
  { slug: "dorogomilovo",   name: "Дорогомилово",    nameIn: "в Дорогомилово",   okrug: "ЗАО", okrugFull: "Западный округ" },
  { slug: "ramenki",        name: "Раменки",         nameIn: "в Раменках",       okrug: "ЗАО", okrugFull: "Западный округ" },
  { slug: "gagarinsky",     name: "Гагаринский",     nameIn: "в Гагаринском",    okrug: "ЮЗАО", okrugFull: "Юго-Западный округ" },
  { slug: "obruchevshy",    name: "Обручевский",     nameIn: "в Обручевском",    okrug: "ЮЗАО", okrugFull: "Юго-Западный округ" },
  { slug: "izmaylovo",      name: "Измайлово",       nameIn: "в Измайлово",      okrug: "ВАО", okrugFull: "Восточный округ" },
  { slug: "nagatinsky",     name: "Нагатинский",     nameIn: "в Нагатинском",    okrug: "ЮАО",  okrugFull: "Южный округ" },
  { slug: "khoroshevo",     name: "Хорошёво-Мнёвники", nameIn: "в Хорошёво-Мнёвниках", okrug: "СЗАО", okrugFull: "Северо-Западный округ" },
  { slug: "strogino",       name: "Строгино",        nameIn: "в Строгино",       okrug: "СЗАО", okrugFull: "Северо-Западный округ" },
  { slug: "kuntsevo",       name: "Кунцево",         nameIn: "в Кунцево",        okrug: "ЗАО",  okrugFull: "Западный округ" },
  { slug: "fili",           name: "Филёвский парк",  nameIn: "в Филёвском парке", okrug: "ЗАО", okrugFull: "Западный округ" },
  { slug: "otradnoe",       name: "Отрадное",        nameIn: "в Отрадном",       okrug: "СВАО", okrugFull: "Северо-Восточный округ" },
  { slug: "babushkinsky",   name: "Бабушкинский",    nameIn: "в Бабушкинском",   okrug: "СВАО", okrugFull: "Северо-Восточный округ" },
  { slug: "tekstilshiki",   name: "Текстильщики",    nameIn: "в Текстильщиках",  okrug: "ЮВАО", okrugFull: "Юго-Восточный округ" },
  { slug: "maryino",        name: "Марьино",         nameIn: "в Марьино",        okrug: "ЮВАО", okrugFull: "Юго-Восточный округ" },
  { slug: "chertanovo",     name: "Чертаново",       nameIn: "в Чертаново",      okrug: "ЮАО",  okrugFull: "Южный округ" },
  { slug: "biryulevo",      name: "Бирюлёво",        nameIn: "в Бирюлёво",       okrug: "ЮАО",  okrugFull: "Южный округ" },
  { slug: "konkovo",        name: "Коньково",        nameIn: "в Коньково",       okrug: "ЮЗАО", okrugFull: "Юго-Западный округ" },
  { slug: "yasenevo",       name: "Ясенево",         nameIn: "в Ясенево",        okrug: "ЮЗАО", okrugFull: "Юго-Западный округ" },
  { slug: "butovo",         name: "Бутово",          nameIn: "в Бутово",         okrug: "ЮЗАО", okrugFull: "Юго-Западный округ" },
  { slug: "tushino",        name: "Тушино",          nameIn: "в Тушино",         okrug: "СЗАО", okrugFull: "Северо-Западный округ" },
];

export function getDistrict(slug: string): DistrictData | undefined {
  return DISTRICTS.find((d) => d.slug === slug);
}
