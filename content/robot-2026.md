# RICOCHET

**2026 · REBUILT · FIRST Robotics Competition Team 7426**

RICOCHET is our 2026 robot. Its architecture puts a full-width over-bumper intake, horizontally extending fuel hopper, feeder, rotating turret, fixed-hood flywheel shooter, and compact telescoping climber on a **27 × 27-inch swerve chassis**. The mechanism details and design changes below are taken from **Pair of Dice Robotics, RICOCHET Technical Binder (2025–2026), pages 4–18**. Where the binder gives a design goal rather than a measured result, this page keeps that distinction.

<figure class="ricochet-hero">
  <img src="assets/document-image-2.png" alt="CAD render of RICOCHET's complete 2026 robot assembly" loading="lazy">
  <figcaption>RICOCHET / 2026 — the full REBUILT competition robot in CAD.</figcaption>
</figure>

<div class="ricochet-facts">
  <div><span>TEAM</span><strong>7426</strong></div>
  <div><span>CHASSIS</span><strong>27 × 27 IN</strong></div>
  <div><span>TURRET</span><strong>370°</strong></div>
  <div><span>SHOOTER HOOD</span><strong>40.125°</strong></div>
</div>

## Explore RICOCHET / interactive workbench

Explore the entire robot or isolate its drivetrain, intake, hopper, feeder, turret, shooter, climber, and bumpers. The 3D model is exported CAD, while some movements and scoring trajectories are **illustrative**, not performance data from the team.

{{explorer:2026}}

**Workbench controls:** Search the imported assembly, select mesh parts, measure approximate point-to-point distances, and move a section plane through rendered geometry. The timeline summarizes stages described in the technical binder; it does **not** load separate historical CAD versions. Use the original engineering drawings—not the optimized browser mesh—for manufacturing measurements.

## Robot layout / how fuel moves

The binder identifies the **intake → hopper → feeder → shooter** sequence, with the shooter mounted to the **turret**. The hopper expands horizontally to store more fuel but can retract so the robot fits below the trench. A separate climber targets the **L1 rung**. The team prioritized shooting while moving, fuel capacity, and preserving room for a compact climbing system.

*Binder reference: subsystem overview, pp. 4–11.*

## Drivetrain

The chassis uses **SDS MK5N swerve modules** with **R3 drive reduction**, **4-inch high-grip molded wheels**, **Kraken X60 drive motors**, and **Kraken X44 steering motors**, with **field-oriented control**.

| Chassis part | Binder specification |
|---|---|
| Frame footprint | **27 × 27 inches** |
| Outside rails | **2 × 1 × 1/8-inch aluminum tubing** |
| Inside rails | **2 × 1 × 1/8-inch aluminum tubing**, with wiring cutouts |
| Belly pan | **1/8-inch aluminum** |
| Bumper mounting | Custom brackets for quick bumper swaps |

*Binder reference: p. 5.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="drivetrain">↑ Inspect drivetrain CAD</a>

## Intake

The team's over-bumper intake was chosen to gather FUEL quickly and maximize the number of balls collected. A **Kraken X60** drives the **1.5-inch polycarbonate tube rollers**. The pivot uses **two Kraken X60 motors** and **1/4-inch 7075-aluminum pivot plates**.

### What changed during prototyping

The iterations on page 17 describe actual changes, rather than a generic redesign:

- Added a **kick plate** to stabilize the intake.
- Changed plate size and motor location to accommodate compression and packaging changes; moved the intake motor closer to the roller.
- Added a **backing plate above the roller** to keep FUEL from becoming stuck.
- Changed the intake motor to an **X60** for greater torque and increased the intake pulley ratio.
- Converted from a **live axle to a dead axle** after bearings came out.
- Adjusted the backing churro and roller positions to find better compression.
- Added bearings to reduce friction between the hopper and intake.

The final mechanism shown in the binder is an over-bumper intake; it is not the same as DEADPOOL's abandoned 2025 floor-intake concept.

*Binder references: pp. 6 and 17.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="intake">↑ Inspect intake CAD</a>

## Hopper

The hopper holds FUEL collected by the intake. Its **horizontal extension** was a deliberate tradeoff: more storage when extended, and a lower profile to travel under the trench when retracted. The front wall projects slightly **beyond the intake** to help protect it during contact with other robots, field walls, and field elements.

The binder specifies **four 1/8-inch SRPP enclosure plates**, **repurposed cabinet drawer slides** for the extending mechanism, and **bearings along the front wall** to reduce friction.

*Binder reference: p. 7.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="hopper">↑ Inspect hopper CAD</a>

## Feeder / queuer

The feeder transfers FUEL from the intake and hopper to the shooter. Its **five guiding belts** move game pieces through the robot, with **1/4-inch aluminum side plates** supporting the belt structure. **Angled LEXAN plates** form an indexing area in which balls collect under gravity.

Near the shooter's entrance, spinning **helicopter blades** are intended to prevent jams and improve feeding. The binder specifies **Kraken 44 motors with 9:1 gearing** for the blades and **1/4-inch 7075-aluminum blade plates**.

*Binder reference: p. 8. The binder calls the motors “Kraken 44”; this page does not infer an unstated motor variant.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="feeder-queuer">↑ Inspect feeder / queuer CAD</a>

## Turret and field vision

The shooter sits on a **370-degree turret**. The design intent was to shoot from a range of field positions, including while the chassis moves, without always turning the whole robot. The turret uses **custom machined hardware** and a **custom energy chain**, **3D-printed in PLA Matte**, to accommodate motion.

The binder documents **three Limelights** for field pose, with a custom mount intended to provide **360-degree vision**. This is a statement of the intended field-of-view arrangement, not an independently validated localization accuracy figure.

*Binder reference: p. 9. The plate-thickness fraction in the binder's turret bullet is illegible/incorrectly typeset, so no thickness is asserted here.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="turret">↑ Inspect turret CAD</a>

## Shooter / fixed-angle flywheel

RICOCHET's flywheel shooter was designed around the goal of shooting while moving. To simplify controls, the team settled on a **fixed hood angle of 40.125°** instead of the adjustable hood shown in earlier concepts.

| Shooter component | Binder specification |
|---|---|
| Hood side plates | **1/4-inch 6061 aluminum** |
| Hood guide rails | **1/4-inch 6061 aluminum** |
| Hood angle | **40.125° fixed** |
| Guide-rail standoffs | **1/8-inch aluminum** |
| Game-piece compression | **1 inch** |
| Flywheel | **8 lb solid brass**, **4-inch diameter** |
| Flywheel motors | **Kraken X60** |

The heavy brass wheel was intended to reduce wheel-speed loss between shots. The binder does not report measured RPM retention or shot accuracy achieved by the final robot.

### Shooter development / iterations I, II and final

Pages 15 and 18 document the evolution:

1. Increased compression by changing the **distance between the flywheel and backing plate**.
2. Increased solid-brass flywheel diameter from **3 to 4 inches**, adding mass and compression.
3. Removed the **adjustable hood** to save space; adopted the fixed shot angle.
4. Removed pulleys and **directly coupled the wheel** to save space and avoid pulley melting.
5. **After Arizona:** Introduced **1-inch aluminum backrollers** to reduce backspin. The team had found that FUEL rebounded from the floor toward the neutral zone, preventing the desired feeding behavior. The revision was described as a faster shot and marked the **fourth shooter**.

The post-Arizona design should not be described merely as a cosmetic shooter change: its documented purpose was to change **backspin and FUEL feeding behavior**. No quantitative before/after speed data is supplied.

*Binder references: pp. 10, 15 and 18.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="shooter">↑ Inspect shooter CAD</a>

## Climber / L1 rung

The climber targets the **L1 rung**, while leaving space for the hopper and shooter. Its final design uses a **three-stage telescoping arm** with a maximum documented extension of **30 inches**, driven by a **Kraken X60 at 45:1 gearing**. The **hook** and **mounting plates** are **7075 aluminum**.

### Prototype decisions

The binder shows three proposed climber concepts, but explicitly says those earlier climb designs were **not fabricated**. They were brainstormed and explored before the final design was chosen in light of **time constraints, resources, packaging, and programming simplicity**. They must not be labeled as physically tested climb prototypes.

*Binder references: pp. 11 and 16.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="climber">↑ Inspect climber CAD</a>

## Bumpers and protection

Custom bumper brackets help speed up installation and removal. In the imported CAD archive, the bumper assembly can be isolated from the chassis. The binder does not specify bumper material, fastening torque, or measured impact performance.

*Binder reference: p. 5.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="bumpers">↑ Inspect bumper CAD</a>

## Three documented robot positions

The binder illustrates three robot configurations on page 12:

- **Normal position:** The compact robot at the beginning of a match.
- **Operating position:** Both the hopper and intake extend over the bumper. The hopper front protrudes slightly farther to protect the intake from field contact.
- **Climbing position:** The robot is prepared to climb, with its climbing mechanism deployed and what the binder describes as the **elevator fully actuated**.

These are documented configurations, not an automatic claim that the browser animations reproduce every linkage or clearance.

*Binder reference: p. 12.*

## Design process and documented priorities

### Kickoff

The team watched the game reveal together, split into groups to read the game manual, compared scoring strategies, and wrote **needs, wants, and dislikes**. Parents helped construct a wooden partial field for testing.

### Prototype requirements

The binder says the team **required 95% shot accuracy** as a design target. **It does not state that this target was measured or achieved.** The team also prioritized smaller mechanisms to increase speed and preserve hopper space, evaluated the likelihood of match failures, and considered whether climbing supported its strategy. The page distinguishes CAD concepts from fabricated prototypes.

### Parts management and documentation

The team used **parts drawings** to communicate how individual components are fabricated, **assembly drawings** to explain subsystem integration, and a **design notebook** to record iterations and why decisions were made. The technical binder serves as a summary for students and external readers.

*Binder reference: p. 14.*

## Verified changes at a glance

| Subsystem | Decision documented in the binder | Source |
|---|---|---|
| Intake | Changed geometry, compression, and bearing arrangement; adopted dead axle | p. 17 |
| Shooter | Fixed 40.125° hood; enlarged brass flywheel; removed pulley drive | pp. 10, 15 |
| Shooter after Arizona | Added 1-inch backrollers to reduce backspin during feeding | p. 18 |
| Climber | Selected compact three-stage telescoping design; earlier concepts not fabricated | pp. 11, 16 |
| Hopper | Used sliding extension to balance storage capacity and trench clearance | p. 7 |

## Source and accuracy notes

**Primary technical source:** *Pair of Dice Robotics — RICOCHET Technical Binder, 2025–2026*, 19 pages. This page preserves the binder's stated measurements and design intent. It does not invent missing tolerances, a confirmed shot percentage, calibrated turret stops, current limits, or measured motion timings.

The supplied PDF is the source for the page; the website does not currently host the original PDF as a downloadable file.


## Engineering notebook / interpreting the scoring animation

The 3D experience separates three things that are easy to mistake for one another: **documented CAD**, **kinematic calculations**, and **measured real-world performance**. RICOCHET's imported robot and named components provide the geometry. The shooting sequence then illustrates how the whole robot can move, how a turret can aim about its mounting axis, and how a launched FUEL object responds to gravity. It is not a substitute for a calibrated shot table.

### Geometry and coordinate systems

Onshape-exported robot assemblies may use a different up-axis from the browser camera. The viewer first reorients the imported CAD into a consistent upright coordinate system. The shooter exit direction is transformed by the live world matrix of the CAD component, so a moving turret also changes the direction of a simulated shot. That is essential: otherwise the ball can appear to leave in a direction that the nozzle is not pointing.

### Projectile model used for the illustration

For a launch speed *v*, elevation angle *θ*, horizontal distance *d*, and elapsed time *t*:

- Horizontal motion: **d = v cos(θ) t**
- Vertical motion: **Δy = v sin(θ) t − ½ g t²**
- Standard gravitational acceleration for the illustrative model: **g = 9.81 m/s²**.

The browser demonstration can derive an ideal launch speed from a chosen direction and target elevation. It ignores aerodynamic drag, ball compression, spin, feed delay, motor-speed variation, and robot vibration. Consequently, an illustrated target hit is **not** proof that a real robot would score with those settings.

To turn this into a validated digital twin, we would need the verified launcher exit point, turret-axis survey, mechanical stop angles, measured wheel surface speeds, calibration shots, and release-direction observations from team testing.

### Design questions to explore in the viewer

- How does rotating only the turret affect the exit direction compared with turning the full chassis?
- What happens to the shot's travel time if launch speed changes while distance stays fixed?
- How do a high-inertia flywheel and a consistent feed path reduce the likelihood of shot-to-shot variation, and what test data would confirm the improvement?
- Which intake or hopper clearances must be verified before commanding a scoring sequence?

The **How it works**, **CAD source**, and **Evidence** tabs next to the viewer identify whether a displayed claim comes from source geometry, team-written notes, or an illustrative calculation.
