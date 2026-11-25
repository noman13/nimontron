/*
 * ─────────────────────────────────────────────────────────────
 *  YOUR WEDDING DETAILS — edit this file only.
 *  Everything on the page is built from what's written here.
 *  Keep the quotes and commas exactly as they are.
 * ─────────────────────────────────────────────────────────────
 */
window.WEDDING = {
  couple: {
    bride: {
      short: "Sanjida",                // shown big in the script font
      full: "Sanjida Farin",
      relation: "Daughter of",
      parents: "Mr. Khayez Ahmed & Mrs. Badrun Nessa",
    },
    groom: {
      short: "Saif",
      full: "Syed Shadman Saif",
      relation: "Son of",
      parents: "Syed Shaiful Islam & Sabrina Islam",
    },
    first: "bride",                    // whose name comes first: "bride" or "groom"
    monogram: "S & S",                 // letters on the wax seal
  },

  // Opening line at the very top. Set to null to remove it.
  blessing: {
    arabic: "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    translation: "In the name of Allah, the Most Gracious, the Most Merciful",
  },

  invitation: {
    before: "Together with their families",
    after: "joyfully invite you to celebrate their wedding",
  },

  // Time zone of the venues. Used for the countdown and calendar entries.
  timeZone: "Asia/Dhaka",

  welcome: {
    title: "Come celebrate with us!",
    text: "Two hearts, two families and a whole lot of happiness. Our days would not be complete without you there, laughing, dancing and eating far too much dessert with us.",
  },

  // The event whose date sits under the scratch card.
  saveTheDate: "wedding",

  // mapQuery: what Google Maps searches for (used for the map and Directions). Use the place
  //           name OR a plus code, not both together (Google then shows no pin).
  // mapsUrl:  link to the exact place, shown as "Open in Google Maps" under the map.
  venues: [
    {
      id: "masjid",
      name: "Purbo Nasirabad Tintala Jame Masjid",
      address: "By Lane (CNB Colony to District Police Head Quarter), Chattogram 4000",
      phone: "+880 1734-071341",
      mapQuery: "Purbo Nasirabad Tintala Jame Masjid, Chattogram, Bangladesh",
      mapsUrl: "https://maps.google.com/?q=9R8F+C83+Purbo+Nasirabad+Tintala+Jame+Masjid,+By+Lane+(CNB+Colony+to+District+Police+Head+Quarter,+Chattogram+4000,+Bangladesh&ftid=0x30acd8860d543f15:0xa6134360a936fb61",
    },
    {
      id: "bwa-kindergarten",
      name: "Bangladesh Women's Association Kindergarten",
      address: "9R3C+GV5, BWA School Foot Overbridge, Chattogram",
      phone: "+880 1840-493652",
      mapQuery: "Bangladesh Women's Association Kindergarten, Chattogram, Bangladesh",
      mapsUrl: "https://maps.google.com/?q=9R3C+GV5+Bangladesh+Women's+Association+Kindergarten,+BWA+School+Foot+Overbridge,+Chattogram,+Bangladesh&ftid=0x30acd89a06d684b9:0x16f31d2a90f4dc81",
    },
    {
      id: "united",
      name: "United Convention Hall",
      address: "9RCW+7J3, Chattogram",
      phone: "+880 1775-135722",
      mapQuery: "United Convention Hall, Chattogram, Bangladesh",
      mapsUrl: "https://maps.google.com/?q=9RCW+7J3+United+Convention+Hall,+Chattogram,+Bangladesh&ftid=0x30ad270051260bdb:0xafdab22b6084e024",
    },
    {
      id: "khulshi",
      name: "Khulshi Convention Hall",
      address: "Dhaka - Chittagong Hwy, Chattogram",
      phone: "",
      mapQuery: "Khulshi Convention Hall, Dhaka - Chittagong Hwy, Chattogram, Bangladesh",
      mapsUrl: "https://maps.google.com?q=Khulshi%20Convention%20Hall,%20Dhaka%20-%20Chittagong%20Hwy,%20Chattogram,%20Bangladesh&ftid=0x30acd9aff086cca7:0xd27ee2290dc5bd79",
    },
  ],

  // Times use the venue's UTC offset (+06:00 for Bangladesh).
  // Icons: mosque, crescent, rings, drinks, henna, dhol, qawwali, music, dj, dinner,
  //        arch, car, camera, cake, sparkle, gift, flower, heart
  // Dress code figures: "man" (panjabi), "suit", "woman".
  // colors: list of colours, or "any". show: colour used for the figure when colors is "any".
  events: [
    {
      id: "akdh",
      name: "Akdh",
      short: "Akdh",
      start: "2026-12-06T16:00:00+06:00",
      durationHours: 1.5,
      venue: "masjid",
      program: [
        { time: "3:30 PM", title: "Arrival at the Masjid", icon: "mosque" },
        { time: "4:00 PM", title: "Asr Salah", icon: "crescent" },
        { time: "4:15 PM", title: "Akdh", icon: "rings" },
      ],
      dressCode: [
        { label: "Men", name: "White or off-white", figure: "man", colors: ["#FFFFFF", "#EFE8D8"] },
        { label: "Women", name: "Off-white", figure: "woman", colors: ["#EFE8D8"] },
      ],
    },
    {
      id: "mehendi",
      name: "Mehendi Night",
      short: "Mehendi",
      start: "2026-12-10T16:00:00+06:00",
      durationHours: 7,
      venue: "bwa-kindergarten",
      program: [
        { time: "4:00 PM", title: "Guest Arrival", icon: "flower" },
        { time: "4:30 PM", title: "Welcome Drinks & Snacks", icon: "drinks" },
        { time: "5:00 PM", title: "Team Bride vs Team Groom Dance-Off", icon: "dhol" },
        { time: "6:00 PM", title: "Qawwali", icon: "qawwali" },
        { time: "9:00 PM", title: "Dinner", icon: "dinner" },
        { time: "10:00 PM", title: "DJ Music & Open Floor", icon: "dj" },
      ],
      dressCode: [
        { label: "Groom's side", name: "White panjabi", figure: "man", colors: ["#FFFFFF"] },
        { label: "Bride's side", name: "Mauve pink panjabi", figure: "man", colors: ["#C99AAE"] },
        { label: "Women", name: "Magenta or lemon", figure: "woman", colors: ["#C2467E", "#EEDC6B"] },
      ],
    },
    {
      id: "wedding",
      name: "Wedding",
      short: "Wedding",
      start: "2026-12-12T20:00:00+06:00",
      durationHours: 3,
      venue: "united",
      program: [
        { time: "7:00 PM", title: "Guest Arrival", icon: "arch" },
        { time: "7:30 PM", title: "Groom's Grand Entry", icon: "car" },
        { time: "8:00 PM", title: "Photos with the Couple", icon: "camera" },
        { time: "9:00 PM", title: "Dinner", icon: "dinner" },
      ],
      dressCode: [
        { label: "Men", name: "Any colour", figure: "man", colors: "any", show: "#9DB4C8" },
        { label: "Women", name: "Any colour except red", figure: "woman", colors: "any", show: "#B7A6D3", except: "#C8312F" },
      ],
    },
    {
      id: "walima",
      name: "Walima",
      short: "Walima",
      start: "2026-12-14T20:00:00+06:00",
      durationHours: 3,
      venue: "khulshi",
      program: [
        { time: "7:00 PM", title: "Guest Arrival", icon: "flower" },
        { time: "8:00 PM", title: "Dinner", icon: "dinner" },
        { time: "9:00 PM", title: "Farewell & Blessings", icon: "sparkle" },
      ],
      dressCode: [
        { label: "Men", name: "Any suit", figure: "suit", colors: ["#465063", "#7A6A58", "#2F3742"] },
        { label: "Women", name: "Pastel", figure: "woman", colors: ["#C9B8E6", "#BFE0CC", "#F4C9C4", "#F5E3A6", "#BCD6EC"], show: "#C9B8E6" },
      ],
    },
  ],

  programHint: "Click the dates to see details",

  // Countdowns shown (event ids). Use [] to hide the section.
  countdown: ["akdh", "mehendi", "wedding", "walima"],

  // "Get in touch" buttons. Use international format for phone numbers.
  contacts: [
    { label: "Bride's side", name: "Sanjida's family", phone: "+8801869478726", display: "01869-478726", whatsapp: true },
    { label: "Groom's side", name: "Saif's family", phone: "+8801849560122", display: "01849-560122", whatsapp: true },
  ],

  // Background music. Starts when the guest taps the envelope (browsers need one tap first)
  // and loops for as long as the page is open. Leave src as "" for no music.
  //   start:     where the first play begins (seconds)
  //   loopStart: where every repeat begins (1.08 skips the song's silent first second)
  //   loopEnd:   where it jumps back (2:14.74, just before the beat drop at 2:14.76)
  music: { src: "assets/music.mp3", start: 0, loopStart: 1.08, loopEnd: 134.74, volume: 0.6 },

  closing: {
    title: "We can't wait to celebrate with you",
    text: "Your love, laughter and prayers mean the world to us.",
    signoff: "With love, the families of Sanjida & Saif",
  },

  // Show or hide whole sections.
  show: {
    saveTheDate: true,
    dressCode: true,
    program: true,
    contacts: true,
  },
};
