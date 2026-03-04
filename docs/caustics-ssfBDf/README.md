# Shadertoy `ssfBDf` Caustics Recreation Pack

## Goal

Recreate the visual style of the `ssfBDf` water caustics effect for Area 4 of the Lilypad demo, with deterministic forward/reverse scroll behavior.

## Notes on Source Access

The Shadertoy page is the target reference:

- https://www.shadertoy.com/view/ssfBDf

Direct source extraction from Shadertoy can be blocked in headless fetch contexts. This pack provides a practical reconstruction tuned for our R3F pipeline and based on publicly available derivative breakdowns.

## Contents

1. `shaders/caustics-ssfBDf.vert.glsl`
2. `shaders/caustics-ssfBDf.frag.glsl`
3. `examples/CausticsSsfBDf.tsx`
4. `examples/SceneUsage.tsx`

## Visual Model

The effect combines:

1. Iterative trigonometric flow-field distortion (core caustic structure).
2. High-contrast luminance shaping (sharp bright caustic lines).
3. Subtle animated noise modulation (organic shimmer).
4. Scroll-driven reveal/intensity controls (`uProgressArea4`).

## Integration Tasks

1. Copy shader files into app shader folder (or import with `?raw` from this docs path).
2. Add `CausticsSsfBDf` component from the example.
3. Feed `uProgressArea4` from scroll segment D progress.
4. Place mesh in Area 4 world region (seabed plane or receiver plane).
5. Tune `uScale`, `uSpeed`, `uBaseIntensity`, and placement for final art direction.

## Recommended Uniform Defaults

1. `uScale = 1.3`
2. `uSpeed = 0.18`
3. `uBaseIntensity = 1.15`
4. `uTint = vec3(0.84, 0.97, 1.0)`

## Scroll Mapping

1. `uProgressArea4` from section-local progress `[0..1]`.
2. Keep shader fully deterministic from `uTime` + progress uniforms.
3. Avoid one-shot animation triggers; compute all state from current progress.

## Quality/Performance Notes (Desktop Target)

1. `MAX_ITER = 5` is a good balance for desktop.
2. If needed, drop to `MAX_ITER = 4` before reducing plane resolution.
3. Use a single receiver plane first; scale to projected/light-based caustics later.

## References

1. Shadertoy target: https://www.shadertoy.com/view/ssfBDf

```common
// 3D simplex noise adapted from https://www.shadertoy.com/view/Ws23RD
// * Removed gradient normalization

vec4 mod289(vec4 x)
{
    return x - floor(x / 289.0) * 289.0;
}

vec4 permute(vec4 x)
{
    return mod289((x * 34.0 + 1.0) * x);
}

vec4 snoise(vec3 v)
{
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);

    // First corner
    vec3 i  = floor(v + dot(v, vec3(C.y)));
    vec3 x0 = v   - i + dot(i, vec3(C.x));

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.x;
    vec3 x2 = x0 - i2 + C.y;
    vec3 x3 = x0 - 0.5;

    // Permutations
    vec4 p =
      permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    vec4 j = p - 49.0 * floor(p / 49.0);  // mod(p,7*7)

    vec4 x_ = floor(j / 7.0);
    vec4 y_ = floor(j - 7.0 * x_); 

    vec4 x = (x_ * 2.0 + 0.5) / 7.0 - 1.0;
    vec4 y = (y_ * 2.0 + 0.5) / 7.0 - 1.0;

    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 g0 = vec3(a0.xy, h.x);
    vec3 g1 = vec3(a0.zw, h.y);
    vec3 g2 = vec3(a1.xy, h.z);
    vec3 g3 = vec3(a1.zw, h.w);

    // Compute noise and gradient at P
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    vec4 m2 = m * m;
    vec4 m3 = m2 * m;
    vec4 m4 = m2 * m2;
    vec3 grad =
      -6.0 * m3.x * x0 * dot(x0, g0) + m4.x * g0 +
      -6.0 * m3.y * x1 * dot(x1, g1) + m4.y * g1 +
      -6.0 * m3.z * x2 * dot(x2, g2) + m4.z * g2 +
      -6.0 * m3.w * x3 * dot(x3, g3) + m4.w * g3;
    vec4 px = vec4(dot(x0, g0), dot(x1, g1), dot(x2, g2), dot(x3, g3));
    return 42.0 * vec4(grad, dot(m4, px));
}

```

```image
// Based on: https://www.shadertoy.com/view/3d3yRj
// See also: KdotJPG's https://www.shadertoy.com/view/wlc3zr

float water_caustics(vec3 pos) {
    vec4 n = snoise( pos );

    pos -= 0.07*n.xyz;
    pos *= 1.62;
    n = snoise( pos );

    pos -= 0.07*n.xyz;
    n = snoise( pos );

    pos -= 0.07*n.xyz;
    n = snoise( pos );
    return n.w;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 p = (-iResolution.xy + 2.0*fragCoord) / iResolution.y;

    // camera matrix
    vec3 ww = normalize(-vec3(0., 1., 0.8));
    vec3 uu = normalize(cross(ww, vec3(0., 1., 0.)));
    vec3 vv = normalize(cross(uu,ww));

	vec3 rd = p.x*uu + p.y*vv + 1.5*ww;	// view ray
    vec3 pos = -ww + rd*(ww.y/rd.y);	// raytrace plane
    pos.y = iTime*0.75;					// animate noise slice
    pos *= 3.;							// tiling frequency

    float w = mix(water_caustics(pos), water_caustics(pos + 1.), 0.5);

    // noise [-1..+1] -> color
    float intensity = exp(w*4. - 1.);
	fragColor = vec4(vec3(intensity), 1.);
}
```