export const WANTED_SUGGESTIONS = [
  "podjadanie kiełbasy z grilla",
  "fałszywy serwis w piłkarzykach",
  "nielegalne tańce w saloonie",
  "znikanie przy sprzątaniu",
  "kradzież ostatniej bułki",
  "podejrzanie dobrą formę przy stole",
  'gadanie "ostatni mecz" przez godzinę',
  "nieoddanie kapelusza szeryfa",
  "parkowanie konia przy grillu",
  "lanie lemoniady bez pozwolenia",
];

export function randomWanted() {
  return WANTED_SUGGESTIONS[Math.floor(Math.random() * WANTED_SUGGESTIONS.length)];
}
