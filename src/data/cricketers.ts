// =====================================================
// DPS BUZZ - Guess the Cricketer: Official Player Database
// Comprehensive dataset of 209+ Indian and International cricket icons
// Integrated with Wikimedia Commons photo discovery and license verification
// =====================================================

export interface CricketerImageMeta {
  imageUrl: string | null;
  thumbnailUrl: string | null;
  sourcePageUrl: string | null;
  photographer: string | null;
  licenseName: string | null;
  attributionText: string | null;
  isVerifiedFreeLicense: boolean;
}

export interface Cricketer {
  id: string;
  name: string;
  country: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
  battingStyle: 'Right-hand bat' | 'Left-hand bat';
  bowlingStyle: string;
  jerseyNumber: number;
  isActive: boolean;
  worldCupWinner: boolean;
  iplTeam: string;
  era: string;
  achievements: string[];
  hint: string;
  imageMeta?: CricketerImageMeta;
}

export const CRICKETERS: Cricketer[] = [
  {
    "id": "virat-kohli",
    "name": "Virat Kohli",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 18,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RCB",
    "era": "2010s-2020s",
    "achievements": [
      "2011 ODI World Cup",
      "2024 T20 World Cup",
      "80+ International Centuries",
      "Former Captain"
    ],
    "hint": "King of run chases, jersey #18, RCB icon.",
    "imageMeta": {
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/2/2b/Virat_Kohli_batting_2013.jpg",
      "thumbnailUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Virat_Kohli_batting_2013.jpg/320px-Virat_Kohli_batting_2013.jpg",
      "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Virat_Kohli_batting_2013.jpg",
      "photographer": "Dee03",
      "licenseName": "CC BY-SA 4.0",
      "attributionText": "Photo by Dee03 via Wikimedia Commons (CC BY-SA 4.0)",
      "isVerifiedFreeLicense": true
    }
  },
  {
    "id": "ms-dhoni",
    "name": "MS Dhoni",
    "country": "India",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 7,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "2000s-2010s",
    "achievements": [
      "2007 T20 World Cup",
      "2011 ODI World Cup",
      "2013 Champions Trophy",
      "5 IPL Trophies"
    ],
    "hint": "Captain Cool, legendary finisher with jersey #7, CSK captain.",
    "imageMeta": {
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/2/27/Matthew_Hayden_and_MS_Dhoni.jpg",
      "thumbnailUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Matthew_Hayden_and_MS_Dhoni.jpg/320px-Matthew_Hayden_and_MS_Dhoni.jpg",
      "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Matthew_Hayden_and_MS_Dhoni.jpg",
      "photographer": "Riana",
      "licenseName": "CC BY-SA 4.0",
      "attributionText": "Photo by Riana via Wikimedia Commons (CC BY-SA 4.0)",
      "isVerifiedFreeLicense": true
    }
  },
  {
    "id": "rohit-sharma",
    "name": "Rohit Sharma",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 45,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "2000s-2020s",
    "achievements": [
      "2007 T20 World Cup",
      "2024 T20 World Cup (Captain)",
      "3 ODI Double Centuries",
      "5 IPL Trophies"
    ],
    "hint": "Hitman, master of pull shots, jersey #45, MI leader.",
    "imageMeta": {
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Rohit_Sharma_during_the_2019_Cricket_World_Cup.jpg",
      "thumbnailUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Rohit_Sharma_during_the_2019_Cricket_World_Cup.jpg/320px-Rohit_Sharma_during_the_2019_Cricket_World_Cup.jpg",
      "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Rohit_Sharma_during_the_2019_Cricket_World_Cup.jpg",
      "photographer": "Dee03",
      "licenseName": "CC BY-SA 4.0",
      "attributionText": "Photo by Dee03 via Wikimedia Commons (CC BY-SA 4.0)",
      "isVerifiedFreeLicense": true
    }
  },
  {
    "id": "sachin-tendulkar",
    "name": "Sachin Tendulkar",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break / off-break",
    "jerseyNumber": 10,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "1990s-2010s",
    "achievements": [
      "100 International Centuries",
      "2011 ODI World Cup",
      "Highest Runs in Cricket History"
    ],
    "hint": "The God of Cricket, straight drive master, jersey #10.",
    "imageMeta": {
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Tendulkar_six.jpg",
      "thumbnailUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Tendulkar_six.jpg/320px-Tendulkar_six.jpg",
      "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Tendulkar_six.jpg",
      "photographer": "Srini G",
      "licenseName": "CC BY-SA 2.0",
      "attributionText": "Photo by Srini G via Wikimedia Commons (CC BY-SA 2.0)",
      "isVerifiedFreeLicense": true
    }
  },
  {
    "id": "jasprit-bumrah",
    "name": "Jasprit Bumrah",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 93,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "2010s-2020s",
    "achievements": [
      "2024 T20 World Cup Player of the Tournament",
      "Test Hat-trick",
      "Death Over Specialist"
    ],
    "hint": "Yorker king with a unique hyperextended action, world #1 pacer.",
    "imageMeta": {
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/3/3b/England_v_India_ODI_Trent_Bridge_12_July_2018_%2842491187125%29.jpg",
      "thumbnailUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/England_v_India_ODI_Trent_Bridge_12_July_2018_%2842491187125%29.jpg/320px-England_v_India_ODI_Trent_Bridge_12_July_2018_%2842491187125%29.jpg",
      "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:England_v_India_ODI_Trent_Bridge_12_July_2018_%2842491187125%29.jpg",
      "photographer": "Dun.can",
      "licenseName": "CC BY 2.0",
      "attributionText": "Photo by Dun.can via Wikimedia Commons (CC BY 2.0)",
      "isVerifiedFreeLicense": true
    }
  },
  {
    "id": "hardik-pandya",
    "name": "Hardik Pandya",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 33,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "2010s-2020s",
    "achievements": [
      "2024 T20 World Cup Hero",
      "IPL Winning Captain (GT 2022)",
      "Clutch All-Rounder"
    ],
    "hint": "Dynamic seam-bowling all-rounder, bowled final over in 2024 T20 WC final.",
    "imageMeta": {
      "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/2/25/Hardik_Pandya_at_Oval.jpg",
      "thumbnailUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Hardik_Pandya_at_Oval.jpg/320px-Hardik_Pandya_at_Oval.jpg",
      "sourcePageUrl": "https://commons.wikimedia.org/wiki/File:Hardik_Pandya_at_Oval.jpg",
      "photographer": "Dee03",
      "licenseName": "CC BY-SA 4.0",
      "attributionText": "Photo by Dee03 via Wikimedia Commons (CC BY-SA 4.0)",
      "isVerifiedFreeLicense": true
    }
  },
  {
    "id": "ravindra-jadeja",
    "name": "Ravindra Jadeja",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 8,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "2000s-2020s",
    "achievements": [
      "2013 Champions Trophy Player of Final",
      "2024 T20 World Cup",
      "CSK 2023 Title Winning Boundary"
    ],
    "hint": "Sir Jadeja, sword celebration, electric fielder with deadly direct hits."
  },
  {
    "id": "shubman-gill",
    "name": "Shubman Gill",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 77,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "GT",
    "era": "2020s",
    "achievements": [
      "ODI Double Century (208)",
      "IPL 2023 Orange Cap (890 runs)",
      "Prince of Indian Cricket"
    ],
    "hint": "Young prodigy called \"Prince\", short-arm jab specialist, GT captain."
  },
  {
    "id": "rishabh-pant",
    "name": "Rishabh Pant",
    "country": "India",
    "role": "Wicketkeeper",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 17,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "2010s-2020s",
    "achievements": [
      "Gabba 2021 Hero (89*)",
      "2024 T20 World Cup",
      "Test Centuries in England, Australia, South Africa"
    ],
    "hint": "Fearless keeper-batter who breached the Gabba fortress, miraculous comeback."
  },
  {
    "id": "suryakumar-yadav",
    "name": "Suryakumar Yadav",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 63,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "2020s",
    "achievements": [
      "2024 T20 World Cup Iconic Catch",
      "ICC T20I Player of the Year",
      "India T20I Captain"
    ],
    "hint": "SKY, 360-degree shot-maker, boundary catch in 2024 T20 WC final."
  },
  {
    "id": "mohammed-shami",
    "name": "Mohammed Shami",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 11,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "GT",
    "era": "2010s-2020s",
    "achievements": [
      "2023 ODI World Cup Leading Wicket-taker (24 wickets)",
      "World Cup 7-fer vs NZ",
      "World Cup Hat-trick (2019)"
    ],
    "hint": "Upright seam master, decimated batting lineups in 2023 World Cup."
  },
  {
    "id": "mohammed-siraj",
    "name": "Mohammed Siraj",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 73,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RCB",
    "era": "2020s",
    "achievements": [
      "2023 Asia Cup 6/21 destruction",
      "2024 T20 World Cup",
      "ICC #1 ODI Bowler Ranking"
    ],
    "hint": "Miyan Magic, spirited pacer who took 6/21 in the Asia Cup Final."
  },
  {
    "id": "kl-rahul",
    "name": "KL Rahul",
    "country": "India",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 1,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "LSG",
    "era": "2010s-2020s",
    "achievements": [
      "Fastest IPL Fifty (14 balls)",
      "Centuries in all three formats",
      "Centuries in South Africa, England, Australia"
    ],
    "hint": "Classy Karnataka batter with serene cover drive, ears-shut celebration."
  },
  {
    "id": "yashasvi-jaiswal",
    "name": "Yashasvi Jaiswal",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 64,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RR",
    "era": "2020s",
    "achievements": [
      "Fastest IPL Fifty (13 balls)",
      "Back-to-back Test Double Centuries vs England",
      "2024 T20 World Cup Squad"
    ],
    "hint": "Explosive young left-handed opener, panipuri seller to international superstar."
  },
  {
    "id": "shreyas-iyer",
    "name": "Shreyas Iyer",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 96,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "2010s-2020s",
    "achievements": [
      "IPL 2024 Winning Captain (KKR)",
      "530 runs in 2023 ODI World Cup",
      "Test Century on Debut"
    ],
    "hint": "Middle-order spin slayer, captained KKR to 2024 IPL championship."
  },
  {
    "id": "axar-patel",
    "name": "Axar Patel",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 20,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "2010s-2020s",
    "achievements": [
      "2024 T20 World Cup Crucial 47 in Final",
      "Test Debut 5-fer streak",
      "Reliable spin all-rounder"
    ],
    "hint": "Bapu, key knock of 47 in 2024 T20 WC final vs SA, wicket-to-wicket accuracy."
  },
  {
    "id": "kuldeep-yadav",
    "name": "Kuldeep Yadav",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Left-arm wrist-spin (Chinaman)",
    "jerseyNumber": 23,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "2010s-2020s",
    "achievements": [
      "Two ODI Hat-tricks",
      "2024 T20 World Cup Leading Spin Wickets",
      "Rare Chinaman Bowling Skill"
    ],
    "hint": "India’s premier left-arm wrist spinner, bowled Babar Azam with dream delivery in 2019 WC."
  },
  {
    "id": "arshdeep-singh",
    "name": "Arshdeep Singh",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Left-arm medium-fast",
    "jerseyNumber": 2,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "PBKS",
    "era": "2020s",
    "achievements": [
      "Joint Leading Wicket-taker in 2024 T20 World Cup (17 wickets)",
      "Death overs yorker specialist"
    ],
    "hint": "Left-arm swing bowler from Punjab, crucial 19th over in 2024 T20 WC final."
  },
  {
    "id": "rinku-singh",
    "name": "Rinku Singh",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 35,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "2020s",
    "achievements": [
      "5 consecutive sixes in final over to win IPL match (2023)",
      "Fearless T20 finisher"
    ],
    "hint": "Hit 5 sixes off Yash Dayal to pull off impossible IPL victory, beloved finisher."
  },
  {
    "id": "sanju-samson",
    "name": "Sanju Samson",
    "country": "India",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 9,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RR",
    "era": "2010s-2020s",
    "achievements": [
      "Consecutive T20I Centuries (2024)",
      "2024 T20 World Cup Squad",
      "RR Captain"
    ],
    "hint": "Kerala stroke-maker with effortless timing, Rajasthan Royals captain."
  },
  {
    "id": "yuzvendra-chahal",
    "name": "Yuzvendra Chahal",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 3,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RR",
    "era": "2010s-2020s",
    "achievements": [
      "Highest Wicket-taker in IPL History (200+ wickets)",
      "IPL Hat-trick",
      "Former National Chess Champion"
    ],
    "hint": "IPL’s all-time leading wicket-taker, crafty leg-spinner and former chess champion."
  },
  {
    "id": "bhuvneshwar-kumar",
    "name": "Bhuvneshwar Kumar",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 15,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2010s-2020s",
    "achievements": [
      "Back-to-back IPL Purple Caps (2016, 2017)",
      "Clean bowled Hafeez on first T20I delivery"
    ],
    "hint": "Bhuvi, maestro of conventional in-swing and out-swing with the new ball."
  },
  {
    "id": "shivam-dube",
    "name": "Shivam Dube",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 25,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "2020s",
    "achievements": [
      "2024 T20 World Cup Champion",
      "CSK Spin Demolisher",
      "Massive Arc Six Hitter"
    ],
    "hint": "Tall Mumbai all-rounder who destroys spinners with towering sixes, CSK regular."
  },
  {
    "id": "washington-sundar",
    "name": "Washington Sundar",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 5,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2020s",
    "achievements": [
      "Gabba 2021 Hero (62 & 3 wickets)",
      "Powerplay Spin Specialist",
      "7-wicket haul vs NZ (2024)"
    ],
    "hint": "Economical powerplay off-spinner, struck counter-attacking 62 on Test debut at the Gabba."
  },
  {
    "id": "ishan-kishan",
    "name": "Ishan Kishan",
    "country": "India",
    "role": "Wicketkeeper",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 32,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "MI",
    "era": "2020s",
    "achievements": [
      "Fastest ODI Double Century in Cricket History (126 balls vs Bangladesh)",
      "Pocket Dynamo"
    ],
    "hint": "Pocket Dynamo, explosive wicketkeeper who blasted 210 off 131 balls in an ODI."
  },
  {
    "id": "ruturaj-gaikwad",
    "name": "Ruturaj Gaikwad",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 31,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "CSK",
    "era": "2020s",
    "achievements": [
      "CSK Captain",
      "IPL 2021 Orange Cap Winner",
      "Asian Games Gold Medal Captain (2023)"
    ],
    "hint": "CSK young captain, elegant timer of the ball, Orange Cap holder."
  },
  {
    "id": "tilak-varma",
    "name": "Tilak Varma",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 72,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "MI",
    "era": "2020s",
    "achievements": [
      "Back-to-back T20I Centuries vs South Africa (2024)",
      "Hyderabad Prodigy",
      "MI Middle-Order Pillar"
    ],
    "hint": "Hyderabad young gun who struck consecutive T20I centuries against South Africa."
  },
  {
    "id": "ravi-bishnoi",
    "name": "Ravi Bishnoi",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break / googly",
    "jerseyNumber": 56,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "LSG",
    "era": "2020s",
    "achievements": [
      "ICC #1 Ranked T20I Bowler (2023)",
      "Deadly Googly Specialist"
    ],
    "hint": "Quick through the air with a venomous googly, reached world #1 T20I ranking."
  },
  {
    "id": "deepak-chahar",
    "name": "Deepak Chahar",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 90,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "CSK",
    "era": "2010s-2020s",
    "achievements": [
      "Best T20I Bowling Figures (6/7 with a hat-trick vs Bangladesh)",
      "CSK Powerplay Specialist"
    ],
    "hint": "Outswing specialist who took unbelievable 6 for 7 including a hat-trick in a T20I."
  },
  {
    "id": "shardul-thakur",
    "name": "Shardul Thakur",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 54,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "CSK",
    "era": "2010s-2020s",
    "achievements": [
      "Lord Shardul",
      "Gabba 2021 Half-Century & 7 Wickets",
      "Golden Arm Breakthrough Specialist"
    ],
    "hint": "Affectionately known as \"Lord Shardul\", partnership-breaker with the golden arm."
  },
  {
    "id": "prasidh-krishna",
    "name": "Prasidh Krishna",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 24,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "RR",
    "era": "2020s",
    "achievements": [
      "Hit-the-deck Pacer",
      "4 Wickets on ODI Debut",
      "Tall Fast Bowler from Karnataka"
    ],
    "hint": "Tall Karnataka pacer capable of extracting steep bounce from good length."
  },
  {
    "id": "mukesh-kumar",
    "name": "Mukesh Kumar",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 49,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "DC",
    "era": "2020s",
    "achievements": [
      "Debuted in all 3 formats on single tour of West Indies (2023)",
      "Death overs yorker specialist"
    ],
    "hint": "Bengal seamer renowned for pin-point yorkers in final overs."
  },
  {
    "id": "avesh-khan",
    "name": "Avesh Khan",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 65,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "RR",
    "era": "2020s",
    "achievements": [
      "Express Pace",
      "5-wicket haul vs South Africa in ODIs",
      "Helmet celebration"
    ],
    "hint": "Madhya Pradesh speedster who hits 145+ km/h regularly."
  },
  {
    "id": "umran-malik",
    "name": "Umran Malik",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 21,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2020s",
    "achievements": [
      "157 km/h Delivery in IPL",
      "Fastest Indian Delivery Record",
      "Jammu Express"
    ],
    "hint": "The Jammu Express, clocked 157 km/h in the IPL with raw sheer pace."
  },
  {
    "id": "t-natarajan",
    "name": "T Natarajan",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Left-arm medium-fast",
    "jerseyNumber": 44,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2020s",
    "achievements": [
      "Yorker King from Salem",
      "Debuted in all three formats in Australia (2020-21)",
      "SRH Death Specialist"
    ],
    "hint": "Tamil Nadu left-armer hailed as Yorker King, tennis ball cricket legend."
  },
  {
    "id": "dhruv-jurel",
    "name": "Dhruv Jurel",
    "country": "India",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 22,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "RR",
    "era": "2020s",
    "achievements": [
      "Player of Match in Ranchi Test vs England (2024)",
      "Salute celebration for army veteran father"
    ],
    "hint": "Young keeper-batter whose 90 in Ranchi turned the Test series against England."
  },
  {
    "id": "sarfaraz-khan",
    "name": "Sarfaraz Khan",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 97,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "DC",
    "era": "2020s",
    "achievements": [
      "150 vs New Zealand in Bengaluru Test (2024)",
      "Don Bradman-like Ranji Trophy average (80+)"
    ],
    "hint": "Mumbai run-machine who scored 150 in Tests against New Zealand with audacious sweeps."
  },
  {
    "id": "devdutt-padikkal",
    "name": "Devdutt Padikkal",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 37,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "LSG",
    "era": "2020s",
    "achievements": [
      "IPL Emerging Player (2020)",
      "Test Debut Half-Century vs England (Dharamsala 2024)"
    ],
    "hint": "Tall Karnataka left-hander with flowing off-side drives, scored 65 on Test debut."
  },
  {
    "id": "sai-sudharsan",
    "name": "Sai Sudharsan",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 23,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "GT",
    "era": "2020s",
    "achievements": [
      "96 in 2023 IPL Final for GT",
      "Half-century on ODI Debut in South Africa (2023)"
    ],
    "hint": "Tamil Nadu technician, struck a dazzling 96 off 47 in the 2023 IPL final."
  },
  {
    "id": "rahul-tripathi",
    "name": "Rahul Tripathi",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 52,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2010s-2020s",
    "achievements": [
      "Intense Intent Striker",
      "35 off 16 vs Sri Lanka in T20I series clincher",
      "Uncapped Warrior"
    ],
    "hint": "Always bats with 100% intent from ball one, beloved for fearless assault on pacers."
  },
  {
    "id": "khaleel-ahmed",
    "name": "Khaleel Ahmed",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Left-arm fast-medium",
    "jerseyNumber": 71,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "DC",
    "era": "2010s-2020s",
    "achievements": [
      "2024 T20 World Cup Traveling Reserve",
      "DC Powerplay Enforcer"
    ],
    "hint": "Rajasthan left-arm pacer who strikes frequently in the first six overs."
  },
  {
    "id": "harshit-rana",
    "name": "Harshit Rana",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 22,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "2020s",
    "achievements": [
      "IPL 2024 Champion with KKR (19 wickets)",
      "Flying kiss send-off celebration"
    ],
    "hint": "Delhi express quick who took 19 wickets in KKR’s title-winning 2024 campaign."
  },
  {
    "id": "abhishek-sharma",
    "name": "Abhishek Sharma",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 4,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2020s",
    "achievements": [
      "Fastest T20I Century by Indian (47 balls vs Zimbabwe 2024)",
      "SRH 200+ Strike Rate in IPL 2024"
    ],
    "hint": "Mentored by Yuvraj Singh, blazed 47-ball T20I century in only his second international game."
  },
  {
    "id": "nitish-kumar-reddy",
    "name": "Nitish Kumar Reddy",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 67,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2020s",
    "achievements": [
      "IPL 2024 Emerging Player of the Season",
      "Test Century on debut tour in Australia (2024)"
    ],
    "hint": "Andhra pace-bowling all-rounder, struck 74 off 34 vs Bangladesh and Test star."
  },
  {
    "id": "mayank-yadav",
    "name": "Mayank Yadav",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 74,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "LSG",
    "era": "2020s",
    "achievements": [
      "156.7 km/h Speed Demon",
      "Back-to-back Player of Match awards on IPL debut"
    ],
    "hint": "Delhi express pacer who terrorized IPL batters with 156.7 km/h thunderbolts."
  },
  {
    "id": "kapil-dev",
    "name": "Kapil Dev",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast-outswing",
    "jerseyNumber": 22,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1970s-1990s",
    "achievements": [
      "1983 World Cup Winning Captain",
      "434 Test Wickets",
      "175* at Tunbridge Wells"
    ],
    "hint": "Haryana Hurricane, first Indian captain to lift the World Cup in 1983."
  },
  {
    "id": "sunil-gavaskar",
    "name": "Sunil Gavaskar",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 10,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1970s-1980s",
    "achievements": [
      "First man to 10,000 Test runs",
      "34 Test Centuries",
      "1983 World Cup Winner"
    ],
    "hint": "Little Master, played the West Indies terrifying pacers without a helmet."
  },
  {
    "id": "rahul-dravid",
    "name": "Rahul Dravid",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 19,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "RR",
    "era": "1990s-2010s",
    "achievements": [
      "The Wall of Indian Cricket",
      "13,288 Test Runs",
      "2024 T20 World Cup Head Coach"
    ],
    "hint": "\"The Wall\", impenetrable defense, coached India to 2024 T20 World Cup victory."
  },
  {
    "id": "sourav-ganguly",
    "name": "Sourav Ganguly",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 99,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "1990s-2000s",
    "achievements": [
      "God of the Off-Side",
      "2002 NatWest Trophy Final Shirt Wave",
      "2003 World Cup Final Captain"
    ],
    "hint": "Dada, Prince of Kolkata, famous Lord’s balcony celebration in 2002."
  },
  {
    "id": "vvs-laxman",
    "name": "VVS Laxman",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 28,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "DC",
    "era": "1990s-2010s",
    "achievements": [
      "281 at Eden Gardens vs Australia (2001)",
      "Very Very Special",
      "Supreme Wristy Strokeplay"
    ],
    "hint": "Very Very Special Laxman, legendary 281 following on against Australia."
  },
  {
    "id": "anil-kumble",
    "name": "Anil Kumble",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 37,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "1990s-2000s",
    "achievements": [
      "Perfect 10 wickets in a Test innings vs Pakistan",
      "619 Test Wickets (India #1)",
      "Jumbo"
    ],
    "hint": "Jumbo, took all 10 wickets in an innings at Feroz Shah Kotla, bowled with broken jaw."
  },
  {
    "id": "virender-sehwag",
    "name": "Virender Sehwag",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 44,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "DD",
    "era": "2000s-2010s",
    "achievements": [
      "Two Test Triple Centuries (309, 319)",
      "2011 ODI World Cup",
      "2007 T20 World Cup",
      "First ball boundaries"
    ],
    "hint": "Nawab of Najafgarh, hit a six to reach 300 in Multan, boundary on ball 1."
  },
  {
    "id": "yuvraj-singh",
    "name": "Yuvraj Singh",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 12,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "KXIP",
    "era": "2000s-2010s",
    "achievements": [
      "2011 World Cup Player of the Tournament",
      "6 Sixes in an over off Stuart Broad (2007)",
      "2007 & 2011 WC Champion"
    ],
    "hint": "6 sixes in an over against England in 2007, Player of the Tournament in 2011 World Cup."
  },
  {
    "id": "gautam-gambhir",
    "name": "Gautam Gambhir",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 5,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "KKR",
    "era": "2000s-2010s",
    "achievements": [
      "Top-scorer in 2007 T20 WC Final (75)",
      "Top-scorer in 2011 ODI WC Final (97)",
      "Current India Head Coach"
    ],
    "hint": "Top-scored in both 2007 T20 and 2011 ODI World Cup finals, 2x IPL winning captain."
  },
  {
    "id": "harbhajan-singh",
    "name": "Harbhajan Singh",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break (Doosra)",
    "jerseyNumber": 27,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "1990s-2010s",
    "achievements": [
      "First Indian Test Hat-trick (2001 vs Australia)",
      "417 Test Wickets",
      "2007 & 2011 World Cup Winner"
    ],
    "hint": "Turbanator, took hat-trick at Eden Gardens in famous 2001 series, doosra pioneer."
  },
  {
    "id": "zaheer-khan",
    "name": "Zaheer Khan",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Left-arm fast-medium",
    "jerseyNumber": 34,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "2000s-2010s",
    "achievements": [
      "Joint Leading Wicket-taker in 2011 World Cup (21 wickets)",
      "Knuckle ball innovator",
      "Zak"
    ],
    "hint": "Zak, India’s greatest left-arm pacer, master of reverse swing and knuckle ball."
  },
  {
    "id": "ashish-nehra",
    "name": "Ashish Nehra",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Left-arm medium-fast",
    "jerseyNumber": 64,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "1990s-2010s",
    "achievements": [
      "6/23 vs England in 2003 World Cup",
      "2011 World Cup Winner",
      "GT Winning Coach (2022)"
    ],
    "hint": "Took 6/23 in Durban in 2003 World Cup, beloved coconut water & paper-notes coach."
  },
  {
    "id": "irfan-pathan",
    "name": "Irfan Pathan",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Left-arm medium-fast",
    "jerseyNumber": 78,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "KXIP",
    "era": "2000s-2010s",
    "achievements": [
      "First-over Test Hat-trick vs Pakistan (Karachi 2006)",
      "Player of the Match in 2007 T20 World Cup Final"
    ],
    "hint": "Hat-trick in the very first over of a Test match in Karachi, swing prince."
  },
  {
    "id": "suresh-raina",
    "name": "Suresh Raina",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 48,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "2000s-2010s",
    "achievements": [
      "First Indian to score centuries in all three formats",
      "2011 World Cup Winner",
      "Mr. IPL"
    ],
    "hint": "\"Mr. IPL\", electric fielder at cover/point, scored centuries in Tests, ODIs, and T20Is."
  },
  {
    "id": "shikhar-dhawan",
    "name": "Shikhar Dhawan",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 42,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "PBKS",
    "era": "2010s-2020s",
    "achievements": [
      "Fastest Test Century on Debut (85 balls)",
      "Golden Bat in 2013 & 2017 Champions Trophy",
      "Gabbar"
    ],
    "hint": "Gabbar, thigh-five celebration, dominant run-scorer in ICC tournaments."
  },
  {
    "id": "ajinkya-rahane",
    "name": "Ajinkya Rahane",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 27,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "CSK",
    "era": "2010s-2020s",
    "achievements": [
      "Captained India to historic 2020-21 Border-Gavaskar Trophy win",
      "Melbourne Century (112)"
    ],
    "hint": "Calm leader who captained India to 2-1 series victory in Australia after 36 all out."
  },
  {
    "id": "cheteshwar-pujara",
    "name": "Cheteshwar Pujara",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 26,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "CSK",
    "era": "2010s-2020s",
    "achievements": [
      "Player of Series in 2018-19 Australia Tour (521 runs)",
      "7,000+ Test Runs",
      "Marathon Batter"
    ],
    "hint": "Modern Test rock who absorbed countless blows to wear down Australian bowlers in 2018 and 2021."
  },
  {
    "id": "dinesh-karthik",
    "name": "Dinesh Karthik",
    "country": "India",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 21,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "RCB",
    "era": "2000s-2020s",
    "achievements": [
      "Nidahas Trophy Final Last-ball Six (2018)",
      "2007 T20 World Cup Champion",
      "RCB Finisher"
    ],
    "hint": "DK, last-ball six against Bangladesh to clinch the 2018 Nidahas Trophy, debuted in 2004."
  },
  {
    "id": "robin-uthappa",
    "name": "Robin Uthappa",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 77,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "2000s-2010s",
    "achievements": [
      "2007 T20 World Cup Bowl-out Hit",
      "IPL 2014 Orange Cap Winner",
      "The Walking Assassin"
    ],
    "hint": "Hit the stumps in the historic 2007 T20 WC bowl-out against Pakistan and tipped his hat."
  },
  {
    "id": "munaf-patel",
    "name": "Munaf Patel",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 13,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "2000s-2010s",
    "achievements": [
      "2011 World Cup Unsung Hero (11 wickets)",
      "Laser-accurate line and length"
    ],
    "hint": "Ikhar Express, unsung hero of the 2011 World Cup campaign with relentless stump-to-stump accuracy."
  },
  {
    "id": "ravi-shastri",
    "name": "Ravi Shastri",
    "country": "India",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 8,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1980s-1990s",
    "achievements": [
      "1985 World Championship of Cricket Champion of Champions",
      "6 Sixes in an over (Ranji)",
      "Head Coach"
    ],
    "hint": "Won Audi car in 1985 World Championship, former head coach famous for \"Tracer Bullet\"."
  },
  {
    "id": "dilip-vengsarkar",
    "name": "Dilip Vengsarkar",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 6,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1970s-1980s",
    "achievements": [
      "Three consecutive Test centuries at Lord’s",
      "1983 World Cup Winner",
      "Colonel"
    ],
    "hint": "Known as \"Colonel\", unique record of scoring centuries in three consecutive Tests at Lord’s."
  },
  {
    "id": "gundappa-viswanath",
    "name": "Gundappa Viswanath",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 11,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1970s-1980s",
    "achievements": [
      "India never lost a Test when he scored a century",
      "Square cut master",
      "Gentleman of the Game"
    ],
    "hint": "Vishy, artist with the square cut, remarkable record that India never lost when he hit a century."
  },
  {
    "id": "bishan-singh-bedi",
    "name": "Bishan Singh Bedi",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 1,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1960s-1970s",
    "achievements": [
      "266 Test Wickets",
      "Poetic Left-arm spin action",
      "Indian Spin Quartet Leader"
    ],
    "hint": "Leader of India’s famous spin quartet, celebrated for the most beautiful, flowing bowling action in history."
  },
  {
    "id": "syed-kirmani",
    "name": "Syed Kirmani",
    "country": "India",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 1,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1970s-1980s",
    "achievements": [
      "Best Wicketkeeper in 1983 World Cup",
      "Partnered Kapil Dev in 126-run 9th wicket stand at Tunbridge"
    ],
    "hint": "India’s premier gloveman behind the stumps in the 1983 World Cup triumph."
  },
  {
    "id": "javagal-srinath",
    "name": "Javagal Srinath",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 13,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1990s-2000s",
    "achievements": [
      "236 Test Wickets",
      "315 ODI Wickets",
      "Spearhead of Indian pace in the 1990s",
      "ICC Match Referee"
    ],
    "hint": "Mysore Express, India’s primary express fast bowler throughout the 1990s."
  },
  {
    "id": "venkatesh-prasad",
    "name": "Venkatesh Prasad",
    "country": "India",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 25,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1990s-2000s",
    "achievements": [
      "1996 World Cup Send-off to Aamir Sohail",
      "96 Test Wickets",
      "Leg-cutter Master"
    ],
    "hint": "Famous 1996 World Cup quarter-final moment cleaning up Aamir Sohail after being taunted."
  },
  {
    "id": "mohammad-azharuddin",
    "name": "Mohammad Azharuddin",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 10,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1980s-1990s",
    "achievements": [
      "Three centuries in first three Tests",
      "Hyderabad Wristwork Icon",
      "Long-standing Indian Captain"
    ],
    "hint": "Collar-up style, unique feat of centuries in his first three Test matches with wristy magic."
  },
  {
    "id": "ajay-jadeja",
    "name": "Ajay Jadeja",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 7,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1990s",
    "achievements": [
      "45 off 25 balls vs Waqar Younis in 1996 World Cup quarter-final",
      "Electric Fielder"
    ],
    "hint": "Hammered Waqar Younis in Bangalore during the 1996 World Cup quarter-final."
  },
  {
    "id": "navjot-singh-sidhu",
    "name": "Navjot Singh Sidhu",
    "country": "India",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 12,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1980s-1990s",
    "achievements": [
      "Sixer Sidhu",
      "Four consecutive ODI fifties in 1987 World Cup",
      "Renowned Orator"
    ],
    "hint": "\"Sixer Sidhu\", step-out lofted drive master against spin bowling."
  },
  {
    "id": "ricky-ponting",
    "name": "Ricky Ponting",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 14,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "1990s-2010s",
    "achievements": [
      "2x World Cup Winning Captain (2003, 2007)",
      "13,378 Test Runs",
      "140* in 2003 World Cup Final",
      "Punter"
    ],
    "hint": "Punter, Australia’s greatest captain with pull shot mastery, 140* vs India in 2003 final."
  },
  {
    "id": "shane-warne",
    "name": "Shane Warne",
    "country": "Australia",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 23,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "RR",
    "era": "1990s-2000s",
    "achievements": [
      "708 Test Wickets",
      "Ball of the Century to Mike Gatting (1993)",
      "IPL Inaugural Winning Captain (RR 2008)"
    ],
    "hint": "The King of Spin, bowled the Ball of the Century, captained RR to the first IPL trophy."
  },
  {
    "id": "glenn-mcgrath",
    "name": "Glenn McGrath",
    "country": "Australia",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 11,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "DD",
    "era": "1990s-2000s",
    "achievements": [
      "563 Test Wickets",
      "3x World Cup Champion (1999, 2003, 2007)",
      "Pigeon"
    ],
    "hint": "Pigeon, metronomic accuracy on off-stump channel, leading wicket-taker in World Cup history."
  },
  {
    "id": "adam-gilchrist",
    "name": "Adam Gilchrist",
    "country": "Australia",
    "role": "Wicketkeeper",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 17,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "1990s-2000s",
    "achievements": [
      "149 with squash ball in glove (2007 WC Final)",
      "3x World Cup Champion",
      "Revolutionized Wicketkeeping"
    ],
    "hint": "Gilly, walking gentleman, 149 in 2007 WC final with a squash ball in his glove."
  },
  {
    "id": "steve-waugh",
    "name": "Steve Waugh",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 5,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1980s-2000s",
    "achievements": [
      "1999 World Cup Winning Captain",
      "16 consecutive Test match wins record",
      "Tugga"
    ],
    "hint": "Tugga, mentally tough leader who told Gibbs \"You just dropped the World Cup\"."
  },
  {
    "id": "matthew-hayden",
    "name": "Matthew Hayden",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 28,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "1990s-2000s",
    "achievements": [
      "380 Test score vs Zimbabwe",
      "2x World Cup Winner",
      "Mongoose Bat User"
    ],
    "hint": "Imposing Queensland opener who scored 380 in a Test, wielded the Mongoose bat for CSK."
  },
  {
    "id": "brett-lee",
    "name": "Brett Lee",
    "country": "Australia",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 58,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "KKR",
    "era": "1990s-2010s",
    "achievements": [
      "161.1 km/h Thunderbolts",
      "310 Test Wickets",
      "380 ODI Wickets",
      "Chainsaw Celebration",
      "Binga"
    ],
    "hint": "Binga, express bowler who touched 161 km/h, famous chainsaw celebration."
  },
  {
    "id": "michael-hussey",
    "name": "Michael Hussey",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 48,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "2000s-2010s",
    "achievements": [
      "Mr. Cricket",
      "2010 T20 World Cup semi-final vs Ajmal (24 off last over)",
      "CSK Legend"
    ],
    "hint": "Mr. Cricket, incredible cricket brain, blasted Saeed Ajmal to take Australia into the 2010 T20 final."
  },
  {
    "id": "michael-clarke",
    "name": "Michael Clarke",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 23,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "PWI",
    "era": "2000s-2010s",
    "achievements": [
      "2015 World Cup Winning Captain",
      "329* at SCG vs India",
      "Pup"
    ],
    "hint": "Pup, captained Australia to 2015 World Cup triumph, scored 329* against India at Sydney."
  },
  {
    "id": "steve-smith",
    "name": "Steve Smith",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 49,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RR",
    "era": "2010s-2020s",
    "achievements": [
      "32 Test Centuries",
      "2019 Ashes Hero (774 runs)",
      "2015 & 2023 World Cup Winner"
    ],
    "hint": "Unorthodox fidgety stance, Bradman-esque Test average, 2x ODI World Cup champion."
  },
  {
    "id": "david-warner",
    "name": "David Warner",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 31,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "SRH",
    "era": "2010s-2020s",
    "achievements": [
      "2016 IPL Winning Captain (SRH)",
      "2021 T20 World Cup Player of Tournament",
      "335* vs Pakistan",
      "Bull"
    ],
    "hint": "Bull, explosive opener, led SRH to 2016 title, famous jump and punch celebration."
  },
  {
    "id": "pat-cummins",
    "name": "Pat Cummins",
    "country": "Australia",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 30,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "SRH",
    "era": "2010s-2020s",
    "achievements": [
      "2023 World Cup Winning Captain",
      "2023 WTC Champion Captain",
      "ICC Men’s Cricketer of the Year (2023)"
    ],
    "hint": "Silenced the 130,000 crowd at Ahmedabad in 2023 World Cup final, SRH captain."
  },
  {
    "id": "mitchell-starc",
    "name": "Mitchell Starc",
    "country": "Australia",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Left-arm fast",
    "jerseyNumber": 56,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "KKR",
    "era": "2010s-2020s",
    "achievements": [
      "2015 World Cup Player of Tournament",
      "2023 World Cup Winner",
      "160.4 km/h Inswinging Yorker"
    ],
    "hint": "Deadly left-arm thunderbolts, player of tournament in 2015 World Cup, KKR title hero in 2024."
  },
  {
    "id": "josh-hazlewood",
    "name": "Josh Hazlewood",
    "country": "Australia",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 38,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RCB",
    "era": "2010s-2020s",
    "achievements": [
      "2021 T20 World Cup Champion",
      "2023 ODI World Cup Champion",
      "Glenn McGrath Clone"
    ],
    "hint": "Bendigod, successor to McGrath with relentless nagging length on fourth stump."
  },
  {
    "id": "glenn-maxwell",
    "name": "Glenn Maxwell",
    "country": "Australia",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 32,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RCB",
    "era": "2010s-2020s",
    "achievements": [
      "201* vs Afghanistan with cramps (2023 WC)",
      "Fastest World Cup Century (40 balls)",
      "Big Show"
    ],
    "hint": "The Big Show, hit 201* on one leg without moving feet against Afghanistan in 2023 World Cup."
  },
  {
    "id": "travis-head",
    "name": "Travis Head",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 62,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "SRH",
    "era": "2020s",
    "achievements": [
      "137 in 2023 World Cup Final",
      "Player of Match in WTC Final 2023",
      "SRH Powerplay Basher"
    ],
    "hint": "Player of the match in both 2023 WTC and ODI World Cup finals against India."
  },
  {
    "id": "mitchell-marsh",
    "name": "Mitchell Marsh",
    "country": "Australia",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 8,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "2010s-2020s",
    "achievements": [
      "2021 T20 World Cup Final Player of the Match",
      "Australia T20I Captain",
      "Bison"
    ],
    "hint": "Bison, powered Australia to their first T20 World Cup in 2021 with 77* in the final."
  },
  {
    "id": "marnus-labuschagne",
    "name": "Marnus Labuschagne",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 33,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "2020s",
    "achievements": [
      "First concussion substitute in Test cricket",
      "2023 World Cup Final match-sealing 58*",
      "Runs Machine"
    ],
    "hint": "Became cricket’s first concussion substitute replacing Steve Smith at Lord’s in 2019."
  },
  {
    "id": "marcus-stoinis",
    "name": "Marcus Stoinis",
    "country": "Australia",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 17,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "LSG",
    "era": "2010s-2020s",
    "achievements": [
      "2021 T20 World Cup Champion",
      "124* vs CSK in IPL chase",
      "The Hulk"
    ],
    "hint": "The Hulk, muscled 146* in Auckland and struck century chasing against CSK at Chepauk."
  },
  {
    "id": "nathan-lyon",
    "name": "Nathan Lyon",
    "country": "Australia",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 67,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2010s-2020s",
    "achievements": [
      "530+ Test Wickets",
      "Gazza",
      "Former Adelaide Oval Groundsman"
    ],
    "hint": "Gazza, former pitch curator at Adelaide Oval who became Australia’s greatest off-spinner."
  },
  {
    "id": "allan-border",
    "name": "Allan Border",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 1,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1970s-1990s",
    "achievements": [
      "1987 World Cup Winning Captain",
      "11,174 Test Runs",
      "Rescued Australian Cricket",
      "AB"
    ],
    "hint": "Original AB, gritty captain who led Australia to their first-ever World Cup victory in India in 1987."
  },
  {
    "id": "shane-watson",
    "name": "Shane Watson",
    "country": "Australia",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 33,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "2000s-2010s",
    "achievements": [
      "2x IPL MVP (2008, 2013)",
      "2018 IPL Final Century for CSK (117*)",
      "2x World Cup Winner (2007, 2015)"
    ],
    "hint": "Watto, bludgeoned century on one bleeding knee in 2019 IPL final, 2x IPL MVP."
  },
  {
    "id": "aaron-finch",
    "name": "Aaron Finch",
    "country": "Australia",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 5,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "KKR",
    "era": "2010s-2020s",
    "achievements": [
      "2021 T20 World Cup Winning Captain",
      "Highest T20I Score (172 vs Zimbabwe)",
      "2015 World Cup Winner"
    ],
    "hint": "Captained Australia to their maiden T20 World Cup title in 2021, scored record 172 in a T20I."
  },
  {
    "id": "cameron-green",
    "name": "Cameron Green",
    "country": "Australia",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 42,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RCB",
    "era": "2020s",
    "achievements": [
      "2023 WTC & World Cup Champion",
      "174* vs New Zealand in Test",
      "6-foot-6 All-round Giant"
    ],
    "hint": "Towering all-rounder who bowls 140 km/h and scored a blistering 47-ball century for MI."
  },
  {
    "id": "alex-carey",
    "name": "Alex Carey",
    "country": "Australia",
    "role": "Wicketkeeper",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 4,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "2010s-2020s",
    "achievements": [
      "2023 World Cup & WTC Champion",
      "Ashes 2023 Bairstow Stumping Mastermind"
    ],
    "hint": "South Australian gloveman who effected the famous 2023 Lord’s Ashes stumping of Bairstow."
  },
  {
    "id": "mitchell-johnson",
    "name": "Mitchell Johnson",
    "country": "Australia",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Left-arm fast",
    "jerseyNumber": 25,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "2000s-2010s",
    "achievements": [
      "37 Wickets in 2013-14 Ashes",
      "ICC Cricketer of the Year (2014)",
      "2015 World Cup Champion"
    ],
    "hint": "Handlebar moustache, terrified English batters with lethal bouncers in the 2013-14 Ashes."
  },
  {
    "id": "brad-haddin",
    "name": "Brad Haddin",
    "country": "Australia",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "None",
    "jerseyNumber": 57,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "KKR",
    "era": "2000s-2010s",
    "achievements": [
      "2015 World Cup Winner",
      "493 runs in 2013-14 Ashes",
      "Aggressive Counter-puncher"
    ],
    "hint": "Gutsy wicketkeeper who rescued Australia repeatedly in the 2013-14 whitewash Ashes."
  },
  {
    "id": "brian-lara",
    "name": "Brian Lara",
    "country": "West Indies",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 9,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1990s-2000s",
    "achievements": [
      "Highest Individual Test Score (400*)",
      "Highest First-Class Score (501*)",
      "Prince of Trinidad"
    ],
    "hint": "Prince of Trinidad, holds the world record for the highest individual Test score of 400 not out."
  },
  {
    "id": "chris-gayle",
    "name": "Chris Gayle",
    "country": "West Indies",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 333,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "RCB",
    "era": "2000s-2020s",
    "achievements": [
      "Highest T20 Score (175* off 66 balls)",
      "2x T20 World Cup Winner (2012, 2016)",
      "Universe Boss"
    ],
    "hint": "Universe Boss, jersey #333, struck 175* for RCB in IPL 2013, 2x T20 World Cup winner."
  },
  {
    "id": "viv-richards",
    "name": "Viv Richards",
    "country": "West Indies",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 21,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1970s-1980s",
    "achievements": [
      "2x World Cup Winner (1975, 1979)",
      "Chewing gum swagger without helmet",
      "56-ball Test century record"
    ],
    "hint": "Original swagger master who dominated fast bowlers without ever wearing a helmet."
  },
  {
    "id": "clive-lloyd",
    "name": "Clive Lloyd",
    "country": "West Indies",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 7,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1960s-1980s",
    "achievements": [
      "2x World Cup Winning Captain (1975, 1979)",
      "Century in 1975 World Cup Final",
      "Big C"
    ],
    "hint": "Captain of the legendary West Indies team that won the first two World Cups in 1975 and 1979."
  },
  {
    "id": "malcolm-marshall",
    "name": "Malcolm Marshall",
    "country": "West Indies",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 1,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1970s-1990s",
    "achievements": [
      "376 Test Wickets at average of 20.94",
      "Batted and took 7 wickets with a broken hand"
    ],
    "hint": "Widely considered the most complete fast bowler in history, deadly skiddy bouncer."
  },
  {
    "id": "curtly-ambrose",
    "name": "Curtly Ambrose",
    "country": "West Indies",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 2,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1980s-2000s",
    "achievements": [
      "405 Test Wickets",
      "Spell of 7 wickets for 1 run vs Australia (1993)",
      "6-foot-7 Giant"
    ],
    "hint": "Gentle giant who spoke through wickets, took an unthinkable 7 wickets for 1 run at Perth."
  },
  {
    "id": "courtney-walsh",
    "name": "Courtney Walsh",
    "country": "West Indies",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 3,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1980s-2000s",
    "achievements": [
      "First bowler to 500 Test wickets (519 total)",
      "Legendary opening partner with Ambrose"
    ],
    "hint": "First bowler in cricket history to reach 500 Test wickets, never-ending stamina."
  },
  {
    "id": "kieron-pollard",
    "name": "Kieron Pollard",
    "country": "West Indies",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 55,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "2000s-2020s",
    "achievements": [
      "5x IPL Champion with MI",
      "6 Sixes in an over vs Sri Lanka",
      "600+ T20 matches played",
      "Polly"
    ],
    "hint": "Polly, Mumbai Indians powerhouse, hit 6 sixes in an over off Akila Dananjaya."
  },
  {
    "id": "andre-russell",
    "name": "Andre Russell",
    "country": "West Indies",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 12,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "KKR",
    "era": "2010s-2020s",
    "achievements": [
      "2x T20 World Cup Champion (2012, 2016)",
      "IPL MVP (2015, 2019)",
      "Dre Russ"
    ],
    "hint": "Dre Russ, explosive power hitter with 175+ career T20 strike rate, KKR stalwart."
  },
  {
    "id": "dwayne-bravo",
    "name": "Dwayne Bravo",
    "country": "West Indies",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 47,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "2000s-2020s",
    "achievements": [
      "Champion Dance",
      "2x T20 World Cup Winner",
      "2x IPL Purple Cap Winner",
      "DJ Bravo"
    ],
    "hint": "DJ Bravo, slower-ball dipping yorker king, famous \"Champion\" song and celebration."
  },
  {
    "id": "sunil-narine",
    "name": "Sunil Narine",
    "country": "West Indies",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 74,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "KKR",
    "era": "2010s-2020s",
    "achievements": [
      "3x IPL MVP (2012, 2018, 2024)",
      "2012 T20 World Cup Winner",
      "Mystery Spinner"
    ],
    "hint": "Mystery spinner who turned pinch-hitting opener, 3x IPL MVP with Kolkata Knight Riders."
  },
  {
    "id": "nicholas-pooran",
    "name": "Nicholas Pooran",
    "country": "West Indies",
    "role": "Wicketkeeper",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 29,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "LSG",
    "era": "2010s-2020s",
    "achievements": [
      "Most T20 sixes in a calendar year",
      "Explosive left-handed middle order bat",
      "LSG Finisher"
    ],
    "hint": "Trinidadian power-hitter with silky bat swing, hit 36 runs in an over in T20 WC 2024."
  },
  {
    "id": "shimron-hetmyer",
    "name": "Shimron Hetmyer",
    "country": "West Indies",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 188,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "RR",
    "era": "2010s-2020s",
    "achievements": [
      "Under-19 World Cup Winning Captain (2016)",
      "Death-overs Finisher for RR"
    ],
    "hint": "Guyanese left-hander who dyes his hair pink, clutch death-overs finisher for Rajasthan Royals."
  },
  {
    "id": "jason-holder",
    "name": "Jason Holder",
    "country": "West Indies",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 98,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "RR",
    "era": "2010s-2020s",
    "achievements": [
      "202* vs England in Kensington Oval Test",
      "4 wickets in 4 balls vs England T20I"
    ],
    "hint": "Towering Barbadian all-rounder, former West Indies Test captain."
  },
  {
    "id": "shai-hope",
    "name": "Shai Hope",
    "country": "West Indies",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Left-arm medium",
    "jerseyNumber": 4,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "DC",
    "era": "2010s-2020s",
    "achievements": [
      "Twin centuries in Headingley Test victory (2017)",
      "50+ ODI batting average"
    ],
    "hint": "Classical Barbadian keeper-batter who scored two centuries in the same Test at Headingley."
  },
  {
    "id": "alzarri-joseph",
    "name": "Alzarri Joseph",
    "country": "West Indies",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 8,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "2010s-2020s",
    "achievements": [
      "Best Bowling Figures in IPL History (6/12 on debut for MI)",
      "Antigua Express"
    ],
    "hint": "Antiguan fast bowler who took 6/12 on his IPL debut, the best bowling figures in tournament history."
  },
  {
    "id": "shivnarine-chanderpaul",
    "name": "Shivnarine Chanderpaul",
    "country": "West Indies",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 6,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "1990s-2010s",
    "achievements": [
      "11,867 Test Runs",
      "Crab-like front-on batting stance",
      "Black eye stickers beneath eyes"
    ],
    "hint": "Famous front-on crab stance, wore dark stickers beneath his eyes to cut glare."
  },
  {
    "id": "darren-sammy",
    "name": "Darren Sammy",
    "country": "West Indies",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium-fast",
    "jerseyNumber": 88,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "SRH",
    "era": "2000s-2010s",
    "achievements": [
      "Only captain to win 2 T20 World Cups (2012, 2016)",
      "St Lucia Stadium Named After Him"
    ],
    "hint": "Inspirational leader, only captain in history to win two men’s ICC T20 World Cups."
  },
  {
    "id": "marlon-samuels",
    "name": "Marlon Samuels",
    "country": "West Indies",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 7,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "2000s-2010s",
    "achievements": [
      "Player of the Match in BOTH 2012 and 2016 T20 World Cup Finals (78 and 85*)"
    ],
    "hint": "Won Player of the Match in both the 2012 and 2016 T20 World Cup finals."
  },
  {
    "id": "ab-de-villiers",
    "name": "AB de Villiers",
    "country": "South Africa",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 17,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "2000s-2020s",
    "achievements": [
      "Fastest ODI Century in History (31 balls)",
      "Mr. 360",
      "RCB Hall of Fame",
      "Superhuman Athleticism"
    ],
    "hint": "Mr. 360, fastest ODI hundred off 31 balls vs West Indies, legendary partnership with Kohli."
  },
  {
    "id": "jacques-kallis",
    "name": "Jacques Kallis",
    "country": "South Africa",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 3,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "1990s-2010s",
    "achievements": [
      "13,289 Test Runs & 292 Test Wickets",
      "45 Test Centuries",
      "Greatest All-rounder of Modern Era"
    ],
    "hint": "Greatest cricketer of the modern era with 13,000+ Test runs and nearly 300 wickets."
  },
  {
    "id": "dale-steyn",
    "name": "Dale Steyn",
    "country": "South Africa",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 8,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2000s-2020s",
    "achievements": [
      "439 Test Wickets at strike rate of 42.3",
      "World #1 Test bowler for 2,343 days",
      "Steyn Gun"
    ],
    "hint": "Steyn Gun, veiny neck celebration, lethal 150 km/h outswinger."
  },
  {
    "id": "shaun-pollock",
    "name": "Shaun Pollock",
    "country": "South Africa",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 7,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "MI",
    "era": "1990s-2000s",
    "achievements": [
      "421 Test Wickets",
      "393 ODI Wickets",
      "South Africa Captain",
      "Polly"
    ],
    "hint": "Red-headed bowling all-rounder with spotless discipline, first MI captain in 2008."
  },
  {
    "id": "allan-donald",
    "name": "Allan Donald",
    "country": "South Africa",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 11,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "1990s-2000s",
    "achievements": [
      "White Lightning",
      "330 Test Wickets",
      "War paint zinc cream on face"
    ],
    "hint": "White Lightning, wore white zinc war paint, spearheaded South Africa’s post-apartheid return."
  },
  {
    "id": "graeme-smith",
    "name": "Graeme Smith",
    "country": "South Africa",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 15,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "RR",
    "era": "2000s-2010s",
    "achievements": [
      "Most Test wins as captain (53 wins)",
      "Batted with broken finger at SCG",
      "Biff"
    ],
    "hint": "Biff, captained South Africa at age 22, walked out to bat with a fractured hand against Mitchell Johnson."
  },
  {
    "id": "hashim-amla",
    "name": "Hashim Amla",
    "country": "South Africa",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 1,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "KXIP",
    "era": "2000s-2010s",
    "achievements": [
      "Fastest to 2000, 3000, 4000, 5000, 6000, 7000 ODI runs",
      "311* at The Oval",
      "Mighty Hash"
    ],
    "hint": "Mighty Hash, serene wristy batting, first South African to score a Test triple-century."
  },
  {
    "id": "faf-du-plessis",
    "name": "Faf du Plessis",
    "country": "South Africa",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 13,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "2010s-2020s",
    "achievements": [
      "Century on Test debut to save Adelaide Test (2012)",
      "RCB Captain",
      "CSK 4x Trophy Winner"
    ],
    "hint": "Batted for nearly 8 hours on debut to save Adelaide Test, RCB leader, super fit."
  },
  {
    "id": "kagiso-rabada",
    "name": "Kagiso Rabada",
    "country": "South Africa",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 25,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "PBKS",
    "era": "2010s-2020s",
    "achievements": [
      "Fastest to 200 Test wickets in terms of balls bowled",
      "IPL Purple Cap (2020)",
      "KG"
    ],
    "hint": "KG, lightning fast bowler who took 6 wickets on ODI debut including a hat-trick against Bangladesh."
  },
  {
    "id": "quinton-de-kock",
    "name": "Quinton de Kock",
    "country": "South Africa",
    "role": "Wicketkeeper",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 12,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "LSG",
    "era": "2010s-2020s",
    "achievements": [
      "4 Centuries in 2023 ODI World Cup",
      "Quinny",
      "2x IPL Champion with MI"
    ],
    "hint": "Quinny, baby-faced left-handed wicketkeeper who blasted 4 centuries in 2023 World Cup."
  },
  {
    "id": "david-miller",
    "name": "David Miller",
    "country": "South Africa",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 10,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "GT",
    "era": "2010s-2020s",
    "achievements": [
      "Miller the Killer",
      "38-ball IPL century for KXIP vs RCB",
      "GT 2022 Champion"
    ],
    "hint": "\"If it’s in the V, it’s in the tree; if it’s in the arc, it’s out of the park\" - Killer Miller."
  },
  {
    "id": "anrich-nortje",
    "name": "Anrich Nortje",
    "country": "South Africa",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 2,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "DC",
    "era": "2020s",
    "achievements": [
      "156.2 km/h Delivery in IPL",
      "2024 T20 World Cup Finalist"
    ],
    "hint": "South African speed demon who broke IPL speed gun records hitting 156+ km/h."
  },
  {
    "id": "keshav-maharaj",
    "name": "Keshav Maharaj",
    "country": "South Africa",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 16,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "RR",
    "era": "2010s-2020s",
    "achievements": [
      "Test Hat-trick vs West Indies",
      "World #1 ODI Bowler Ranking (2023)",
      "Ram Siya Ram song intro"
    ],
    "hint": "Orthodox left-arm spinner whose entry is marked by \"Ram Siya Ram\" stadium song."
  },
  {
    "id": "heinrich-klaasen",
    "name": "Heinrich Klaasen",
    "country": "South Africa",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 45,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2020s",
    "achievements": [
      "174 off 83 balls vs Australia in ODIs",
      "Premier Spin Destroyer in World Cricket",
      "SRH Powerhouse"
    ],
    "hint": "Regarded as the most devastating hitter of spin bowling in world cricket, 174 vs Australia."
  },
  {
    "id": "aiden-markram",
    "name": "Aiden Markram",
    "country": "South Africa",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 94,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2010s-2020s",
    "achievements": [
      "Fastest World Cup Century (49 balls vs SL 2023)",
      "South Africa 2024 T20 WC Final Captain"
    ],
    "hint": "Classy captain who led South Africa to their first men’s senior World Cup final in 2024."
  },
  {
    "id": "jonty-rhodes",
    "name": "Jonty Rhodes",
    "country": "South Africa",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 8,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "MI",
    "era": "1990s-2000s",
    "achievements": [
      "Iconic Superman run-out of Inzamam (1992 WC)",
      "Greatest Fielder in Cricket History"
    ],
    "hint": "Revolutionized cricket fielding, dived full-length like Superman to run out Inzamam in 1992."
  },
  {
    "id": "gary-kirsten",
    "name": "Gary Kirsten",
    "country": "South Africa",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 9,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "GT",
    "era": "1990s-2000s",
    "achievements": [
      "188* in 1996 World Cup (World Cup Record for 19 years)",
      "2011 World Cup Winning Coach for India"
    ],
    "hint": "Solid left-handed opener who coached India to their historic 2011 World Cup victory."
  },
  {
    "id": "lance-klusener",
    "name": "Lance Klusener",
    "country": "South Africa",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 1,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "MI",
    "era": "1990s-2000s",
    "achievements": [
      "1999 World Cup Player of the Tournament",
      "Zulu",
      "Baseball-style power-hitting with heavy bat"
    ],
    "hint": "Zulu, armed with a 3-pound bat, Player of the Tournament in the 1999 World Cup."
  },
  {
    "id": "mark-boucher",
    "name": "Mark Boucher",
    "country": "South Africa",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 9,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "1990s-2010s",
    "achievements": [
      "999 International Dismissals (World Record)",
      "Hit winning boundary in historic 438 game vs Australia"
    ],
    "hint": "Holds the all-time world record for most dismissals by a wicketkeeper (999), hit winning four in the 438 game."
  },
  {
    "id": "marco-jansen",
    "name": "Marco Jansen",
    "country": "South Africa",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Left-arm fast",
    "jerseyNumber": 70,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2020s",
    "achievements": [
      "6-foot-8 Left-arm Pacer & Power Hitter",
      "2024 T20 World Cup Finalist"
    ],
    "hint": "6-foot-8 giant left-arm pacer and hard-hitting all-rounder for South Africa and SRH."
  },
  {
    "id": "ben-stokes",
    "name": "Ben Stokes",
    "country": "England",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 55,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "2010s-2020s",
    "achievements": [
      "2019 World Cup Final Hero",
      "Headingley 2019 Miracle 135*",
      "2022 T20 World Cup Final Hero",
      "England Test Captain"
    ],
    "hint": "Ultimate clutch player, Headingley 2019 miracle 135*, hero of 2019 and 2022 World Cup finals."
  },
  {
    "id": "joe-root",
    "name": "Joe Root",
    "country": "England",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 66,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RR",
    "era": "2010s-2020s",
    "achievements": [
      "35+ Test Centuries (England Record)",
      "12,000+ Test Runs",
      "2019 World Cup Winner"
    ],
    "hint": "England’s all-time leading Test century maker, master of the reverse-ramp and sweep."
  },
  {
    "id": "james-anderson",
    "name": "James Anderson",
    "country": "England",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 9,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2000s-2020s",
    "achievements": [
      "704 Test Wickets (Most by any fast bowler in history)",
      "188 Test Matches Played",
      "Jimmy"
    ],
    "hint": "Jimmy, only fast bowler to take 700 Test wickets, master of English cloud and swing."
  },
  {
    "id": "stuart-broad",
    "name": "Stuart Broad",
    "country": "England",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 8,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "KXIP",
    "era": "2000s-2020s",
    "achievements": [
      "604 Test Wickets",
      "8/15 vs Australia at Trent Bridge (2015)",
      "Wicket on final ball of career"
    ],
    "hint": "Took 8/15 against Australia at Trent Bridge, took a wicket on the final ball of his career in 2023."
  },
  {
    "id": "kevin-pietersen",
    "name": "Kevin Pietersen",
    "country": "England",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 24,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "RCB",
    "era": "2000s-2010s",
    "achievements": [
      "2010 T20 World Cup Player of Tournament",
      "Switch-hit Inventor",
      "KP"
    ],
    "hint": "KP, pioneered the switch-hit shot, Player of the Tournament in England’s 2010 T20 World Cup win."
  },
  {
    "id": "alastair-cook",
    "name": "Alastair Cook",
    "country": "England",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm slow",
    "jerseyNumber": 26,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2000s-2010s",
    "achievements": [
      "12,472 Test Runs",
      "Captained England to series win in India (2012)",
      "Century in final Test innings"
    ],
    "hint": "Chef, marathon opening bat, led England to historic 2012 Test series win in India."
  },
  {
    "id": "ian-botham",
    "name": "Ian Botham",
    "country": "England",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 7,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1970s-1990s",
    "achievements": [
      "Botham’s Ashes (1981)",
      "5,200 Test runs & 383 wickets",
      "Beefy"
    ],
    "hint": "Beefy, transformed the 1981 Ashes from the brink of defeat with 149* at Headingley."
  },
  {
    "id": "andrew-flintoff",
    "name": "Andrew Flintoff",
    "country": "England",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 11,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "CSK",
    "era": "1990s-2000s",
    "achievements": [
      "2005 Ashes Hero",
      "Iconic Brett Lee Consolidation (Edgbaston 2005)",
      "Freddie"
    ],
    "hint": "Freddie, 2005 Ashes talisman, crouched down to console Brett Lee at Edgbaston."
  },
  {
    "id": "jos-buttler",
    "name": "Jos Buttler",
    "country": "England",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "None",
    "jerseyNumber": 63,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "RR",
    "era": "2010s-2020s",
    "achievements": [
      "2022 T20 World Cup Winning Captain",
      "IPL 2022 Orange Cap (863 runs with 4 centuries)",
      "2019 WC Run-out"
    ],
    "hint": "Broke the stumps in 2019 World Cup super over, captained England to 2022 T20 WC title, RR icon."
  },
  {
    "id": "jonny-bairstow",
    "name": "Jonny Bairstow",
    "country": "England",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 51,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "PBKS",
    "era": "2010s-2020s",
    "achievements": [
      "2019 World Cup Winner",
      "Bazball Spearhead (4 Test tons in 2022)",
      "YJB"
    ],
    "hint": "YJB, fiery red-head Yorkshire batter, smashed century off 45 balls in IPL 2024."
  },
  {
    "id": "jofra-archer",
    "name": "Jofra Archer",
    "country": "England",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 22,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "2010s-2020s",
    "achievements": [
      "Bowled the 2019 World Cup Super Over to win the title",
      "Effortless 150+ km/h action"
    ],
    "hint": "Bowled the dramatic Super Over in the 2019 World Cup final, effortless run-up with 150 km/h pace."
  },
  {
    "id": "harry-brook",
    "name": "Harry Brook",
    "country": "England",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 88,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "2020s",
    "achievements": [
      "317 vs Pakistan in Multan (2024)",
      "Fastest to 1,000 Test runs in terms of balls (1,058 balls)"
    ],
    "hint": "Bazball prodigy who blasted 317 in Multan and centuries across Pakistan and New Zealand."
  },
  {
    "id": "eoin-morgan",
    "name": "Eoin Morgan",
    "country": "England",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 16,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "KKR",
    "era": "2000s-2020s",
    "achievements": [
      "2019 World Cup Winning Captain",
      "17 Sixes in an ODI innings vs Afghanistan",
      "White-ball Revolution Leader"
    ],
    "hint": "Irish-born captain who revolutionized England’s white-ball mindset and lifted 2019 World Cup."
  },
  {
    "id": "chris-woakes",
    "name": "Chris Woakes",
    "country": "England",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 19,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "PBKS",
    "era": "2010s-2020s",
    "achievements": [
      "2019 ODI World Cup & 2022 T20 World Cup Champion",
      "Ashes 2023 Player of the Series"
    ],
    "hint": "Wizard with the Dukes ball in English conditions, key member of both 2019 and 2022 WC triumphs."
  },
  {
    "id": "kane-williamson",
    "name": "Kane Williamson",
    "country": "New Zealand",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 22,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "GT",
    "era": "2010s-2020s",
    "achievements": [
      "World Test Championship 2021 Winning Captain",
      "2019 World Cup Player of the Tournament",
      "Fab 4 Member"
    ],
    "hint": "Gentleman Kane, Fab Four member, captained NZ to 2021 World Test Championship title."
  },
  {
    "id": "brendon-mccullum",
    "name": "Brendon McCullum",
    "country": "New Zealand",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 42,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "2000s-2010s",
    "achievements": [
      "Fastest Test Century in History (54 balls)",
      "158* on very first night of IPL (2008)",
      "Baz"
    ],
    "hint": "Baz, lit up IPL on opening night with 158*, father of \"Bazball\" aggressive cricket."
  },
  {
    "id": "ross-taylor",
    "name": "Ross Taylor",
    "country": "New Zealand",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 3,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "2000s-2020s",
    "achievements": [
      "290 at Perth vs Australia",
      "Hit winning runs in 2021 WTC Final",
      "Tongue-out celebration"
    ],
    "hint": "Famous tongue-poking century celebration, hit winning runs in 2021 World Test Championship."
  },
  {
    "id": "martin-guptill",
    "name": "Martin Guptill",
    "country": "New Zealand",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 31,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2000s-2020s",
    "achievements": [
      "237* in 2015 World Cup quarter-final",
      "Run-out Dhoni in 2019 World Cup semi-final",
      "Two Toes"
    ],
    "hint": "Scored 237* in 2015 World Cup quarter-final, direct hit to run out MS Dhoni in 2019 semi-final."
  },
  {
    "id": "trent-boult",
    "name": "Trent Boult",
    "country": "New Zealand",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Left-arm fast-medium",
    "jerseyNumber": 18,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "RR",
    "era": "2010s-2020s",
    "achievements": [
      "First over wicket specialist",
      "WTC 2021 Champion",
      "Lightning Left-arm Inswing"
    ],
    "hint": "Boulty, lethal first-over inswinger, destroyed India’s top order in 2019 semi-final."
  },
  {
    "id": "tim-southee",
    "name": "Tim Southee",
    "country": "New Zealand",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast-medium",
    "jerseyNumber": 38,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "2000s-2020s",
    "achievements": [
      "380+ Test Wickets",
      "7/33 vs England (2015 WC)",
      "90+ Test Sixes as Batter"
    ],
    "hint": "Outswing expert, took 7/33 against England in 2015 World Cup, hit over 90 Test sixes."
  },
  {
    "id": "daniel-vettori",
    "name": "Daniel Vettori",
    "country": "New Zealand",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 11,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "1990s-2010s",
    "achievements": [
      "362 Test Wickets & 4,531 Test Runs",
      "Bespectacled Spin Wizard",
      "Long-time NZ Captain"
    ],
    "hint": "Bespectacled left-arm spinner, former NZ captain and RCB coach."
  },
  {
    "id": "richard-hadlee",
    "name": "Richard Hadlee",
    "country": "New Zealand",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 1,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1970s-1990s",
    "achievements": [
      "First bowler to 400 Test wickets (431 total)",
      "9/52 vs Australia at Gabba",
      "Knighted for services to cricket"
    ],
    "hint": "New Zealand’s greatest-ever cricketer, first man in history to capture 400 Test wickets."
  },
  {
    "id": "rachin-ravindra",
    "name": "Rachin Ravindra",
    "country": "New Zealand",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 8,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "CSK",
    "era": "2020s",
    "achievements": [
      "3 Centuries in 2023 ODI World Cup",
      "ICC Emerging Cricketer of the Year 2023",
      "CSK Opener"
    ],
    "hint": "Named after Rahul (Dravid) and Sachin (Tendulkar), scored 3 centuries in 2023 World Cup in India."
  },
  {
    "id": "devon-conway",
    "name": "Devon Conway",
    "country": "New Zealand",
    "role": "Wicketkeeper",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 88,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "CSK",
    "era": "2020s",
    "achievements": [
      "Double century on Test debut at Lord’s (200)",
      "CSK 2023 IPL Champion (Player of Match in Final)"
    ],
    "hint": "Scored 200 on Test debut at Lord’s, Player of the Match in CSK’s 2023 IPL final victory."
  },
  {
    "id": "glenn-phillips",
    "name": "Glenn Phillips",
    "country": "New Zealand",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 23,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2020s",
    "achievements": [
      "Superman Diving Catches",
      "Gold standard fielding",
      "Counter-attacking centuries"
    ],
    "hint": "Athletic livewire on the boundary, took multiple gravity-defying catches and bowled key spin overs."
  },
  {
    "id": "imran-khan",
    "name": "Imran Khan",
    "country": "Pakistan",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 6,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1970s-1990s",
    "achievements": [
      "1992 World Cup Winning Captain",
      "Cornered Tigers speech",
      "362 Test Wickets & 3,807 Runs"
    ],
    "hint": "Cornered Tigers captain who rallied Pakistan to 1992 World Cup glory at the MCG."
  },
  {
    "id": "wasim-akram",
    "name": "Wasim Akram",
    "country": "Pakistan",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Left-arm fast",
    "jerseyNumber": 3,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "KKR",
    "era": "1980s-2000s",
    "achievements": [
      "Sultan of Swing",
      "Back-to-back wickets in 1992 WC Final",
      "502 ODI Wickets",
      "414 Test Wickets"
    ],
    "hint": "Sultan of Swing, two unplayable balls in 1992 World Cup final to dismiss Botham and Lamb."
  },
  {
    "id": "waqar-younis",
    "name": "Waqar Younis",
    "country": "Pakistan",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 99,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1980s-2000s",
    "achievements": [
      "Toe-crushing Inswinging Yorker Master",
      "373 Test Wickets",
      "416 ODI Wickets",
      "Burewala Express"
    ],
    "hint": "Burewala Express, master of reverse-swinging toe-crushers alongside Wasim Akram."
  },
  {
    "id": "shoaib-akhtar",
    "name": "Shoaib Akhtar",
    "country": "Pakistan",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 14,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "1990s-2010s",
    "achievements": [
      "Fastest Ball in Cricket History (161.3 km/h vs England 2003)",
      "Rawalpindi Express"
    ],
    "hint": "Rawalpindi Express, officially bowled the fastest ball in cricket history at 161.3 km/h."
  },
  {
    "id": "javed-miandad",
    "name": "Javed Miandad",
    "country": "Pakistan",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 8,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1970s-1990s",
    "achievements": [
      "Last-ball Six at Sharjah vs Chetan Sharma (1986)",
      "1992 World Cup Winner",
      "Frog Jump at 1992 WC"
    ],
    "hint": "Last-ball six in Sharjah in 1986, mimicked Kiran More with frog-jumping in 1992 World Cup."
  },
  {
    "id": "inzamam-ul-haq",
    "name": "Inzamam-ul-Haq",
    "country": "Pakistan",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 8,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1990s-2000s",
    "achievements": [
      "1992 World Cup Semi-final hero (60 off 37)",
      "8,830 Test Runs",
      "Inzi"
    ],
    "hint": "Inzi, lazy elegance with unmatched pull shot, broke out in 1992 semi-final vs New Zealand."
  },
  {
    "id": "shahid-afridi",
    "name": "Shahid Afridi",
    "country": "Pakistan",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 10,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "1990s-2010s",
    "achievements": [
      "37-ball Century Record (stood for 17 years)",
      "2009 T20 World Cup Final Hero",
      "Boom Boom"
    ],
    "hint": "Boom Boom Afridi, 37-ball ODI century as a teenager, arms-spread star celebration."
  },
  {
    "id": "saeed-anwar",
    "name": "Saeed Anwar",
    "country": "Pakistan",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 23,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1980s-2000s",
    "achievements": [
      "194 vs India in Chennai (1997 World Record for 13 years)",
      "Silky Left-hand Flick"
    ],
    "hint": "Scored 194 in Chennai in 1997, which remained the highest ODI score for over a decade."
  },
  {
    "id": "younis-khan",
    "name": "Younis Khan",
    "country": "Pakistan",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 75,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "RR",
    "era": "2000s-2010s",
    "achievements": [
      "2009 T20 World Cup Winning Captain",
      "10,099 Test Runs (Pakistan Record)",
      "313 vs Sri Lanka"
    ],
    "hint": "Pakistan’s highest Test run-scorer with over 10,000 runs, led Pakistan to 2009 T20 World Cup win."
  },
  {
    "id": "babar-azam",
    "name": "Babar Azam",
    "country": "Pakistan",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 56,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2010s-2020s",
    "achievements": [
      "Cover drive aesthetics icon",
      "Fastest to 5,000 ODI runs",
      "Former #1 Ranked ODI Batter",
      "Bobby"
    ],
    "hint": "Bobby, world-renowned cover drive, captained Pakistan to 10-wicket victory over India in 2021 T20 WC."
  },
  {
    "id": "shaheen-afridi",
    "name": "Shaheen Afridi",
    "country": "Pakistan",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Left-arm fast",
    "jerseyNumber": 10,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2020s",
    "achievements": [
      "Opening spell vs India in 2021 T20 World Cup (Rohit, Rahul, Kohli)",
      "Eagle celebration"
    ],
    "hint": "Eagle, 6-foot-6 left-arm pacer who bowled iconic opening spell against India in 2021 T20 World Cup."
  },
  {
    "id": "mohammad-rizwan",
    "name": "Mohammad Rizwan",
    "country": "Pakistan",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 16,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2010s-2020s",
    "achievements": [
      "Record T20I runs in a calendar year (1,326 runs)",
      "Pakistan White-ball Captain"
    ],
    "hint": "Energetic wicketkeeper-batter, sweeps fast bowlers, 10-wicket opening stand with Babar in 2021."
  },
  {
    "id": "naseem-shah",
    "name": "Naseem Shah",
    "country": "Pakistan",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 71,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2020s",
    "achievements": [
      "Youngest bowler to take a Test hat-trick (age 16)",
      "Two consecutive sixes vs Afghanistan in Asia Cup"
    ],
    "hint": "Youngest ever Test hat-trick taker at age 16, hit two final-over sixes to stun Afghanistan."
  },
  {
    "id": "haris-rauf",
    "name": "Haris Rauf",
    "country": "Pakistan",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 150,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2020s",
    "achievements": [
      "150+ km/h Express Speed",
      "Tape ball to international star",
      "Slap-city celebration"
    ],
    "hint": "Tape-ball sensation who bowls 150 km/h rockets, hit by Kohli for famous straight six at MCG."
  },
  {
    "id": "shadab-khan",
    "name": "Shadab Khan",
    "country": "Pakistan",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 7,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "2010s-2020s",
    "achievements": [
      "2017 Champions Trophy Winner",
      "Aggressive leg-spinner & electric fielder"
    ],
    "hint": "Dynamic leg-spinning all-rounder and gun fielder, crucial spell in 2017 Champions Trophy final."
  },
  {
    "id": "saqlain-mushtaq",
    "name": "Saqlain Mushtaq",
    "country": "Pakistan",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 28,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "1990s-2000s",
    "achievements": [
      "Inventor of the Doosra",
      "Two World Cup Hat-tricks (1999)",
      "Fastest to 100, 150, 200, 250 ODI wickets"
    ],
    "hint": "The inventor of the \"Doosra\", dismissed Sachin Tendulkar in thrilling 1999 Chennai Test."
  },
  {
    "id": "misbah-ul-haq",
    "name": "Misbah-ul-Haq",
    "country": "Pakistan",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 22,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "2000s-2010s",
    "achievements": [
      "Fastest Test Century (56 balls)",
      "Tuk Tuk & Push-ups Celebration at Lord’s",
      "Long-standing Captain"
    ],
    "hint": "Did push-ups at Lord’s after scoring century, hit 56-ball Test century against Australia."
  },
  {
    "id": "kumar-sangakkara",
    "name": "Kumar Sangakkara",
    "country": "Sri Lanka",
    "role": "Wicketkeeper",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 11,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "KXIP",
    "era": "2000s-2010s",
    "achievements": [
      "Four consecutive centuries in 2015 World Cup",
      "12,400 Test Runs",
      "2014 T20 World Cup Champion",
      "Sanga"
    ],
    "hint": "Sanga, eloquent lawyer and cricket legend, four consecutive centuries in the 2015 World Cup."
  },
  {
    "id": "mahela-jayawardene",
    "name": "Mahela Jayawardene",
    "country": "Sri Lanka",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 27,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "1990s-2010s",
    "achievements": [
      "374 in 624-run stand with Sangakkara",
      "103* in 2011 World Cup Final",
      "2014 T20 World Cup Winner"
    ],
    "hint": "Century in 2011 World Cup final, shared world-record 624-run partnership with Sangakkara."
  },
  {
    "id": "muttiah-muralitharan",
    "name": "Muttiah Muralitharan",
    "country": "Sri Lanka",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break (Doosra)",
    "jerseyNumber": 8,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "CSK",
    "era": "1990s-2010s",
    "achievements": [
      "800 Test Wickets (World Record)",
      "534 ODI Wickets (World Record)",
      "1996 World Cup Champion",
      "Murali"
    ],
    "hint": "Murali, highest wicket-taker in cricket history with 800 Test wickets and 534 ODI wickets."
  },
  {
    "id": "sanath-jayasuriya",
    "name": "Sanath Jayasuriya",
    "country": "Sri Lanka",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 7,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "1980s-2010s",
    "achievements": [
      "1996 World Cup Player of Tournament",
      "Matara Hurricane",
      "Revolutionized pinch-hitting"
    ],
    "hint": "Matara Hurricane, revolutionized ODI powerplay batting in 1996 World Cup, left-arm spin all-rounder."
  },
  {
    "id": "lasith-malinga",
    "name": "Lasith Malinga",
    "country": "Sri Lanka",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast (Round-arm sling)",
    "jerseyNumber": 99,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "MI",
    "era": "2000s-2020s",
    "achievements": [
      "4 wickets in 4 balls TWICE in international cricket",
      "2014 T20 WC Winning Captain",
      "Slinga Malinga"
    ],
    "hint": "Slinga Malinga, round-arm sling yorkers, defended 1 run off last ball in 2019 IPL final for MI."
  },
  {
    "id": "chaminda-vaas",
    "name": "Chaminda Vaas",
    "country": "Sri Lanka",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Left-arm fast-medium",
    "jerseyNumber": 11,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "DC",
    "era": "1990s-2000s",
    "achievements": [
      "Best Bowling Figures in ODI History (8/19 vs Zimbabwe)",
      "Hat-trick with first 3 balls of match (2003 WC)"
    ],
    "hint": "Left-arm swing legend, took 8 for 19 (world record) and hat-trick off first three balls of a World Cup game."
  },
  {
    "id": "aravinda-de-silva",
    "name": "Aravinda de Silva",
    "country": "Sri Lanka",
    "role": "Batsman",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 9,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1980s-2000s",
    "achievements": [
      "1996 World Cup Final Player of the Match (Century + 3 wickets)",
      "Mad Max"
    ],
    "hint": "Player of the match in 1996 World Cup final with century and 3 wickets in Lahore."
  },
  {
    "id": "tillakaratne-dilshan",
    "name": "Tillakaratne Dilshan",
    "country": "Sri Lanka",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 23,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "RCB",
    "era": "1990s-2010s",
    "achievements": [
      "Inventor of the Dilscoop",
      "2014 T20 World Cup Champion",
      "2009 T20 WC Player of Tournament"
    ],
    "hint": "Invented the famous \"Dilscoop\" ramp shot over the wicketkeeper’s head."
  },
  {
    "id": "angelo-mathews",
    "name": "Angelo Mathews",
    "country": "Sri Lanka",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 69,
    "isActive": true,
    "worldCupWinner": true,
    "iplTeam": "KKR",
    "era": "2000s-2020s",
    "achievements": [
      "2014 T20 World Cup Champion",
      "First player \"timed out\" in international cricket history (2023)"
    ],
    "hint": "Sri Lankan all-rounder involved in historic \"timed out\" dismissal against Bangladesh in 2023."
  },
  {
    "id": "wanindu-hasaranga",
    "name": "Wanindu Hasaranga",
    "country": "Sri Lanka",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break / googly",
    "jerseyNumber": 49,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "RCB",
    "era": "2020s",
    "achievements": [
      "Leading wicket-taker in 2021 & 2022 T20 World Cups",
      "T20 World Cup Hat-trick",
      "Neymar celebration"
    ],
    "hint": "Leading wicket-taker in two consecutive T20 World Cups, deceptive googly and phone celebration."
  },
  {
    "id": "matheesha-pathirana",
    "name": "Matheesha Pathirana",
    "country": "Sri Lanka",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm fast (Sling)",
    "jerseyNumber": 99,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "CSK",
    "era": "2020s",
    "achievements": [
      "Baby Malinga",
      "CSK 2023 IPL Champion Death Overs Hero",
      "150+ km/h Slingers"
    ],
    "hint": "\"Baby Malinga\", slinging yorkers at 150 km/h, mentored by MS Dhoni at CSK."
  },
  {
    "id": "kusal-mendis",
    "name": "Kusal Mendis",
    "country": "Sri Lanka",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break",
    "jerseyNumber": 13,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2010s-2020s",
    "achievements": [
      "176 against Australia at Kandy (2016)",
      "122 off 77 vs Pakistan (2023 WC)"
    ],
    "hint": "Sri Lanka’s counter-attacking wicketkeeper-batter, explosive striker against pace."
  },
  {
    "id": "rangana-herath",
    "name": "Rangana Herath",
    "country": "Sri Lanka",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 14,
    "isActive": false,
    "worldCupWinner": true,
    "iplTeam": "None",
    "era": "1990s-2010s",
    "achievements": [
      "433 Test Wickets (Most by left-arm spinner in history)",
      "5/3 vs New Zealand in 2014 T20 WC",
      "2014 T20 WC Champion"
    ],
    "hint": "Most successful left-arm spinner in Test history with 433 wickets, took 5/3 in 2014 T20 WC."
  },
  {
    "id": "rashid-khan",
    "name": "Rashid Khan",
    "country": "Afghanistan",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm leg-break / googly",
    "jerseyNumber": 19,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "GT",
    "era": "2010s-2020s",
    "achievements": [
      "ICC T20I Player of the Decade",
      "Fastest to 100 ODI Wickets",
      "Led AFG to 2024 T20 WC Semi-finals",
      "GT Champion"
    ],
    "hint": "Global T20 magician, lightning-fast arm action, led Afghanistan to historic 2024 T20 WC semi-final."
  },
  {
    "id": "mohammad-nabi",
    "name": "Mohammad Nabi",
    "country": "Afghanistan",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 7,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "MI",
    "era": "2000s-2020s",
    "achievements": [
      "The President",
      "Pillar of Afghanistan Cricket from Division 5 to Test status",
      "Former #1 T20I All-rounder"
    ],
    "hint": "\"The President\", veteran who represented Afghanistan from Division 5 all the way to Test cricket."
  },
  {
    "id": "mujeeb-ur-rahman",
    "name": "Mujeeb Ur Rahman",
    "country": "Afghanistan",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break / carrom ball",
    "jerseyNumber": 88,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "2010s-2020s",
    "achievements": [
      "First male cricketer born in the 21st century to play international cricket",
      "Carrom ball master"
    ],
    "hint": "Mystery spinner with flicked carrom ball, first player born in the 21st century to play Test cricket."
  },
  {
    "id": "rahmanullah-gurbaz",
    "name": "Rahmanullah Gurbaz",
    "country": "Afghanistan",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "None",
    "jerseyNumber": 21,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "2020s",
    "achievements": [
      "Leading run-scorer in 2024 T20 World Cup (281 runs)",
      "IPL 2024 Champion with KKR"
    ],
    "hint": "Fearless Afghan opener who finished as top run-scorer in the 2024 T20 World Cup, won IPL with KKR."
  },
  {
    "id": "fazalhaq-farooqi",
    "name": "Fazalhaq Farooqi",
    "country": "Afghanistan",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Left-arm fast-medium",
    "jerseyNumber": 5,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "SRH",
    "era": "2020s",
    "achievements": [
      "Joint Leading Wicket-taker in 2024 T20 World Cup (17 wickets)",
      "Deadly powerplay inswing"
    ],
    "hint": "Left-arm swing bowler who took 17 wickets to top the bowling charts in 2024 T20 World Cup."
  },
  {
    "id": "noor-ahmad",
    "name": "Noor Ahmad",
    "country": "Afghanistan",
    "role": "Bowler",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Left-arm wrist-spin",
    "jerseyNumber": 15,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "GT",
    "era": "2020s",
    "achievements": [
      "Young Chinaman sensation",
      "Crucial role in GT 2023 IPL campaign"
    ],
    "hint": "Left-arm wrist-spinner from Herat, bowling in tandem with Rashid Khan for Gujarat Titans."
  },
  {
    "id": "shakib-al-hasan",
    "name": "Shakib Al Hasan",
    "country": "Bangladesh",
    "role": "All-rounder",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Slow left-arm orthodox",
    "jerseyNumber": 75,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "2000s-2020s",
    "achievements": [
      "Ranked #1 All-rounder across all three formats simultaneously",
      "600 runs & 11 wickets in 2019 WC",
      "2x IPL Champion with KKR"
    ],
    "hint": "Bangladesh’s greatest ever cricketer, scored 606 runs and took 11 wickets in 2019 World Cup."
  },
  {
    "id": "tamim-iqbal",
    "name": "Tamim Iqbal",
    "country": "Bangladesh",
    "role": "Batsman",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 28,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "PWI",
    "era": "2000s-2020s",
    "achievements": [
      "Highest Run-scorer for Bangladesh across formats (15,000+ runs)",
      "Famous Lord’s Century (2010)"
    ],
    "hint": "Aggressive left-handed opener from Chittagong who famously took down Zaheer Khan in 2007 WC."
  },
  {
    "id": "mushfiqur-rahim",
    "name": "Mushfiqur Rahim",
    "country": "Bangladesh",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm medium",
    "jerseyNumber": 15,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2000s-2020s",
    "achievements": [
      "First double century in Test cricket for Bangladesh",
      "Debuted at Lord’s at age 16",
      "Mushi"
    ],
    "hint": "Mushi, diminutive wicketkeeper who scored Bangladesh’s first Test double hundred, debuted at 16."
  },
  {
    "id": "mustafizur-rahman",
    "name": "Mustafizur Rahman",
    "country": "Bangladesh",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Left-arm fast-medium",
    "jerseyNumber": 90,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "CSK",
    "era": "2010s-2020s",
    "achievements": [
      "The Fizz",
      "Back-to-back 5-wicket hauls on ODI debut vs India",
      "IPL Emerging Player 2016 (SRH)"
    ],
    "hint": "The Fizz, baffling cutters and slower balls that Bamboozled world’s best on debut against India."
  },
  {
    "id": "taskin-ahmed",
    "name": "Taskin Ahmed",
    "country": "Bangladesh",
    "role": "Bowler",
    "battingStyle": "Left-hand bat",
    "bowlingStyle": "Right-arm fast",
    "jerseyNumber": 3,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2010s-2020s",
    "achievements": [
      "5 wickets on ODI debut vs India",
      "145 km/h Express Pace",
      "Leader of Bangladesh Pace Attack"
    ],
    "hint": "Tall Dhaka express bowler who grabbed 5 wickets on ODI debut against India."
  },
  {
    "id": "litton-das",
    "name": "Litton Das",
    "country": "Bangladesh",
    "role": "Wicketkeeper",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 16,
    "isActive": true,
    "worldCupWinner": false,
    "iplTeam": "KKR",
    "era": "2010s-2020s",
    "achievements": [
      "176 in ODI vs Zimbabwe (highest Bangladesh score)",
      "121 in 2018 Asia Cup Final vs India"
    ],
    "hint": "Silky strokeplayer who scored 121 in Asia Cup final against India, holds highest ODI score for Bangladesh."
  },
  {
    "id": "mahmudullah",
    "name": "Mahmudullah",
    "country": "Bangladesh",
    "role": "All-rounder",
    "battingStyle": "Right-hand bat",
    "bowlingStyle": "Right-arm off-break",
    "jerseyNumber": 30,
    "isActive": false,
    "worldCupWinner": false,
    "iplTeam": "None",
    "era": "2000s-2020s",
    "achievements": [
      "First Bangladesh player to score a World Cup century (2015 vs England)",
      "Clutch Finisher",
      "Riyad"
    ],
    "hint": "Riyad, clutch finisher who hit back-to-back centuries in 2015 World Cup to eliminate England."
  }
];

export interface SuggestedQuestionCategory {
  category: string;
  icon: string;
  questions: string[];
}

export const SUGGESTED_QUESTION_CATEGORIES: SuggestedQuestionCategory[] = [
  {
    category: 'Nationality & Origin',
    icon: '🌍',
    questions: [
      'Is this player Indian?',
      'Is this an overseas / international cricketer?',
      'Is this player from Australia?',
      'Is this player from South Africa, England, or New Zealand?',
    ],
  },
  {
    category: 'Playing Role',
    icon: '🏏',
    questions: [
      'Is his primary role Batsman?',
      'Is his primary role Bowler?',
      'Is he an All-rounder?',
      'Is he a Wicketkeeper?',
    ],
  },
  {
    category: 'Batting & Bowling Style',
    icon: '⚡',
    questions: [
      'Does he bat right-handed?',
      'Does he bat left-handed?',
      'Is he a fast / pace bowler?',
      'Is he a spin bowler?',
    ],
  },
  {
    category: 'World Cups & Trophies',
    icon: '🏆',
    questions: [
      'Has he won an ICC World Cup (ODI or T20)?',
      'Has he captained his national team?',
      'Has he won an IPL trophy?',
      'Was he a hero in the 2011 or 2024 World Cup?',
    ],
  },
  {
    category: 'Era & Status',
    icon: '⏳',
    questions: [
      'Is he currently active in international cricket?',
      'Is he a retired legend?',
      'Has he scored more than 50 international centuries?',
      'Has he played for CSK or MI in the IPL?',
    ],
  },
];

export const SUGGESTED_QUESTIONS = SUGGESTED_QUESTION_CATEGORIES;

export function getCricketerById(id: string): Cricketer | undefined {
  return CRICKETERS.find((c) => c.id.toLowerCase() === id.toLowerCase());
}

export function searchCricketers(query: string, filterRole?: string, filterCountry?: string): Cricketer[] {
  const clean = query.trim().toLowerCase();
  return CRICKETERS.filter((c) => {
    const matchesQuery =
      !clean ||
      c.name.toLowerCase().includes(clean) ||
      c.country.toLowerCase().includes(clean) ||
      c.iplTeam.toLowerCase().includes(clean) ||
      c.role.toLowerCase().includes(clean) ||
      c.jerseyNumber.toString() === clean;

    const matchesRole = !filterRole || filterRole === 'All' || c.role.toLowerCase() === filterRole.toLowerCase();
    const matchesCountry = !filterCountry || filterCountry === 'All' || c.country.toLowerCase() === filterCountry.toLowerCase();

    return matchesQuery && matchesRole && matchesCountry;
  });
}

export interface PaginatedCricketersResult {
  items: Cricketer[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function searchCricketersPaginated(
  query: string,
  filterRole: string = 'All',
  filterCountry: string = 'All',
  page: number = 1,
  pageSize: number = 18
): PaginatedCricketersResult {
  const allMatched = searchCricketers(query, filterRole, filterCountry);
  const total = allMatched.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const validPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (validPage - 1) * pageSize;
  const items = allMatched.slice(startIndex, startIndex + pageSize);

  return {
    items,
    total,
    totalPages,
    currentPage: validPage,
  };
}
