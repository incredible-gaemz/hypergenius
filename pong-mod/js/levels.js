// ========================================================
// PONG MOD - LEVEL REGISTRY (Levels 1 - 13 + Future Slots)
// Simple, direct non-AI names & dedicated mode types
// ========================================================

const LEVELS = [
  {
    id: 1,
    name: 'NORMAL PONG',
    mode: 'normal',
    targetScore: 5,
    desc: 'Classic Pong. Player on left, AI on right. First to 5 points.'
  },
  {
    id: 2,
    name: 'FLAPPY PONG',
    mode: 'flappy',
    targetScore: 5,
    desc: 'Gravity pulls your paddle down. Tap W, Up, or Space to flap up!'
  },
  {
    id: 3,
    name: 'SMALL PADDLE BIG BALL',
    mode: 'small_big',
    targetScore: 5,
    desc: 'Tiny 24px paddles and a giant 36px Pong ball.'
  },
  {
    id: 4,
    name: 'REVERSE ROLES',
    mode: 'sphere_paddle',
    targetScore: 5,
    desc: 'Roles reversed! Paddles are small squares and the ball is a spinning paddle.'
  },
  {
    id: 5,
    name: 'BE THE BALL',
    mode: 'be_the_ball',
    targetScore: 5,
    desc: 'You are the ball! Use WASD to steer, outmaneuver the AI sentinels, and score!'
  },
  {
    id: 6,
    name: 'CURVED PADDLES',
    mode: 'curved',
    targetScore: 5,
    desc: 'Concave parabolic paddles bent at the ends, funneling steep inward angles.'
  },
  {
    id: 7,
    name: 'INVERTED',
    mode: 'inverted',
    targetScore: 5,
    desc: 'Pure inverted white visuals AND upside-down inverted controls.'
  },
  {
    id: 8,
    name: 'CROSSY ROAD',
    mode: 'crossy',
    targetScore: 5,
    desc: 'Cross 5 levels of moving paddles! Each level paddles get longer and faster.'
  },
  {
    id: 9,
    name: 'POKE-BATTLE',
    mode: 'pokebattle',
    targetScore: 1,
    desc: 'Retro 1-bit turn-based battle: Paddle vs Wild Pong Ball.'
  },
  {
    id: 10,
    name: 'SOCCER PONG',
    mode: 'soccer',
    targetScore: 3,
    desc: 'Full pitch movement! Paddle aims at your mouse and dynamic AI adjusts across difficulties.'
  },
  {
    id: 11,
    name: '3 FPS PONG',
    mode: 'three_fps',
    targetScore: 3,
    desc: 'Normal speed physics, but screen visual updates at 3 FPS retro lag!'
  },
  {
    id: 12,
    name: 'BREAKOUT',
    mode: 'breakout',
    targetScore: 1,
    desc: 'Classic vertical Breakout! Move your paddle at the bottom and destroy bricks at top.'
  },
  {
    id: 13,
    name: 'PADDLE RACING',
    mode: 'racing',
    targetScore: 3,
    desc: 'Drive your paddle around an enclosed racetrack, racing an AI ball for 3 laps!'
  },
  {
    id: 14,
    name: 'CLIP',
    mode: 'shatter',
    targetScore: 5,
    desc: 'Long paddles that chip off from where the ball hits in the shorter direction!'
  },
  {
    id: 15,
    name: 'DODGEBALL',
    mode: 'dodgeball',
    targetScore: 3,
    desc: '5 bouncing red dodgeballs! Dodge them while the AI dodges on the right. First to 3 hits loses!'
  },
  {
    id: 16,
    name: 'MITOSIS',
    mode: 'mitosis',
    targetScore: 1000,
    desc: 'Balls double up to 2000 balls! Score 1000 to win (600 on Easy, 2000 on Impossible).'
  },
  {
    id: 17,
    name: 'BLASTER',
    mode: 'blaster',
    targetScore: 7,
    desc: 'First to 7! Press Space to shoot blaster bullets. If hit by a laser, you die!'
  },
  {
    id: 18,
    name: 'TWO BALLS',
    mode: 'two_balls',
    targetScore: 5,
    desc: 'Two balls in play at the same time. Juggle both to score.'
  },
  {
    id: 19,
    name: 'THREE BALLS',
    mode: 'three_balls',
    targetScore: 7,
    desc: 'Three balls in play simultaneously. Multi-ball reflex test.'
  },
  {
    id: 20,
    name: 'ZOOM CAM',
    mode: 'zoomed_cam',
    targetScore: 5,
    desc: 'The camera is zoomed in at 2.2x and dynamically follows the ball.'
  },
  {
    id: 21,
    name: 'MATH PONG',
    mode: 'math_pong',
    targetScore: 5,
    desc: 'Every time you hit the ball, answer a 3rd grade math question or die!'
  },
  {
    id: 22,
    name: 'SPHERE ARENA',
    mode: 'circle_pong',
    targetScore: 5,
    desc: 'Circular sphere arena with agile paddles! Keep the ball inside; last to hit wins.'
  },
  {
    id: 23,
    name: 'FLASHLIGHT',
    mode: 'flashlight',
    targetScore: 5,
    desc: 'Pitch black court! The ball casts a circle of light around itself.'
  },
  {
    id: 24,
    name: 'SPINNING ARENA',
    mode: 'spinning',
    targetScore: 5,
    desc: 'Everything is spinning! The court, paddles, and ball rotate continuously.'
  },
  {
    id: 25,
    name: 'LOOPING PONG',
    mode: 'looping',
    targetScore: 5,
    desc: 'No ceiling or floor! The ball and paddles seamlessly loop through top and bottom.'
  },
  {
    id: 26,
    name: 'MAZE RUNNER',
    mode: 'maze',
    targetScore: 1,
    desc: 'You are the ball! Navigate the giant maze to the exit while evading patrol paddles.'
  },
  {
    id: 27,
    name: 'GEOMETRY DASH',
    mode: 'geometry_dash',
    targetScore: 1,
    desc: 'Geometry Dash Pong! Press Space to jump over paddle obstacles and reach 100%!'
  },
  {
    id: 28,
    name: 'PAC-PONG',
    mode: 'pacman',
    targetScore: 1,
    desc: 'Eat all pellets as the ball while escaping four roaming ghost paddles!'
  },
  {
    id: 29,
    name: 'SUPER BLURRY',
    mode: 'blurry',
    targetScore: 5,
    desc: 'Heavy visual blur! Rely on reflexes to track fuzzy glowing light blobs.'
  },
  {
    id: 30,
    name: 'GIANT ARENA',
    mode: 'giant_arena',
    targetScore: 5,
    desc: 'A massive full-court stadium arena with scaled entities and balanced cross-court ball speed.'
  },
  {
    id: 31,
    name: 'ORBIT DEFENDER',
    mode: 'orbit_defense',
    targetScore: 30,
    desc: 'You are the central core. Use your orbital mouse paddle to deflect swarms of incoming balls!'
  },
  {
    id: 32,
    name: '3D TOP-DOWN',
    mode: 'top_down_3d',
    targetScore: 5,
    desc: 'Top-down Pong rendered with simple 3D isometric depth, bouncing height, and wall perspective.'
  },
  {
    id: 33,
    name: 'SOFTBODY PONG',
    mode: 'softbody',
    targetScore: 5,
    desc: 'Jelly physics! Deformable softbody paddles and ball that squash, stretch, and jiggle weirdly.'
  },
  {
    id: 34,
    name: 'FIRST-PERSON 3D',
    mode: 'first_person_3d',
    targetScore: 5,
    desc: 'Step onto the court! True 3D first-person perspective facing your opponent down the tunnel.'
  },
  {
    id: 35,
    name: 'GRAVITY WELL',
    mode: 'gravity_well',
    targetScore: 5,
    desc: 'A massive gravitational vortex in the center of the court whips and spirals the ball in fast orbits!'
  },
  {
    id: 36,
    name: '4-PLAYER KNOCKOUT',
    mode: 'four_player',
    targetScore: 1,
    desc: 'Square 4-player arena! Eliminate opponents to turn their side into a solid wall. Be the last one standing!'
  },
  {
    id: 37,
    name: 'DRUNK PONG',
    mode: 'drunk_pong',
    targetScore: 5,
    desc: 'Everything is wiggling, drifting, and warped! Fight through extreme intoxication wobble to hit the ball.'
  },
  {
    id: 38,
    name: 'PADDLE DODGE',
    mode: 'paddle_dodge',
    targetScore: 1,
    desc: 'Rogue paddles ricochet wildly! At 5s and 10s extra paddles spawn. Dodge all 3 and survive for 15 seconds.'
  },
  {
    id: 39,
    name: 'CUBE PADDLE',
    mode: 'cube_paddle',
    targetScore: 5,
    desc: 'Every impact permanently fuses a new cube to the paddle where the ball hit, growing bizarre geometry!'
  },
  {
    id: 40,
    name: 'LORD PADDLE',
    mode: 'megalovania',
    targetScore: 1,
    desc: 'Megalovania bullet-hell boss fight! Evade Lord Paddle and swarms of flying paddle attacks as the ball.'
  },
  {
    id: 41,
    name: 'FLASHING BARS',
    mode: 'flashing_bars',
    targetScore: 5,
    desc: 'Solid white horizontal strobe bars alternate across the court, masking the ball and paddles.'
  },
  {
    id: 42,
    name: 'TRY TO LOSE',
    mode: 'try_to_lose',
    targetScore: 5,
    desc: 'Normal Pong with massive paddles leaving a tiny opening. Align your opening and try to lose!'
  },
  {
    id: 43,
    name: 'TALL COURT',
    mode: 'tall_court',
    targetScore: 5,
    desc: 'A narrow, towering vertical court where horizontal distance is short and paddles are lightning fast.'
  },
  {
    id: 44,
    name: 'BEACH VOLLEYBALL',
    mode: 'beach_ball',
    targetScore: 5,
    desc: 'Beach volleyball over the net! Move, jump, and spike the spinning beach ball. Do not let it touch your sand!'
  },
  {
    id: 45,
    name: 'DRAW PADDLE',
    mode: 'draw_paddle',
    targetScore: 5,
    desc: 'Draw your custom paddle shape! Both you and your opponent play with the identical shape (max 220px length).'
  },
  {
    id: 46,
    name: '4D PONG',
    mode: 'four_d',
    targetScore: 5,
    desc: 'Pong inside a 4D tesseract hypercube! Move across Y and Z with WASD/Arrows, and shift hyperplanes (W) with Q and E.'
  },
  {
    id: 47,
    name: 'SUBWAY SURF',
    mode: 'subway_surf',
    targetScore: 5,
    desc: '3rd-person Subway Surfers! You are the ball rolling down 3 tracks. Dodge solid paddle-trains, hop low paddles, and slide under high barriers!'
  },
  {
    id: 48,
    name: 'SPEED PONG',
    mode: 'speed_laser',
    targetScore: 5,
    desc: 'Looks like classic Pong, but the ball secretly accelerates with every single paddle return!'
  },
  {
    id: 49,
    name: 'PONG PINBALL',
    mode: 'pinball',
    targetScore: 5,
    desc: 'Classic Pong meets arcade pinball! Pop bumpers and diamond bumpers ricochet balls at intense angles.'
  },
  {
    id: 50,
    name: 'SHRINKING BALL',
    mode: 'shrinking_ball',
    targetScore: 5,
    desc: 'Classic Pong with a twist: the ball starts gigantic and shrinks with every paddle deflection!'
  },
  {
    id: 51,
    name: 'SECOND-PERSON PONG',
    mode: 'second_person',
    targetScore: 5,
    desc: 'You control your paddle in the distance, but the camera is looking through the eyes of your opponent!'
  },
  {
    id: 52,
    name: 'ROGUELIKE PONG',
    mode: 'roguelike',
    targetScore: 5,
    desc: 'Survive 5 floors of escalating opponents. Pick 1 of 3 retro upgrades between floors.'
  },
  {
    id: 53,
    name: 'SUPERHOT PONG',
    mode: 'superhot',
    targetScore: 5,
    desc: 'Time moves only when you move! Stop moving to slow time to a crawl, then strike at full speed.'
  },
  {
    id: 54,
    name: 'PORTAL PONG',
    mode: 'portal',
    targetScore: 5,
    desc: 'Quantum wormholes bridge the court! Bank the ball through drifting portals to bypass the net and score trick shots.'
  },
  {
    id: 55,
    name: 'TETRIS PONG',
    mode: 'tetris',
    targetScore: 5,
    desc: 'Tetrominoes drop down the center net in real-time! Bank off falling blocks, chip through stacks, and clear lines.'
  },
  {
    id: 56,
    name: 'SINGULARITY PONG',
    mode: 'singularity',
    targetScore: 5,
    desc: 'A gravitational black hole warps the center court! Execute curved orbital slingshots around the event horizon.'
  },
  {
    id: 57,
    name: 'EXCAVATOR PONG',
    mode: 'excavator',
    targetScore: 5,
    desc: 'Both sides launch drill balls into a central mountain of solid earth! Burrow tunnels from both ends to break through and score.'
  },
  {
    id: 58,
    name: 'SPACE INVADERS PONG',
    mode: 'invaders',
    targetScore: 5,
    desc: 'Classic alien invaders march across the midfield! Bank the ball into the descending swarm to blast through.'
  },
  {
    id: 59,
    name: 'AIR HOCKEY PONG',
    mode: 'airhockey',
    targetScore: 5,
    desc: 'Free 2D half-court mallet movement! Skate forward, charge the puck, and bank cross-court shots at lightning speed.'
  },
  {
    id: 60,
    name: 'LIGHT CYCLE PONG',
    mode: 'lightcycle',
    targetScore: 5,
    desc: 'The ball leaves solid laser trails in its wake! Every volley etches a maze of reflective light walls across the court.'
  },
  {
    id: 61,
    name: 'GRAVITY FLIP PONG',
    mode: 'gravity_flip',
    targetScore: 5,
    desc: 'Vertical gravity warps the ball into parabolic arcs! Every paddle hit flips gravity upside-down between ceiling and floor.'
  },
  {
    id: 62,
    name: 'POLARITY PONG',
    mode: 'polarity',
    targetScore: 5,
    desc: 'Electromagnetic polarities! Press SPACE to toggle your paddle between Attractor (curves ball inward) and Repulsor (magnetic kinetic blast).'
  },
  {
    id: 63,
    name: 'SNAKE PONG',
    mode: 'snake_pong',
    targetScore: 5,
    desc: 'The ball is an undulating 8-bit retro snake! Eat glowing food pellets on the court to grow longer and overwhelm your opponent.'
  },
  {
    id: 64,
    name: 'CHRONO PONG',
    mode: 'chrono',
    targetScore: 5,
    desc: 'Hold SPACE to rewind time! Step backwards up to 2 seconds to undo missed shots and launch lethal counter-attacks.'
  },
  {
    id: 65,
    name: 'ASTEROIDS PONG',
    mode: 'asteroids_pong',
    targetScore: 5,
    desc: 'Lethal micro-gravity asteroid field! Asteroid hits instantly destroy paddles. Higher difficulty spawns denser asteroid swarms.'
  },
  {
    id: 66,
    name: 'TIME BOMB PONG',
    mode: 'time_bomb',
    targetScore: 5,
    desc: 'The ball is an armed time bomb with an unpredictable randomized fuse! Every paddle hit accelerates the countdown.'
  },
  {
    id: 67,
    name: 'BULLET HELL PONG',
    mode: 'bullet_hell',
    targetScore: 5,
    desc: 'Midfield Danmaku sentinel pulses geometric bullet spirals! Dodge bullet waves with your paddle and smash the ball through bullet curtains.'
  }
];

window.LEVELS = LEVELS;
