/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FishGuideDetails {
  scientificName: string;
  visualDescription: string;
  habitatBehavior: string;
  dietNotes: string;
  wikiUrl: string;
}

export const FISH_GUIDE_DATA: Record<number, FishGuideDetails> = {
  "1": {
    "scientificName": "Phoxinus phoxinus",
    "visualDescription": "Slender, compressed body with olive-green back, iridescent golden-bronze flanks, and pale translucent fins. Small scales give it a silky shimmer.",
    "habitatBehavior": "Frequents shallow, sunlit weedlines and calm shallows near lily pads. Schools closely in clear water.",
    "dietNotes": "Feeds on algae, micro-crustaceans, bread fragments, and tiny midge larvae.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Common_minnow"
  },
  "2": {
    "scientificName": "Semotilus atromaculatus",
    "visualDescription": "Stout cylindrical body with dusky brownish-olive dorsum, a bold black spot at the anterior base of the dorsal fin, and a distinct dark lateral line.",
    "habitatBehavior": "Inhabits calm pools and gravel-bottom pockets around sunken brush and overhanging banks.",
    "dietNotes": "Opportunistic feeder taking aquatic nymphs, earthworms, and terrestrial insects.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Semotilus_atromaculatus"
  },
  "3": {
    "scientificName": "Notemigonus crysoleucas",
    "visualDescription": "Deep-bodied baitfish with bright metallic golden-olive sides, a strongly decurved lateral line, and clear to faint yellow fins.",
    "habitatBehavior": "Cruises in loose schools through quiet weed beds and shallow farm pond margins.",
    "dietNotes": "Consumes zooplankton, filamentous algae, and surface insects.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Golden_shiner"
  },
  "4": {
    "scientificName": "Pimephales promelas",
    "visualDescription": "Stocky, blunt-snouted minnow with dusky olive scales and a faint dark lateral stripe. Breeding males develop small head tubercles.",
    "habitatBehavior": "Extremely hardy; thrives in shallow muddy backwaters and tranquil pond shallows.",
    "dietNotes": "Forages on organic detritus, bottom algae, and tiny aquatic invertebrates.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Fathead_minnow"
  },
  "5": {
    "scientificName": "Lepomis macrochirus",
    "visualDescription": "Compressed oval panfish with olive-green to blue flanks, dark vertical banding, bright blue chin/lower jaw, and an all-black ear flap.",
    "habitatBehavior": "Hover near docks, sunken timber, and weedbeds in warm, shallow waters.",
    "dietNotes": "Voracious feeder on earthworms, mayflies, damselfly nymphs, and small snails.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Bluegill"
  },
  "6": {
    "scientificName": "Lepomis gibbosus",
    "visualDescription": "Radiant panfish marked with wavy emerald and turquoise bands, glowing orange belly, and a bright crimson spot on the ear flap tip.",
    "habitatBehavior": "Congregates in clear, sun-warmed coves thick with submerged vegetation and clean sand.",
    "dietNotes": "Equipped with strong pharyngeal teeth to crush small snails, crustaceans, and beetle larvae.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Pumpkinseed"
  },
  "7": {
    "scientificName": "Lepomis cyanellus",
    "visualDescription": "Heavy-bodied sunfish with a large bass-like mouth, turquoise facial vermiculations, and white to yellowish margins on dorsal and anal fins.",
    "habitatBehavior": "Guards rocky shorelines, riprap banks, and shallow root tangles.",
    "dietNotes": "Aggressive predator taking worms, crawfish, minnows, and small frogs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Green_sunfish"
  },
  "8": {
    "scientificName": "Lepomis microlophus",
    "visualDescription": "Deep slab-sided sunfish with golden-olive scales, faint mottling, and a prominent red-to-orange border surrounding its black ear flap.",
    "habitatBehavior": "Benthic bottom feeder preferring quiet, deep open-water zones near weed edges.",
    "dietNotes": "Nicknamed shellcracker; specializes in freshwater snails, clams, and aquatic grubs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Redear_sunfish"
  },
  "9": {
    "scientificName": "Lepomis gulosus",
    "visualDescription": "Thick, dark mottled sunfish with reddish-brown streaks radiating from the eye and a sandpaper-like patch of teeth on its tongue.",
    "habitatBehavior": "Lurks tightly inside heavy mud bottoms, sunken cypress roots, and dense cover.",
    "dietNotes": "Ambush feeder targeting small minnows, worms, and freshwater crawdads.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Warmouth"
  },
  "10": {
    "scientificName": "Ambloplites rupestris",
    "visualDescription": "Stout bronze-olive panfish with rows of dark square spots on its flanks and startling red eyes that reflect ambient light.",
    "habitatBehavior": "Hides under boulder piles, rocky cribs, and submerged logs during daylight.",
    "dietNotes": "Feeds heavily on small crayfish, hellgrammites, and baitfish jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Rock_bass"
  },
  "11": {
    "scientificName": "Ameiurus natalis",
    "visualDescription": "Smooth, scaleless catfish with yellowish-brown back, white chin barbels, and a rounded caudal fin.",
    "habitatBehavior": "Prowls silty pond bottoms and heavily vegetated coves at dusk and nighttime.",
    "dietNotes": "Strong olfactory scavenger seeking decaying matter, cheese baits, worms, and invertebrates.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Yellow_bullhead"
  },
  "12": {
    "scientificName": "Ameiurus melas",
    "visualDescription": "Dark greenish-black catfish with dusky to black chin barbels and a pale greenish-gold underbelly.",
    "habitatBehavior": "Thrives in warm, turbid, low-oxygen farm pond mud and quiet backbays.",
    "dietNotes": "Bottom-feeding omnivore drawn to strong scent baits, liver, and nightcrawlers.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Black_bullhead"
  },
  "13": {
    "scientificName": "Ameiurus nebulosus",
    "visualDescription": "Mottled brown-to-olive body with darker blotches, pale belly, and dark brown chin whiskers.",
    "habitatBehavior": "Rests stationary in deep soft mud holes during the bright day, feeding actively after twilight.",
    "dietNotes": "Crustaceans, worms, small mollusks, and aromatic bottom baits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Brown_bullhead"
  },
  "14": {
    "scientificName": "Micropterus salmoides",
    "visualDescription": "Elongate green body with dark horizontal lateral blotches; jaw joint extends distinctly past the rear edge of the eye.",
    "habitatBehavior": "Cruises pond weedlines, sunken stumps, and lily pad beds ambushing forage.",
    "dietNotes": "Aggressive predator targeting bluegills, frogs, crankbaits, and small rodents.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Largemouth_bass"
  },
  "15": {
    "scientificName": "Cyprinus carpio",
    "visualDescription": "Deep, robust freshwater cyprinid with large golden-bronze cycloid scales, two pairs of sensory barbels, and a serrated dorsal spine.",
    "habitatBehavior": "Roots into soft silt and organic pond substrates creating visible mud clouds.",
    "dietNotes": "Omnivorous grazer fond of boiled sweet corn, dough baits, seeds, and worms.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Common_carp"
  },
  "16": {
    "scientificName": "Cyprinus carpio carpio",
    "visualDescription": "Genetic variant of common carp possessing large, irregular, reflective mirror-like scales scattered across smooth leathery skin.",
    "habitatBehavior": "Favors tranquil, deep pond corners and warm shallows with plentiful insect larvae.",
    "dietNotes": "Benthic forager attracted to sweet corn, bread crusts, and protein-rich boilies.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Mirror_carp"
  },
  "17": {
    "scientificName": "Ctenopharyngodon idella",
    "visualDescription": "Long, torpedo-shaped herbivore with large silvery scales bordered in dark brown, wide mouth, and firm muscular build.",
    "habitatBehavior": "Cruises surface and mid-depths near dense mats of aquatic vegetation and pond weeds.",
    "dietNotes": "Herbivore feeding on hydrilla, duckweed, pondweeds, and sweet corn kernels.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Grass_carp"
  },
  "18": {
    "scientificName": "Carassius carassius",
    "visualDescription": "Deep rounded golden-bronze back without barbels, high curved dorsal fin, and thick leathery golden flanks.",
    "habitatBehavior": "Extremely resilient; survives in stagnant, heavily weed-choked muddy farm ponds.",
    "dietNotes": "Picks at chironomid larvae, tender aquatic plant shoots, and corn.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Crucian_carp"
  },
  "19": {
    "scientificName": "Micropterus salmoides",
    "visualDescription": "Enormous veteran bass with deep sagging belly, dark forest-green markings, and a gaping bucket-sized maw.",
    "habitatBehavior": "Dominates the prime deep-water sunken timber and shade structures in the pond.",
    "dietNotes": "Feeds exclusively on large forage: whole bluegills, crawfish, frogs, and diving lures.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Largemouth_bass"
  },
  "20": {
    "scientificName": "Cyprinus rubrofuscus var.",
    "visualDescription": "Magnificent ornamental carp shimmering with brilliant iridescent gold, sunset orange, and pure metallic scales with prominent whisker barbels.",
    "habitatBehavior": "Gracefully patrols open sunny basins and deep weed sanctuaries; extremely wary.",
    "dietNotes": "Rare specimen attracted only to the most enticing offerings and specialized lures.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Koi"
  },
  "21": {
    "scientificName": "Salvelinus fontinalis",
    "visualDescription": "Native char with dark olive vermiculations on back, crimson spots ringed in azure blue, and snow-white leading edges on lower fins.",
    "habitatBehavior": "Demands pristine, cold spring-fed mountain creeks and shaded oxygenated eddies.",
    "dietNotes": "Feeds delicately on drifting mayflies, caddis pupae, and tiny midges.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Brook_trout"
  },
  "22": {
    "scientificName": "Oncorhynchus mykiss",
    "visualDescription": "Streamlined silvery trout featuring a broad reddish-pink lateral stripe, black pepper spots covering back and fins, and square tail.",
    "habitatBehavior": "Holds in fast riffles, bubble lines, and oxygen-rich current seams behind boulders.",
    "dietNotes": "Active surface and drift feeder chasing winged mayflies, stoneflies, and small spinners.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Rainbow_trout"
  },
  "23": {
    "scientificName": "Salmo trutta",
    "visualDescription": "Golden-brown flanks adorned with large dark halos and vibrant red-orange spots encircled by pale rings; pale yellow belly.",
    "habitatBehavior": "Wary hunter sheltering beneath undercut riverbanks, log jams, and deep swirling pools.",
    "dietNotes": "Piscivorous predator that feeds aggressively on minnows, sculpins, and spinners.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Brown_trout"
  },
  "24": {
    "scientificName": "Micropterus dolomieu",
    "visualDescription": "Bronze-brown body with vertical dark tiger bars, red-tinted eyes, and jaw ending forward of the eye socket.",
    "habitatBehavior": "Hunts fast gravel runs, rocky drop-offs, and swift boulder-strewn river currents.",
    "dietNotes": "Relentless feeder on river crawfish, hellgrammites, and darting hair jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Smallmouth_bass"
  },
  "25": {
    "scientificName": "Oncorhynchus clarkii",
    "visualDescription": "Slender salmonid recognized by twin vivid blood-red slash marks tucked beneath the lower jaw and dense black spots toward the tail.",
    "habitatBehavior": "Inhabits cold mountain rivers and tumbling alpine tributaries with clean gravel bottoms.",
    "dietNotes": "Eagerly rises to dry mayflies, stonefly nymphs, and small drifting spinners.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Cutthroat_trout"
  },
  "26": {
    "scientificName": "Oncorhynchus aguabonita",
    "visualDescription": "Breathtaking trout with glowing bright gold flanks, crimson-red belly, olive back, and prominent parr marks along the lateral line.",
    "habitatBehavior": "Endemic to icy high-altitude alpine streams and clear headwater pools.",
    "dietNotes": "Selective feeder on high-elevation aquatic midge larvae and tiny mayflies.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Golden_trout"
  },
  "27": {
    "scientificName": "Prosopium williamsoni",
    "visualDescription": "Cylindrical silvery body with pointed snout, small subterminal mouth, and delicate grayish-silver scales.",
    "habitatBehavior": "Forms dense schools hugging the deep, swift gravel runs and turbulent tailwaters.",
    "dietNotes": "Bottom-grazing insectivore taking tiny stoneflies, midge pupae, and small jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Mountain_whitefish"
  },
  "28": {
    "scientificName": "Thymallus arcticus",
    "visualDescription": "Distinguished by an enormous, sail-like dorsal fin patterned with iridescent turquoise and violet spots and purplish-gray scales.",
    "habitatBehavior": "Cruises cold, swift mountain river riffles with exceptional eyesight.",
    "dietNotes": "Rises acrobatically to seize drifting adult mayflies and terrestrial beetles.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Arctic_grayling"
  },
  "29": {
    "scientificName": "Sander vitreus",
    "visualDescription": "Olive-gold predatory fish with glassy, light-reflecting eyes, razor canine teeth, and white tip on the lower tail fin lobe.",
    "habitatBehavior": "Hunts deep river channels and churning whitewater below dams in low-light conditions.",
    "dietNotes": "Nocturnal carnivore targeting river chubs, shiners, and lead-headed jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Walleye"
  },
  "30": {
    "scientificName": "Sander canadensis",
    "visualDescription": "Slender walleye cousin marked with bold dark saddle blotches and distinct black spots along the spinous dorsal fin.",
    "habitatBehavior": "Prefers deeper, more turbid river currents with rocky and sandy floors.",
    "dietNotes": "Bottom predator feeding on small river minnows and crawfish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Sauger"
  },
  "31": {
    "scientificName": "Semotilus corporalis",
    "visualDescription": "Large river minnow with bright silvery scales, dark olive-brown dorsum, and broad triangular caudal fin.",
    "habitatBehavior": "Dwells in clear gravel rivers, constructing large pebble nests in swift currents.",
    "dietNotes": "Takes aquatic nymphs, earthworms, and terrestrial grasshoppers.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Fallfish"
  },
  "32": {
    "scientificName": "Moxostoma carinatum",
    "visualDescription": "Heavy sucker fish with bright brassy-gold scales, distinct crimson-orange fins, and large downward-turned fleshy lips.",
    "habitatBehavior": "Restricted to clean, fast-flowing rivers over bedrock and coarse river gravel.",
    "dietNotes": "Uses pharyngeal teeth to crush river snails, clams, and bottom-dwelling crawfish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/River_redhorse"
  },
  "33": {
    "scientificName": "Salvelinus confluentus",
    "visualDescription": "Large predatory char with broad flattened head, pale yellow-to-pink spots without blue rings, and olive-brown back.",
    "habitatBehavior": "Occupies the coldest, most pristine mountain river pools and deep canyons.",
    "dietNotes": "Apex river predator devouring whitefish, sculpins, and aggressively striking spinners.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Bull_trout"
  },
  "34": {
    "scientificName": "Salmo trutta × Salvelinus fontinalis",
    "visualDescription": "Striking sterile hybrid displaying intricate maze-like tiger vermiculations across amber and gold flanks.",
    "habitatBehavior": "Cruises swift river eddies and deep undercut banks with high predatory vigor.",
    "dietNotes": "Fierce predator attacking flash spinners, streamers, and juvenile fish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Tiger_trout"
  },
  "35": {
    "scientificName": "Oncorhynchus mykiss",
    "visualDescription": "Anadromous ocean-going rainbow trout grown massive, chrome-silver flanks with subtle crimson blush and muscular build.",
    "habitatBehavior": "Migrates up roaring coastal rivers battling rapids and staging in deep bedrock resting pools.",
    "dietNotes": "Aggressive reaction biter striking spoons, spinners, and roe imitations.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Steelhead"
  },
  "36": {
    "scientificName": "Acipenser transmontanus",
    "visualDescription": "Prehistoric freshwater behemoth with rows of bony scutes (plates), shark-like heterocercal tail, and sensitive sensory barbels.",
    "habitatBehavior": "Cruises the deepest river trenches and gravel bottoms of large river systems.",
    "dietNotes": "Suction feeder vacuuming stinky clams, dead fish, lampreys, and invertebrates.",
    "wikiUrl": "https://en.wikipedia.org/wiki/White_sturgeon"
  },
  "37": {
    "scientificName": "Oncorhynchus tshawytscha",
    "visualDescription": "The mighty King Salmon entering rivers to spawn; dark olive-bronze back, black gums, and dense spotting on entire caudal fin.",
    "habitatBehavior": "Hugs the deep gravel channels of torrential coastal rivers on its spawning run.",
    "dietNotes": "Fiercely defends river territory, striking shad lures and large bright spoons.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Chinook_salmon"
  },
  "38": {
    "scientificName": "Acipenser transmontanus",
    "visualDescription": "Colossal river elder measuring over ten feet in length, armor-plated in bony scutes with ancient slate-gray coloring.",
    "habitatBehavior": "Inhabits the absolute deepest abyssal holes of mighty river canyons.",
    "dietNotes": "Massive bottom vacuum consuming bulk fish scraps, clams, and deep scent baits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/White_sturgeon"
  },
  "39": {
    "scientificName": "Micropterus salmoides",
    "visualDescription": "Classic apex lake predator with heavy dark olive back, broken lateral stripe, and deep jaw structure extending beyond eye.",
    "habitatBehavior": "Stalks offshore humps, weed lines, sunken brush, and boat docks.",
    "dietNotes": "Feeds ravenously on shad, yellow perch, crawfish, and deep crankbaits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Largemouth_bass"
  },
  "40": {
    "scientificName": "Micropterus dolomieu",
    "visualDescription": "Deep golden-bronze bass with crimson eyes and dark vertical barred flanks adapted to deep clear glacial water.",
    "habitatBehavior": "Schools over sunken boulder piles, rocky points, and submerged offshore shoals.",
    "dietNotes": "Specializes in deep crayfish, sculpins, and bottom-bounced jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Smallmouth_bass"
  },
  "41": {
    "scientificName": "Micropterus punctulatus",
    "visualDescription": "Resembles largemouth but features distinct horizontal rows of black spots on lower belly scales and a tooth patch on the tongue.",
    "habitatBehavior": "Prefers deep, open reservoir waters, steep rock bluffs, and current breaks.",
    "dietNotes": "Forages on crawfish, threadfin shad, and deep jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Spotted_bass"
  },
  "42": {
    "scientificName": "Morone chrysops",
    "visualDescription": "Deep, compressed silver body with faint horizontal dark stripes and a arched spiny dorsal profile.",
    "habitatBehavior": "Schools in vast open-water pods, herding schools of shad toward the surface.",
    "dietNotes": "Fast pelagic predator blitzing on minnows, spoons, and silver spinners.",
    "wikiUrl": "https://en.wikipedia.org/wiki/White_bass_(fish)"
  },
  "43": {
    "scientificName": "Perca flavescens",
    "visualDescription": "Golden-yellow panfish with six to eight bold dark olive triangular vertical bars and vibrant orange lower fins.",
    "habitatBehavior": "Roams clean sand flats, weed edges, and drop-offs in large cohesive schools.",
    "dietNotes": "Feeds on live minnows, insect nymphs, and small jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Yellow_perch"
  },
  "44": {
    "scientificName": "Pomoxis nigromaculatus",
    "visualDescription": "Compressed silvery body irregularly mottled with dark black-green specks and 7 to 8 dorsal fin spines.",
    "habitatBehavior": "Suspends near deep brush piles, submerged standing timber, and weedlines.",
    "dietNotes": "Selective minnow predator taking small live baitfish and feathered jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Black_crappie"
  },
  "45": {
    "scientificName": "Pomoxis annularis",
    "visualDescription": "Slightly paler crappie exhibiting regular vertical dark bars down its flanks and only 6 dorsal fin spines.",
    "habitatBehavior": "Inhabits turbid lake bays, silted coves, and shaded dock pilings.",
    "dietNotes": "Feeds on schooling minnows, shad fry, and small jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/White_crappie"
  },
  "46": {
    "scientificName": "Sander vitreus",
    "visualDescription": "Deep-water lake walleye with glistening olive-bronze hues, opaque reflective tapetum lucidum eyes, and white tail tip.",
    "habitatBehavior": "Patrols submerged humps, gravel reefs, and deep drop-offs in low-light conditions.",
    "dietNotes": "Nocturnal hunter targeting yellow perch, ciscoes, and bottom jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Walleye"
  },
  "47": {
    "scientificName": "Coregonus clupeaformis",
    "visualDescription": "Sleek silvery salmonid relative with dark greenish-brown back, small head, and delicate fleshy adipose fin.",
    "habitatBehavior": "Inhabits deep, icy, highly-oxygenated hypolimnion zones of northern glacial lakes.",
    "dietNotes": "Bottom feeder consuming amphipods, midge pupae, and small spoons.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Lake_whitefish"
  },
  "48": {
    "scientificName": "Esox lucius",
    "visualDescription": "Elongate freshwater predator with duck-bill snout, mottled bean-shaped yellow-white spots on dark olive flanks, and razor-sharp teeth.",
    "habitatBehavior": "Conceals itself in dense cabbage weeds and drop-off ambush points.",
    "dietNotes": "Ruthless carnivore ambushing perch, suckers, frogs, and flash spinners.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Northern_pike"
  },
  "49": {
    "scientificName": "Esox niger",
    "visualDescription": "Slender esocid distinguished by an intricate dark chain-like pattern overlaying yellowish-green flanks and vertical eye teardrop bar.",
    "habitatBehavior": "Ambush specialist lurking in shallow, weed-choked lake coves and lily beds.",
    "dietNotes": "Explosive strike on small fish, frogs, spinners, and surface plugs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Chain_pickerel"
  },
  "50": {
    "scientificName": "Esox masquinongy × Esox lucius",
    "visualDescription": "Magnificent sterile hybrid combining the barred vertical stripes of a muskie with the teardrop markings of northern pike.",
    "habitatBehavior": "Cruises deep lake weed contours and rock shelves hunting trophy forage.",
    "dietNotes": "Voracious hunter hitting large swimbaits, jerkbaits, and crankbaits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Tiger_muskellunge"
  },
  "51": {
    "scientificName": "Esox masquinongy",
    "visualDescription": "The legendary apex freshwater predator with long olive flanks, dark vertical bars, and rows of razor dagger teeth.",
    "habitatBehavior": "Commands prime structure: isolated rock humps, main-lake points, and weed flats.",
    "dietNotes": "Consumes mature suckers, bass, waterfowl, and large jointed crankbaits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Muskellunge"
  },
  "52": {
    "scientificName": "Salvelinus namaycush",
    "visualDescription": "Deep-lake giant char with deeply forked tail, dark gray-green back covered in pale yellow-white spots, and thick girth.",
    "habitatBehavior": "Dwells in the freezing abyss of deep glacial lakes down to 200 feet deep.",
    "dietNotes": "Hunts ciscoes, alewives, and smelt near the bottom; hits heavy spoons and crankbaits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Lake_trout"
  },
  "53": {
    "scientificName": "Lota lota",
    "visualDescription": "The only freshwater cod; elongate eel-like body with smooth mottled skin, single chin barbel, and long dorsal and anal fins.",
    "habitatBehavior": "Hides in cold, dark subterranean lake trenches under deep rocks.",
    "dietNotes": "Nocturnal feeder on crayfish, sculpins, and jigged cut bait.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Burbot"
  },
  "54": {
    "scientificName": "Aplodinotus grunniens",
    "visualDescription": "Hump-backed silvery fish with large scales, rounded tail, and sonic muscles that produce characteristic deep croaking sounds.",
    "habitatBehavior": "Schools along sandy flats and gravel bars in large open lakes.",
    "dietNotes": "Crushes freshwater clams, snails, and crayfish with heavy pharyngeal plates.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Freshwater_drum"
  },
  "55": {
    "scientificName": "Acipenser fulvescens",
    "visualDescription": "Ancient armored survivor with five rows of sharp bony scutes, sensory barbels, and long pointed snout.",
    "habitatBehavior": "Cruises vast, deep lake basins and silt-gravel transition zones.",
    "dietNotes": "Vacuums bottom-dwelling insect larvae, clams, snails, and stinky baits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Lake_sturgeon"
  },
  "56": {
    "scientificName": "Acipenser fulvescens",
    "visualDescription": "Century-old massive sturgeon displaying worn, rounded scutes, ancient dark slate armor, and immense girth.",
    "habitatBehavior": "Rests in the deepest unexplored trenches of glacial lakes.",
    "dietNotes": "Ancient titan requiring heavy scent bait and monster-rated tackle.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Lake_sturgeon"
  },
  "57": {
    "scientificName": "Amia calva",
    "visualDescription": "Prehistoric air-breathing predator with cylindrical olive body, long undulating dorsal fin, and a dark spot ringed in yellow at the tail.",
    "habitatBehavior": "Inhabits stagnant, oxygen-poor swamp backwaters, weed tangles, and cypress swamps.",
    "dietNotes": "Vicious carnivore devouring crayfish, frogs, and live fish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Bowfin"
  },
  "58": {
    "scientificName": "Ictalurus punctatus",
    "visualDescription": "Sleek silvery-gray catfish with deeply forked tail, dark pepper spots along flanks, and long sensory barbels.",
    "habitatBehavior": "Favors slow-moving channels, sunken timber, and deep bayou washouts.",
    "dietNotes": "Relies on acute sense of smell for cheese baits, chicken liver, and crawfish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Channel_catfish"
  },
  "59": {
    "scientificName": "Pylodictis olivaris",
    "visualDescription": "Massive flattened head with protruding lower jaw, mottled yellowish-brown camo skin, and squared caudal fin.",
    "habitatBehavior": "Lurks tightly within deep cypress root washouts and underwater logjams.",
    "dietNotes": "Strict live-prey hunter devouring large live sunfish, bullheads, and crawfish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Flathead_catfish"
  },
  "60": {
    "scientificName": "Ictalurus furcatus",
    "visualDescription": "Heavy slate-blue catfish with distinct humped back, deeply forked tail, and straight-edged anal fin.",
    "habitatBehavior": "Commands deep, swift bayou river channels and deep open holes.",
    "dietNotes": "Voracious feeder on fresh cut shad, mussels, and pungent scent bait.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Blue_catfish"
  },
  "61": {
    "scientificName": "Lepisosteus oculatus",
    "visualDescription": "Primitive ambush gar covered in diamond-shaped ganoid enamel scales, covered in distinct round dark olive spots.",
    "habitatBehavior": "Basks motionlessly near the surface around cypress knees and duckweed mats.",
    "dietNotes": "Snaps sideways with sharp needle teeth to snare passing minnows.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Spotted_gar"
  },
  "62": {
    "scientificName": "Lepisosteus platostomus",
    "visualDescription": "Compact gar with a shorter, broader snout lacking dark spots on the head, covered in interlocking armor.",
    "habitatBehavior": "Frequents calm bayou sloughs and turbid mud-bottom channels.",
    "dietNotes": "Ambushes forage fish, crayfish, and insects near the surface.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Shortnose_gar"
  },
  "63": {
    "scientificName": "Lepisosteus osseus",
    "visualDescription": "Remarkably long, slender snout packed with fine needle teeth, greenish-gray armor, and spotted median fins.",
    "habitatBehavior": "Drifts like a waterlogged stick along sluggish bayou weed beds.",
    "dietNotes": "Strikes small schooling fish sideways; often caught on frayed nylon lures.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Longnose_gar"
  },
  "64": {
    "scientificName": "Ictiobus cyprinellus",
    "visualDescription": "Heavy, deep-bodied brownish-olive catostomid with large scales and a large oblique terminal mouth.",
    "habitatBehavior": "Schools in quiet bayou oxbows and floodplain backwaters.",
    "dietNotes": "Filters zooplankton and grazes on sweet corn and organic detritus.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Bigmouth_buffalo"
  },
  "65": {
    "scientificName": "Ictiobus bubalus",
    "visualDescription": "Distinguished by a high-arched back, bluish-gray metallic sheen, and small downward-facing sucker mouth.",
    "habitatBehavior": "Frequents deeper channels with moderate current and firm clay bottom.",
    "dietNotes": "Benthic feeder rooting for bottom mollusks, insect larvae, and corn.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Smallmouth_buffalo"
  },
  "66": {
    "scientificName": "Polyodon spathula",
    "visualDescription": "Ancient scaleless chondrostean with an elongated, paddle-shaped rostrum and enormous gaping filter-feeding mouth.",
    "habitatBehavior": "Cruises deep bayou oxbow lakes and muddy river channels.",
    "dietNotes": "Filters zooplankton through fine gill rakers; struck on heavy jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Paddlefish"
  },
  "67": {
    "scientificName": "Atractosteus spatula",
    "visualDescription": "Monstrous living dinosaur with broad alligator-like snout, double row of large fangs in upper jaw, and heavy diamond armor.",
    "habitatBehavior": "Inhabits murky, slow-moving bayou waters and brackish tidal marshes.",
    "dietNotes": "Apex swamp predator eating whole fish, waterfowl, and bloodworm clusters.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Alligator_gar"
  },
  "68": {
    "scientificName": "Pylodictis olivaris",
    "visualDescription": "Triple-digit weight swamp flathead with gigantic shovel head, sunken eyes, and massive muscular tail.",
    "habitatBehavior": "Rules the deep, dark washouts under century-old cypress root tangles.",
    "dietNotes": "Requires large live cut baits, heavy line, and brute strength to land.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Flathead_catfish"
  },
  "69": {
    "scientificName": "Atractosteus spatula var.",
    "visualDescription": "Rare ghostly albino alligator gar gleaming with bone-white armored scales and piercing pale pink eyes.",
    "habitatBehavior": "A legendary specter lurking in the deepest, most secluded cypress swamp holes.",
    "dietNotes": "Ancient apex beast reachable only with mystical dragon scale bait.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Alligator_gar"
  },
  "70": {
    "scientificName": "Scomber scombrus",
    "visualDescription": "Iridescent blue-green dorsum patterned with wavy dark zebra stripes, silvery belly, and small finlets behind dorsal fin.",
    "habitatBehavior": "Fast pelagic coastal schools feeding actively in open tidal currents and off piers.",
    "dietNotes": "Strikes small flash spinners, feather jigs, and baitfish schools.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_mackerel"
  },
  "71": {
    "scientificName": "Sardinops sagax",
    "visualDescription": "Slender silvery baitfish with dark bluish-green back and a row of dark spots along the upper flank.",
    "habitatBehavior": "Forms massive bait balls in open coastal waters, drawing predatory seabirds and gamefish.",
    "dietNotes": "Filter feeds on coastal phytoplankton and zooplankton.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Pacific_sardine"
  },
  "72": {
    "scientificName": "Mugil cephalus",
    "visualDescription": "Stout cigar-shaped coastal fish with grayish-olive back, distinct horizontal dark stripes, and blunt snout with small mouth.",
    "habitatBehavior": "Schools in shallow coastal estuaries, surf zones, and salt marshes; often leaps clear of water.",
    "dietNotes": "Grazes on benthic microalgae and bread crumbs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Flathead_grey_mullet"
  },
  "73": {
    "scientificName": "Paralichthys dentatus",
    "visualDescription": "Left-eyed predatory flatfish with camo-brown upper surface covered in 10 to 14 eye-like ocelli and sharp canine teeth.",
    "habitatBehavior": "Buries itself in coastal sandbars and inlet channels waiting for passing bait.",
    "dietNotes": "Explosive ambush predator taking live minnows, squid strips, and bucktail jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Summer_flounder"
  },
  "74": {
    "scientificName": "Pseudopleuronectes americanus",
    "visualDescription": "Right-eyed flatfish with thick oval body, muddy reddish-brown camouflage, and small toothless mouth.",
    "habitatBehavior": "Resting flat on muddy inshore bays, estuaries, and cold harbor bottoms.",
    "dietNotes": "Pecks at seaworms, small shrimp, and clam bits with downward mouth.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Winter_flounder"
  },
  "75": {
    "scientificName": "Centropristis striata",
    "visualDescription": "Dark smoky-black to blue fish with pale grid patterns, spiny dorsal fin tipped in white, and tri-lobed tail with trailing filament.",
    "habitatBehavior": "Congregates around coastal rocky reefs, jetties, shipwrecks, and pier pilings.",
    "dietNotes": "Bottom feeder devouring crabs, clams, squid, and jigged lures.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Black_sea_bass"
  },
  "76": {
    "scientificName": "Archosargus probatocephalus",
    "visualDescription": "Deep compressed silvery body marked with 5 to 7 vertical black bars, equipped with human-like incisor teeth.",
    "habitatBehavior": "Graze closely on barnacle-encrusted bridge pilings, jetties, and oyster reefs.",
    "dietNotes": "Picks barnacles and crushes crabs, clams, and fiddler crabs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Sheepshead_(fish)"
  },
  "77": {
    "scientificName": "Cynoscion nebulosus",
    "visualDescription": "Sleek silvery marine sciaenid with dark spots scattered over upper back and dorsal/tail fins, featuring two prominent upper vampire fangs.",
    "habitatBehavior": "Stalks shallow coastal seagrass flats, oyster reefs, and tidal marsh cuts.",
    "dietNotes": "Hunts live shrimp, finger mullet, and minnows.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Cynoscion_nebulosus"
  },
  "78": {
    "scientificName": "Morone saxatilis",
    "visualDescription": "Powerful migratory gamefish with silvery flanks striped with seven to eight continuous dark horizontal lines.",
    "habitatBehavior": "Rides breaking surf, tidal rips, rocky headlands, and turbulent inlet currents.",
    "dietNotes": "Aggressive predator smashing swimming plugs, shad, and crankbaits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Striped_bass"
  },
  "79": {
    "scientificName": "Sciaenops ocellatus",
    "visualDescription": "Copper-bronze coastal drum featuring a prominent black false eye-spot near the base of the tail to deceive predators.",
    "habitatBehavior": "Tails in shallow coastal spartina marshes and patrols surf beaches.",
    "dietNotes": "Roots out blue crabs, mullet, and strikes crankbaits and gold spoons.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Red_drum"
  },
  "80": {
    "scientificName": "Pogonias cromis",
    "visualDescription": "Heavy gray-black drum with chin barbels, deeply arched back, and thick crushing pharyngeal teeth.",
    "habitatBehavior": "Forages over deep tidal passes, shellfish beds, and coastal pier bottoms.",
    "dietNotes": "Crushes hard-shelled mollusks, oysters, and stinky clam baits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Black_drum"
  },
  "81": {
    "scientificName": "Pomatomus saltatrix",
    "visualDescription": "Streamlined greenish-blue predator with broad forked tail and a mouthful of razor-sharp triangular teeth.",
    "habitatBehavior": "Marauds through open surf breaks and coastal rips in feeding frenzies.",
    "dietNotes": "Viciously chops through menhaden, mullet, and metal spoons.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Bluefish"
  },
  "82": {
    "scientificName": "Centropomus undecimalis",
    "visualDescription": "Sleek predatory gamefish with pronounced black lateral stripe, sloping forehead, and divided dorsal fins.",
    "habitatBehavior": "Ambush feeder tucked under mangrove roots, dock lights, and tidal bridge shadow lines.",
    "dietNotes": "Inhales passing mullet, shrimp, and feathered jigs with loud pop.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Common_snook"
  },
  "83": {
    "scientificName": "Megalops atlanticus",
    "visualDescription": "The 'Silver King'; massive reflective mirror scales, upturned bucket mouth, and long trailing dorsal ray.",
    "habitatBehavior": "Cruises coastal channels, mangrove lagoons, and shallow coastal flats.",
    "dietNotes": "Explosive leaps when hooked; feeds on crabs, pinfish, and whole shad.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Tarpon"
  },
  "84": {
    "scientificName": "Rachycentron canadum",
    "visualDescription": "Dark brown shark-like silhouette with flattened head, white belly, and distinct dark brown lateral band.",
    "habitatBehavior": "Curiously follows manta rays, sea turtles, channel buoys, and pilings.",
    "dietNotes": "Hunts swimming crabs, eels, squid, and deep leadhead jigs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Cobia"
  },
  "85": {
    "scientificName": "Hippoglossus stenolepis",
    "visualDescription": "Immense flatfish with diamond-shaped dark brown camo top and stark white underside, armed with sharp teeth.",
    "habitatBehavior": "Lies on deep coastal gravel shelves and abyssal marine trenches.",
    "dietNotes": "Devours whole cod, octopus, crab, and stinky clam bait.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Pacific_halibut"
  },
  "86": {
    "scientificName": "Oncorhynchus tshawytscha",
    "visualDescription": "Ocean-phase King Salmon gleaming chrome with dark blue-green back and irregular black spots covering both tail lobes.",
    "habitatBehavior": "Hunts schools of herring along deep coastal drop-offs and underwater canyons.",
    "dietNotes": "Voracious feeder striking baitfish schools, flashers, and shad.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Chinook_salmon"
  },
  "87": {
    "scientificName": "Thunnus albacares",
    "visualDescription": "Sleek hydrodynamic pelagic torpedo with bright golden-yellow sickle dorsal and anal fins and brilliant yellow finlets.",
    "habitatBehavior": "Hunts in high-speed pelagic packs around offshore temperature breaks and ocean flotsam.",
    "dietNotes": "Blitzes flying fish, saury, and squid with blistering speed.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Yellowfin_tuna"
  },
  "88": {
    "scientificName": "Thunnus thynnus",
    "visualDescription": "Gigantic warm-blooded pelagic leviathan with deep cobalt back, shimmering platinum sides, and immense muscular propulsion.",
    "habitatBehavior": "Migrates thousands of miles across open ocean currents and offshore banks.",
    "dietNotes": "Apex ocean carnivore consuming mackerel, herring, and whole squid.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_bluefin_tuna"
  },
  "89": {
    "scientificName": "Thunnus thynnus",
    "visualDescription": "Legendary thousand-pound ocean monarch with barrel-sized girth, midnight-blue back, and unmatched swimming stamina.",
    "habitatBehavior": "Commands the deep open ocean abyss and shelf drop-offs.",
    "dietNotes": "Grand pelagic beast requiring maximum gear and mystical dragon lures.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_bluefin_tuna"
  },
  "90": {
    "scientificName": "Amphiprion ocellaris",
    "visualDescription": "Vibrant orange body accented by three clean vertical white bars outlined in crisp black margins.",
    "habitatBehavior": "Lives in symbiotic safety among sea anemone tentacles on shallow sunlit coral heads.",
    "dietNotes": "Picks at copepods, plankton, and bread fragments.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Ocellaris_clownfish"
  },
  "91": {
    "scientificName": "Paracanthurus hepatus",
    "visualDescription": "Vivid royal-blue oval body with bold black painterly palette pattern and bright yellow triangular tail.",
    "habitatBehavior": "Darts among branching coral colonies and current-washed reef crests.",
    "dietNotes": "Herbivore feeding primarily on filamentous reef algae and worms.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Paracanthurus"
  },
  "92": {
    "scientificName": "Sparisoma viride",
    "visualDescription": "Terminal phase male displays brilliant emerald-green body with salmon and yellow spots, and crescent tail with yellow band.",
    "habitatBehavior": "Patrols shallow coral patch reefs and outer reef lagoons.",
    "dietNotes": "Scrapes coral rock with fused parrot beak to digest endolithic algae.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Stoplight_parrotfish"
  },
  "93": {
    "scientificName": "Holacanthus ciliaris",
    "visualDescription": "Magnificent reef fish glowing electric blue and yellow, with dark forehead 'crown' speckled with blue jewels.",
    "habitatBehavior": "Glides majestically around deep coral crevices, sponges, and reef drop-offs.",
    "dietNotes": "Specialized feeder on marine sponges, tunicates, and worms.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Queen_angelfish"
  },
  "94": {
    "scientificName": "Ocyurus chrysurus",
    "visualDescription": "Graceful silvery-pink snapper featuring a bright canary-yellow mid-lateral stripe extending onto a deeply forked yellow tail.",
    "habitatBehavior": "Schools in mid-water above vibrant coral formations and drop-offs.",
    "dietNotes": "Eats small schooling baitfish, minnows, and swimming crabs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Yellowtail_snapper"
  },
  "95": {
    "scientificName": "Lutjanus analis",
    "visualDescription": "Olive-green back fading to reddish flanks with distinctive small black spot above the lateral line and pale blue eye line.",
    "habitatBehavior": "Hugs deep reef rubble channels and sandy drop-off pockets.",
    "dietNotes": "Feeds on conchs, crabs, and stinky clam baits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Mutton_snapper"
  },
  "96": {
    "scientificName": "Lutjanus campechanus",
    "visualDescription": "Deep rosy-red body with triangular head, red iris, and sharp canine teeth.",
    "habitatBehavior": "Schools tightly over deep coral shelves, ledges, and artificial reefs.",
    "dietNotes": "Crustaceans, squid, and stinky clam chunks.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Northern_red_snapper"
  },
  "97": {
    "scientificName": "Pterois volitans",
    "visualDescription": "Dramatic striped fish sporting elaborate fan-like pectoral fins and venomous needle-like dorsal spines in red, white, and brown.",
    "habitatBehavior": "Hovers motionless beneath reef overhangs and coral pinnacles.",
    "dietNotes": "Inhales small reef fish and shrimp with explosive buccal expansion.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Red_lionfish"
  },
  "98": {
    "scientificName": "Gymnothorax moringa",
    "visualDescription": "Serpentine scaleless eel with pale cream skin densely covered in dark brown and black overlapping spots.",
    "habitatBehavior": "Coils within dark cavernous coral recesses with mouth gaping rhythmically.",
    "dietNotes": "Nocturnal ambush hunter grabbing octopus, crabs, and crawfish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Spotted_moray"
  },
  "99": {
    "scientificName": "Sphyraena barracuda",
    "visualDescription": "Long cylindrical silver predator with dark crossbars, prominent underbite, and razor-sharp fang teeth.",
    "habitatBehavior": "Cruises coral drop-offs and shallow reef flats stalking prey.",
    "dietNotes": "Explosive ambush attacks on shiny baitfish and crankbaits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Great_barracuda"
  },
  "100": {
    "scientificName": "Caranx ignobilis",
    "visualDescription": "Powerhouse reef predator with steep forehead profile, silvery-black armor, and formidable crushing jaws.",
    "habitatBehavior": "Hunts coral reef margins, channels, and crashing surf breaks with raw power.",
    "dietNotes": "Aggressive biter attacking surface poppers, reef fish, and crankbaits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Giant_trevally"
  },
  "101": {
    "scientificName": "Acanthocybium solandri",
    "visualDescription": "Ultra-sleek torpedo-shaped predator with iridescent blue back, vertical tiger bands, and scissor-like serrated jaws.",
    "habitatBehavior": "High-speed cruiser along outer blue-water reef walls and drop-offs.",
    "dietNotes": "Strikes high-speed trolled lures, flying fish, and crankbaits.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Wahoo"
  },
  "102": {
    "scientificName": "Coryphaena hippurus",
    "visualDescription": "Dazzling iridescent colors of electric green, bright yellow, and gold; males possess steep vertical bull foreheads.",
    "habitatBehavior": "Hunts near floating sargassum mats, reef drop-offs, and flotsam.",
    "dietNotes": "Fast surface hunter chasing flying fish, squid, and bright lures.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Mahi-mahi"
  },
  "103": {
    "scientificName": "Epinephelus itajara",
    "visualDescription": "Gigantic broad-headed grouper with rounded tail, mottled yellowish-brown camo, and cavernous suction mouth.",
    "habitatBehavior": "Lives in deep coral caverns, reef ledges, and deep shipwrecks.",
    "dietNotes": "Inhales spiny lobsters, small sharks, crabs, and stinky clam chunks.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_goliath_grouper"
  },
  "104": {
    "scientificName": "Carcharhinus melanopterus",
    "visualDescription": "Streamlined coastal shark easily identified by distinct jet-black tips on first dorsal and lower caudal fins.",
    "habitatBehavior": "Cruises shallow coral reef flats, drop-offs, and channels.",
    "dietNotes": "Active hunter of reef fish, octopuses, cuttlefish, and squid.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Blacktip_reef_shark"
  },
  "105": {
    "scientificName": "Ginglymostoma cirratum",
    "visualDescription": "Docile bottom-dwelling shark with broad rounded fins, smooth brownish skin, and paired barbels near mouth.",
    "habitatBehavior": "Rests stationary on sandy reef bottoms and within dark coral caves.",
    "dietNotes": "Suction feeder extracting conchs, crabs, sea urchins, and clams.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Nurse_shark"
  },
  "106": {
    "scientificName": "Makaira nigricans",
    "visualDescription": "Magnificent cobalt-blue apex billfish with long pointed spear, cobalt dorsal fin, and muscular crescent tail.",
    "habitatBehavior": "Patrols open pelagic waters along outer barrier reef contours.",
    "dietNotes": "Slashes through tuna, squid, and bonito schools with bill.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_blue_marlin"
  },
  "107": {
    "scientificName": "Xiphias gladius",
    "visualDescription": "Broadbill gladiator with enormous black eyes, bronze-brown back, and flat sword-shaped bill measuring one-third its length.",
    "habitatBehavior": "Basks near deep outer reef drop-offs at night after deep day dives.",
    "dietNotes": "Slashes deep-water squid, lanternfish, and pelagic fish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Swordfish"
  },
  "108": {
    "scientificName": "Istiophorus platypterus",
    "visualDescription": "Fastest fish in the ocean; recognizable by its colossal cobalt-blue sail dorsal fin spotted with black dots and slender bill.",
    "habitatBehavior": "Hunts along warm outer reef edges and thermal boundary currents.",
    "dietNotes": "Cooperative hunter corralling sardines, flying fish, and squid.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Sailfish"
  },
  "109": {
    "scientificName": "Makaira nigricans",
    "visualDescription": "Mythic thousand-pound Sovereign of the deep reefs; deep midnight-indigo hue with glowing phosphor stripes and majestic spear.",
    "habitatBehavior": "Rules the abyssal drop-offs where the barrier reef plummets into the open ocean.",
    "dietNotes": "Supreme ocean titan requiring dragon scale bait to tempt into striking.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_blue_marlin"
  },
  "110": {
    "scientificName": "Lepomis megalotis",
    "visualDescription": "Stunningly colorful freshwater panfish with a bright red-orange breast, intricate wavy turquoise streaks, and a long flexible dark ear flap rimmed in white.",
    "habitatBehavior": "Inhabits calm shallow pond margins, backwaters, and clear rocky structures.",
    "dietNotes": "Feeds on aquatic insects, damselfly larvae, tiny worms, and micro-crustaceans.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Longear_sunfish"
  },
  "111": {
    "scientificName": "Salvelinus malma",
    "visualDescription": "Sleek coldwater char with an olive-green to bronze back, pale pink and cream spots along the flanks, and crisp white leading edges on lower fins.",
    "habitatBehavior": "Dwells in pristine, fast-flowing gravel riverbeds and deep canyon plunge pools.",
    "dietNotes": "Predatory feeder consuming salmon roe, aquatic nymphs, minnows, and small sculpins.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Dolly_Varden_trout"
  },
  "112": {
    "scientificName": "Salvelinus fontinalis x namaycush",
    "visualDescription": "Prized hatchery-born lake hybrid displaying vermiculated olive-green back patterns, golden flanks with pinkish halos, and a slightly forked tail.",
    "habitatBehavior": "Cruises deep cold thermoclines and rocky drop-offs in northern lakes.",
    "dietNotes": "Aggressive gamefish targeting yellow perch, ciscoes, smelts, and aquatic insects.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Splake"
  },
  "113": {
    "scientificName": "Esox americanus americanus",
    "visualDescription": "Compact swamp ambush predator with dark vertical tiger-striped bars, a distinct dark vertical teardrop below each eye, and fiery vermilion-red fins.",
    "habitatBehavior": "Stalks heavily vegetated cypress bayous, slow-moving tea-colored backwaters, and weed beds.",
    "dietNotes": "Lurks motionless to strike juvenile sunfish, frogs, crayfish, and swamp minnows.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Redfin_pickerel"
  },
  "114": {
    "scientificName": "Trachinotus carolinus",
    "visualDescription": "Gleaming compressed marine gamefish with a brilliant silvery body, metallic golden-yellow breast, and deeply forked tail.",
    "habitatBehavior": "Feeds actively in the churning surf zone, beach troughs, and tidal inlets along coastal beaches.",
    "dietNotes": "Digs through wave wash for sand fleas (mole crabs), small coquina clams, and ghost shrimp.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Florida_pompano"
  },
  "115": {
    "scientificName": "Rhinecanthus aculeatus",
    "visualDescription": "Geometric tropical reef triggerfish with bold angular black, cream, and turquoise markings, a bright yellow stripe across the snout, and a locking dorsal trigger spine.",
    "habitatBehavior": "Territorial resident of shallow coral flats, lagoons, and sheltering reef crevices.",
    "dietNotes": "Equipped with powerful chisel teeth to crush sea urchins, crabs, coral tips, and hard-shelled mollusks.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Lagoon_triggerfish"
  },
  "116": {
    "scientificName": "Regalecus glesne",
    "visualDescription": "Spectacular elongated silvery ribbon-like deep-sea serpent fish up to 36 feet long, crowned with a tall, vibrant scarlet dorsal crest and long vermilion pelvic ray paddles.",
    "habitatBehavior": "Inhabits the pelagic twilight mesopelagic zone, occasionally rising to calm open ocean surface waters.",
    "dietNotes": "Filter feeds on deep-sea euphausiid krill, small bioluminescent lanternfish, and pelagic crustaceans.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Giant_oarfish"
  },
  "117": {
    "scientificName": "Mesonychoteuthis hamiltoni",
    "visualDescription": "Massive gelatinous reddish-brown mantle with broad rounded fins, enormous dinner-plate eyes with light photophores, and arms equipped with 25 swiveling sharp claw hooks.",
    "habitatBehavior": "Lurks in the abyssal bathypelagic depths of open oceanic trenches thousands of feet below the surface.",
    "dietNotes": "Ambush predator of large deepwater toothfish, sleeper sharks, and abyssal cephalopods.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Colossal_squid"
  },
  "118": {
    "scientificName": "Carcharodon carcharias",
    "visualDescription": "Tremendous hydrodynamic torpedo torso with slate-grey dorsal coloration, a starkly delineated snow-white belly, dark eyes, and a gaping jaw bristling with triangular serrated teeth.",
    "habitatBehavior": "Cruises epipelagic open ocean continental shelves and offshore coastal drop-offs with strong currents.",
    "dietNotes": "Carnivorous apex hunter preying on tuna, marine mammals, pelagic gamefish, and giant rays.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Great_white_shark"
  },
  "119": {
    "scientificName": "Megachasma pelagios",
    "visualDescription": "Bulbous brownish-black head with a gigantic cavernous mouth lined with bioluminescent reflective tissue on the upper jaw and minute filter-feeding teeth.",
    "habitatBehavior": "Performs daily vertical migrations from deep bathypelagic daytime depths to shallow night feeding grounds.",
    "dietNotes": "Filter feeds swimming forward with its glowing mouth agape, swallowing massive plumes of euphausiids and jellyfish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Megamouth_shark"
  },
  "120": {
    "scientificName": "Latimeria chalumnae",
    "visualDescription": "Prehistoric heavily armored lobed-fin fish with mottled deep sapphire-blue scales, white camouflage rosettes, a unique three-lobed diphycercal tail, and fleshy limb-like fins.",
    "habitatBehavior": "Inhabits deep submarine volcanic caves, rocky sea canyons, and steep outer coral reef drop-offs.",
    "dietNotes": "Nocturnal drift-feeder consuming cuttlefish, reef squids, lanternfish, and benthic bottom dwellers.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Coelacanth"
  },
  "121": {
    "scientificName": "Mobula birostris",
    "visualDescription": "Immense diamond-shaped disc wingspan reaching over 20 feet, dark black velvety dorsal surface with striking white shoulder patches, cephalic horn flaps, and wide terminal mouth.",
    "habitatBehavior": "Soars along open oceanic surface corridors, offshore volcanic seamounts, and deep barrier reef channels.",
    "dietNotes": "Ram filter-feeder funneling zooplankton swarms, larval fish, and pelagic crustacean clouds through its gill plates.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Giant_oceanic_manta_ray"
  },
  "122": {
    "scientificName": "Melanocetus johnsonii",
    "visualDescription": "Rounded, pitch-black abyssal predator with sharp needle teeth, tiny beady eyes, and a bioluminescent esca glowing atop a modified dorsal ray.",
    "habitatBehavior": "Lurks in the bathypelagic aphotic ocean trenches between 1,000 and 4,000 meters below the surface.",
    "dietNotes": "Lures lanternfish, deep-sea shrimp, and squids directly into its expandable jaw.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Humpback_anglerfish"
  },
  "123": {
    "scientificName": "Oncorhynchus kisutch",
    "visualDescription": "Streamlined silvery gamefish with dark metallic blue-green back, fine black speckles along the upper back, white gums, and a broad tail.",
    "habitatBehavior": "Migrates from offshore Pacific waters into swift gravel-bottom coastal rivers and cold clear tributaries to spawn.",
    "dietNotes": "Voracious carnivore feeding on herring, sand lance, anchovies, insects, and juvenile salmonids.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Coho_salmon"
  },
  "124": {
    "scientificName": "Alosa sapidissima",
    "visualDescription": "Deep-bodied silvery anadromous herring with an iridescent green-blue dorsal back, a prominent dark shoulder spot behind the gill cover, and a saw-like belly keel.",
    "habitatBehavior": "Schools in coastal ocean waters before undertaking legendary spring spawning runs far up freshwater rivers.",
    "dietNotes": "Filter-feeds on plankton, copepods, small mysid shrimp, and small fish larvae.",
    "wikiUrl": "https://en.wikipedia.org/wiki/American_shad"
  },
  "125": {
    "scientificName": "Balistoides conspicillum",
    "visualDescription": "Spectacular tropical reef triggerfish with large white polka dots across a black belly, a vivid yellow-orange snout saddle, bright orange lips, and a locking first dorsal spine.",
    "habitatBehavior": "Patrols steep outer coral reef slopes and drop-offs with clear water and sheltering caverns.",
    "dietNotes": "Crushes sea urchins, hard corals, crabs, and spiny mollusks with powerful chisel-like jaws.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Clown_triggerfish"
  },
  "126": {
    "scientificName": "Pomacanthus imperator",
    "visualDescription": "Regal deep-bodied coral angelfish with horizontal electric-blue and yellow stripes, a bold black ocular mask edged in cyan, and a vibrant golden tail.",
    "habitatBehavior": "Resident of rich coral reefs, sheltered ledges, and reef caves from 3 to 100 meters depth.",
    "dietNotes": "Feeds on encrusting marine sponges, tunicates, macroalgae, and small benthic invertebrates.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Emperor_angelfish"
  },
  "127": {
    "scientificName": "Gramma loreto",
    "visualDescription": "Vibrant bi-colored reef gem with an electric violet-purple head and front body blending seamlessly into a bright golden-yellow tail, featuring a dark spot on the dorsal fin.",
    "habitatBehavior": "Hovering resident of Caribbean coral caves and overhangs, often swimming upside down against rock ceilings.",
    "dietNotes": "Planktivore feeding on tiny copepods, crustacean larvae, and acting as a cleaner picking ectoparasites from larger fish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Royal_gramma"
  },
  "128": {
    "scientificName": "Triaenodon obesus",
    "visualDescription": "Slender, flexible brownish-gray reef shark with a blunt snout, white belly, and brilliant, conspicuous bright white tips on its dorsal and caudal fin lobes.",
    "habitatBehavior": "Spends daytime resting motionless in coral caves and sandy reef channels, hunting actively through narrow reef crevices at night.",
    "dietNotes": "Specialist hunter of octopuses, crabs, damselfish, parrotfish, and moray eels deep within coral crevices.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Whitetip_reef_shark"
  },
  "129": {
    "scientificName": "Cheilinus undulatus",
    "visualDescription": "Colossal coral reef giant sporting a prominent forehead bump, thick fleshy lips, intricate maze-like blue-green facial patterns, and broad rounded fins.",
    "habitatBehavior": "Solitary roamer along outer coral reef slopes, deep drop-offs, and lagoon channels.",
    "dietNotes": "Immune to toxic prey; crushes crown-of-thorns starfish, boxfish, sea urchins, and giant clams with heavy pharyngeal teeth.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Humphead_wrasse"
  },
  "130": {
    "scientificName": "Centropyge loricula",
    "visualDescription": "Fiery dwarf angelfish showcasing an intense glowing orange-red body with 4 to 5 bold black vertical tiger bars and luminous cobalt-blue edges along the dorsal and anal fins.",
    "habitatBehavior": "Shy inhabitant of shallow stony coral patches, finger coral beds, and surge zones.",
    "dietNotes": "Browses on filamentous microalgae, spirulina, and small benthic detrital micro-crustaceans.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Flame_angelfish"
  },
  "131": {
    "scientificName": "Diodon hystrix",
    "visualDescription": "Stout sandy-tan pufferfish covered in sharp defensive spines, speckled with small dark spots, with large expressive pupils and heavy beak-like crushing plates.",
    "habitatBehavior": "Frequents coral reef ledges, shallow rocky drop-offs, and sheltered lagoon caves.",
    "dietNotes": "Crushes hard-shelled mollusks, sea urchins, hermit crabs, and snails using fused dental plates.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Spot-fin_porcupinefish"
  },
  "132": {
    "scientificName": "Sphyrna mokarran",
    "visualDescription": "Apex predator featuring a wide hammer-shaped cephalofoil head with lateral eyes, tall sickle-like first dorsal fin, and slate-gray to bronze body.",
    "habitatBehavior": "Solitary migratory hunter cruising coastal continental shelves, deep reef drop-offs, and open ocean channels.",
    "dietNotes": "Specialized predator of stingrays, skates, smaller sharks, groupers, and sea catfishes.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Great_hammerhead"
  },
  "133": {
    "scientificName": "Mola mola",
    "visualDescription": "Enormous laterally flattened circular disc fish with tall wing-like dorsal and anal fins and a scalloped clavus rudder in place of a tail.",
    "habitatBehavior": "Basks on its side near the ocean surface to warm up after making deep foraging dives into the twilight zone.",
    "dietNotes": "Consumes vast quantities of jellyfish, salps, siphonophores, and small pelagic crustaceans.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Ocean_sunfish"
  },
  "134": {
    "scientificName": "Synchiropus splendidus",
    "visualDescription": "Dazzling scaleless reef dragonet displaying a maze of psychedelic turquoise-blue and orange labyrinth swirls with fan-shaped fins.",
    "habitatBehavior": "Secretive resident of sheltered coral lagoons, dead coral rubble, and silty reef flats.",
    "dietNotes": "Picks continuously at benthic micro-copepods, amphipods, small gastropods, and polychaete worms.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Mandarinfish"
  },
  "135": {
    "scientificName": "Macropinna microstoma",
    "visualDescription": "Bizarre bathypelagic fish with a delicate transparent fluid-filled cranial shield encasing large, glowing emerald-green tubular eyes directed upward.",
    "habitatBehavior": "Hovers motionlessly in the bathypelagic darkness between 600 and 800 meters, rotating its eyes forward when locking onto prey.",
    "dietNotes": "Steals siphonophore tentacles, small pelagic jellies, and trapped copepods with surgical precision.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Macropinna_microstoma"
  },
  "136": {
    "scientificName": "Chauliodus sloani",
    "visualDescription": "Slender iridescent deep-sea dragonfish with monstrous curved needle fangs that do not fit inside its mouth, folding back against the head, and ventral photophore rows.",
    "habitatBehavior": "Undertakes vertical diel migrations from 1,000 meters up to 400 meters at night to ambush unsuspecting bathypelagic forage.",
    "dietNotes": "Impales lanternfish, small squid, and hatchetfish on its hinged fang bars.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Sloane%27s_viperfish"
  },
  "137": {
    "scientificName": "Eurypharynx pelecanoides",
    "visualDescription": "Pitch-black eel-like fish featuring an astonishingly massive expandable pouch mouth loosely hinged to a tiny skull, ending in a whip-like glowing tail.",
    "habitatBehavior": "Cruises abyssal midwaters with its mouth closed into a small snout, suddenly inflating its pouch to envelope entire shoals or large prey.",
    "dietNotes": "Swallows schools of small mysid crustaceans, cephalopods, and bioluminescent deep-sea shrimp.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Pelican_eel"
  },
  "138": {
    "scientificName": "Chlamydoselachus anguineus",
    "visualDescription": "Living fossil with an elongated dark brown eel-like shark body, six pairs of frilled gill openings around the neck, and 25 rows of three-pronged trident teeth.",
    "habitatBehavior": "Benthic predator slithering through submarine canyons, deep trenches, and continental slopes between 500 and 1,500 meters.",
    "dietNotes": "Strikes like a snake by bending its body and lunging forward to swallow deep-sea squid and benthic bony fish whole.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Frilled_shark"
  },
  "139": {
    "scientificName": "Bathynomus giganteus",
    "visualDescription": "Enormous deep-sea scavenger crustacean with an armored segmented lilac-gray exoskeleton, dozens of hooked jointed legs, and massive triangular compound eyes.",
    "habitatBehavior": "Crawls slowly over muddy abyssal ocean plains up to 2,000 meters deep, adapted to months of metabolic fasting between marine snow falls.",
    "dietNotes": "Scavenges whale falls, sunken fish carcasses, crabs, and deep-sea benthic worms.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Bathynomus_giganteus"
  },
  "140": {
    "scientificName": "Chiasmodon niger",
    "visualDescription": "Dark, slender predatory fish capable of distending its stomach into a translucent balloon to engulf prey over twice its length and ten times its own mass.",
    "habitatBehavior": "Solitary deep-water stalker inhabiting oceanic mesopelagic and bathypelagic zones between 700 and 2,700 meters.",
    "dietNotes": "Swallows whole giant dragonfish, barracudinas, and squid tail-first using backwards-pointing palatine fangs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Black_swallower"
  },
  "141": {
    "scientificName": "Psychrolutes marcidus",
    "visualDescription": "Gelatinous pale pinkish-gray benthic fish whose body density is slightly less than water, allowing it to drift above the sea floor without expending swimming energy.",
    "habitatBehavior": "Rests motionless on deep continental shelves and ocean floor depressions under crushing hydrostatic pressures exceeding 1,000 psi.",
    "dietNotes": "Passively ingests edible organic particles, deep-sea sea pens, micro-crabs, and carrion drifting past its downturned jaws.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Psychrolutes_marcidus"
  },
  "142": {
    "scientificName": "Anoplogaster cornuta",
    "visualDescription": "Ferocious deep-sea predator with dark armored scales and the largest teeth proportionate to body size of any known marine species, fitting into roof sockets beside the brain.",
    "habitatBehavior": "Active hunter ranging from 500 to 5,000 meters beneath the surface, navigating extreme cold and absolute darkness.",
    "dietNotes": "Chases down squid, hatchetfish, and midwater shrimp, locking them tight with formidable fangs.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Fangtooth"
  },
  "143": {
    "scientificName": "Malacosteus niger",
    "visualDescription": "Deep-sea dragonfish possessing hinged lower jaws lacking a floor and suborbital photophores that emit rare far-red bioluminescent light invisible to other animals.",
    "habitatBehavior": "Uses its red headlight beam like night-vision goggles to spot red-pigmented deep-sea prey without alerting them to its presence.",
    "dietNotes": "Preys primarily on calanoid copepods and small bathypelagic lanternfish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Stoplight_loosejaw"
  },
  "144": {
    "scientificName": "Hydrolagus trolli",
    "visualDescription": "Ghostly pale blue-gray chimaera with wing-like pectoral fins, whip-like tail, smooth scaleless skin crisscrossed with open sensory grooves, and fused dental grinding plates.",
    "habitatBehavior": "Glides through the water column above deep submarine canyons and trenches, using sensory canals on its snout to detect minute electrical pulses from buried benthic prey.",
    "dietNotes": "Grinds hard mollusks, brittle stars, deep sea urchins, and benthic worms.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Pointy-nosed_blue_chimaera"
  },
  "145": {
    "scientificName": "Somniosus microcephalus",
    "visualDescription": "Massive prehistoric deep-sea shark with cylindrical heavy gray-brown body, tiny rounded fins, milky eyes hosting bioluminescent Ommatokoita parasites, and rows of razor-sharp slicing teeth.",
    "habitatBehavior": "Prowls lightless abyssal depths down to 7,200 feet in near-freezing waters, possessing the longest confirmed lifespan of any vertebrate on Earth at over 400 years.",
    "dietNotes": "Apex deep scavenger and ambush hunter taking benthic cod, seals, flounders, skates, and carrion in the deep dark ocean.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Greenland_shark"
  },
  "146": {
    "scientificName": "Pseudoliparis swirei",
    "visualDescription": "Small translucent pale pinkish-white snailfish with gelatinous scaleless skin revealing subtle internal organ anatomy, blunt bulbous head, and delicate ribbon fins.",
    "habitatBehavior": "Inhabits the extreme hadal ocean depths of the Mariana Trench between 6,000 and 8,000 meters, thriving under hydrostatic pressures exceeding 1,000 atmospheres.",
    "dietNotes": "Top scavenger and predator in hadal trenches, consuming vast swarms of benthic amphipods and decapod crustaceans.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Pseudoliparis_swirei"
  },
  "147": {
    "scientificName": "Somniosus pacificus",
    "visualDescription": "Gigantic sluggish abyssal shark with heavy cylindrical slate-gray to black torso, short rounded snout, small low-set spineless dorsal fins, and small dark eyes.",
    "habitatBehavior": "Cruises silent sub-arctic continental shelves and deep oceanic trenches up to 6,600 feet down, gliding effortlessly through near-freezing waters.",
    "dietNotes": "Opportunistic predator taking giant Pacific octopuses, bottom flatfish, crabs, and carrion.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Pacific_sleeper_shark"
  },
  "148": {
    "scientificName": "Albatrossia pectoralis",
    "visualDescription": "Huge 7-foot deep-sea macrourid rattail with heavy grayish-brown armored head, large reflective sensory eyes, chin barbel, and long tapering whip-like tail.",
    "habitatBehavior": "Hovers just above deep bathyal and abyssal muddy sea beds along the continental slope between 500 and 3,500 meters.",
    "dietNotes": "Rootles through sediment for brittle stars, benthic polychaete worms, crabs, and small deepwater fishes.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Giant_grenadier"
  },
  "149": {
    "scientificName": "Mitsukurina owstoni",
    "visualDescription": "Ancient living fossil shark featuring a long flat blade-like rostrum snout packed with ampullae of Lorenzini, flabby pinkish body, and slingshot jaws lined with sharp needle teeth.",
    "habitatBehavior": "Stalks lightless continental slopes and submarine canyons between 270 and 1,300 meters deep, hunting with electric sensor detection.",
    "dietNotes": "Catapults its jaws forward at lightning speed to snatch deep-sea teleosts, cephalopods, and decapod crustaceans.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Goblin_shark"
  },
  "150": {
    "scientificName": "Grimpoteuthis bathypelagica",
    "visualDescription": "Charming deep-sea umbrella octopus with dusky reddish-orange mantle, eight webbed arms, and a pair of prominent rounded ear-like fins that flap for propulsion.",
    "habitatBehavior": "Drifts gracefully through the deep bathypelagic and abyssopelagic ocean floor up to 7,000 meters down, foraging above the sediment.",
    "dietNotes": "Swallows whole deep-sea copepods, isopods, amphipods, and benthic bristle worms.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Dumbo_octopus"
  },
  "151": {
    "scientificName": "Magnapinna sp.",
    "visualDescription": "Enigmatic deep-sea squid with huge broad spade-shaped lateral fins spread wide, and ten arms and tentacles bent at 90-degree elbows that trail down as incredibly long thin filaments.",
    "habitatBehavior": "Hovers silently in the water column thousands of meters deep in abyssal trenches, drifting its extremely long tentacles like sticky fishing lines.",
    "dietNotes": "Traps drifting bathypelagic crustaceans, small squids, and gelatinous organism particles in its trailing arm filaments.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Bigfin_squid"
  },
  "152": {
    "scientificName": "Bathypterois grallator",
    "visualDescription": "Specialized benthic fish with three extraordinarily elongated, stiff fin rays extending downward from its pelvic and caudal fins, allowing it to stand on the sea floor like a tripod.",
    "habitatBehavior": "Perches motionlessly facing into deep-sea benthic currents between 1,000 and 6,000 meters deep, waiting for prey to drift into its arching tactile pectoral rays.",
    "dietNotes": "Gently scoops passing bathypelagic copepods, amphipods, and small benthic crustaceans into its wide mouth.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Bathypterois_grallator"
  },
  "153": {
    "scientificName": "Heterobranchus titan",
    "visualDescription": "Immense armored swamp catfish with heavy cranial bone plates forming a protective helmet, mottled olive-bronze coloration, a wide cavernous maw, and eight thick sweeping sensory barbels.",
    "habitatBehavior": "Lurks in oxygen-poor cypress bayous and stagnant river channels beneath floating peat mats, using specialized suctorial breathing organs.",
    "dietNotes": "Ambush predator capable of engulfing large turtles, water snakes, waterfowl, and substantial river fish.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Lau_(cryptid)"
  },
  "154": {
    "scientificName": "Epinephelus lanceolatus titan",
    "visualDescription": "Massive, barrel-chested apex reef titan cloaked in weathered mottled bronze and slate-grey scales, featuring a broad armored jaw capable of creating immense suction, thick rounded fins, and gleaming golden amber eyes.",
    "habitatBehavior": "Inhabits deep outer reef drop-offs, underwater caves, and sunken shipwrecks; fiercely territorial solitary predator known to challenge divers and stalk large marine life.",
    "dietNotes": "Apex reef ambusher capable of inhaling whole reef sharks, sea turtles, stingrays, and massive spiny lobsters in a single explosive gulp.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Giant_grouper"
  },
  "155": {
    "scientificName": "Hydrolagus trolli",
    "visualDescription": "Ghostly pale blue-grey chimaera with smooth, scale-free skin patterned by intricate sensory canal grooves across its snout, translucent wing-like pectoral fins, a whip-like tail, and dead milky-white eyes.",
    "habitatBehavior": "Ancient deep-sea holocephalan roaming steep rocky trenches and seamounts past 6,000 feet; predates dinosaurs by hundreds of millions of years and was first filmed alive in 2016.",
    "dietNotes": "Grinds deep-sea benthic crabs, mollusks, brittle stars, and benthic polychaetes between its mineralized tooth plates.",
    "wikiUrl": "https://en.wikipedia.org/wiki/Pointy-nosed_blue_chimaera"
  },
  "156": {
      "scientificName": "Salmo salar",
      "visualDescription": "Elegantly streamlined anadromous salmon with steel-blue and silver flanks adorned with distinctive black cross-shaped spots and a pale white belly.",
      "habitatBehavior": "Migrates from open subarctic North Atlantic feeding grounds upstream into rapid, cold gravel-bedded rivers to spawn.",
      "dietNotes": "Preys voraciously on capelin, herring, sand lances, and river aquatic invertebrates.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_salmon"
  },
  "157": {
      "scientificName": "Oncorhynchus nerka",
      "visualDescription": "Vibrant crimson-bodied salmon with an emerald-green head, humpback spawning profile, and hooked kype jaws developed during upstream runs.",
      "habitatBehavior": "Spawns in clear glacial river tributaries and lake chains, feeding in vast oceanic circles for several years prior.",
      "dietNotes": "Specialized filter-feeder that strains zooplankton, copepods, krill, and small crustacean larvae.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Sockeye_salmon"
  },
  "158": {
      "scientificName": "Cheilopogon melanurus",
      "visualDescription": "Streamlined iridescent indigo-blue surface cruiser with enormously enlarged, translucent wing-like pectoral fins capable of extended aerial glides.",
      "habitatBehavior": "Schools near the tropical and temperate sea surface; leaps into the air and glides over wave tops to escape pursuing predators.",
      "dietNotes": "Feeds on surface copepods, plankton, floating seaweed organisms, and larval fishes.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Flying_fish"
  },
  "159": {
      "scientificName": "Ophiodon elongatus",
      "visualDescription": "Mottled brown and emerald-tinted green apex predator with a massive tooth-studded maw, continuous dorsal fin, and occasional turquoise-blue flesh.",
      "habitatBehavior": "Territorial ambush hunter hugging deep rocky reefs, sunken boulders, and kelp forests across the North Pacific.",
      "dietNotes": "Aggressively ambushes herring, rockfish, flatfish, squid, and crabs.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Lingcod"
  },
  "160": {
      "scientificName": "Sarda sarda",
      "visualDescription": "Fast, muscular pelagic predator with gleaming metallic blue-green back, silvery flanks, and five to seven dark narrow longitudinal stripes sloping across its upper side.",
      "habitatBehavior": "High-speed schooling coastal predator found chasing baitfish schools in offshore tidal currents and rips.",
      "dietNotes": "Hunts schooling anchovies, silversides, sardines, squid, and mackerel in explosive surface frenzies.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_bonito"
  },
  "161": {
      "scientificName": "Pygocentrus nattereri",
      "visualDescription": "Deep-bodied disc-like characin shimmering in silver and speckled gold, featuring a brilliant fiery red-orange throat, muscular jaw, and razor-sharp interlocking triangular teeth.",
      "habitatBehavior": "Inhabits murky backwater oxbow lakes, flooded cypress swamps, and sluggish creeks, schooling tightly in warm shallows.",
      "dietNotes": "Opportunistic carnivore feeding on fish, insects, crustaceans, and carcasses with ferocious precision.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Red-bellied_piranha"
  },
  "162": {
      "scientificName": "Cichla ocellaris",
      "visualDescription": "Muscular gamefish with warm olive-gold scales, three broad vertical black tiger bands, and a prominent black-and-gold halo eyespot at the base of its tail.",
      "habitatBehavior": "Dominant cichlid prowling warm slow-moving bayous, river margins, and canals with intense visual aggression.",
      "dietNotes": "Explosive surface predator hunting shad, minnows, sunfish, and frogs.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Peacock_bass"
  },
  "163": {
      "scientificName": "Osteoglossum bicirrhosum",
      "visualDescription": "Prehistoric ribbon-bodied surface dweller covered in large pearlescent scales, twin barbels protruding from its lower jaw, and an upward-directed drawbridge mouth.",
      "habitatBehavior": "Cruises calmly beneath floating vegetative canopies; famously leaps several feet clear of the water to snatch prey from overhanging branches.",
      "dietNotes": "Feeds on surface insects, beetles, crabs, spiders, and small unsuspecting fish.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Silver_arowana"
  },
  "164": {
      "scientificName": "Astronotus ocellatus",
      "visualDescription": "Stocky velvet-dark cichlid adorned with intricate fiery red-orange marbling and a distinct orange-ringed black ocellus spot near the caudal peduncle.",
      "habitatBehavior": "Intelligent, highly curious cichlid claiming shelter around submerged cypress roots, fallen timber, and pond rocks.",
      "dietNotes": "Omnivorous browser feeding on snails, river clams, small fish, worms, and benthic larvae.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Oscar_(fish)"
  },
  "165": {
      "scientificName": "Hypostomus plecostomus",
      "visualDescription": "Heavily armored suckermouth catfish with geometric bony dermal plates, mottled earthy-brown skin, and an expansive sailfin dorsal crest.",
      "habitatBehavior": "Clings to submerged timber, stone ledges, and muddy bottoms with its powerful suctorial disc mouth.",
      "dietNotes": "Scrapes algae, biofilm, detritus, and aquatic vegetation from hard surfaces.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Hypostomus_plecostomus"
  },
  "166": {
      "scientificName": "Electrophorus electricus",
      "visualDescription": "Elongated serpentine knifefish with smooth muddy-grey skin, yellowish-orange throat, flattened skull, and specialized bioelectric organ tissues lining four-fifths of its body.",
      "habitatBehavior": "Nocturnal air-breather navigating murky bayou sloughs and oxygen-depleted swamps with steady low-voltage electrolocation pulses.",
      "dietNotes": "Delivers sudden high-voltage discharges up to 860 volts to stun amphibians, catfish, and crustaceans.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Electric_eel"
  },
  "167": {
      "scientificName": "Toxotes jaculatrix",
      "visualDescription": "Compact, silver-sheened fish with bold black teardrop vertical stripes, a flattened dorsal line, and large mobile eyes oriented toward the water surface.",
      "habitatBehavior": "Dwells in peaceful mangrove margins and calm ponds; shoots high-velocity water droplets up to six feet into air to knock insects into the water.",
      "dietNotes": "Insectivore specializing in terrestrial crickets, moths, beetles, and aquatic spiders.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Archerfish"
  },
  "168": {
      "scientificName": "Remora remora",
      "visualDescription": "Slender, dark grey marine hitchhiker with an oval, slatted laminated suction disc atop its head used to latch onto pelagic hosts.",
      "habitatBehavior": "Commensal voyager that anchors itself onto sharks, rays, billfish, and boat hulls to hitchhike across ocean expanses.",
      "dietNotes": "Consumes host food scraps, parasitic copepods, and passing pelagic zooplankton.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Common_remora"
  },
  "169": {
      "scientificName": "Bodianus pulcher",
      "visualDescription": "Dramatic wrasse with striking color zones: jet-black head and tail flanking a brilliant crimson-red midbody, white chin, and prominent canine teeth.",
      "habitatBehavior": "Inhabits Pacific kelp forests and rocky coastal reefs, using strong teeth to dislodge hard-shelled prey from rocks.",
      "dietNotes": "Feeds on sea urchins, crabs, spiny lobsters, barnacles, and mollusks.",
      "wikiUrl": "https://en.wikipedia.org/wiki/California_sheephead"
  },
  "170": {
      "scientificName": "Strongylura marina",
      "visualDescription": "Slender, needle-thin marine surface dweller with translucent green-blue back, silvery belly, and elongated beaked jaws densely packed with sharp teeth.",
      "habitatBehavior": "Skims tranquil coastal estuaries, bays, and pier shallows, leaping across the surface when startled.",
      "dietNotes": "Lightning-fast ambusher of killifish, silversides, and juvenile anchovies.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_needlefish"
  },
  "171": {
      "scientificName": "Triakis semifasciata",
      "visualDescription": "Slender, bronze-toned houndshark distinguished by striking black saddle bands and dark leopard-like spots scattered along its back and sides.",
      "habitatBehavior": "Peaceful benthic shark cruising sandy flats, bays, and kelp beds, often in loose nomadic schools.",
      "dietNotes": "Roots out fat innkeeper worms, crabs, shrimp, clams, and small flatfish from bottom sediments.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Leopard_shark"
  },
  "172": {
      "scientificName": "Isurus oxyrinchus",
      "visualDescription": "The fastest shark in the sea, possessing an aerodynamic hydrofoil body cloaked in brilliant metallic cobalt blue, snow-white underside, and slender curved fangs.",
      "habitatBehavior": "High-octane pelagic hunter capable of burst speeds over 45 mph and legendary acrobatic jumps when hooked.",
      "dietNotes": "Hunts fast pelagic prey including bluefish, swordfish, tuna, squid, and smaller sharks.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Shortfin_mako_shark"
  },
  "173": {
      "scientificName": "Alopias vulpinus",
      "visualDescription": "Graceful deep-blue pelagic shark distinguished by an enormous, scythe-like upper tail lobe measuring as long as the rest of its entire body.",
      "habitatBehavior": "Roams open coastal waters and ocean drop-offs, using its whip-like caudal fin like a flail to stun schooling baitfish.",
      "dietNotes": "Stuns and corrals mackerel, herring, bluefish, and squid with sonic caudal tail strikes.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Common_thresher"
  },
  "174": {
      "scientificName": "Pristis pectinata",
      "visualDescription": "Prehistoric ray with a heavy shark-like silhouette and a long, flattened blade-like snout armed with 25 to 32 pairs of sharp lateral rostral teeth.",
      "habitatBehavior": "Inhabits shallow coastal bays, brackish lagoons, and mangrove swamps, swinging its saw side-to-side through schools of fish.",
      "dietNotes": "Disables mullets, menhaden, and crabs with rapid slashing sweeps of its toothed rostrum.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Smalltooth_sawfish"
  },
  "175": {
      "scientificName": "Arapaima gigas",
      "visualDescription": "Colossal armored freshwater titan with a broad greenish-bronze bony skull, massive red-edged scales forming a crimson tail flank, and air-breathing labyrinth lungs.",
      "habitatBehavior": "Reigns supreme in ancient flooded bayous and slow-moving river oxbows, surfacing periodically with a distinctive resonant gulp.",
      "dietNotes": "Apex carnivore that inhales large fish, turtles, crustaceans, and small birds with explosive suction.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Arapaima"
  },
  "176": {
      "scientificName": "Salvelinus alpinus",
      "visualDescription": "Cold-water salmonid with an olive-slate back and brilliant fiery red-orange flanks adorned with pale pink spots and bright white fin margins.",
      "habitatBehavior": "Inhabits glacial melt rivers, subarctic tarns, and coastal fiords; survives beneath winter lake ice.",
      "dietNotes": "Feeds on aquatic insect larvae, freshwater snails, amphipods, and small schooling fish.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Arctic_char"
  },
  "177": {
      "scientificName": "Gadus morhua",
      "visualDescription": "Heavily built benthopelagic fish with greenish-brown mottled skin, three distinct dorsal fins, a pale white lateral line, and a chin barbel.",
      "habitatBehavior": "Schools along cold rocky continental shelves, banks, and coastal fjord channels in the North Atlantic.",
      "dietNotes": "Predatory carnivore hunting capelin, herring, sand lances, and deep-water crabs.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_cod"
  },
  "178": {
      "scientificName": "Stenodus leucichthys",
      "visualDescription": "Immense silvery coregonid known as the Eskimo Tarpon, featuring large reflective scales and an aggressively undershot lower jaw.",
      "habitatBehavior": "Cruises muddy subarctic rivers and glacial estuaries across the Arctic basin; leaps when hooked.",
      "dietNotes": "Voracious predator feeding primarily on other fish such as whitefish, smelt, and pike.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Beloribitsa"
  },
  "179": {
      "scientificName": "Pollachius virens",
      "visualDescription": "Streamlined, muscular gadid with dark olive-black back, silvery-grey flanks, a stark white lateral line, and a slight chin barbel.",
      "habitatBehavior": "Fast-swimming pelagic schooling fish hunting midwater baitfish over coastal banks and deep rocky ledges.",
      "dietNotes": "Chases herring, sprat, sand eels, and euphausiids in vigorous hunting packs.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Pollachius_virens"
  },
  "180": {
      "scientificName": "Melanogrammus aeglefinus",
      "visualDescription": "Sleek silvery-grey marine groundfish with a prominent dark black lateral line and a distinct dark thumbprint blotch above the pectoral fin.",
      "habitatBehavior": "Dwells in cold North Atlantic waters over deep gravel, sand, and shell bottoms between 130 and 450 feet.",
      "dietNotes": "Bottom browser that roots out brittle stars, sea urchins, mollusks, and benthic worms.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Haddock"
  },
  "181": {
      "scientificName": "Anarhichas lupus",
      "visualDescription": "Ferocious eel-like predator with powerful crushing jaws armed with prominent forward-pointing canine fangs and dark blue-grey banding.",
      "habitatBehavior": "Inhabits rocky crevices, boulder fields, and deep caves along frigid North Atlantic fjord walls; blood contains natural antifreeze.",
      "dietNotes": "Crushes hard-shelled sea urchins, large green crabs, deep-sea whelks, and queen scallops.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Atlantic_wolffish"
  },
  "182": {
      "scientificName": "Coregonus autumnalis",
      "visualDescription": "Slender, silver-scaled subarctic whitefish with dark olive-slate back and deeply forked tail fin.",
      "habitatBehavior": "Anadromous wanderer roaming coastal brackish Arctic seas, migrating upstream into glacial rivers to spawn.",
      "dietNotes": "Filters copepods, amphipods, mysids, and aquatic insect larvae from cold waters.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Arctic_cisco"
  },
  "183": {
      "scientificName": "Cyclopterus lumpus",
      "visualDescription": "Portly, ball-shaped marine fish covered in ridges of hard bony tubercles, featuring modified pelvic fins that form a powerful suction disc on its chest.",
      "habitatBehavior": "Anchors itself to rocky ledges and kelp beds in cold subarctic waters, riding tidal surges effortlessly.",
      "dietNotes": "Feeds on comb jellies, ctenophores, small amphipods, and floating pelagic crustaceans.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Cyclopterus_lumpus"
  },
  "184": {
      "scientificName": "Osmerus mordax",
      "visualDescription": "Translucent, slender shimmering silver-purple forage fish with prominent canine teeth in its mouth and a faint cucumber-like aroma.",
      "habitatBehavior": "Schools in frigid coastal bays, estuaries, and deep glacial lakes, ascending streams immediately upon ice melt.",
      "dietNotes": "Feeds on zooplankton, mysid shrimp, and small aquatic insect larvae.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Rainbow_smelt"
  },
  "185": {
      "scientificName": "Myoxocephalus scorpius",
      "visualDescription": "Broad-headed, spiny benthic sculpin covered in sharp thorn-like defensive spines, wide fan-like pectoral fins, and mottled brown camouflage.",
      "habitatBehavior": "Well-camouflaged bottom dweller resting on subarctic gravel, boulders, and seaweed beds.",
      "dietNotes": "Ambush predator swallowing crabs, shrimp, sand eels, and small bottom fish whole.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Shorthorn_sculpin"
  },
  "186": {
      "scientificName": "Liopsetta glacialis",
      "visualDescription": "Small oval right-eyed flatfish with rough scales, mottled muddy-olive upper side with dark spots, and stark white blind side.",
      "habitatBehavior": "Thrives on mud and silt bottoms in freezing arctic fjords and estuaries, tolerating brackish river mouths.",
      "dietNotes": "Preys on benthic amphipods, small bivalve mollusks, and marine polychaete worms.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Arctic_flounder"
  },
  "187": {
      "scientificName": "Lamna ditropis",
      "visualDescription": "Muscular, heavy-bodied apex predator resembling a compact great white shark, with slate-grey dorsal skin, blotched white belly, and large dark predatory eyes.",
      "habitatBehavior": "Endothermic subarctic hunter capable of maintaining body temperature well above freezing water; prowls glacial fjords and open northern seas.",
      "dietNotes": "Apex hunter targeting Pacific salmon, sablefish, squid, and herring.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Salmon_shark"
  },
  "188": {
      "scientificName": "Boreogadus saida",
      "visualDescription": "Slender brownish-grey subarctic gadid with deeply forked tail, protruding lower jaw, and biological antifreeze proteins that allow it to live directly under polar sea ice.",
      "habitatBehavior": "Cruises the freezing upper surface layers directly beneath Arctic drift ice and cryopelagic pack margins.",
      "dietNotes": "Consumes ice amphipods, copepods, and hyperiid amphipods clinging to underside of sea ice.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Polar_cod"
  },
  "189": {
      "scientificName": "Mallotus villosus",
      "visualDescription": "Small, delicate pelagic smelt with an iridescent olive-green back, glittering silvery belly, and a faint characteristic cucumber scent.",
      "habitatBehavior": "Schools by the millions in frigid subarctic fjords and bays, serving as the cornerstone forage base for northern marine ecosystems.",
      "dietNotes": "Feeds on planktonic crustaceans, euphausiids, and copepods.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Capelin"
  },
  "190": {
      "scientificName": "Anoplopoma fimbria",
      "visualDescription": "Sleek, velvety charcoal-black deepwater fish known as Black Cod or Butterfish, celebrated for its exceptionally rich, oil-dense white meat.",
      "habitatBehavior": "Inhabits deep muddy and rocky seafloors across the cold North Pacific down to 3,000 feet.",
      "dietNotes": "Omnivorous deepwater predator eating squid, small fish, crabs, and worms.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Sablefish"
  },
  "191": {
      "scientificName": "Anarhichas minor",
      "visualDescription": "Large serpentine benthic predator covered in striking irregular black spots and blotches over a yellow-brown body, featuring massive crushing teeth.",
      "habitatBehavior": "Solitary bottom dweller prowling cold Arctic boulder reefs and deep shelf banks past 1,000 feet.",
      "dietNotes": "Crushes hard-shelled sea urchins, large northern crabs, and mollusks with ease.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Spotted_wolffish"
  },
  "192": {
      "scientificName": "Hucho taimen",
      "visualDescription": "The River Wolf: the largest salmonid on Earth, featuring a ferocious streamlined copper-bronze body, heavy scarred jaw, dark X-spots, and brilliant flame-red tail and anal fins.",
      "habitatBehavior": "Legendary apex predator ruling pristine subarctic rivers and glacial channels; lives for over 50 years and ambushes waterfowl, rodents, and big fish.",
      "dietNotes": "Apex carnivore that strikes frogs, ducks, muskrats, and entire adult salmon in violent surface attacks.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Taimen"
  },
  "193": {
      "scientificName": "Albula vulpes",
      "visualDescription": "Known as the 'Gray Ghost of the Flats', featuring a sleek torpedo-shaped silvery body with subtle dusky pinstripes, conical underslung snout, and a deeply forked caudal fin.",
      "habitatBehavior": "Cruises shallow tropical sand flats and turtle grass beds with the incoming tide, often exposing its tail fin while rooting in sediment.",
      "dietNotes": "Crushes burrowing crabs, mantis shrimp, and bivalves with specialized granular pharyngeal teeth.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Bonefish"
  },
  "194": {
      "scientificName": "Trachinotus falcatus",
      "visualDescription": "Deep-bodied, laterally compressed diamond-shaped saltwater gamefish boasting brilliant silver-gray flanks, a warm golden-orange wash on the belly, and iconic sickle-shaped dark fins.",
      "habitatBehavior": "Frequents shallow ocean flats, reef edges, and coral passes; renowned among saltwater anglers for its acute eyesight and cautious feeding habits.",
      "dietNotes": "Excavates swimming crabs, mole crabs, sea urchins, and mollusks with crushing jaw plates.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Florida_pompano"
  },
  "195": {
      "scientificName": "Seriola dumerili",
      "visualDescription": "Muscular pelagic predator with a brownish-olive back, warm amber lateral stripe, and a distinctive dark nuchal band angling upward across the eyes.",
      "habitatBehavior": "Schools around offshore reefs, deep ledges, and artificial wrecks; famous for brutal downward diving runs that test tackle to the breaking point.",
      "dietNotes": "Voracious predator feeding on squid, cuttlefish, jacks, and smaller schooling reef fish.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Greater_amberjack"
  },
  "196": {
      "scientificName": "Carcharhinus leucas",
      "visualDescription": "Stout, heavy-bodied apex predator with a broad blunt snout, muscular slate-gray flank, pale white underbelly, and triangular serrated teeth.",
      "habitatBehavior": "Capable of osmoregulation, allowing it to roam brackish bayous, murky estuaries, and coastal channels far up freshwater rivers.",
      "dietNotes": "Apex carnivore feeding opportunistically on stingrays, catfish, mullet, turtles, and other marine creatures.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Bull_shark"
  },
  "197": {
      "scientificName": "Lates calcarifer",
      "visualDescription": "Renowned Australian gamefish with a distinctive concave forehead profile, bright luminous copper-silver scales, large pinkish reflective eyes, and a powerful paddle-like tail.",
      "habitatBehavior": "Thrives in tropical tidal rivers, estuary mangroves, and freshwater billabongs; famous for explosive surface strikes and aerobatic leaps.",
      "dietNotes": "Ambush hunter that engulfs mullet, cherabin prawns, baitfish, and small crabs with immense suction.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Barramundi"
  },
  "198": {
      "scientificName": "Nematistius pectoralis",
      "visualDescription": "Unmistakable Pacific prize gamefish with iridescent blue-grey flanks, two broad curved dark zebra-like bands, and an iconic crest of seven long whip-like spiny dorsal rays resembling a rooster comb.",
      "habitatBehavior": "Hunts the turbulent surf zones, rocky shoreline drops, and white-water beach breaks of the Eastern Pacific, raising its comb when aggressive.",
      "dietNotes": "High-speed pursuit predator chasing sardines, mullet, and flying fish right up to the shoreline.",
      "wikiUrl": "https://en.wikipedia.org/wiki/Roosterfish"
  }
};
