# DEADPOOL

**2025 · REEFSCAPE · FRC Team 7426**

DEADPOOL was built around a three-stage elevator and a carriage-mounted wrist with a combined CORAL and ALGAE claw. The team revised the elevator as its game strategy expanded, reconsidered its deep-cage climber after testing, and removed an experimental floor intake when weight and strategic priorities changed. The specifications below come from the team's **2025 DEADPOOL Technical Binder**, not estimates from the 3D model.

<figure class="ricochet-hero">
  <img src="models/preview/posters/2025.jpg" alt="CAD preview of DEADPOOL, Team 7426's 2025 REEFSCAPE robot" loading="lazy">
  <figcaption>DEADPOOL / 2025. CAD preview of the robot; subsystem illustrations and specifications are described in the team's 11-page technical binder.</figcaption>
</figure>

<div class="ricochet-facts">
  <div><span>TEAM</span><strong>7426</strong></div>
  <div><span>SEASON</span><strong>2025 / REEFSCAPE</strong></div>
  <div><span>CHASSIS</span><strong>28 × 28 IN</strong></div>
  <div><span>DRIVETRAIN</span><strong>SDS MK4i</strong></div>
</div>

## Explore DEADPOOL / interactive CAD

Start with the complete 2025 assembly, then isolate the drivetrain, elevator, carriage, claw, climber, or bumpers. The CAD viewer lets you inspect actual parts. Its CORAL-scoring sequence is an **illustration**, not a measured reproduction of the robot's real joint travel or field performance.

{{explorer:2025}}

## Drivetrain / the base of the robot

DEADPOOL's **28 × 28-inch** chassis uses **SDS MK4i swerve modules** with **L2 drive reduction** and **4-inch Colson wheels**. The binder specifies Kraken motors and field-oriented control for driving and steering; it does not identify a particular Kraken model for each application.

The outside and inside chassis rails are **2 × 1 × 1/8-inch aluminum tube**. Exterior cutouts reduce weight; internal through-cutouts accommodate wiring. The **1/8-inch aluminum belly pan** has no weight-reduction cutouts. **1/16-inch polycarbonate covers** protect electronics and swerve modules. Custom bumper brackets make swaps faster, and **two Limelights** are specified for reef alignment.

*Source: DEADPOOL Technical Binder, page 2.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="drivetrain">↑ Inspect drivetrain CAD</a>

## Three-stage elevator / extending the strategy

The elevator begins at approximately **41 inches** above the ground and reaches approximately **90 inches**. It uses **two Kraken motors**, a **24:1 ratio**, **pull-up and pull-down rope runs**, and **1/8-inch Dyneema rigging**. A bottom limit switch provides a zero reference; a **CTRE Through Bore encoder** provides positioning feedback.

Its base uses **2 × 1 × 1/8-inch tubing**, while stages 1 and 2 use **2 × 1 × 1/16-inch tubing**. The binder also identifies **1/4-inch aluminum elevator support plates** and **WCP Inline Clamping Bearing Blocks**. Two **Limelight 4** cameras, on adjustable 3D-printed mounts, assist with human-player-station alignment.

### Why the elevator changed

The team originally explored a **two-stage elevator** for quick CORAL scoring from the trough through L3 and ground ALGAE pickup. As the team's strategy expanded to more of the game, the design changed to **three stages** to better reach **L4 and the Barge**. This is a documented strategic revision—not simply an aesthetic CAD change.

*Source: pages 3 and 9. Heights are approximate as written in the binder.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="elevator">↑ Inspect elevator CAD</a>

## Carriage and wrist / controlled reach

The carriage uses **one Kraken motor with a 48:1 ratio** to move the wrist. Its wrist mount extends **8.5 inches** behind the carriage for added claw reach. Main plates provide an additional motor mounting-hole pattern for possible future upgrades, while **1/2-inch aluminum churros** act as structural standoffs.

The supporting structure includes **2 × 1 × 1/8-inch tubes**, overlapping **1/8-inch plates** around the inline clamping bearing blocks, **1/2-inch hex dead-axle interfaces**, and through-holes to access motor fasteners.

*Source: page 4.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="carriage">↑ Inspect carriage CAD</a>

## Dual-purpose claw / CORAL and ALGAE

DEADPOOL's claw has **distinct CORAL and ALGAE mechanisms**, not a single generic roller.

### CORAL side

- **Two NEO 550 motors**, with **2:1 gearing**, intake and score CORAL.
- **1/4-inch polycarbonate plates** keep the CORAL claw lightweight.
- **Two sets of six 2-inch wheels**, **45A durometer**, serve as top and bottom rollers.
- A **PLA-CF printed hard stop** sets a consistent CORAL resting position.
- **Two beam-break sensors** verify CORAL presence.

### ALGAE side

- **Two NEO 550 motors**, with **20:1 gearing**, drive the ALGAE-grabbing mechanism.
- **1/8-inch weight-reduced aluminum plates** support it.
- **Two sets of two 4-inch wheels**, **60A durometer**, serve as left and right rollers.
- **PLA-CF printed guides** help secure ALGAE while guiding CORAL.
- **One beam-break sensor** verifies ALGAE presence.

The binder's **claw iterations** page shows multiple earlier claw geometries before the integrated arrangement. It presents visual design alternatives but does not provide measured success rates for them.

*Source: pages 5 and 8.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="claw">↑ Inspect combined claw CAD</a>

## Deep-cage climber / stability and retention

The climber uses **one NEO motor with 25:1 gearing** for the winch and **one NEO 550 motor with 5:1 gearing** to deploy its arms. A **1/2-inch ratchet wrench** is specified to prevent the robot from descending after the buzzer.

The tower and arms use **2 × 1 × 1/8-inch aluminum tube**. The grabbers use **1/4-inch weight-reduced aluminum plates**; climber mounts and leverage plates are also **1/4-inch aluminum**. **1/8-inch aluminum washers** help keep the cage within the leverage-plate area.

### Why the climber changed

The initial climber took inspiration from **Ri3D RustHOUNDS**, but testing showed that DEADPOOL's **center of gravity** and subsystem packaging differed. The team needed to bring the cage inward around the elevator and claw, so guiding components were added to position it for a sufficient climb height. The original concept could not simply be copied unchanged.

*Source: pages 6 and 10.*

<a class="workbench-jump" href="#robot-explorer" data-explore-system="climber">↑ Inspect climber CAD</a>

## Prototypes and decisions / what didn't reach the final robot

| Area | Documented change | Engineering reason |
|---|---|---|
| Elevator | Two stages → three stages | Expanded scoring strategy required L4 and Barge reach |
| Claw | Several geometric concepts explored | The binder shows claw iterations before the combined mechanism |
| Climber | Ri3D-inspired first concept → guided cage entry | The robot's center of gravity and frame packaging differed |
| Floor ALGAE intake | Built as a prototype, then removed | Strategy changes and weight restrictions favored more critical subsystems |

The **floor ALGAE intake did not make the final build**. The team liked its simplicity but removed it as priorities and weight constraints changed. It should not appear in this page as a finished competition subsystem.

*Source: pages 8–11.*

## Vision, controls and evidence

The binder identifies **two reef-alignment Limelights** on the drivetrain and **two Limelight 4 cameras** for human-player alignment at the elevator. It also specifies field-oriented swerve driving, the elevator's bottom zeroing switch, its CTRE Through Bore encoder, and the claw's beam-break sensors. It **does not provide** a complete wiring diagram, software architecture, autonomous routines, verified motor current limits, or measured cycle times; those values are not claimed here.

## CAD, safety and verification notes

The 2025 CAD archive includes the complete robot and separate subsystem models. The dimensions and gear ratios in this page are transcribed from the technical binder; dimensions inferred from optimized browser meshes may differ from shop measurements.

The animated CORAL placement sequence is an educational visualization. **The binder does not establish** the precise animation timing, dynamic collision behavior, joint travel envelope, or measured CORAL placement success rate. Likewise, exploding CAD components is a viewing tool, not a physically possible actuation sequence.

### Technical source

**Pair of Dice Robotics Team 7426, `DEADPOOL Technical Binder` (2025), 11 pages.** Page 2: drivetrain; page 3: elevator; page 4: carriage; page 5: dual-purpose claw; page 6: climber; page 7: robot arrangements; pages 8–11: mechanism iterations. The complete PDF supplied by the team has not been published as a website download.
