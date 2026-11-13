# 2025 / REEFSCAPE

**Pair of Dice · FRC 7426 · 2025**

> Verified: the uploaded archive includes a CAD model for this year. The model's engineering specifications have not been verified from a season binder.

## Explore REEFSCAPE / interactive workbench

The entire 2025 CAD assembly is the starting point. Choose a subsystem to isolate its geometry and inspect it beside its explanation. The written sections below are still being expanded from verified team notes.

{{explorer:2025}}

## Overview

*Verified engineering documentation pending.*

## Robot strategy

*Verified engineering documentation pending.*

## Drivetrain

The drivetrain is available as its own CAD assembly. Detailed specifications and design decisions can be added once the team's 2025 engineering notes are available.

<a class="workbench-jump" href="#robot-explorer" data-explore-system="drivetrain">↑ Isolate drivetrain in the interactive workbench</a>

## Intake

*Verified engineering documentation pending.*

## Elevator and scoring mechanism

These independently viewable assemblies show how the elevator, carriage, and claw were packaged. The mechanisms' specifications and design reasoning still need to be verified against the team's 2025 documentation.

### Elevator

<a class="workbench-jump" href="#robot-explorer" data-explore-system="elevator">↑ Isolate elevator in the interactive workbench</a>

### Carriage

<a class="workbench-jump" href="#robot-explorer" data-explore-system="carriage">↑ Isolate carriage in the interactive workbench</a>

### Claw

<a class="workbench-jump" href="#robot-explorer" data-explore-system="claw">↑ Isolate claw in the interactive workbench</a>

## Climber

The climbing assembly has been separated from the full robot for closer inspection.

<a class="workbench-jump" href="#robot-explorer" data-explore-system="climber">↑ Isolate climber in the interactive workbench</a>

## Electrical system

*Verified engineering documentation pending.*

## Software

*Verified engineering documentation pending.*

## CAD and engineering documentation

*Verified engineering documentation pending.*

## Bumpers and protection

The bumper assembly can be inspected separately from the drivetrain and superstructure.

<a class="workbench-jump" href="#robot-explorer" data-explore-system="bumpers">↑ Isolate bumpers in the interactive workbench</a>

## Photos and diagrams

*Verified engineering documentation pending.*

## Design decisions

*Verified engineering documentation pending.*

## Lessons learned

*Verified engineering documentation pending.*

## Technical binder

*Verified engineering documentation pending.*


## Engineering notebook / interpreting CORAL placement

DEADPOOL's viewer uses the team's archived CAD assemblies for the chassis, elevator, carriage, and claw. The placement animation is a **kinematic illustration**, not a certified collision simulation or a claim about measured actuator limits. Until the team's full mechanism documentation is supplied, the geometry and joint travel should be explored as design references rather than verified dimensions.

### Coordinated placement

A believable CORAL scoring motion must coordinate the complete robot's position, elevator height, carriage and claw pose, and the orientation of the CORAL relative to the branch. The hollow game piece cannot simply teleport onto a target; it must approach the free end, become aligned with the receiving feature, and remain supported when the robot releases it.

For a simplified tube sliding along an upward-inclined branch, the component of gravity along the branch may be expressed as **g sin(β)**. A basic friction model would oppose that motion by **μ g cos(β)**, giving a possible sliding acceleration **a = g(sin β − μ cos β)**. Here *β* is the branch inclination and *μ* the contact-friction coefficient. Neither coefficient nor the complete contact mesh has been verified against DEADPOOL's field performance, so the viewer must not treat a simulated slide as measurement.

### What would make the simulation more accurate?

- Verified claw opening, release motion, manipulator degrees of freedom, and joint hard stops.
- The actual robot-to-target alignment and the geometry of the CORAL handoff or exit path.
- A simplified, tested set of collision surfaces around the claw, game piece, and field target.
- Video or telemetry from known successful placements for timing and clearance comparison.

In the viewer, select a real CAD component to inspect the imported label, then use the **Evidence** tab to distinguish observed geometry from unverified behavior. The exploded view is an inspection aid—not a physically possible actuation path.
