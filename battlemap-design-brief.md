# Forced-Movement Battlemap Design Brief

Status: initial working model for revised fifth-edition (2024 / “5.5”) combat.

## Working thesis

A good battlemap generator should not begin by drawing a pretty room. It should begin by laying out tactical relationships, test them against the party's movement tools, and only then render the room.

The generator's real product is a **terrain rules graph**:

- where creatures can stand;
- which destinations are desirable or dangerous;
- how many 5-foot increments separate combatants from those destinations;
- which movement vectors are possible from likely attack positions;
- how creatures can recover from displacement;
- what cover, line of sight, elevation, and chokepoints do to the available choices.

The art is the final skin over that graph.

## Rules baseline

Use the official [SRD 5.2.1](https://www.dndbeyond.com/srd) as the machine-readable baseline. It uses the revised core rules and is available under CC BY 4.0. The linked Roll20 basic rules are useful but describe the 2014 rules and should not be the authority when the versions differ.

The following revised-rule facts immediately affect map design:

| Mechanic | Map consequence |
|---|---|
| One grid square represents 5 feet | All tactical geometry should be generated in 5-foot increments. |
| Shove is an Unarmed Strike option | Any capable creature can attempt a 5-foot push instead of dealing damage, subject to a Strength or Dexterity save and a size limit. Every map can therefore assume at least a small amount of forced movement. |
| The Push weapon mastery moves a qualifying target up to 10 feet straight away on a hit | Ten-foot push lanes should be common enough to matter, but not so common that every hit becomes a ring-out. |
| Some character features, spells, and monsters move targets 15–60 feet | A party/encounter profile is needed. One generic map cannot treat a 5-foot shove and a 60-foot repulsion effect as equivalent. |
| Forced relocation does not provoke an Opportunity Attack | Enemy threat zones do not themselves make push destinations costly. Terrain, positioning, objectives, or follow-up attacks must provide the payoff. |
| A grapple ends if the target and grappler are separated beyond the grapple's range | Walls, ledges, portals, currents, and other separation tools can make displacement tactically useful even without damage. |
| Difficult Terrain costs extra voluntary movement | It makes recovery and approach expensive. It should not be assumed to reduce the distance of a discrete push or pull unless a specific effect says so. |
| Falling deals 1d6 Bludgeoning damage per 10 feet, to a maximum of 20d6 | Ledge height is a damage dial. A fall can be meaningful without being an instant kill. |
| Climbing normally costs extra movement; long jumps depend on Strength and a running start | A pit or elevation change needs explicit exit geometry. Its ledges, ladders, stairs, handholds, and run-up space determine whether it is a delay, a trap, or a death sentence. |

“Forced movement” is useful design shorthand, but individual rules usually say *push*, *pull*, or otherwise relocate. Each exact effect still governs its direction, distance, save, size limit, and timing.

## The map grammar

Each generated map should combine several of these primitives. No primitive is interesting by itself; the tactical value comes from their spacing and connections.

### 1. Soft hazards

Consequences that cost position or movement rather than large amounts of HP:

- difficult terrain;
- a 5- or 10-foot drop;
- prone-on-entry ice, grease, scree, or loose debris;
- a lower level that requires climbing or a longer route to escape;
- obscuring smoke or darkness;
- a zone exposed to enemy fire;
- a one-way current, conveyor, or slope.

These are safe to place near the main melee because they create frequent movement plays without deciding the encounter on one roll.

### 2. Hard hazards

Consequences that deal damage, impose a strong condition, or remove a creature from the fight:

- fire, acid, lightning machinery, thorns, or freezing water;
- a tall fall;
- a closing gate, crusher, or trap;
- a cage, portal, or isolated platform;
- deep water or another zone requiring special movement.

Hard hazards need telegraphing, limited frontage, and a recovery or counterplay route. A lethal chasm around the entire arena would make forced movement powerful but the map one-dimensional.

### 3. Stops and vector shapers

Objects that determine where a straight push can and cannot go:

- pillars, statues, trees, machinery, and crates;
- railings or low walls;
- corners and diagonal walls;
- creatures and narrow occupied lanes;
- doors, portcullises, and movable barricades.

These create aiming problems. “Can I get to the other side of the target?” should often be a more interesting question than “Do I have a push available?”

### 4. Recovery routes

Every displacement consequence should answer “what happens next?”:

- ladder: short but exposed recovery;
- stairs: longer but safe recovery;
- climbable ledge: costly and perhaps check-gated;
- bridge or jump: quick for mobile characters;
- lever: ally can change the terrain;
- destructible wall or rail: hazard access can change during the fight.

Multiple recovery options preserve player agency and make mobility features valuable.

### 5. Objectives

An objective makes position matter even when nobody is pushed into damage:

- hold two control points;
- stop a ritual at three stations;
- escort a cart across a bridge;
- operate a crane, sluice, or furnace;
- rescue a captive before a moving hazard reaches them;
- capture a creature rather than kill it.

The best hazards and objectives interact. For example, moving an enemy off a control plate might be more valuable than dealing fall damage.

## Placement rules for a first generator

1. **Design for 5-, 10-, and 15-foot bands.** Place soft consequences 5–10 feet from common melee positions and hard consequences usually 10–20 feet away. This lets ordinary Shove matter and lets a Push mastery create stronger but not automatic payoffs.
2. **Do not make the perimeter the only hazard.** At least half of the displacement opportunities should point toward an internal feature, lower tier, objective zone, or enemy-favored position.
3. **Keep multiple approaches.** Each important zone should normally have two routes, and the whole map should contain at least one loop. Single corridors turn positioning into congestion.
4. **Give both sides leverage.** Enemy deployment should be able to use the same geometry. Safe player spawn zones may be appropriate, but permanent one-way advantage is not.
5. **Protect setup rounds.** Initial positions should rarely allow a hard-hazard ring-out before the target has acted, unless that danger is the encounter's explicit premise.
6. **Make elevation legible.** Every level needs a printed height, and every connection needs a movement cost. Perspective art alone is insufficient for play.
7. **Use exact trigger language.** Every damaging zone needs a key stating whether it triggers on entering, moving through, starting a turn, ending a turn, falling into it, or being moved into it.
8. **Calibrate by expected HP, not just level.** A hazard should be tagged as nuisance, serious, or potentially decisive relative to the expected combatants.
9. **Check creature sizes.** A layout meant for Large monsters needs 10-foot routes and landing spaces; a narrow bridge may accidentally prevent the featured monster from participating.
10. **Leave ordinary ground.** Roughly 35–55 percent of usable squares should be tactically neutral so the special terrain stays readable and the fight can breathe.

## Generator inputs

The rulebook is necessary but not sufficient. A useful request should eventually include:

```yaml
party:
  count: 4
  level: 4
  forced_movement:
    - name: Push mastery
      distance_ft: 10
      direction: straight_away_from_attacker
      size_limit: Large
      save: none
  unusual_mobility: [climb_speed, teleport]

encounter:
  opponents: []
  objective: defeat_or_drive_off
  desired_rounds: 4
  lethality: standard

map:
  theme: ruined_foundry
  grid: square_5_ft
  target_dimensions_squares: [24, 18]
  platform: generic_vtt
  gridless_export: true
```

For a fast human prompt, the minimum is: **party level/count, notable push/pull abilities, enemies, environment, objective, desired danger, and VTT/print format**.

## Generator outputs

A complete map package should contain four layers:

1. **Player map:** clean art, no secrets, preferably both gridded and gridless.
2. **GM overlay:** heights, difficult-terrain bounds, cover, hazard IDs, entrances, spawn suggestions, and interactive objects.
3. **Rules key:** exact trigger, damage/save, movement cost, reset timing, and recovery method for every special feature.
4. **Tactical audit:** a short explanation of the intended movement plays and warnings about party abilities that trivialize or greatly amplify the map.

For VTT use, later versions should also export walls, doors, lights, elevation regions, and hazard polygons in a structured format such as Universal VTT where practical.

## First worked concept: the Broken Smelter

Assumptions: four level-4 characters, at least one 10-foot Push mastery, mostly Medium enemies, four-round fight.

### Topology

- Overall play area: 24 × 18 squares (120 × 90 feet).
- West floor: player approach and scattered half-cover.
- Center: a 15-foot-wide raised casting platform, 10 feet above the floor.
- North and south: two shallow slag trenches, 10 feet below the floor. Falling deals 1d6; the trench is Difficult Terrain and has ladders at its far ends.
- East: furnace controls on a 10-foot-high enemy platform, accessible by stairs and one narrow bridge.
- Two internal steam vents: 10-foot squares near, but not directly beside, the central melee positions.
- One suspended crucible: a lever can move it between two marked positions, temporarily changing which push lane is dangerous.

### Terrain key

| ID | Feature | Effect | Design purpose |
|---|---|---|---|
| S1–S2 | Slag trench | 10-foot fall (1d6); trench floor is Difficult Terrain; ladders cost normal climbing movement | Frequent, recoverable 5–10-foot displacement payoff |
| V1–V2 | Steam vent | When a creature enters the vent for the first time on a turn or starts its turn there, DC 12 Dexterity save; 1d6 Fire damage on a failure | Internal hazard that rewards pushes without removing a creature |
| C | Casting platform | 10 feet high; two stairs, one climbable broken face | Elevation, cover, and a choice of recovery routes |
| F | Furnace controls | A creature adjacent to the controls can use an action to disable one vent or reverse a conveyor | Objective competes with direct attacks |
| R | Partial railings | Stop a fall and provide Half Cover; each section has AC/HP and can be destroyed | Telegraph safety early, then allow geometry to change |
| B | Conveyor | Difficult Terrain when moving against it; at initiative count 20, unsecured creatures on it move 5 feet east | Predictable forced relocation that both sides can exploit |

### Intended play

- A normal 5-foot Shove can put a poorly positioned creature into a vent or off an unrailed edge.
- A 10-foot Push can do that from a safer attack square, cross one additional band of floor, or bypass a railing gap.
- The trenches inconvenience rather than eliminate a creature, so forced movement stays fun even when used repeatedly.
- The controls and moving crucible make the optimal vectors change during the encounter.
- Enemies can threaten the same plays, keeping the terrain from feeling like a player-only damage multiplier.

## Tactical validation

Before rendering art, a generated layout should pass these checks:

| Check | Initial target |
|---|---|
| Round-one hard-hazard eliminations | None from default spawn positions |
| Meaningful destinations within 5 feet of likely melee | At least 2 soft, no more than 1 hard per major combat zone |
| Meaningful destinations within 10 feet | 2–4 per major combat zone, from different attack vectors |
| Routes to each objective | At least 2 |
| Global route loops | At least 1 |
| Neutral usable terrain | 35–55% |
| Cover availability | Some cover reachable from each entry, but no continuous protected firing line |
| Recovery from nonlethal displacement | Possible within roughly one turn for a typical creature |
| Featured creature fit | Every mandatory route and combat zone accommodates its space |

A later automated validator can sample likely token positions, cast push rays of 5/10/15 feet, and count how often they end in a meaningful destination. That “push-opportunity map” is a much better quality signal than visual complexity alone.

## Information to add when available

- Actual character sheets or a list of each PC's forced-movement and mobility options.
- Likely monster roster and size distribution.
- Full 2024 PHB/DMG material that is not in the SRD, especially feats, subclasses, items, hazards, and encounter-building guidance.
- Target output: Roll20, Foundry, Owlbear Rodeo, another VTT, or printable 1-inch squares.
- Preferred visual tone and whether the map needs reusable modular tiles or a bespoke encounter.

## Proposed next build step

Represent terrain and forced-movement abilities in small JSON records, then make a layout-first prototype that:

1. generates walkable zones, height regions, routes, and hazards;
2. scores 5/10/15-foot push rays from plausible combat squares;
3. rejects unfair or tactically empty layouts;
4. emits a simple SVG tactical map and GM key;
5. applies attractive art only after the geometry passes validation.

This keeps rule accuracy and tactical usefulness testable while allowing the rendering method—vector tiles, procedural textures, or image generation—to change later.
