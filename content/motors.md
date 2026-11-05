# FRC Motors


# CTRE MOTORS


![Image from the original document](assets/document-image-11.png)


The Kraken X60 is a relatively compact high-performance FRC motor with an integrated controller, meaning you don't need a separate external motor controller.

Its output uses a standard FRC-friendly interface, and its integrated electronics reduce the amount of external wiring and packaging required.

This is one of the highest-performance motors commonly used in modern FRC.

It has high torque, high RPM, excellent power density, and integrated motor control and sensory. It’s a beast.

### Best uses

Drivetrain

Excellent for:

Swerve drive

Tank drive

High-speed drivetrains

Shooter

Very good when you need:

High acceleration

Fast recovery between shots

High flywheel speed

Climber

Excellent because you can heavily reduce it and obtain substantial output torque.

Large arms

Very capable, although the motor should be properly geared and gravity effects considered.

### When NOT to use it

Don't automatically use a Kraken because it's powerful.

It can be:

More expensive

More powerful than necessary

Overkill for a small roller or sensor-driven mechanism


![Image from the original document](assets/document-image-1.png)


The Kraken X44 is essentially part of the same modern high-performance family but occupies a different performance/package space than the X60.

It is useful when you want the advantages of the integrated brushless architecture without necessarily choosing the largest output option.

### Good uses

Swerve modules

Mechanism pivots

Elevators

Shooters

Compact high-power applications

This is REALLY REALLY Important but deciding between when to use an X44 or an X60 but just think of it like this

Use the X44 when you think:

“I need a serious motor, but an X60 is physically annoying.”

Use the X60 when you think:

“This mechanism is going to get abused and pull power repeatedly.”

But generally, if you have access to this two, use them, they are the cream of the CROP forgot FRC motors


![Image from the original document](assets/document-image-9.png)


Unlike the Kraken, the Minion is a standalone brushless motor. It does not have a motor controller built in; CTRE designed it to pair with the Talon FXS. It is also explicitly legal for the 2026 FRC season. You generally want to use the minion in places where well, you don’t need that much space but you want movement, one thing I want to point out is…

## Wrist or small arm movement

This is where the Minion becomes particularly interesting.

Suppose you need substantial torque but don't want a full-size NEO or Kraken hanging off the end of your arm.

The Minion with gear reduction can actually be a serious compact actuator

For example, at a hypothetical 50:1 reduction, the idealized stall output before losses would be:

3.1×50=155 N-M

Actual usable output would be lower due to gearbox losses and because you should never design for continuous stall.
