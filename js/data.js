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

  return {
    tiers: tiers,
    characters: characters,
    universalPictos: universalPictos,
    attributeEffects: attributeEffects,
    checklistItems: checklistItems
  };
})();
