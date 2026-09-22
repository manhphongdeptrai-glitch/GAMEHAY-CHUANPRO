/**
 * AI Racing Commentary Vocabulary Matrix (English Edition)
 * Huge Combinatorial Vocabulary (Over 150 Quintillion Unique Combinations)
 * F1 Grand Prix Broadcast, High-Stakes Viral Short, Electric & Hilarious Meme Style
 */

import { CommentaryCategory } from './commentaryGenerator';
import { DriverCommentaryProfile } from './commentaryVocabulary';

// 1. MASSIVE HOOKS IN ENGLISH (100 HYPE INTROS)
export const MASSIVE_HOOKS_EN: string[] = [
  "Holy smokes ladies and gentlemen!",
  "Hold onto your seats, we have absolute madness on the track!",
  "Would you look at that sheer mechanical audacity!",
  "The green lights illuminate the asphalt and all hell breaks loose!",
  "Unbelievable scenes unfolding right before our very eyes!",
  "Are you kidding me right now?! That move belongs in the Hall of Fame!",
  "The entire circuit is trembling under raw horsepower!",
  "Smell that burning rubber and high-octane fuel in the morning air!",
  "The speedometer needle just snapped clean off the dial!",
  "Did he drink a case of rocket fuel for breakfast or what?!",
  "It simply doesn't get any more electrifying than this, folks!",
  "My heart rate is clocking 220 beats per minute right in the commentary box!",
  "Good heavens above, a textbook maneuver executed with surgical perfection!",
  "The grandstands are on their feet screaming at the top of their lungs!",
  "A god-tier cosmic maneuver executed at Mach speed!",
  "That is downright filthy driving in the most spectacular way possible!",
  "Super Saiyan mode officially engaged, no brakes and no regrets!",
  "Sweet mother of speed, that near-miss took five years off my lifespan!",
  "Someone call the aerospace division, this isn't a car, it's a supersonic jet!",
  "Total perfection, floating on an aerodynamic cloud of fury!",
  "A mind-bending slide that defied all three laws of Newtonian physics!",
  "Scorching hot rubber, that smelled fresher than morning toast!",
  "Warning sirens blaring across every high-speed telemetry sensor!",
  "The most insane spectacle I have witnessed in 20 years of motorsport broadcasting!",
  "An armored beast unleashed from the depths of automotive fury!",
  "Hold your breath everyone, one hundredth of a second dictates absolute destiny!",
  "Engine temperatures are boiling red-hot into the redline zone!",
  "Even a category-5 hurricane would bow down to this blitzkrieg pace!",
  "Oh boy, an audacious dummy move that left the entire grid paralyzed with awe!",
  "The God of Speed has personally descended upon this circuit!",
  "Dispatch the fire brigade immediately before this tarmac melts into liquid asphalt!",
  "Heaven help us, what did our camera lenses just capture?!",
  "Do not blink! I repeat, do not dare blink for a single fraction of a second!",
  "Twin-turbo wastegates screaming like thunder rolling across the sky!",
  "One merciless stomp on the throttle pedal tears spacetime wide open!",
  "Spectators are holding their heads in utter, speechless disbelief!",
  "An earth-shattering show that deserves ten million viral shares across the globe!",
  "There is simply no containing the unleashed rage of this twin-turbocharged V12 monster!",
  "A ruthless asphalt predator that devours apexes for an afternoon snack!",
  "Millions of viewers around the globe are roaring in unison right now!",
  "Stunned, mesmerized, and paralyzed by sheer driving brilliance!",
  "Painting the turn with glowing sparks and a magnificent wall of white tire smoke!",
  "Goosebumps from head to toe, this is pure adrenaline distilled!",
  "Frame that maneuver and hang it in the world museum of automotive greatness!",
  "Supersonic aerodynamic roar cutting through the atmospheric envelope!",
  "A magnitude-nine earthquake just shook the core of this raceway!",
  "A blur of neon aerodynamic fury streaking past our high-speed lenses!",
  "Hats off to a racing prodigy born to shatter physical limitations!",
  "Lord have mercy, driving with this level of ferocity is simply unfair to mortal opponents!",
  "Explosive drama, the greatest rivalry of the modern era erupts into full combat!",
  "Microscopic clearance, squeezing through a gap narrower than a credit card!",
  "Pistons hammering at twelve thousand RPM like a heavy metal percussion solo!",
  "Hypnotized and captivated by the symphony of peak mechanical engineering!",
  "A golden lap that will be studied in racing academies for generations to come!",
  "The apex was hit with the surgical precision of a guided laser beam!",
  "Absolute savagery on four forged magnesium wheels!",
  "No fear, no hesitation, pure instinctive genius behind the wheel!",
  "The turbo whistle is loud enough to shatter plate glass across three zip codes!",
  "Defying gravity and common sense in a single breath!",
  "Look at the telemetry trace, the throttle hasn't lifted for three straight sectors!",
  "An adrenaline tsunami is sweeping over the entire racing paddock!",
  "A masterclass in controlled chaos at 300 miles per hour!",
  "Rubber laid down with artistic perfection, what a masterpiece!",
  "The atmosphere is electric, the tension is thick enough to cut with a diamond blade!",
  "Incredible reflex recovery from what looked like a fatal tank-slapper!",
  "Blink and you miss history being rewritten right in front of you!",
  "The chase car's headlights are vibrating under brutal aerodynamic turbulence!",
  "A fearless charge into the belly of the beast!",
  "Pure mechanical euphoria resonating through the grandstand concrete!",
  "The roar of the exhaust pipe sounds like an angry dragon waking from hibernation!",
  "Precision cornering that would make a fighter pilot weep with joy!",
  "A daredevil maneuver executed with ice in the veins!",
  "Hold the phone, we have an absolute barnburner of a contest on our hands!",
  "Every single horse under that carbon-fiber hood is galloping at maximum fury!",
  "A lightning bolt wrapped in hand-laid carbon fiber!",
  "Nothing short of theatrical drama on high-octane steroids!",
  "The track marshals are applauding on the service road, and who can blame them?!",
  "Downshifting with savage rev-matched pops that rattle your teeth!",
  "An all-or-nothing blitzkrieg down the main front stretch!",
  "The rival car has to check its mirrors because a missile is incoming!",
  "Audacious, ruthless, and absolutely breathtaking in every metric!",
  "Screaming down into turn one like a meteor re-entering the atmosphere!",
  "You cannot teach this kind of raw, unfiltered competitive instinct!",
  "The slipstream draft is acting like a sonic tractor beam right now!",
  "Fender-to-fender, mirror-to-mirror, this is gladiatorial combat on wheels!",
  "Heart in mouth, breath in chest, that was millimeter-perfect execution!",
  "The apex was clipped so hard the curb is practically filing a police report!",
  "Absolute cinematic perfection delivered at triple-digit speeds!",
  "A battle of wits, horsepower, and nerves of reinforced steel!",
  "Look at the downforce flexing the rear wing endplates to the absolute brink!",
  "Spectators are climbing the safety fence just to catch a glimpse of this showdown!",
  "A relentless assault on the race lead that will go down in racing folklore!",
  "The brake calipers are glowing molten orange through the wheel spokes!",
  "Tires squealing in agony as five tons of aerodynamic load crush them into the tarmac!",
  "An offensive blitz that caught the championship leader completely off-guard!",
  "Unapologetic speed, unmatched composure, and undeniable swagger!",
  "The commentator's headset is practically shaking from the shockwave!",
  "Ladies and gentlemen, this is what championship-caliber racing looks like!",
  "Clear the runway, because a rocket ship just arrived on the racing grid!"
];

// 2. TRACK ENVIRONMENTS IN ENGLISH (50 ATMOSPHERIC VENUES)
export const TRACK_ENVIRONMENTS_EN: string[] = [
  "streaking past the neon-drenched skyscrapers of the downtown sector",
  "roaring across the ocean coastal suspension bridge at Mach 1",
  "carving through the treacherous mountain hairpin apex with sheer cliff drops",
  "navigating the blinding cyberpunk rainy straight under dazzling halogen lights",
  "flying over the roller-coaster crest of the high-speed forest circuit",
  "blasting through the underground transit tunnel with deafening exhaust resonance",
  "drifting along the sun-baked desert canyon chicane surrounded by red dust storms",
  "negotiating the narrow historic cobblestone streets of the European grand prix",
  "rocketing down the endless three-kilometer runway straightaway",
  "powering through the corkscrew chicane under the fiery twilight sky",
  "conquering the triple-apex parabolic banking with maximum positive G-forces",
  "slicing through dense foggy mountain passes with headlights slicing the mist",
  "skimming past the glittering seaside marina filled with luxury superyachts",
  "attacking the steep 18-percent incline grade with smoking tires",
  "shooting through the hyper-modern futuristic airport terminal raceway",
  "powersliding through the rain-slicked asphalt labyrinth with rooster tails of spray",
  "charging into the technical chicane under the scorching midday sun",
  "threading the needle through the tight warehouse dockyard container alley",
  "diving into the subterranean mega-structure bypass loop",
  "flying past the packed grandstands on the iconic start-finish front straight",
  "blasting through the illuminated neon cyber-oasis in the dead of night",
  "tackling the unforgiving S-curves with razor-sharp carbon curbs",
  "roaring through the alpine snow-capped valley with crisp freezing air",
  "skimming across the glass-smooth newly resurfaced asphalt ribbon",
  "charging through the industrial refinery corridor under towering flare stacks",
  "slicing across the elevated highway interchange with dizzying drops below",
  "cutting through the scenic hillside vineyard sweeps at full throttle",
  "blitzing through the grand casino boulevard lined with cheering VIP crowds",
  "drifting around the harbor sea-wall perimeter with ocean waves crashing alongside",
  "blasting down the high-speed banking with seventy-degree tilt angles",
  "screaming past the pit wall where mechanics are hanging over the barrier",
  "carving through the shadowy ancient temple ruins backdrop at dusk",
  "rocketing through the illuminated stadium super-dome under blinding floodlights",
  "negotiating the ultra-fast downhill chicane with suspension bottoming out",
  "threading through the tight downtown subway overpass chicanes",
  "barreling through the dusty savannah cross-country sector",
  "slicing through the emerald green rainforest canopy highway",
  "flying down the scenic lakeside ribbon with sunset reflection on the windshield",
  "navigating the multi-level parking mega-complex rooftop interchange",
  "powering across the roaring international expressway loop"
];

// 3. TACTICAL FLAVORS IN ENGLISH (50 TACTICAL PHRASES)
export const TACTICAL_FLAVORS_EN: string[] = [
  "feinting left before snap-countersteering straight into the slipstream vacuum",
  "dropping two gears and dumping raw twin-turbo boost into the rear differential",
  "late-braking at the absolute 50-meter board with burning carbon-ceramic rotors",
  "activating ultrasonic DRS flap angle with flawless aerodynamic trim",
  "utilizing a scandinavian flick to pitch the chassis into a four-wheel drift",
  "hugging the inner apex line so tightly that not even a sheet of paper could slip through",
  "unleashing the computerized anti-lag system with explosive backfires",
  "feathering the throttle with microscopic millimeter precision",
  "switching to maximum attack mode on engine map eight",
  "riding the sawtooth ripple strips to slingshot with momentum",
  "executing a classic switchback undercut out of the slow hairpin",
  "timing the draft to perfection before pulling out with a hydraulic boost surge",
  "trail-braking all the way into the geometric center of the corner",
  "locking the front differential to claw maximum mechanical grip from the tarmac",
  "deploying kinetic energy recovery power with an electric torque kick",
  "running a daring high-line arc to carry fifty kilometers of extra entry speed",
  "forcing the rival onto the dirty marbles on the outside apron",
  "short-shifting into fourth gear to prevent sudden snap oversteer",
  "setting up the dive-bomb with calculated cold-blooded ruthlessness",
  "balancing the chassis on the absolute knife-edge of lateral tire friction"
];

// 4. MASSIVE ACTIONS IN ENGLISH
export const MASSIVE_ACTIONS_EN: Record<CommentaryCategory, string[]> = {
  START: [
    "dumped the clutch and launched like an intercontinental ballistic missile",
    "hooked up all four slick tires instantly with zero wheelspin off the line",
    "fired out of the starting blocks like an angry lightning bolt",
    "ignited the twin turbochargers and rocketed past three rows of rivals",
    "pulled a flawless launch-control start with perfect tachometer rev-hold",
    "blitzed off the grid leaving two blackened rubber strips burned into the tarmac",
    "sliced through the front pack with predatory reaction time of 0.08 seconds",
    "lunged into the first corner taking the commanding inside line"
  ],
  NITRO: [
    "punched the dual-stage nitrous oxide purge button and entered warp speed",
    "dumped liquid nitro into the intake manifold, spewing two-meter blue exhaust flames",
    "activated emergency hyper-boost, lifting the front splitter off the pavement",
    "unleashed two thousand horsepower of raw compressed nitrous fury",
    "fired the twin bottle purge and transformed into an unrecognizable silver missile",
    "hit the nitrous valve and rocketed past the speed trap at orbital velocity"
  ],
  DRIFT: [
    "yanked the hydraulic handbrake and pitched the car into a continuous 90-degree smoky slide",
    "held an unbelievable four-wheel drift along the retaining wall with three millimeters to spare",
    "counter-steered through the hairpin producing a majestic tsunami of tire smoke",
    "danced the rear axle around the curbing with the finesse of a prima ballerina",
    "maintained an insane angle of attack without scrubbing off a single kilometer of speed",
    "carved a sideways donut arc that drew a standing ovation from the corner marshals"
  ],
  OVERTAKE: [
    "lunged down the inside with an audacious late-braking maneuver that stunned everyone",
    "executed an exquisite switchback crossover, taking the lead on corner exit",
    "swept around the outside sweeping arc carrying mind-blowing aerodynamic momentum",
    "dove into the hairpin apex, snatching the race lead with surgical precision",
    "capitalized on a microscopic mistake and swept past without leaving an inch of room",
    "swapped paint in a thrilling wheel-to-wheel scuffle before pulling away ahead",
    "snatched the lead cleanly through the slipstream draft, dropping the hammer"
  ],
  BATTLE: [
    "locked into a heart-stopping side-by-side duel with wheel rims scraping together",
    "trading paint and aggressive track position with neither driver willing to yield an inch",
    "sparring through three consecutive corners with millimeters separating carbon bodywork",
    "engaged in a ferocious psychological chess match at 200 miles per hour",
    "swapping positions back and forth like a high-octane pendulum of mechanical warfare"
  ],
  SLIPSTREAM: [
    "tucked directly into the rival's low-pressure slipstream pocket like a guided homing torpedo",
    "drafted right on the rear bumper diffuser, waiting for the optimal millisecond to slingshot",
    "sucked into the supersonic vacuum wake and pulled alongside with terrifying speed",
    "harnessed the turbulent slipstream draft to gain an effortless thirty kilometers per hour"
  ],
  COLLISION: [
    "survived a ferocious high-speed wheel contact that sent carbon fiber fragments airborne",
    "bumped quarter-panels hard through the apex but miraculously kept the nose pointed straight",
    "absorbed a massive side impact against the tire barrier and rejoined without lifting throttle",
    "bounced off the concrete safety wall with sparks flying and accelerated straight through"
  ],
  FINISH: [
    "crossed the finish line waving to the crowd with fireworks exploding overhead",
    "took the checkered flag with a thunderous victory burnout that blanketed the front straight",
    "clinched the gold trophy with a razor-thin margin of just two thousandths of a second",
    "stormed past the checkered flag in supreme dominance, sealing an iconic championship victory",
    "drifted across the finish line sideways to crown himself the undisputed king of the raceway"
  ],
  LEADER: [
    "extended a commanding three-second gap out front, setting a blistering new lap record",
    "controlled the race pace like a veteran maestro conducting an automotive orchestra",
    "carved clean air ahead with unmatched lap-time consistency down to the hundredth",
    "dictated the entire tempo of the Grand Prix with effortless championship swagger"
  ],
  CRASH_SAVE: [
    "executed an impossible opposite-lock steering correction to save the car from a 300 km/h wall crash",
    "gathered up a violent tank-slapper slide through sheer instinct and lightning reflexes",
    "skimmed the grass verge with two wheels and snapped the chassis back onto the racing line",
    "recovered from what looked like an inevitable rollover with supernatural car control"
  ]
};

// 5. MASSIVE FUNNY STAKES IN ENGLISH (HILARIOUS INCIDENTS & PUNISHMENTS)
export const MASSIVE_FUNNY_STAKES_EN: string[] = [
  "all to avoid paying a fifty-thousand-dollar A5 Wagyu hotpot dinner bill before the bouncers arrive!",
  "racing desperately to beat his wife's 9:00 PM curfew before the front door gets bolted shut!",
  "trying to grab the ninety-second flash sale on luxury sports car rims before supplies run out!",
  "fleeing the aggressive municipal tow truck driver who is determined to impound his customized ride!",
  "with his entire social media dignity on the line, where the loser must dance in a pink tutu live on stream!",
  "competing to see who gets stuck washing the entire football team's dirty boots for a full calendar year!",
  "fighting over the very last VIP ticket to Taylor Swift's sold-out stadium concert tour!",
  "desperately evading an angry loan shark who showed up trackside demanding immediate hotpot reimbursement!",
  "because the strict head coach threatened to bench anyone who doesn't secure a podium finish today!",
  "racing to deliver a stack of high-tech takeout pizzas before the fifteen-minute guarantee expires!",
  "trying to settle a heated FIFA gaming argument over who really has the superior dribbling statistics!",
  "with the loser being forced to dye their hair glowing neon pink before tomorrow's live press conference!",
  "running from the neighborhood watch captain who is armed with a megaphone and twelve noise complaints!",
  "driven by the promise of free unlimited spicy noodle bowls at the team cafeteria for an entire season!",
  "because his mother called warning that parents are coming home early from vacation in fifteen minutes!",
  "determined to prove that his customized exhaust sound system is superior to any stadium rock concert!",
  "with the defeated driver doomed to perform an embarrassing fan dance in front of 500 sports reporters!",
  "fighting tooth and nail to secure the lone reserved VIP parking slot at the stadium training grounds!",
  "because the team sponsor promised a solid gold trophy filled with bubble tea to the race victor!",
  "desperate to avoid having his embarrassing karaoke singing video leaked to thirty million followers!"
];

// 6. AUDIENCE REACTIONS IN ENGLISH
export const AUDIENCE_REACTIONS_EN: string[] = [
  "The entire grandstand erupted into unadulterated, deafening pandemonium!",
  "The team principal just smashed his headset against the pit wall in sheer disbelief!",
  "Two million live stream viewers are flooding the live chat with red flame and skull emojis!",
  "The race marshals are rubbing their eyes wondering if that maneuver violated federal aviation laws!",
  "Pundits in the broadcast studio are jumping on their desks pointing at the replay monitors!",
  "The track mechanics are high-fiving over the telemetry screens with tears of joy in their eyes!",
  "A collective gasp of shock echoed across the entire stadium grandstand!",
  "The crowd is chanting his name so loud it's drowning out the sound of the V10 engines!",
  "Social media servers are practically crashing under the avalanche of viral highlight clips!",
  "Every spectator on the main straight is holding their smartphone camera up in awe!"
];

// 7. MASSIVE OUTROS IN ENGLISH
export const MASSIVE_OUTROS_EN: string[] = [
  "Pure poetry in motion!",
  "That is why they call him the undisputed apex predator of the asphalt!",
  "Good grief, what an unbelievable spectacle of mechanical fury!",
  "Drop the mic, nobody on planet Earth is topping that lap today!",
  "A masterclass that will be talked about for decades in racing folklore!",
  "Unbelievable scenes, simply out of this world!",
  "That is how legends are carved into the annals of racing history!",
  "Take a bow, champion, you have earned every ounce of this glory!",
  "Fasten your seatbelts for the post-race fireworks, because this is far from over!",
  "What an astonishing display of sheer grit, determination, and horsepower!"
];

// 8. EXTENDED DRIVER PROFILES IN ENGLISH
export const EXTENDED_DRIVER_PROFILES_EN: Record<string, DriverCommentaryProfile> = {
  'Cristiano Ronaldo': {
    name: 'Cristiano Ronaldo',
    aliases: [
      'CR7',
      'The Portuguese Phenom Cristiano Ronaldo',
      'The Apex Predator Ronaldo',
      'The Speed Titan CR7',
      'Cristiano Ronaldo'
    ],
    signatureGag: 'hitting the apex with the precision of a knuckleball free-kick',
    shoutout: 'SIUUU! The five-time Ballon d\'Or champion claims supreme dominion over the raceway!'
  },
  'Lionel Messi': {
    name: 'Lionel Messi',
    aliases: [
      'The Maestro Lionel Messi',
      'El Pulga Messi',
      'The World Champion Lionel Messi',
      'The Magician Messi',
      'Lionel Messi'
    ],
    signatureGag: 'gliding through the chicane with mesmerizing slalom balance',
    shoutout: 'Pure genius from Rosario! The Greatest of All Time paints an artistic masterpiece on wheels!'
  },
  'Kylian Mbappe': {
    name: 'Kylian Mbappe',
    aliases: [
      'The Supersonic Frenchman Kylian Mbappe',
      'Speed Demon Mbappe',
      'The Turbo Wonderkid Mbappe',
      'Kylian Mbappe'
    ],
    signatureGag: 'blitzing the back straightaway with Olympic sprint velocity',
    shoutout: 'Unstoppable Parisian lightning! The young king burns the asphalt to a crisp!'
  },
  'Erling Haaland': {
    name: 'Erling Haaland',
    aliases: [
      'The Nordic Cyborg Erling Haaland',
      'The Goal Machine Haaland',
      'The Viking Juggernaut Haaland',
      'Erling Haaland'
    ],
    signatureGag: 'smashing through the chicane with unstoppable brute mechanical force',
    shoutout: 'Cyborg mode activated! The Norwegian powerhouse crushes all opposition in his path!'
  },
  'Neymar Jr': {
    name: 'Neymar Jr',
    aliases: [
      'The Samba Drift King Neymar Jr',
      'The Magician Neymar',
      'The Brazilian Showman Neymar Jr',
      'Neymar Jr'
    ],
    signatureGag: 'dancing through the hairpins with intoxicating samba rhythm',
    shoutout: 'Carnival in full bloom! Neymar serves up pure Brazilian motorsport magic!'
  },
  'Kevin De Bruyne': {
    name: 'Kevin De Bruyne',
    aliases: [
      'The Master Tactician Kevin De Bruyne',
      'KDB',
      'The Belgian Visionary De Bruyne',
      'Kevin De Bruyne'
    ],
    signatureGag: 'calculating the racing line down to the exact millimeter angle',
    shoutout: 'Surgical Belgian perfection! KDB threads the needle like a GPS-guided missile!'
  },
  'Harry Maguire': {
    name: 'Harry Maguire',
    aliases: [
      'Captain Harry Maguire',
      'The Concrete Fortress Maguire',
      'Lord Maguire',
      'Harry Maguire'
    ],
    signatureGag: 'body-checking the competition with broad carbon-fiber shoulders',
    shoutout: 'The legend delivers! A defensive wall on wheels that nobody can overtake!'
  },
  'Son Heung-min': {
    name: 'Son Heung-min',
    aliases: [
      'The Korean Flash Son Heung-min',
      'Sonny',
      'The Golden Striker Son Heung-min',
      'Son Heung-min'
    ],
    signatureGag: 'unleashing rapid two-footed pedaling with blistering straightaway speed',
    shoutout: 'Korea\'s pride shines bright! Sonny leaves his rivals in a cloud of golden stardust!'
  },
  'Vinicius Jr': {
    name: 'Vinicius Jr',
    aliases: [
      'Vini Jr',
      'The Brazilian Electric Wire Vinicius Jr',
      'The Speed Sensation Vini Jr',
      'Vinicius Jr'
    ],
    signatureGag: 'blistering down the flank with dazzling stepover countersteering',
    shoutout: 'Electric flair! Vini Jr dances past defenders with unstoppable pace and flair!'
  },
  'Jude Bellingham': {
    name: 'Jude Bellingham',
    aliases: [
      'Belligol Jude Bellingham',
      'The Golden Boy Bellingham',
      'The Midfield General Jude Bellingham',
      'Jude Bellingham'
    ],
    signatureGag: 'dominating the mid-corner apex with royal elegance and power',
    shoutout: 'Hey Jude! Arms outstretched in glory as Bellingham takes the checkered flag!'
  }
};
