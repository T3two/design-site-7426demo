# RICOCHET

**2026 · REBUILT · FRC Team 7426**

RICOCHET is the result of a season spent thinking about more than just scoring. We wanted a robot that could move effectively, work through tight field spaces, handle fuel consistently, and give drivers useful options as a match changed. The design came together as a group of tightly packaged subsystems that could be improved without rebuilding everything else.

<figure class="ricochet-hero">
  <img src="assets/document-image-2.png" alt="CAD render of RICOCHET, the 2026 Pair of Dice competition robot, in a red-and-black assembly" loading="lazy">
  <figcaption>RICOCHET — the assembled 2026 robot, with a low chassis and a compact superstructure.</figcaption>
</figure>

<div class="ricochet-facts">
  <div><span>TEAM</span><strong>7426</strong></div>
  <div><span>SEASON</span><strong>2026 / REBUILT</strong></div>
  <div><span>DRIVE</span><strong>SWERVE</strong></div>
  <div><span>DESIGN APPROACH</span><strong>MODULAR</strong></div>
</div>

## Explore the CAD

The complete assembly is available below. Select **Load interactive 3D** to inspect the robot from any angle. The site downloads the large assembly only after you request it.

{{model:robot-2026-assembly}}

## The robot at a glance

RICOCHET combines a swerve drivetrain, over-bumper intake, extendable hopper, feeder, rotating turret, scoring mechanism, and climbing system. Each subsystem has its own design constraints, but the real challenge was getting the whole robot to work together.

## Drivetrain / a foundation we can trust

<figure class="ricochet-inline">
  <img src="assets/document-image-12.png" alt="CAD view of the four-module swerve drivetrain and compact red-and-black frame" loading="lazy">
  <figcaption>A low, serviceable swerve chassis with four corner modules.</figcaption>
</figure>

The drivetrain uses SDS MK5N swerve modules with R3 drive reduction, four-inch high-grip wheels, and Kraken X60 drive motors paired with Kraken X44 steering motors. The frame footprint is **27 × 27 inches**.

We also designed custom bumper brackets for quicker swaps. Aluminum tube rails form the perimeter and inner structure, while the internal rails leave openings for wire routing and an aluminum belly pan supports the layout. That packaging helps other systems sit within a predictable frame.

## Intake / built to work with the hopper

Our over-bumper intake brings fuel into the robot using a polycarbonate roller on a pivoting assembly. The design pairs a Kraken X60 roller motor with two pivot motors and aluminum support plates.

The intake wasn't finalized in one pass. Across prototypes, the team changed the geometry and motor placement, added a stabilizing kick plate, and used a backing plate to reduce the chance of fuel getting stuck. The later design also moved to a dead-axle arrangement after a bearing-retention problem.

The important lesson was that an intake doesn't operate independently. Small changes in roller position, compression, and pivot geometry affected how well it handed fuel off to the hopper.

## Hopper / making room when it matters

The hopper acts as an adjustable storage space between the intake and feeder. Its extending design allows the robot to carry fuel while also retracting to travel beneath the field's trench.

The mechanism uses cabinet-style drawer slides and added bearings to reduce friction during movement. We paid particular attention to clearance between the hopper and intake, since both systems needed to move without interfering with one another.

## Feeder / keeping fuel moving

The feeder takes fuel from the robot's storage area and directs it into the scoring mechanism. Its layout uses multiple guide belts and a compact internal transfer path, with angled panels to help collect fuel. The feeder was designed with the overall robot package in mind, rather than as a separate oversized assembly.

## Turret and vision / more flexibility

A rotating turret allows the scoring assembly to aim independently of the robot's drivetrain heading. The team integrated three Limelight cameras for awareness of the field and robot pose.

This arrangement was part of the goal to give the drivers more flexibility during matches while still preserving a compact robot layout.

## Scoring mechanism / consistent performance

RICOCHET's scoring assembly uses a fixed-geometry hood and a high-inertia flywheel. The team wanted predictable performance during movement and sought to reduce speed variation between scoring cycles.

The design changed significantly during the season. Early versions were reworked to improve packaging and consistency, and the post-Arizona revision addressed fuel feeding behavior that had shown up in competition. These iterations show why testing a complete mechanism matters as much as testing individual components.

## Climber / focused on the endgame

The climber extends upward to engage the endgame structure. The final design emphasizes a simpler arrangement than earlier concepts, with a compact footprint and a focus on reliability.

The team explored several concepts in CAD before settling on the version that fit the available space and matched the endgame strategy.

## Robot positions

The robot was documented in three distinct configurations:

- **Normal:** Compact for general driving and the start of a match.
- **Operating:** Intake and hopper extended for collecting fuel while the superstructure stays clear of surrounding mechanisms.
- **Climbing:** Climbing system deployed for the endgame sequence.

Those positions made it easier to check that moving subsystems could coexist inside the full robot envelope.

## Our design process

### Kickoff: choose priorities before mechanisms

We began by reviewing the game together, splitting into groups to analyze strategy and scoring opportunities. The team developed a list of needs, wants, and dislikes before moving too far into specific mechanism concepts.

### Prototyping: make it adjustable

A major offseason goal was to improve our prototyping process. We favored modular assemblies that could be adjusted and tested independently, rather than committing to one full robot design too early.

We considered scoring consistency, subsystem size, space for fuel, failure risk, and whether each mechanism actually supported the match strategy.

### Iteration: solve the problems we saw

| Subsystem | What changed | What we learned |
|---|---|---|
| Intake | Roller geometry, plate layout, motor position, stability features and bearing arrangement | Reliable fuel transfer depends on the intake and hopper working together |
| Hopper | Clearance and friction between moving structures | Packaging details can determine whether an adjustable subsystem is dependable |
| Scoring | Several geometry and feed-path revisions, including a post-Arizona redesign | Full-system testing exposes behaviors a standalone prototype can miss |
| Climber | Multiple concepts explored before simplifying the final design | A dependable, maintainable concept can matter more than adding complexity |

### Documentation: leave useful work behind

Part drawings, assembly drawings, design notebooks, and subsystem documentation help different groups communicate. They also give future Pair of Dice students something better than a finished CAD file: the reasoning behind the design.

## What we'd add next

More workshop photographs, annotated CAD closeups, electrical and controls diagrams, and measured testing results would complete the picture. The existing assembly and source images already provide a starting point for documenting how RICOCHET was built and improved.
