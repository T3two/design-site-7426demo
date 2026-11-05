# CAD & FeatureScript


Now the CAD software which I will be using, and the one that is commonly used today is Onshape.com but you may be using Fusion, Solidworks, or perhaps a different cad site. However, most of these function the same. You draw lines, extrude and such. However, the layout will be different or maybe you might just have to google on how to do your CAD software equivalent of an onshape feature.

Step 1: Download Featurescripts and such.

Everything you need to do is first is to install a library, I am unsure what other CAD softwares will use for their libraries but on Onshape we use FRCDesignApp

# 1. Introduction: What Is FeatureScript?

Onshape is normally used by creating parts through features such as:

Sketch

Extrude

Revolve

Fillet

Chamfer

Boolean

These features are already built into Onshape. However, sometimes the feature you need does not exist.

```javascript
FeatureScript allows users to create their own custom features.
```

A FeatureScript can create geometry, modify geometry, analyze parts, calculate measurements, and create completely custom tools inside Onshape.

# 2. What You Need Before Learning FeatureScript

Before starting FeatureScript, you do not need to be an expert programmer.

However, it helps to understand a few basic ideas.

## You should understand:

### Variables

Variables store information.

For example:

```javascript
const referenceVolume = 10;
```

This stores a value called:

referenceVolume

In our project, variables store things such as:

Volumes

Queries

Percentages

Selected geometry

### Functions

Functions are reusable pieces of code.

For example:

```javascript
function getVolume()
```

```javascript
{
```

```javascript
// Calculate volume
```

```javascript
}
```

Instead of rewriting the same instructions repeatedly, a function allows the code to reuse them.

The Part Geometry Grader uses functions for tasks such as:

Copying bodies

Getting volumes

Calculating percentages

Finding the largest error region

### If Statements

An if statement allows code to make decisions.

For example:

```javascript
if (volume > 0)
```

```javascript
{
```

// Do something

```javascript
}
```

The code inside only runs if the condition is true.

The grader uses this to handle situations such as:

No missing geometry exists

No extra geometry exists

The user selected the wrong number of parts

# 3. What Makes FeatureScript Different?

```javascript
FeatureScript is specifically designed for Onshape CAD modeling.
```

This is important.

```javascript
FeatureScript is not simply general-purpose JavaScript.
```

Although the syntax may look somewhat similar, FeatureScript has tools specifically designed for CAD.

For example, FeatureScript understands concepts such as:

Bodies

Faces

Edges

Vertices

Solids

Sketches

Transforms

Boolean operations

This means FeatureScript can directly interact with the geometry inside an Onshape Part Studio.

For example:

```javascript
opBoolean(...)
```

can perform Boolean operations on CAD geometry.

A normal programming language would not automatically understand what a CAD solid body is.

# 4. Understanding the Structure of a FeatureScript

Most FeatureScripts follow a general structure.

### 1. FeatureScript version

### 2. Imports

### 3. Helper functions

### 4. Feature definition

### 5. User inputs

### 6. Main feature logic

### 7. Results

Let's look at each part.

# 5. FeatureScript Version

At the top of the file is:

```javascript
FeatureScript 3070;
```

This tells Onshape which version of FeatureScript the code is written for.

```javascript
FeatureScript changes over time, so specifying a version helps ensure the code behaves consistently.
```

For this project:

```javascript
FeatureScript 3070;
```

means the script is intended for FeatureScript version 3070.

### General Rule

When starting a FeatureScript:

Use the version generated or specified by your Onshape Feature Studio.

Do not randomly change versions unless you understand why.

# 6. Imports: Giving Your Script Access to Tools

FeatureScripts often import Onshape's standard libraries.

For example:

```javascript
import(path : "onshape/std/geometry.fs", version : "3070.0");
```

Think of an import like opening a toolbox.

The toolbox contains useful tools for working with geometry.

Without the proper tools available, your script may not recognize certain operations or types.

For the Part Geometry Grader, geometry functionality is important because the script needs to work with:

Solid bodies

Boolean operations

Volumes

Colors

Geometry queries

# 7. Helper Functions

As your FeatureScript becomes larger, you should avoid repeating the same code.

Instead, create helper functions.

For example:

```javascript
function getVolume(context is Context, entities is Query)
```

```javascript
{
```

return evVolume(context, {

```javascript
"entities" : entities
```

});

```javascript
}
```

This creates a reusable function that measures volume.

Instead of repeatedly writing:

```javascript
evVolume(...)
```

throughout the script, we can write:

getVolume(...)

This makes the main code easier to read.

## Why Helper Functions Matter

They improve:

Organization

Readability

Reusability

Debugging

A large FeatureScript should ideally read more like a series of instructions than one massive block of repeated code.

# 8. The Most Important Concept: Queries

One of the biggest concepts in FeatureScript is the Query.

A query tells Onshape:

“Find these entities.”

Those entities could be:

Bodies

Faces

Edges

Vertices

For example:

```javascript
definition.referencePart is Query;
```

This means the user will select geometry, and that selection will be stored as a query.

## Why Not Just Store the Part Directly?

Because CAD models constantly change.

A query allows FeatureScript to identify geometry inside the current model.

The script can then use the query in operations such as:

```javascript
evVolume()
```

or:

```javascript
opBoolean()
```