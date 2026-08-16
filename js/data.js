/**
 * Expedition 33 — Build Reference : content data
 *
 * This is the file to edit when game knowledge changes. It is a plain classic
 * script (not an ES module and not JSON) on purpose, so that opening
 * index.html directly from the filesystem via file:// still works — fetch()
 * and module imports are both blocked by CORS under file://.
 *
 * Everything hangs off a single global namespace to keep the window clean.
 */
var E33_DATA = (function () {
  'use strict';

  /*
   * Attribute allocation priority by level band.
   * `range` is inclusive on both ends and the bands must not overlap —
   * lookup takes the first match, so a shared boundary would always
   * resolve to the lower tier.
   */
  var tiers = [
    {
      id: 't1',
      range: [1, 19],
      name: 'Tier 1 · Survival',
      priority: 'Vitality &gt; Agility &gt; Might',
      detail: "Front-load Vitality while you learn to dodge/parry. Add Agility so enemies don't out-turn you. Skip Defense and Luck almost entirely — Defense is weak, Luck is capped by the 9,999 damage limit this early."
    },
    {
      id: 't2',
      range: [20, 44],
      name: 'Tier 2 · Vitality Peak',
      priority: 'Vitality (push to ~45) &gt; Weapon-scaling stat &gt; Agility',
      detail: "This is Vitality's strongest HP-per-point window. Start splitting into whichever stat your current weapon scales highest on (check its S–D letter grade)."
    },
    {
      id: 't3',
      range: [45, 65],
      name: 'Tier 3 · Agility Window',
      priority: 'Agility (soft cap ~47, extend to 66) &gt; Might/weapon stat &gt; a few Luck points',
      detail: "Agility softens around 47 but is still worth extending to 66 if you're getting outsped. Cheap early Luck thresholds (~11, 15, 35 pts) unlock efficient crit-rate jumps."
    },
    {
      id: 't4',
      range: [66, 99],
      name: 'Tier 4 · Damage Scaling',
      priority: 'Might &gt; Luck &gt; Agility spillover &gt; Defense (only if weapon scales)',
      detail: 'Once the damage cap lifts (~Act 3 / Painted Power Picto), Might and full Luck/crit investment finally pay off. Only prioritize Defense if a specific weapon scales heavily on it.'
    }
  ];

  /* Per-character builds. Key order drives tab order. */
  var characters = {
    gustave: {
      label: 'Gustave',
      role: 'Burst DPS / Free Aim',
      attrs: 'Luck, Might — multi-hit skills compound well with crit chance.',
      early: [
        'Marking Shots (Lumina) — debuff before allies act',
        'Burning Shots (Lumina) — cheap Burn application',
        'Dodger (Lumina) — 1 AP on perfect dodge'
      ],
      mid: [
        'Energising Turn / Start — steady AP flow',
        'Augmented Counter I→III as you get counter-heavy'
      ],
      late: [
        'Painted Power — removes 9,999 dmg cap',
        'Cheater — act twice per turn',
        'Energy Master — +1 all AP gains',
        'Warming Up — stacking dmg over a fight'
      ],
      note: 'Prioritize supportive/debuff Pictos early since he sets up the party before others act.'
    },
    lune: {
      label: 'Lune',
      role: 'Elemental / Burn Support-DPS',
      attrs: "Vitality, Defense — she's your primary healer/support, survivability first.",
      early: [
        'Burn Affinity — +dmg on burning targets',
        'Dead Energy II — AP on kill',
        'Dodger'
      ],
      mid: [
        'Energising Burn — AP on applying Burn',
        'Double Burn — 2 stacks per application'
      ],
      late: [
        'Painted Power',
        'Cheater',
        'Energy Master',
        'Feint / Frenzy for skill-hit scaling'
      ],
      note: 'Crit Rate feeds her Elemental Trick for Stains; Burn stacking is her core damage loop.'
    },
    maelle: {
      label: 'Maelle',
      role: 'Parry/Dodge Crit DPS',
      attrs: 'Agility, Luck — goes first to apply weaknesses, then lands crits with multi-hit skills.',
      early: [
        'Empowering Parry — +dmg per successful parry',
        'Charging Critical — gradient charge on crit',
        'Shortcut — emergency heal-turn below 30% HP'
      ],
      mid: [
        'Confident Fighter — +30% dmg, no healing (once stable)',
        'Auto Powerful / First Strike'
      ],
      late: [
        'Immaculate, Glass Canon, Inverted Affinity — Act 3 core trio',
        'Painted Power',
        'Healing Counter + Energising Parry for sustain'
      ],
      note: 'Late game: dodge/parry to keep the Glass Canon/Inverted Affinity risk safe while damage stacks massively.'
    },
    sciel: {
      label: 'Sciel',
      role: 'Speed / Fortune DPS',
      attrs: 'Might, Luck — classic multi-hit DPS profile, similar to Gustave.',
      early: [
        'Marking Shots / Burning Shots',
        'Dead Energy II'
      ],
      mid: [
        'Warming Up — stacking dmg per turn',
        'Full Strength — dmg boost at full HP'
      ],
      late: [
        "Cheater — extra turn to set up Fortune's Fury",
        'Painted Power',
        'Second Chance for safety net'
      ],
      note: "Speed + offensive stats matter most for landing Fortune's Fury windows."
    },
    verso: {
      label: 'Verso',
      role: 'Parry Tank/Support-DPS',
      attrs: 'Vitality, Agility — relies on dodge/parry rather than raw Defense.',
      early: [
        'Augmented Counter I',
        'Perilous Parry (careful: doubles dmg taken)',
        'Confident Fighter (once comfortable)'
      ],
      mid: [
        'Auto Rush, Charging Tint',
        'Critical Burn'
      ],
      late: [
        'Confident Fighter + Glass Canon combo for max dmg amplification',
        'Painted Power',
        'Free Aim Luminas to boost Follow Up skill'
      ],
      note: 'Damage scales almost entirely off successful parries — invest Luminas around parry chains.'
    },
    monoco: {
      label: 'Monoco',
      role: 'Flexible / Absorb-based',
      attrs: 'Agility, Luck as safe defaults — kit shifts based on absorbed enemies, so stay flexible.',
      early: [
        'Empowering Parry',
        'Energising Parry',
        'AP-focused Luminas'
      ],
      mid: [
        'Break-focused Luminas (Breaker, Breaking Counter)',
        'More AP generation for consistent absorb-skill use'
      ],
      late: [
        'Immaculate, Energising Parry, Empowering Parry — Act 3 core trio',
        'Painted Power'
      ],
      note: 'Because his skills change with absorbed enemies, prioritize AP economy and parry survivability over fixed dmg Luminas.'
    }
  };

  /* Pictos worth chasing regardless of who you are playing. */
  var universalPictos = [
    { name: 'Painted Power', note: 'Removes 9,999 dmg cap — get ASAP in Act 2, equip on whole party once unlocked.' },
    { name: 'Cheater', note: 'Always act twice — one of the strongest Luminas in the game once affordable.' },
    { name: 'Energy Master', note: '+1 to all AP gain sources — snowballs with any AP-generation build.' },
    { name: 'Second Chance', note: 'Revive once per battle at full HP — great safety net for your main DPS.' },
    { name: 'Warming Up', note: '+5% dmg/turn, stacks to 5 — free damage in any fight that runs long.' },
    { name: 'First Strike', note: 'Guarantees your party acts before dangerous bosses that open with big hits.' }
  ];

  /* Cheat-sheet pills on the Attributes tab. */
  var attributeEffects = [
    { name: 'Vitality', effect: 'Max HP, best returns early-mid' },
    { name: 'Might', effect: 'All damage dealt' },
    { name: 'Agility', effect: 'Turn frequency / speed' },
    { name: 'Defense', effect: 'Dmg reduction, weakest overall' },
    { name: 'Luck', effect: 'Crit chance, best after dmg-cap removal' }
  ];

  /*
   * Progress checklist.
   * `id` is the stable localStorage key for each row. Never reuse or renumber
   * an existing id — append new ones — or saved progress will shift onto the
   * wrong rows. Reordering this array is safe; renaming an id is not.
   */
  var checklistItems = [
    { id: 'painted-power', label: 'Painted Power unlocked (Act 2 boss)' },
    { id: 'cheater', label: 'Cheater unlocked (Sprong boss)' },
    { id: 'energy-master', label: 'Energy Master (Serpenphare, Act 3)' },
    { id: 'second-chance', label: 'Second Chance (Renoir, The Monolith)' },
    { id: 'first-strike', label: 'First Strike (Act 1, Stone Wave Cliffs)' },
    { id: 'recoat', label: 'Respec item (Recoat) obtained' },
    { id: 'lumina-slots', label: 'All characters have full Lumina slots equipped' },
    { id: 'weapon-scaling', label: 'Checked weapon letter-grade scaling before last attribute dump' }
  ];

  /*
   * Recommended skill-point spend order, per character.
   *
   * Skills in Expedition 33 are NOT gated by character level. Each level-up
   * grants 1 Skill Point and 3 Attribute Points, which bank until you spend
   * them at an Expedition Flag. The real gates are a skill's SP cost and its
   * prerequisite node. So "what can I unlock at level 30" is really
   * "I have ~29 SP banked, what is the best order to spend it in" — which is
   * what `path` answers. Order is validated to respect prerequisites: every
   * entry's prerequisite is either a starting skill or appears earlier.
   *
   * `sp`     cost in Skill Points
   * `varies` true when wikis disagree on the cost (patch drift) — treat as ±1
   * `why`    why it earns its place at that point in the order
   * `fx`     in-game effect
   *
   * Monoco is the exception (`mode: 'feet'`): his skills unlock by defeating
   * enemy types while he is in the active party, not by spending SP.
   */
  var skillBuilds = {
    gustave: {
      mode: 'sp',
      starting: ['Lumière Assault', 'Overcharge'],
      path: [
        { n: 'Marking Shot', sp: 4, why: 'Mark is his damage multiplier - everything after this hits harder.', fx: 'Deals low single-target Lightning damage and applies Mark to the target.' },
        { n: 'From Fire', sp: 2, why: 'Two points for damage plus a heal. Best value on his tree.', fx: 'Deals medium single-target damage over 3 hits using the weapon\'s element; heals self for 20% Health if the target is Burning.' },
        { n: 'Powerful', sp: 6, why: 'Attack buff that carries the whole party, not just him.', fx: 'Applies Powerful to 1-3 allies, increasing their damage dealt for 3 turns, and grants 0-2 Charges.' },
        { n: 'Recovery', sp: 2, why: 'Sustain so you stop burning items in Act 1 boss fights.', fx: 'Recovers 50% Health, dispels Status Effects, and gives 0-2 Charges.' },
        { n: 'Shatter', sp: 6, why: 'Dedicated Break tool for armored and shielded enemies.', fx: 'Deals high Lightning damage to all enemies; can Break, and fully charges Overcharge if the hit Breaks a target.' },
        { n: 'Strike Storm', sp: 10, why: 'Capstone. Multi-hit AP engine that pays off a crit/Luck build.', fx: 'Deals very high single-target damage over 6 hits using the weapon\'s element; critical hits generate 2 additional Charges.' }
      ],
      gradients: [
      ]
    },
    lune: {
      mode: 'sp',
      starting: ['Ice Lance', 'Immolation'],
      path: [
        { n: 'Thunderfall', sp: 1, why: 'One point, opens the Lightning line. Take it first.', fx: 'Deals medium Lightning damage to 2-6 random enemies; critical hits trigger an additional hit; consumes a Fire Stain for increased damage.' },
        { n: 'Earth Rising', sp: 1, why: 'One point, opens the Earth line and her AP generation.', fx: 'Deals low Earth damage to all enemies; consumes a Lightning Stain for increased damage.' },
        { n: 'Healing Light', sp: 1, why: 'One point of insurance before you have a real healer.', fx: 'Heals the targeted ally for 30-50% Health and dispels Status Effects; consuming Earth Stains lets it cost 0 AP.' },
        { n: 'Electrify', sp: 1, why: 'Cheap Lightning Stain generator to feed the good spells.', fx: 'Deals low single-target Lightning damage over 3 hits; critical hits trigger an additional hit; consumes a Fire Stain to generate a Light Stain.' },
        { n: 'Thermal Transfer', sp: 2, why: 'AP generation. This is what makes Lune sustainable.', fx: 'Deals low single-target Ice damage; gains 4 AP if target is Burning; consuming Earth Stains grants a second turn.' },
        { n: 'Mayhem', sp: 3, spHi: 4, why: 'Solid mid damage and the gateway to Elemental Trick.', fx: 'Consumes all Stains to deal high elemental damage to a target; can Break if 4 Stains are consumed.' },
        { n: 'Elemental Trick', sp: 4, why: 'Her Stain engine. Core of every Lune build.', fx: 'Deals low single-target Ice, Fire, Lightning, and Earth damage over 4 hits; critical hits generate the corresponding Stain.' },
        { n: 'Wildfire', sp: 2, why: 'Starts Burn stacking, which scales into the late game.', fx: 'Deals medium Fire damage to all enemies and applies 3 Burn; consuming Ice Stains increases damage.' },
        { n: 'Rebirth', sp: 4, why: 'Revive. Turns wipes into recoverable fights.', fx: 'Revives an ally with 30-70% Health and grants 2 additional AP; consuming Lightning Stains lets it cost 0 AP.' },
        { n: 'Fire Rage', sp: 6, why: 'Burn stacking payoff and the setup for Hell.', fx: 'Deals increasingly high Fire damage to all enemies each turn until Lune takes damage (stuns self if interrupted); consumes Ice Stains for increased damage.' },
        { n: 'Lightning Dance', sp: 6, spHi: 7, why: 'High Lightning damage once you can afford six points.', fx: 'Deals very high single-target Lightning damage over 6 hits; critical hits trigger an additional hit; consumes Stains for greatly increased damage.' },
        { n: 'Crippling Tsunami', sp: 5, spHi: 6, why: 'Debuff plus damage; opens Typhoon.', fx: 'Deals medium Ice damage to all enemies and applies Slow for 3 turns; consuming stains greatly increases damage.' },
        { n: 'Storm Caller', sp: 8, why: 'Damage over time that ticks while you do other things.', fx: 'All enemies take medium Lightning damage at end of turn and low Lightning damage when hit, for 3 turns; consuming Fire Stains doubles the thunder strikes.' },
        { n: 'Typhoon', sp: 8, why: 'Damage and healing in one cast for long boss fights.', fx: 'At turn start, deals high Ice damage to all enemies and heals allies; consuming Earth Stains extends duration from 3 to 5 turns.' },
        { n: 'Hell', sp: 10, why: 'Burn build finisher.', fx: 'Deals very high Fire damage applying 5 Burn per hit (2 hits) to all enemies, dealing self-damage if failed; consuming stains greatly increases damage.' },
        { n: 'Elemental Genesis', sp: 10, why: 'Ultimate. Only worth it once the tree beneath it is built.', fx: 'Deals extreme damage to all enemies over 8 hits, each hit a random element; can only be cast while holding one of each elemental Stain.' }
      ],
      gradients: [
        { n: 'Tremor', when: 'Unlocks automatically once Gradient Attacks open up in Act II.', fx: 'Deals high Earth damage to all enemies and removes all enemies\' Shields.' },
        { n: 'Tree of Life', when: 'Unlocks around Relationship Level 4-5 (sources disagree) - raise it at camp.', fx: 'Cleanses all status effects and heals all allies.' },
        { n: 'Sky Break', when: 'Unlocks at max Relationship Level 7.', fx: 'Deals extreme damage to all enemies; element depends on which Stains Lune holds the most of; can Break.' }
      ]
    },
    maelle: {
      mode: 'sp',
      starting: ['Offensive Switch', 'Percée', 'Spark'],
      path: [
        { n: 'Swift Stride', sp: 1, why: 'One point of stance control - Maelle lives on stances.', fx: 'Deals low single-target Physical damage; switches to Virtuose Stance if target is Burning; regains 0-2 AP.' },
        { n: 'Dégagement', sp: 2, why: 'Opens the Fire line and her cheap mobility.', fx: 'Deals low single-target Fire damage; target becomes weak to Fire damage for 2 turns; switches to Offensive Stance.' },
        { n: 'Guard Up', sp: 2, spHi: 3, why: 'Gateway node to most of her good offense.', fx: 'Applies Shell (reduced damage taken) to up to 3 allies for 3 turns; switches to Offensive Stance.' },
        { n: 'Fleuret Fury', sp: 2, why: 'Early multi-hit damage that pairs with her crit scaling.', fx: 'Deals high single-target Physical damage over 3 hits, stays in Virtuose Stance if already in it, can Break.' },
        { n: 'Mezzo Forte', sp: 1, spHi: 4, why: 'One point, and it unlocks Last Chance later.', fx: 'Reapplies current stance and gives 2-4 AP.' },
        { n: 'Breaking Rules', sp: 3, spHi: 4, why: 'Steps toward Fencer’s Flurry.', fx: 'Deals low single-target Physical damage over 2 hits, destroys all target\'s Shields, gains 1 AP per Shield destroyed; plays a second turn if target is Defenceless.' },
        { n: 'Rain of Fire', sp: 4, spHi: 5, why: 'AoE and the entry to the Burn line.', fx: 'Deals medium single-target Fire damage over 2 hits, applying 3 Burn per hit (2 more in Defensive Stance).' },
        { n: 'Fencer\'s Flurry', sp: 4, spHi: 6, why: 'Big multi-hit payoff for an Agility/Luck Maelle.', fx: 'Deals medium damage to all enemies using weapon\'s element and applies Defenceless for 1 turn.' },
        { n: 'Combustion', sp: 4, spHi: 6, why: 'Burn scaling; sets up Revenge.', fx: 'Deals medium single-target Physical damage over 2 hits, consuming up to 10 Burn stacks for increased damage.' },
        { n: 'Égide', sp: 3, spHi: 4, why: 'Defensive stance work plus the Momentum Strike branch.', fx: 'Protects allies by taking damage in their place for 2 turns; duration extends when Maelle gains Shell.' },
        { n: 'Phantom Strike', sp: 4, spHi: 7, why: 'Act II unlock. Strong once Virtuose stance is online.', fx: 'Deals very high Void damage to all enemies over 4 hits and gives 35% of a Gradient Charge.' },
        { n: 'Stendhal', sp: 4, spHi: 8, why: 'Act II unlock. Heavy single-target from Virtuose.', fx: 'Deals extreme single-target Void damage, removing self-Shields and applying self-Defenceless.' },
        { n: 'Sword Ballet', sp: 8, spHi: 10, why: 'Her signature multi-hit finisher.', fx: 'Deals extreme single-target damage over 5 hits using the weapon\'s element; critical hits deal double damage.' },
        { n: 'Revenge', sp: 6, why: 'Counter damage that rewards her dodge/parry play.', fx: 'Deals high single-target Fire damage, with damage increased for each hit received since the previous turn; can Break.' },
        { n: 'Burning Canvas', sp: 6, why: 'Act II capstone for the Fire build.', fx: 'Deals high single-target Void damage over 5 hits, applying 1 Burn per hit, with damage increasing per Burn stack on the target.' },
        { n: 'Pyrolyse', sp: 8, spHi: 9, why: 'Late Burn nuke.', fx: 'Deals extreme single-target Fire damage over 3 hits, applying 5 Burn per hit (2 more in Offensive Stance).' }
      ],
      gradients: [
        { n: 'Virtuose Strike', when: 'Unlocks automatically once Gradient Attacks open up in Act II.', fx: 'Deals high single-target Physical damage over 5 hits.' },
        { n: 'Phoenix Flame', when: 'Unlocks around Relationship Level 4-5 (sources disagree) - raise it at camp.', fx: 'Applies 10 Burn to all enemies and revives all allies with 50-70% Health.' },
        { n: 'Gommage', when: 'Unlocks at max Relationship Level 7.', fx: 'Instantly kills weak targets; otherwise deals extreme Void damage.' }
      ]
    },
    sciel: {
      mode: 'sp',
      starting: ['Focused Foretell', 'Twilight Slash'],
      path: [
        { n: 'Harvest', sp: 1, why: 'One point, builds Foretell charges - her whole economy.', fx: 'Deals medium single-target damage using weapon\'s element and heals self 40% Health, consuming Foretell to boost the heal.' },
        { n: 'Rush', sp: 1, why: 'One point of turn manipulation.', fx: 'Applies Rush to 1-3 allies, increasing their Speed for 3 turns.' },
        { n: 'Marking Card', sp: 2, why: 'Mark application for the party’s burst turns.', fx: 'Deals medium single-target Dark damage over 2 hits, applies Mark and 3 Foretell.' },
        { n: 'Spectral Sweep', sp: 2, why: 'Cheap AoE and a hub node.', fx: 'Deals medium single-target damage over 2-6 hits using the weapon\'s element, applying 1 Foretell per hit (extra on crits).' },
        { n: 'Phantom Blade', sp: 2, why: 'Cheap damage that opens the Sealed Fate line.', fx: 'Deals high single-target Dark damage, consuming all Foretell for additional damage; can Break.' },
        { n: 'Searing Bond', sp: 2, why: 'Foretell stacking.', fx: 'Deals medium single-target Dark damage, applies 5 Foretell, and also damages/applies Foretell to every other Burning enemy.' },
        { n: 'Dark Cleansing', sp: 2, why: 'Cleanse plus the Card Weaver branch.', fx: 'Cleanses an ally\'s Status Effects and propagates that ally\'s active buff to all allies.' },
        { n: 'Firing Shadow', sp: 2, why: 'Hub node - three good skills sit behind it.', fx: 'Deals low Dark damage to all enemies over 3 hits, consuming 1 Foretell per hit for increased damage.' },
        { n: 'Card Weaver', sp: 3, spHi: 4, why: 'Card manipulation, better Foretell control.', fx: 'Deals low single-target Physical damage, propagates the target\'s Foretell to all enemies, and plays a second turn.' },
        { n: 'Bad Omen', sp: 3, spHi: 4, why: 'Debuff that stacks with Mark.', fx: 'Deals low Dark damage to all enemies over 2 hits, applying 2 Foretell per hit.' },
        { n: 'Sealed Fate', sp: 4, why: 'Strong single-target setup.', fx: 'Deals high single-target damage over 5-7 hits using the weapon\'s element; each hit can consume 1 Foretell for +200% damage.' },
        { n: 'Plentiful Harvest', sp: 4, why: 'Mass Foretell payoff.', fx: 'Deals medium single-target Physical damage over 2 hits, consuming all Foretell on the target to give 1 AP per Foretell consumed to a party member.' },
        { n: 'Fortune\'s Fury', sp: 5, spHi: 6, why: 'Her signature skill. Build toward this.', fx: 'Targeted ally deals double damage for 1 turn.' },
        { n: 'Grim Harvest', sp: 5, spHi: 6, why: 'Heavy Foretell consumption damage.', fx: 'Deals medium single-target Dark damage and heals all allies by 30% Health, boosted by consuming Foretell.' },
        { n: 'Intervention', sp: 5, spHi: 6, why: 'Support/utility for harder fights.', fx: 'Targeted ally plays immediately and gains 4 AP.' },
        { n: 'Our Sacrifice', sp: 4, spHi: 8, why: 'High risk, high damage; opens Twilight Dance.', fx: 'Deals extreme Dark damage to all enemies, absorbing allies\' Health and enemies\' Foretell to deal increased damage.' },
        { n: 'Dark Wave', sp: 6, spHi: 10, why: 'Late AoE.', fx: 'Deals high Dark damage to all enemies over 3 hits, consuming all Foretell for increased damage.' },
        { n: 'Twilight Dance', sp: 9, spHi: 10, why: 'Capstone damage.', fx: 'Deals extreme single-target Dark damage over 4 hits; during Twilight extends its duration by 1 turn; consumes all Foretell for additional damage.' },
        { n: 'Final Path', sp: 9, spHi: 10, why: 'Ultimate finisher.', fx: 'Deals extreme single-target Dark damage and applies 10 Foretell; can Break.' }
      ],
      gradients: [
        { n: 'Shadow Bringer', when: 'Unlocks automatically once Gradient Attacks open up in Act II.', fx: 'Deals high Dark damage to random enemies over 10 hits, applying 1 Foretell per hit.' },
        { n: 'Doom', when: 'Unlocks around Relationship Level 4-5 (sources disagree) - raise it at camp.', fx: 'Deals very high single-target Dark damage and applies Powerless, Defenceless, and Slow for 3 turns; can Break.' },
        { n: 'End Slice', when: 'Unlocks at max Relationship Level 7.', fx: 'Deals extreme single-target Physical damage, with damage increasing for each Foretell consumed since the start of battle.' }
      ]
    },
    verso: {
      mode: 'sp',
      starting: ['Assault Zero', 'From Fire'],
      path: [
        { n: 'Marking Shot', sp: 1, spHi: 2, why: 'One point for Mark. Immediate value.', fx: 'Deals low single-target damage using the weapon\'s element and applies Mark.' },
        { n: 'Perfect Recovery', sp: 1, why: 'One point of sustain, opens Purification.', fx: 'Recovers 50% Health and dispels Status Effects, giving 0-2 Perfection Rank progress; at higher Rank heals to 100%.' },
        { n: 'Quick Strike', sp: 2, why: 'Central hub - most of his tree routes through it.', fx: 'Deals low single-target Physical damage; at D Rank grants more Perfection progress.' },
        { n: 'Purification', sp: 2, spHi: 5, why: 'Cleanse plus the Blitz branch.', fx: 'Deals medium single-target Light damage over 2 hits and dispels self status effects.' },
        { n: 'Berserk Slash', sp: 2, spHi: 4, why: 'Cheap damage and a hub node.', fx: 'Deals medium single-target Physical damage over 3 hits, with damage increased for each Health point Verso is missing.' },
        { n: 'Burden', sp: 1, why: 'One point, opens Phantom Stars later.', fx: 'Removes all Status Effects from all allies and applies them to Verso; gains 1 Perfection Rank.' },
        { n: 'Blitz', sp: 2, spHi: 3, why: 'Speed and the gateway to his best nodes.', fx: 'Deals low single-target Physical damage and plays a second time; instantly kills non-boss enemies under 10% Health.' },
        { n: 'Powerful', sp: 2, spHi: 3, why: 'Party attack buff.', fx: 'Applies Powerful to 1-3 allies, increasing their damage for 3 turns, and gives 0-2 Perfection Rank progress.' },
        { n: 'Radiant Slash', sp: 2, spHi: 4, why: 'Light damage, opens Light Holder.', fx: 'Deals low Light damage to all enemies; can Break.' },
        { n: 'Perfect Break', sp: 4, spHi: 7, why: 'Break tool tied to his parry play.', fx: 'Deals very high single-target Light damage, can Break; reaches Rank S on Break.' },
        { n: 'Follow Up', sp: 4, spHi: 5, why: 'Extra attacks; required for Overload.', fx: 'Deals medium single-target Light damage, with damage increased for each Free Aim shot taken that turn (up to 10 times).' },
        { n: 'Overload', sp: 0, spHi: 6, why: 'Free AP generation and the cheapest node on his tree by most sources - take it right after Follow Up.', fx: 'Increases Perfection Rank to A/S and refills all AP, but sets self-Health to 1.' },
        { n: 'Leadership', sp: 3, spHi: 4, why: 'Party support and the Phantom Stars route.', fx: 'Reduces current Perfection Rank; gives 2-4 AP to other allies.' },
        { n: 'Defiant Strike', sp: 3, spHi: 6, why: 'Opens Strike Storm.', fx: 'Deals high single-target Physical damage over 2 hits, applying Mark; costs 30% of current Health.' },
        { n: 'Light Holder', sp: 4, spHi: 6, why: 'Light scaling toward End Bringer.', fx: 'Deals medium single-target Light damage over 5 hits; on completion gains 1 Perfection Rank.' },
        { n: 'Speed Burst', sp: 6, why: 'Turn economy for a Perfection-rank build.', fx: 'Deals high single-target Light damage over 5 hits, with damage increased by the Speed difference with the target.' },
        { n: 'Strike Storm', sp: 7, spHi: 8, why: 'Heavy multi-hit.', fx: 'Deals very high single-target damage over 6 hits using the weapon\'s element; critical hits generate 2 additional Perfection Rank progress.' },
        { n: 'Phantom Stars', sp: 8, spHi: 9, why: 'Big AoE payoff.', fx: 'Deals extreme Light damage to all enemies over 5 hits; can Break; costs less AP at S Rank.' },
        { n: 'End Bringer', sp: 9, spHi: 10, why: 'Light build capstone.', fx: 'Deals extreme single-target Physical damage over 6 hits, increased if the target is Stunned; at A Rank can reapply Stun.' },
        { n: 'Steeled Strike', sp: 9, spHi: 10, why: 'Physical build capstone.', fx: 'After 1 turn delay, deals extreme single-target Physical damage over 13 hits; interrupted if Verso takes any damage.' }
      ],
      gradients: [
        { n: 'Sabotage', when: 'Unlocks automatically once Gradient Attacks open up in Act II.', fx: 'Deals medium Physical damage to all enemies and applies Mark.' },
        { n: 'Striker', when: 'Unlocks around Relationship Level 4-5 (sources disagree) - raise it at camp.', fx: 'Deals high single-target Physical damage; can Break.' },
        { n: 'Angel\'s Eyes', when: 'Unlocks at max Relationship Level 7.', fx: 'Deals extreme Physical damage over 8 hits, gaining 1 additional Perfection Rank per hit, and applies Aureole to Verso (revives him if he dies).' }
      ]
    },
    monoco: {
      mode: 'feet',
      starting: ['Chalier Combo', 'Stalact Punches'],
      path: [
        { n: 'Abbest Wind', phase: 'early', from: 'Abbest', why: 'Grants a second turn. Best action economy in the game early.', fx: 'Deals low single-target Physical damage and plays a second turn; costs 0 AP on Agile Mask.' },
        { n: 'Orphelin Cheers', phase: 'early', from: 'Orphelin', why: 'Powerful on up to 3 allies plus AP. Party-wide value.', fx: 'Applies Powerful to 1-3 allies; gives 3 AP to targets on Caster Mask.' },
        { n: 'Ramasseur Bonk', phase: 'early', from: 'Ramasseur', why: 'Break plus 20% Break bar fill.', fx: 'Deals low single-target Dark damage; can Break, fills 20% of Break Bar on Agile Mask.' },
        { n: 'Gault Fury', phase: 'early', from: 'Gault', why: 'Applies Mark for the team’s burst turn.', fx: 'Deals low single-target Physical damage over 4 hits and applies Mark.' },
        { n: 'Luster Slices', phase: 'early', from: 'Luster', why: 'Applies Rush - extra turns for whoever needs them.', fx: 'Deals low single-target Physical damage over 3 hits and applies Rush to self for 3 turns.' },
        { n: 'Potier Energy', phase: 'mid', from: 'Potier', why: 'Gives AP to all allies. The single best support foot.', fx: 'Gives 1-3 AP to all allies (1 additional AP on Caster Mask).' },
        { n: 'Chapelier Slash', phase: 'mid', from: 'Chapelier', why: 'High AoE damage and applies Mark.', fx: 'Deals high Physical damage to all enemies over 3 hits and applies Mark.' },
        { n: 'Pèlerin Heal', phase: 'mid', from: 'Pèlerin', why: 'Regen on all allies, plus a 40% heal on Caster Mask.', fx: 'Applies Regen to all allies; also heals 40% Health on Caster Mask.' },
        { n: 'Braseleur Smash', phase: 'mid', from: 'Braseleur', why: 'Applies 3 Burn - pairs with a Burn party.', fx: 'Deals medium single-target Fire damage over 2 hits and applies 3 Burn.' },
        { n: 'Lampmaster Light', phase: 'mid', from: 'Lampmaster', why: 'AoE Light that escalates each hit.', fx: 'Deals high Light damage to all enemies, with increasing damage on each cast.' },
        { n: 'Troubadour Trumpet', phase: 'mid', from: 'Troubadour', why: 'Random buffs on up to 3 allies.', fx: 'Applies a random buff to 1-3 allies; a second random buff on Caster Mask.' },
        { n: 'Dualliste Storm', phase: 'late', from: 'Dualliste', why: 'Extreme single-target over 4 hits. Boss killer.', fx: 'Deals extreme single-target Physical damage over 4 hits; can Break.' },
        { n: 'Création Void', phase: 'late', from: 'Création', why: 'Extreme Void damage to random targets.', fx: 'Deals extreme Void damage to random targets over 3 hits, dealing more damage if the same target is hit multiple times.' },
        { n: 'Sakapatate Fire', phase: 'late', from: 'Ultimate Sakapatate', why: 'Extreme AoE Fire plus 3 Burn per target.', fx: 'Deals extreme Fire damage to all enemies over 3 hits, applying 3 Burn per hit.' },
        { n: 'Steel Chevalière Thrusts', phase: 'late', from: 'Steel Chevalière', why: 'High AoE that rewards a crit build.', fx: 'Deals high Physical damage to all enemies over 3 hits; critical hits deal double damage.' },
        { n: 'Portier Crash', phase: 'late', from: 'Portier', why: 'High AoE that can Break.', fx: 'Deals high Physical damage to all enemies; can Break.' }
      ],
      gradients: [
        { n: 'Mighty Strike', when: 'Unlocks automatically once Gradient Attacks open up in Act II.', fx: 'Deals high single-target damage over 2 hits using the weapon\'s element; deals double damage if target is Stunned, and moves to Almighty Mask.' },
        { n: 'Sanctuary', when: 'Unlocks around Relationship Level 4-5 (sources disagree) - raise it at camp.', fx: 'Gives 2 Shields and applies Regen to all allies for 3 turns.' },
        { n: 'Break Point', when: 'Unlocks at max Relationship Level 7.', fx: 'Deals extreme single-target damage using the weapon\'s element, fully filling the target\'s Break Bar and Breaking it.' }
      ]
    }
  };

  return {
    tiers: tiers,
    characters: characters,
    skillBuilds: skillBuilds,
    universalPictos: universalPictos,
    attributeEffects: attributeEffects,
    checklistItems: checklistItems
  };
})();
