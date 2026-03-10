# Plasma Toroid Tuning Guide

This demo is driven by an animated torus field. The controls do not all push the shape in the same space, so the easiest way to tune it is to keep a simple mental model in mind:

```text
theta = motion around the big ring
phi   = motion around the tube cross-section

center      = ringCenter(theta, majorRadius + ringOffset)
tube        = tubeDirection(theta, phi) * (minorRadius + radialOffset)
binormal    = worldUp * binormalOffset
tangent     = ringTangent(theta) * tangentOffset
warp        = objectSpaceXYZOffset
position    = center + tube + binormal + tangent + warp
density     = clamp(base + layer1 + layer2, 0, 1)
```

The implementation lives in:

- `src/plasmaToroidField.ts`
- `src/PlasmaToroidDemoPage.tsx`
- `src/usePlasmaToroidInspector.ts`

## Quick Mental Model

- `Geometry` sets the base donut.
- `Orbit` controls how fast particles travel around the donut before any extra wobble.
- `Flow` changes how particles slide around that donut before deformation.
- `Wobble Local` changes the torus in torus-local space.
- `Warp XYZ` bends the result in object space after the torus math.
- `Density` decides where particles are visible, so it reads as clumping and voids rather than shape.
- `Render` changes how each particle sprite reads on screen.
- `Camera` is there to inspect the shape from the angles that usually expose weaknesses.

## Shared Meanings

Most animated channels use the same four inputs:

- `Amplitude`: how far the effect pushes.
- `Freq T`: how many repeats happen around the major ring (`theta`).
- `Freq P`: how many repeats happen around the tube cross-section (`phi`).
- `Speed`: how fast the pattern animates over time.

Practical rule:

- Increase `Amplitude` when you want more visible effect.
- Increase `Freq T` when you want more repeats around the donut.
- Increase `Freq P` when you want more breakup around the tube itself.
- Increase `Speed` when you want livelier motion rather than a stronger static silhouette.

`Orbit` is the exception: those controls are direct speed multipliers for particle travel, not sinusoidal wobble channels.

## Geometry

### `Particles`

- Higher values make the toroid look fuller and smoother.
- Lower values expose the field structure and improve performance.
- This does not change the field math, only how densely it is sampled.

### `Major Radius`

- Changes the radius of the big ring.
- Visually: larger value makes a wider donut, smaller value pulls the whole form inward.
- This is the baseline before `Ring Radius` wobble is added.

### `Minor Radius`

- Changes the base thickness of the tube.
- Visually: larger value gives a chunkier torus, smaller value makes a tighter filament ring.
- This is the baseline before `Radial` wobble is added.

### `Halo Spread`

- Scales the random radial jitter for halo particles.
- Visually: adds fuzz, glow spill, and a looser edge around the core band.
- Low values keep the torus clean; high values make it airy and electrical.

## Orbit

Orbit changes the base particle travel before the drift and wobble layers are applied.

### `Around Ring Speed`

- Multiplies the base `theta` motion, which is the movement around the big donut.
- Visually: this is the main "spin around the center" control.
- Set it to `0` to freeze ring travel.
- Increase it when you want particles to circulate faster around the torus core.

### `Ring Direction`

- Chooses whether the base `theta` orbit runs `forward`, `reverse`, or `mixed`.
- `forward`: all particles travel the same way around the donut.
- `reverse`: all particles travel the opposite way around the donut.
- `mixed`: preserves the older turbulent look, with most particles forward and a smaller counter-rotating band.
- If you want a coherent reactor-ring style flow, use `forward`.

### `Around Tube Speed`

- Multiplies the base `phi` motion, which is the movement around the tube cross-section.
- Visually: this adds faster rolling/corkscrew motion around the tube itself.
- This is not the same as spinning around the center of the scene; it is local tube rotation.
- Set it to `0` to freeze that rolling component.

## Flow

Flow happens after base orbit is established but before the shape offsets. It changes where particles are on the torus, not the torus basis itself.

### `Theta` controls

- Offsets `theta`, which means particles drift around the big ring before the final position is built.
- Visually: creates broad circulation, sliding ridges, and asymmetric travel around the donut.
- Strong `Theta Amp` makes the ring feel like it is breathing sideways around itself.

### `Phi` controls

- Offsets `phi`, which means particles drift around the local tube cross-section before final placement.
- Visually: creates corkscrew motion and rolling activity around the tube.
- Strong `Phi Amp` usually reads as more turbulent plasma rather than a larger silhouette.

Use `Orbit` when you want the whole donut circulation to speed up, slow down, or unify into one direction.
Use `Flow` when orbit speed is correct but the motion still feels too regular.

## Wobble Local

These controls modify the torus in torus-local space. They are the most important shape controls.

### `Ring Radius`

- Adds an offset to the major radius before the ring center is computed.
- Visually: some parts of the donut push outward or inward along the main loop.
- This is the best control for making the big ring uneven.
- If overused, the torus starts to look lumpy rather than energized.

### `Radial`

- Adds or subtracts local tube thickness along the tube direction.
- Visually: the tube swells and narrows.
- This is the main "thickness wobble" control.
- High `Freq P` makes the tube surface feel chattery; high `Freq T` makes thickness change around the whole ring.

### `Binormal`

- Offsets the shape along world up after the tube radius is applied.
- Visually: lifts and dips parts of the torus out of its base plane.
- This is useful for breaking the clean flat-donut read when viewed from the side or front.
- It does less for a perfect top-down/axis view than `Tangent` or `Warp XYZ`.

### `Tangent`

- Offsets particles along the ring travel direction.
- Visually: shears, drags, and combs the plasma around the loop.
- This is one of the most useful controls for axis-safe variation because it creates directional structure instead of only thickness changes.
- If the torus still looks too perfect when viewed along its axis, add `Tangent` before adding a lot of random warp.

## Warp XYZ

This happens after the torus-local shape has already been built.

### `Enabled`

- Turns the object-space warp layer on or off.
- With it off, you see the pure torus-local field.
- With it on, the result becomes less symmetrical and more view-resilient.

### `X Amp`, `Y Amp`, `Z Amp`

- Push the final particle position in object space.
- Visually:
  - `X Amp`: side-to-side asymmetry.
  - `Y Amp`: vertical leaning, sag, and lift.
  - `Z Amp`: front-back asymmetry.
- These are the strongest controls for avoiding the "looks flat when viewed down the axis" problem.

### `Freq T`, `Freq P`, `Speed`

- Control the shared animation pattern for the object-space warp.
- Lower frequencies create broad bending.
- Higher frequencies create a more noisy, broken-up silhouette.

Use `Warp XYZ` sparingly at first. It is powerful because it ignores the torus frame and can overpower the cleaner local wobble if pushed too hard.

## Density

Density does not move particles. It decides where particles are visible.

### `Base`

- Sets the overall fill level.
- Higher values make the toroid look denser and more solid.
- Lower values create more gaps and a more filament-like read.

### `Layer One`

- Broad density modulation.
- Visually: large clumps, large voids, slow pulsing structure.
- This is the main density shaping layer.

### `Layer Two`

- Secondary density modulation.
- Visually: finer breakup inside the larger clumps created by Layer One.
- This is useful for adding complexity without changing the outer silhouette much.

Practical rule:

- If the torus shape is good but the energy pattern feels boring, adjust `Density`.
- If the silhouette is wrong, adjust `Wobble Local` or `Warp XYZ` instead.

## Render

These controls change how the particle sprites read, not where they are placed.

### `Point Size`

- Sets the base sprite size.
- Larger values make the torus read as softer and fuller.
- Smaller values make the field feel sharper and more particulate.

### `Size Variance`

- Increases variation between small and large particles.
- Visually: more sparkle and hierarchy.
- Too much can make the effect noisy rather than luminous.

### `Alpha`

- Global opacity/intensity of visible particles.
- Higher values make the torus brighter and more solid.
- Lower values make it more ghostly.

### `Softness`

- Despite the name, this currently behaves as an overall alpha multiplier in the shader rather than true edge feathering.
- Visually: it mostly acts like a second intensity control.
- If you want a softer look, it is usually better to combine moderate `Softness` with larger `Point Size`.

## Camera

These are inspection tools as much as presentation controls.

### `Auto Rotate`

- Keeps the torus moving so asymmetry is easier to read over time.

### `Rotate Speed`

- Changes how quickly that inspection orbit happens.

### `Front`, `Side`, `Axis`, `Isometric`

- `Front`: good for reading vertical lift and density clumping.
- `Side`: good for reading ring unevenness and tangent drag.
- `Axis`: the stress test. If the torus looks too perfect here, add `Tangent` or `Warp XYZ`.
- `Isometric`: best all-round tuning view.

## Recommended Tuning Order

When building a new toroid, tune in this order:

1. `Geometry`: get the base proportions right.
2. `Orbit`: set how fast particles should circulate.
3. `Wobble Local`: add ring, radial, binormal, and tangent structure.
4. `Warp XYZ`: add just enough asymmetry to survive axis views.
5. `Density`: sculpt clumps and voids.
6. `Render`: adjust brightness and particle read.
7. `Flow`: add motion if the field still feels static.
8. `Camera`: check `Axis` before calling it done.

## Fast Recipes

### Clean reactor ring

- Keep `Warp XYZ` low.
- Use low-to-medium `Ring Radius`.
- Use medium `Radial`.
- Use low `Binormal`.
- Use medium `Density Base`.

### View-safe asymmetric toroid

- Add medium `Tangent`.
- Add low-to-medium `X/Y/Z` warp.
- Check `Axis` view often.
- Keep `Ring Radius` moderate so the silhouette stays readable.

### Chaotic plasma knot

- Push `Ring Radius`, `Radial`, and `Tangent`.
- Add noticeable `Warp XYZ`.
- Use stronger density amplitudes.
- Increase `Size Variance` carefully so it stays luminous instead of dusty.

## One Useful Rule

If a control changes the shape and you only notice it from one angle, it is probably too tied to torus-local symmetry. Add a little `Tangent` or `Warp XYZ` and re-check `Axis` view.
