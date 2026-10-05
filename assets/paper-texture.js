/*
 * paper-texture.js — plain WebGL2 port
 *
 *
*/

import { getShaderNoiseTexture } from "./paper-noise.js";

const DEFAULTS = Object.freeze({
  image: "",
  colorBack: "#d3d2ab",
  colorPaper: "#ffffff",
  colorShadow: "#cccccc",
  blending: 1,
  distortion: 0.75,
  clip: false,
  angle: 300,
  seed: 4,
  roughness: 0.4,
  roughnessSize: 0.5,
  roughnessRows: 0,
  fiber: 0.4,
  fiberSize: 0.5,
  folds: 0.5,
  foldSizeX: 1,
  foldSizeY: 1,
  foldOffsetX: 0,
  foldOffsetY: 0,
  wrinkles: 1,
  wrinkleSize: 0.65,
  crumples: 0,
  crumpleCount: 6,
  drops: 0.4,
  fit: "contain",
  scale: 0.9,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  originX: 0.5,
  originY: 0.5,
  worldWidth: 0,
  worldHeight: 0,
  maxPixelRatio: 2
});

const FIT = Object.freeze({
  none: 0,
  contain: 1,
  cover: 2
});

const VERTEX_SHADER = `#version 300 es
precision mediump float;

layout(location = 0) in vec4 a_position;

uniform vec2 u_resolution;
uniform float u_pixelRatio;
uniform float u_imageAspectRatio;
uniform float u_originX;
uniform float u_originY;
uniform float u_worldWidth;
uniform float u_worldHeight;
uniform float u_fit;
uniform float u_scale;
uniform float u_rotation;
uniform float u_offsetX;
uniform float u_offsetY;

out vec2 v_objectUV;
out vec2 v_objectBoxSize;
out vec2 v_responsiveUV;
out vec2 v_responsiveBoxGivenSize;
out vec2 v_patternUV;
out vec2 v_patternBoxSize;
out vec2 v_imageUV;

vec3 getBoxSize(float boxRatio, vec2 givenBoxSize) {
  vec2 box = vec2(0.);

  box.x =
    boxRatio *
    min(
      givenBoxSize.x / boxRatio,
      givenBoxSize.y
    );

  float noFitBoxWidth =
    box.x;

  if (u_fit == 1.) {
    box.x =
      boxRatio *
      min(
        u_resolution.x / boxRatio,
        u_resolution.y
      );
  } else if (u_fit == 2.) {
    box.x =
      boxRatio *
      max(
        u_resolution.x / boxRatio,
        u_resolution.y
      );
  }

  box.y =
    box.x / boxRatio;

  return vec3(
    box,
    noFitBoxWidth
  );
}

void main() {
  gl_Position =
    a_position;

  vec2 uv =
    gl_Position.xy * .5;

  vec2 boxOrigin =
    vec2(
      .5 - u_originX,
      u_originY - .5
    );

  vec2 givenBoxSize =
    vec2(
      u_worldWidth,
      u_worldHeight
    );

  givenBoxSize =
    max(
      givenBoxSize,
      vec2(1.)
    ) *
    u_pixelRatio;

  float r =
    u_rotation *
    3.14159265358979323846 /
    180.;

  mat2 graphicRotation =
    mat2(
      cos(r),
      sin(r),
      -sin(r),
      cos(r)
    );

  vec2 graphicOffset =
    vec2(
      -u_offsetX,
      u_offsetY
    );

  float fixedRatio =
    1.;

  vec2 fixedRatioBoxGivenSize =
    vec2(
      (u_worldWidth == 0.)
        ? u_resolution.x
        : givenBoxSize.x,

      (u_worldHeight == 0.)
        ? u_resolution.y
        : givenBoxSize.y
    );

  v_objectBoxSize =
    getBoxSize(
      fixedRatio,
      fixedRatioBoxGivenSize
    ).xy;

  vec2 objectWorldScale =
    u_resolution.xy /
    v_objectBoxSize;

  v_objectUV =
    uv;

  v_objectUV *=
    objectWorldScale;

  v_objectUV +=
    boxOrigin *
    (
      objectWorldScale -
      1.
    );

  v_objectUV +=
    graphicOffset;

  v_objectUV /=
    u_scale;

  v_objectUV =
    graphicRotation *
    v_objectUV;

  v_responsiveBoxGivenSize =
    vec2(
      (u_worldWidth == 0.)
        ? u_resolution.x
        : givenBoxSize.x,

      (u_worldHeight == 0.)
        ? u_resolution.y
        : givenBoxSize.y
    );

  float responsiveRatio =
    v_responsiveBoxGivenSize.x /
    v_responsiveBoxGivenSize.y;

  vec2 responsiveBoxSize =
    getBoxSize(
      responsiveRatio,
      v_responsiveBoxGivenSize
    ).xy;

  vec2 responsiveBoxScale =
    u_resolution.xy /
    responsiveBoxSize;

  v_responsiveUV =
    uv;

  v_responsiveUV *=
    responsiveBoxScale;

  v_responsiveUV +=
    boxOrigin *
    (
      responsiveBoxScale -
      1.
    );

  v_responsiveUV +=
    graphicOffset;

  v_responsiveUV /=
    u_scale;

  v_responsiveUV.x *=
    responsiveRatio;

  v_responsiveUV =
    graphicRotation *
    v_responsiveUV;

  v_responsiveUV.x /=
    responsiveRatio;

  float patternBoxRatio =
    givenBoxSize.x /
    givenBoxSize.y;

  vec2 patternBoxGivenSize =
    vec2(
      (u_worldWidth == 0.)
        ? u_resolution.x
        : givenBoxSize.x,

      (u_worldHeight == 0.)
        ? u_resolution.y
        : givenBoxSize.y
    );

  patternBoxRatio =
    patternBoxGivenSize.x /
    patternBoxGivenSize.y;

  vec3 boxSizeData =
    getBoxSize(
      patternBoxRatio,
      patternBoxGivenSize
    );

  v_patternBoxSize =
    boxSizeData.xy;

  float patternBoxNoFitBoxWidth =
    boxSizeData.z;

  vec2 patternBoxScale =
    u_resolution.xy /
    v_patternBoxSize;

  v_patternUV =
    uv;

  v_patternUV +=
    graphicOffset /
    patternBoxScale;

  v_patternUV +=
    boxOrigin;

  v_patternUV -=
    boxOrigin /
    patternBoxScale;

  v_patternUV *=
    u_resolution.xy;

  v_patternUV /=
    u_pixelRatio;

  if (u_fit > 0.) {
    v_patternUV *=
      patternBoxNoFitBoxWidth /
      v_patternBoxSize.x;
  }

  v_patternUV /=
    u_scale;

  v_patternUV =
    graphicRotation *
    v_patternUV;

  v_patternUV +=
    boxOrigin /
    patternBoxScale;

  v_patternUV -=
    boxOrigin;

  v_patternUV *=
    .01;

  vec2 imageBoxSize;

  if (u_fit == 1.) {
    imageBoxSize.x =
      min(
        u_resolution.x /
        u_imageAspectRatio,

        u_resolution.y
      ) *
      u_imageAspectRatio;
  } else if (u_fit == 2.) {
    imageBoxSize.x =
      max(
        u_resolution.x /
        u_imageAspectRatio,

        u_resolution.y
      ) *
      u_imageAspectRatio;
  } else {
    imageBoxSize.x =
      min(
        10.0,

        10.0 /
        u_imageAspectRatio *
        u_imageAspectRatio
      );
  }

  imageBoxSize.y =
    imageBoxSize.x /
    u_imageAspectRatio;

  vec2 imageBoxScale =
    u_resolution.xy /
    imageBoxSize;

  v_imageUV =
    uv;

  v_imageUV *=
    imageBoxScale;

  v_imageUV +=
    boxOrigin *
    (
      imageBoxScale -
      1.
    );

  v_imageUV +=
    graphicOffset;

  v_imageUV /=
    u_scale;

  v_imageUV.x *=
    u_imageAspectRatio;

  v_imageUV =
    graphicRotation *
    v_imageUV;

  v_imageUV.x /=
    u_imageAspectRatio;

  v_imageUV +=
    .5;

  v_imageUV.y =
    1. -
    v_imageUV.y;
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

uniform sampler2D u_image;
uniform bool u_isImage;
uniform float u_imageAspectRatio;

uniform vec4 u_colorBack;
uniform vec4 u_colorPaper;
uniform vec4 u_colorShadow;

uniform float u_blending;
uniform float u_distortion;
uniform bool u_clip;
uniform float u_angle;
uniform float u_seed;

uniform float u_roughness;
uniform float u_roughnessSize;
uniform float u_roughnessRows;

uniform float u_fiber;
uniform float u_fiberSize;

uniform float u_folds;
uniform float u_foldSizeX;
uniform float u_foldSizeY;
uniform float u_foldOffsetX;
uniform float u_foldOffsetY;

uniform float u_wrinkles;
uniform float u_wrinkleSize;

uniform float u_crumples;
uniform float u_crumpleCount;

uniform float u_drops;

uniform sampler2D u_noiseTexture;

in vec2 v_imageUV;

out vec4 fragColor;

float getUvFrame(vec2 uv) {
  vec2 invAA =
    .5 /
    clamp(
      fwidth(uv),
      1e-5,
      .02
    );

  vec2 lo =
    clamp(
      uv *
      invAA +
      .5,
      0.,
      1.
    );

  vec2 hi =
    clamp(
      (1. - uv) *
      invAA +
      .5,
      0.,
      1.
    );

  return
    lo.x *
    hi.x *
    lo.y *
    hi.y;
}

float lst(
  float edge0,
  float edge1,
  float x
) {
  return clamp(
    (x - edge0) /
    (edge1 - edge0),
    0.0,
    1.0
  );
}

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

float hash21(vec2 p) {
  p =
    fract(
      p *
      vec2(
        0.3183099,
        0.3678794
      )
    ) +
    0.1;

  p +=
    dot(
      p,
      p + 19.19
    );

  return
    fract(
      p.x *
      p.y
    );
}

vec2 hash22(vec2 p) {
  p =
    fract(
      p *
      vec2(
        0.3183099,
        0.3678794
      )
    ) +
    0.1;

  p +=
    dot(
      p,
      p.yx + 19.19
    );

  return
    fract(
      vec2(
        p.x * p.y,
        p.x + p.y
      )
    );
}

float getRoughness(
  vec2 p,
  vec2 lightDir,
  vec2 seedShift,
  float basePixel
) {
  vec2 u =
    p /
    vec2(
      2.,
      4.
    );

  float w =
    100. *
    basePixel;

  float eps =
    4. *
    w;

  float size =
    mix(
      3.2,
      .8,
      u_roughnessSize
    );

  float logLac =
    log2(
      2.1
    );

  float level =
    -log2(
      w +
      1e-8
    ) /
    logLac;

  float baseLevel =
    floor(level) -
    2.;

  float fade =
    fract(level);

  vec2 px =
    (
      u.x +
      vec2(
        eps,
        -eps
      )
    ) *
    .1;

  float py =
    u.y *
    .1;

  vec2 sum =
    vec2(0.);

  float norm =
    0.;

  float amp =
    .5;

  float freq =
    exp2(
      baseLevel *
      logLac
    );

  for (
    int i = 0;
    i < 4;
    i++
  ) {
    float absIdx =
      baseLevel +
      float(i);

    vec2 qx =
      size *
      px *
      freq;

    float qy =
      size *
      py *
      freq;

    float wi =
      1.;

    if (i == 0) {
      wi =
        1. -
        fade;
    }

    if (i == 3) {
      wi =
        fade;
    }

    vec2 fx =
      fract(qx);

    float fy =
      fract(qy);

    vec2 shift =
      .5 +
      absIdx *
      .3 +
      seedShift;

    float uvY =
      floor(qy) /
      50. +
      shift.y;

    vec2 s0a =
      textureLod(
        u_noiseTexture,
        fract(
          vec2(
            floor(qx.x) /
            50. +
            shift.x,

            uvY
          )
        ),
        0.
      ).rg;

    vec2 s1a =
      textureLod(
        u_noiseTexture,
        fract(
          vec2(
            ceil(qx.x) /
            50. +
            shift.x,

            uvY
          )
        ),
        0.
      ).rg;

    vec2 s0b =
      textureLod(
        u_noiseTexture,
        fract(
          vec2(
            floor(qx.y) /
            50. +
            shift.x,

            uvY
          )
        ),
        0.
      ).rg;

    vec2 s1b =
      textureLod(
        u_noiseTexture,
        fract(
          vec2(
            ceil(qx.y) /
            50. +
            shift.x,

            uvY
          )
        ),
        0.
      ).rg;

    vec2 ny0 =
      mix(
        vec2(
          s0a.r,
          s0b.r
        ),
        vec2(
          s0a.g,
          s0b.g
        ),
        fy
      );

    vec2 ny1 =
      mix(
        vec2(
          s1a.r,
          s1b.r
        ),
        vec2(
          s1a.g,
          s1b.g
        ),
        fy
      );

    vec2 n =
      mix(
        ny0,
        ny1,
        fx
      );

    sum +=
      amp *
      wi *
      n;

    norm +=
      amp *
      wi;

    amp *=
      .8;

    freq *=
      2.1;
  }

  vec2 r =
    sum /
    norm;

  float dx =
    .5 +
    r.x -
    r.y;

  float grain =
    3. *
    dx *
    dx -
    .7;

  float rowBand =
    fract(
      dot(
        p,
        lightDir
      ) *
      .05 *
      size
    );

  return
    grain +
    .6 *
    u_roughnessRows *
    (
      rowBand -
      .5
    );
}

float getFiber(
  vec2 p,
  vec2 seedShift,
  float basePixel
) {
  float size =
    mix(
      4.,
      1.,
      u_fiberSize
    );

  float w =
    50. *
    basePixel;

  float level =
    -log2(
      w +
      1e-8
    );

  float baseLevel =
    floor(level) -
    3.;

  float fade =
    fract(level);

  vec2 grad =
    vec2(0.);

  float scale =
    1.;

  float amp =
    1.;

  float freq =
    pow(
      1.7,
      baseLevel
    );

  for (
    int i = 0;
    i < 5;
    i++
  ) {
    float absIdx =
      baseLevel +
      float(i);

    vec2 q =
      size *
      p *
      freq;

    float an =
      absIdx *
      .8;

    float rc =
      cos(an);

    float rs =
      sin(an);

    q =
      vec2(
        rc * q.x -
        rs * q.y,

        rs * q.x +
        rc * q.y
      );

    float wi =
      1.;

    if (i == 0) {
      wi =
        1. -
        fade;
    }

    if (i == 4) {
      wi =
        fade;
    }

    vec2 iq =
      floor(q);

    vec2 fq =
      fract(q);

    float shift =
      absIdx *
      .3;

    vec4 uv =
      fract(
        vec4(
          iq,
          iq + 1.
        ) /
        50. +
        .5 +
        shift +
        seedShift.xyxy
      );

    float aF =
      textureLod(
        u_noiseTexture,
        uv.xy,
        0.
      ).b;

    float bF =
      textureLod(
        u_noiseTexture,
        uv.zy,
        0.
      ).b;

    float cF =
      textureLod(
        u_noiseTexture,
        uv.xw,
        0.
      ).b;

    float dF =
      textureLod(
        u_noiseTexture,
        uv.zw,
        0.
      ).b;

    vec2 u =
      fq *
      fq *
      (
        3. -
        2. *
        fq
      );

    vec2 du =
      8. *
      fq *
      (
        1. -
        fq
      );

    float dx =
      du.x *
      mix(
        bF -
        aF,

        dF -
        cF,

        u.y
      );

    float dy =
      du.y *
      mix(
        cF -
        aF,

        dF -
        bF,

        u.x
      );

    grad +=
      wi *
      amp *
      scale *
      vec2(
        rc * dx +
        rs * dy,

        -rs * dx +
        rc * dy
      );

    scale *=
      1.7;

    amp *=
      .5;

    freq *=
      1.7;
  }

  return
    clamp(
      .333 *
      length(grad),
      0.,
      1.
    );
}

vec2 smoothNoise(vec2 p) {
  vec2 t =
    p *
    50. -
    .5;

  vec2 i =
    floor(t);

  vec2 f =
    fract(t);

  f =
    f *
    f *
    (
      3. -
      2. *
      f
    );

  return
    textureLod(
      u_noiseTexture,
      fract(
        (
          i +
          f +
          .5
        ) /
        vec2(50.)
      ),
      0.
    ).rg;
}

float getDrops(
  vec2 uv,
  vec2 seedShift
) {
  vec2 iDropsUV =
    floor(uv);

  vec2 fDropsUV =
    fract(uv);

  float dropsMinDist =
    1.;

  for (
    int y = -1;
    y < 2;
    y += 1
  ) {
    for (
      int x = -1;
      x < 2;
      x += 1
    ) {
      vec2 neighbor =
        vec2(
          float(y),
          float(x)
        );

      vec2 offset =
        hash22(
          iDropsUV +
          neighbor +
          50. *
          seedShift
        );

      vec2 pos =
        neighbor +
        offset -
        fDropsUV;

      dropsMinDist *=
        min(
          1.,
          dot(
            pos,
            pos
          )
        );
    }
  }

  return
    .5 *
    lst(
      .09,
      .08,
      sqrt(
        sqrt(
          dropsMinDist
        )
      )
    );
}

vec2 getCellTilt(
  float idx,
  float radius
) {
  vec2 rand =
    hash22(
      vec2(
        idx + 31.,
        idx * u_seed + 17.
      )
    );

  float an =
    rand.x *
    TWO_PI;

  return
    vec2(
      cos(an),
      sin(an)
    ) *
    mix(
      .3,
      1.7,
      rand.y *
      rand.y
    ) *
    mix(
      .7,
      1.,
      radius
    );
}

vec2 getCrumpleDetail(
  vec2 uv,
  float freq,
  float shift,
  float basePixel,
  out float depth
) {
  depth =
    0.;

  vec2 v =
    uv *
    freq;

  float pixel =
    .9 *
    freq *
    basePixel;

  vec2 base =
    floor(v);

  float n1 =
    9.;

  float n2 =
    9.;

  vec2 s1 =
    vec2(0.);

  vec2 s2 =
    vec2(0.);

  vec2 q1 =
    vec2(0.);

  vec2 q2 =
    vec2(0.);

  for (
    int y = -1;
    y <= 1;
    y++
  ) {
    for (
      int x = -1;
      x <= 1;
      x++
    ) {
      vec2 cell =
        base +
        vec2(
          float(x),
          float(y)
        );

      vec2 q =
        hash22(
          vec2(
            cell.y *
            1.9 +
            3.1 +
            shift,

            cell.x *
            1.3 +
            .11 *
            u_seed
          )
        );

      float keep =
        .8;

      if (q.y > keep) {
        continue;
      }

      vec2 r =
        hash22(
          vec2(
            cell.x +
            .37 *
            u_seed +
            shift +
            11.1,

            cell.y -
            .21 *
            u_seed +
            5.7
          )
        );

      vec2 s =
        cell +
        .06 +
        .88 *
        r;

      vec2 d =
        v -
        s;

      float dsq =
        dot(
          d,
          d
        );

      if (dsq < n1) {
        n2 = n1;
        s2 = s1;
        q2 = q1;

        n1 = dsq;
        s1 = s;
        q1 = q;
      } else if (dsq < n2) {
        n2 = dsq;
        s2 = s;
        q2 = q;
      }
    }
  }

  if (n1 > 8.) {
    return vec2(0.);
  }

  float an1 =
    q1.x *
    TWO_PI;

  float mag1 =
    q1.y /
    .8;

  vec2 t1 =
    vec2(
      cos(an1),
      sin(an1)
    ) *
    mix(
      .3,
      1.7,
      mag1 *
      mag1
    );

  float an2 =
    q2.x *
    TWO_PI;

  float mag2 =
    q2.y /
    .8;

  vec2 t2 =
    vec2(
      cos(an2),
      sin(an2)
    ) *
    mix(
      .3,
      1.7,
      mag2 *
      mag2
    );

  vec2 span =
    s1 -
    s2;

  float spanLen =
    max(
      length(span),
      1e-4
    );

  float toEdge =
    (
      n2 -
      n1
    ) /
    (
      2. *
      spanLen
    );

  float pair =
    hash21(
      s1 +
      s2 +
      1.7 *
      abs(
        s1 -
        s2
      )
    );

  float pairSoft =
    .05 +
    .1 *
    step(
      pair,
      .4
    );

  float b =
    clamp(
      toEdge /
      max(
        1.5 *
        pixel,

        .5 *
        pairSoft
      ),
      0.,
      1.
    );

  b =
    b *
    b *
    (
      3. -
      2. *
      b
    );

  float d1 =
    max(
      sqrt(n1),
      1e-4
    );

  depth =
    .2 *
    d1;

  float shoulderAmt =
    max(
      0.,
      1. -
      toEdge /
      .42
    ) *
    b;

  vec2 shoulder =
    vec2(0.);

  if (shoulderAmt > 0.) {
    float d2 =
      max(
        sqrt(n2),
        1e-4
      );

    shoulder =
      shoulderAmt *
      (
        (
          v -
          s2
        ) /
        d2 -
        (
          v -
          s1
        ) /
        d1
      );
  }

  vec2 mid =
    .5 *
    (
      t1 +
      t2
    );

  return
    mid +
    (
      t1 -
      mid
    ) *
    b +
    .9 *
    shoulder;
}

vec4 getCrumples(vec2 uv) {
  float crumpleN =
    max(
      2.,
      floor(
        u_crumpleCount +
        .5
      )
    );

  float near =
    60000.;

  float nearB =
    60000.;

  float idx =
    0.;

  float rad =
    0.;

  vec2 nearP =
    vec2(0.);

  vec2 nearPb =
    vec2(0.);

  vec4 seeds[15];

  for (
    int i = 0;
    i < 15;
    i++
  ) {
    if (
      float(i) >=
      crumpleN
    ) {
      break;
    }

    vec2 rand =
      hash22(
        vec2(
          float(i),
          float(i) *
          u_seed
        )
      );

    float an =
      rand.x *
      TWO_PI;

    vec2 p =
      vec2(
        cos(an),
        sin(an)
      ) *
      rand.y;

    seeds[i] =
      vec4(
        p,
        rand
      );

    vec2 d =
      uv -
      p;

    float dsq =
      dot(
        d,
        d
      );

    if (dsq < near) {
      nearB =
        near;

      nearPb =
        nearP;

      near =
        dsq;

      idx =
        float(i);

      rad =
        rand.y;

      nearP =
        p;
    } else if (
      dsq <
      nearB
    ) {
      nearB =
        dsq;

      nearPb =
        p;
    }
  }

  float l =
    sqrt(near);

  float lb =
    sqrt(nearB);

  vec2 dir =
    (
      uv -
      nearP
    ) /
    max(
      l,
      1e-4
    );

  float edge =
    lst(
      0.,
      .5,
      lb -
      l
    );

  float shoulderLimit =
    l +
    .5;

  vec2 tilt =
    getCellTilt(
      idx,
      rad
    );

  float tiltSum =
    1.;

  vec2 wide =
    vec2(0.);

  float wideSum =
    0.;

  float toEdge =
    9.;

  float edgeSoft =
    0.;

  for (
    int i = 0;
    i < 15;
    i++
  ) {
    if (
      float(i) >=
      crumpleN
    ) {
      break;
    }

    if (
      float(i) ==
      idx
    ) {
      continue;
    }

    vec4 seed =
      seeds[i];

    vec2 p =
      seed.xy;

    vec2 rand =
      seed.zw;

    vec2 d =
      uv -
      p;

    float dsq =
      dot(
        d,
        d
      );

    if (
      dsq <
      shoulderLimit *
      shoulderLimit
    ) {
      float di =
        sqrt(dsq);

      float shoulder =
        lst(
          .5,
          0.,
          di -
          l
        );

      wide +=
        shoulder *
        (
          d /
          max(
            di,
            1e-4
          ) -
          dir
        );

      wideSum +=
        shoulder;
    }

    float pairSoft =
      .01 +
      .05 *
      step(
        .2,
        rand.x
      ) +
      .3 *
      rand.y;

    float toBisector =
      (
        dsq -
        near
      ) /
      (
        .2 *
        max(
          length(
            p -
            nearP
          ),
          1e-4
        )
      );

    if (
      toBisector <
      toEdge
    ) {
      toEdge =
        toBisector;

      edgeSoft =
        pairSoft;
    }

    float w =
      1. -
      toBisector /
      pairSoft;

    if (w > 0.) {
      w *=
        w;

      tilt +=
        w *
        getCellTilt(
          float(i),
          rand.y
        );

      tiltSum +=
        w;
    }
  }

  float blend =
    clamp(
      toEdge /
      edgeSoft,
      0.,
      1.
    );

  vec2 sharp =
    (
      1. -
      edge
    ) *
    (
      (
        uv -
        nearPb
      ) /
      max(
        lb,
        1e-4
      ) -
      dir
    );

  vec2 rounding =
    mix(
      sharp,
      wide /
      max(
        wideSum,
        1.
      ),
      min(
        2. *
        edgeSoft,
        1.
      )
    );

  float radial =
    l /
    max(
      l +
      toEdge,
      1e-4
    );

  return
    vec4(
      tilt /
      tiltSum +
      rounding *
      blend *
      radial,

      .2 *
      l,

      edge
    );
}

void getFolds(
  vec2 coord,
  vec2 offset,
  vec2 count,
  vec2 noise,
  vec2 baseFwidth,
  out vec2 slope,
  out vec2 dark,
  out vec2 lift
) {
  vec2 g =
    coord *
    count +
    .5 *
    offset +
    noise;

  vec2 dx =
    fract(g) -
    .5;

  vec2 adx =
    abs(dx);

  float foldRadius =
    .3;

  vec2 t =
    clamp(
      adx /
      foldRadius,
      0.,
      1.
    );

  dark =
    t *
    t *
    (
      3. -
      2. *
      t
    );

  lift =
    1. -
    t;

  lift *=
    lift;

  vec2 crease =
    clamp(
      dx /
      max(
        count *
        baseFwidth,
        1e-5
      ),
      -1.,
      1.
    );

  slope =
    crease *
    (
      1. -
      dark
    );

  vec2 lineWidth =
    .02 *
    count *
    mix(
      vec2(2.5),
      vec2(.8),
      dark.yx
    ) +
    .1 *
    noise;

  slope -=
    1. -
    smoothstep(
      vec2(0.),
      lineWidth,
      adx
    );
}

void main() {
  vec2 patternUV =
    (
      v_imageUV -
      .5
    ) *
    vec2(
      u_imageAspectRatio,
      1.
    );

  float basePixel =
    max(
      length(
        dFdx(
          patternUV
        )
      ),
      length(
        dFdy(
          patternUV
        )
      )
    );

  vec2 baseFwidth =
    fwidth(
      patternUV
    );

  float pattern =
    0.;

  float crumpleDepth =
    0.;

  float wrinkleDepth =
    0.;

  float foldDepth =
    0.;

  float roughness =
    0.;

  float fiber =
    0.;

  float drops =
    0.;

  float grazing =
    0.7;

  float lightRad =
    radians(
      u_angle
    );

  vec2 lightDir =
    vec2(
      sin(
        lightRad
      ),
      -cos(
        lightRad
      )
    );

  float foldAngleInSector =
    mod(
      u_angle,
      90.
    );

  float foldLightRad =
    radians(
      u_angle -
      foldAngleInSector +
      mix(
        12.,
        78.,
        foldAngleInSector /
        90.
      )
    );

  vec2 foldLightDir =
    vec2(
      sin(
        foldLightRad
      ),
      -cos(
        foldLightRad
      )
    );

  vec2 relief =
    vec2(0.);

  vec2 foldSlope =
    vec2(0.);

  float reliefAmount =
    0.;

  float foldInk =
    1.;

  vec2 crumpleFlow =
    vec2(0.);

  vec2 warpNoise =
    vec2(0.);

  if (
    u_crumples > 0. ||
    u_folds > 0. ||
    u_wrinkles > 0.
  ) {
    warpNoise =
      smoothNoise(
        patternUV *
        .1 +
        .2 +
        .6 *
        fract(
          .017 *
          u_seed
        )
      ) -
      .5;
  }

  vec2 crumplesUV =
    (
      patternUV *
      .9
    ) +
    .012 *
    warpNoise;

  if (u_crumples > 0.) {
    vec4 crumples =
      getCrumples(
        crumplesUV
      );

    vec2 crumpleTilt =
      .5 *
      u_crumples *
      crumples.xy;

    crumpleTilt -=
      .1 *
      max(
        dot(
          crumpleTilt,
          lightDir
        ),
        0.
      ) *
      lightDir;

    relief +=
      crumpleTilt;

    reliefAmount +=
      .6 *
      u_crumples;

    crumpleFlow =
      crumples.w *
      crumpleTilt;

    crumpleDepth =
      clamp(
        5. *
        crumples.z,
        0.,
        1.
      );
  }

  if (u_wrinkles > 0.) {
    float detailFreq =
      mix(
        10.,
        1.,
        u_wrinkleSize
      );

    float detailAmp =
      .2;

    vec2 detailGrad =
      vec2(0.);

    float detailDepth =
      0.;

    float depthSum =
      0.;

    for (
      int i = 0;
      i < 3;
      i++
    ) {
      float layerDepth;

      detailGrad +=
        detailAmp *
        getCrumpleDetail(
          crumplesUV,
          detailFreq,
          31. *
          float(i),
          basePixel,
          layerDepth
        );

      detailDepth +=
        detailAmp *
        layerDepth;

      depthSum +=
        detailAmp;

      detailAmp *=
        (
          .5 +
          .2 *
          detailGrad.x
        );

      detailFreq *=
        2.1;
    }

    vec2 detailTilt =
      1.5 *
      u_wrinkles *
      detailGrad;

    detailTilt -=
      .65 *
      max(
        dot(
          detailTilt,
          lightDir
        ),
        0.
      ) *
      lightDir;

    relief +=
      detailTilt;

    reliefAmount +=
      .6 *
      u_wrinkles;

    wrinkleDepth =
      clamp(
        5. *
        detailDepth /
        max(
          depthSum,
          1e-4
        ),
        0.,
        1.
      );
  }

  if (u_folds > 0.) {
    vec2 foldOffset =
      vec2(
        1. -
        2. *
        u_foldOffsetX,

        1. -
        2. *
        u_foldOffsetY
      );

    vec2 foldCount =
      vec2(
        mix(
          3.,
          .5,
          u_foldSizeX
        ),
        mix(
          3.,
          .5,
          u_foldSizeY
        )
      );

    vec2 foldNoise =
      .005 *
      warpNoise *
      foldCount;

    vec2 uv =
      patternUV +
      .03 *
      crumpleFlow;

    vec2 slope;
    vec2 dark;
    vec2 lift;

    getFolds(
      uv,
      foldOffset,
      foldCount,
      foldNoise,
      baseFwidth,
      slope,
      dark,
      lift
    );

    foldSlope =
      u_folds *
      slope;

    reliefAmount +=
      1. *
      u_folds;

    vec2 ink =
      mix(
        vec2(.96),
        vec2(1.),
        dark
      );

    float flatness =
      dark.x *
      dark.y;

    foldInk *=
      mix(
        1.,
        ink.x *
        ink.y *
        mix(
          .5,
          .3,
          flatness
        ),
        u_folds
      );

    foldDepth =
      u_folds *
      (
        lift.y *
        foldLightDir.y -
        lift.x *
        foldLightDir.x
      );
  }

  float unlit =
    cos(
      grazing
    );

  float lit =
    unlit;

  if (reliefAmount > 0.) {
    float lightFalloff =
      clamp(
        .5 +
        dot(
          v_imageUV -
          .5,
          lightDir
        ),
        0.,
        1.
      );

    float lightPower =
      mix(
        .5,
        1.,
        lightFalloff
      );

    float slope =
      clamp(
        dot(
          relief,
          lightDir
        ) +
        dot(
          foldSlope,
          foldLightDir
        ),
        -1.2,
        1.2
      );

    lit =
      max(
        cos(
          slope +
          grazing
        ),
        0.
      );

    pattern +=
      (
        clamp(
          reliefAmount,
          0.,
          1.
        ) *
        unlit +
        (
          lit -
          unlit
        )
      ) *
      foldInk *
      lightPower;
  }

  patternUV +=
    .04 *
    crumpleFlow;

  vec2 seedShift =
    floor(
      fract(
        u_seed *
        vec2(
          .7548776662,
          .5698402909
        )
      ) *
      50.
    ) /
    50.;

  if (u_roughness > 0.) {
    roughness =
      u_roughness *
      getRoughness(
        1000. *
        patternUV,
        lightDir,
        seedShift,
        basePixel
      );

    pattern +=
      roughness;
  }

  if (u_fiber > 0.) {
    fiber =
      u_fiber *
      getFiber(
        50. *
        patternUV,
        seedShift,
        basePixel
      );

    pattern +=
      fiber;
  }

  if (u_drops > 0.) {
    drops =
      u_drops *
      getDrops(
        patternUV *
        10.,
        seedShift
      );
  }

  pattern =
    clamp(
      pattern,
      0.,
      1.
    );

  vec3 backColor =
    u_colorBack.rgb *
    u_colorBack.a;

  float backOpacity =
    u_colorBack.a;

  vec3 baseColor =
    u_colorPaper.rgb *
    u_colorPaper.a;

  float baseOpacity =
    u_colorPaper.a;

  vec3 shadowColor =
    u_colorShadow.rgb *
    u_colorShadow.a;

  float shadowOpacity =
    u_colorShadow.a;

  float notClipped =
    u_clip
      ? .1
      : 1.;

  vec2 imageCenteredUV =
    v_imageUV -
    .5;

  float edgeDist =
    2. *
    max(
      abs(
        imageCenteredUV.x
      ),
      abs(
        imageCenteredUV.y
      )
    );

  float wrinkleDistortion =
    mix(
      .38,
      .0175,
      smoothstep(
        0.,
        1.,
        edgeDist
      )
    );

  float scaleDistortion =
    .15 *
    u_crumples *
    (
      crumpleDepth -
      .5
    ) +
    wrinkleDistortion *
    u_wrinkles *
    (
      wrinkleDepth -
      .5
    ) +
    .05 *
    foldDepth;

  vec2 linearDistortion =
    notClipped *
    .002 *
    lightDir *
    drops;

  float radialDistortion =
    notClipped *
    .02 *
    (
      roughness +
      fiber
    );

  vec2 centeredUV =
    imageCenteredUV *
    (
      1. -
      u_distortion *
      scaleDistortion
    );

  centeredUV -=
    u_distortion *
    linearDistortion;

  vec2 imageUV =
    .5 +
    centeredUV *
    (
      1. -
      abs(
        u_distortion
      ) *
      radialDistortion *
      dot(
        centeredUV,
        centeredUV
      )
    );

  vec3 color =
    shadowColor *
    pattern;

  float opacity =
    shadowOpacity *
    pattern;

  color +=
    baseColor *
    (
      1. -
      opacity
    );

  opacity +=
    baseOpacity *
    (
      1. -
      opacity
    );

  if (u_isImage) {
    float frame =
      getUvFrame(
        imageUV
      );

    vec4 image =
      texture(
        u_image,
        imageUV
      );

    frame *=
      image.a;

    float maxC =
      max(
        max(
          image.r,
          image.g
        ),
        image.b
      );

    float minC =
      min(
        min(
          image.r,
          image.g
        ),
        image.b
      );

    float sat =
      maxC > 0.
        ? (
          maxC -
          minC
        ) /
        maxC
        : 0.;

    float midC =
      image.r +
      image.g +
      image.b -
      maxC -
      minC;

    float secondaryness =
      maxC >
      minC
        ? (
          midC -
          minC
        ) /
        (
          maxC -
          minC
        )
        : 0.;

    float satDampen =
      sat *
      (
        1. -
        .5 *
        secondaryness
      );

    float darkDampen =
      1. -
      dot(
        vec3(
          .2126,
          .7152,
          .0722
        ),
        image.rgb
      );

    float dampen =
      mix(
        0.,
        .7,
        u_blending
      ) *
      max(
        satDampen,
        darkDampen
      );

    vec3 paper =
      vec3(1.) -
      opacity +
      color;

    vec3 pic =
      image.rgb *
      paper *
      u_blending +
      image.rgb *
      (
        1. -
        u_blending
      );

    pic =
      mix(
        pic,
        vec3(1.),
        .6 *
        pow(
          dampen,
          2. +
          3. *
          pattern
        )
      );

    color =
      mix(
        color,
        pic,
        frame
      );

    opacity =
      frame +
      opacity *
      (
        1. -
        frame
      );

    if (u_clip) {
      color *=
        frame;

      opacity *=
        frame;
    }
  }

  color *=
    mix(
      vec3(1.),
      .5 *
      u_colorShadow.rgb,
      drops *
      shadowOpacity
    );

  color +=
    backColor *
    (
      1. -
      opacity
    );

  opacity +=
    backOpacity *
    (
      1. -
      opacity
    );

  fragColor =
    vec4(
      color,
      opacity
    );
}
`;

function clamp(value, min, max) {
  return Math.min(
    Math.max(
      Number(value),
      min
    ),
    max
  );
}

function parseColor(input) {
  let s =
    String(
      input ??
      "#000000"
    ).trim();

  if (!s.startsWith("#")) {
    throw new Error(
      `PaperTexture: unsupported color ${s}; use hex.`
    );
  }

  s =
    s.slice(1);

  if (
    s.length === 3 ||
    s.length === 4
  ) {
    s =
      [...s]
        .map(
          (c) => c + c
        )
        .join("");
  }

  if (s.length === 6) {
    s +=
      "ff";
  }

  if (
    !/^[0-9a-fA-F]{8}$/.test(s)
  ) {
    throw new Error(
      `PaperTexture: invalid hex color #${s}`
    );
  }

  return new Float32Array([
    parseInt(
      s.slice(0, 2),
      16
    ) / 255,

    parseInt(
      s.slice(2, 4),
      16
    ) / 255,

    parseInt(
      s.slice(4, 6),
      16
    ) / 255,

    parseInt(
      s.slice(6, 8),
      16
    ) / 255
  ]);
}

function compileShader(
  gl,
  type,
  source
) {
  const shader =
    gl.createShader(
      type
    );

  gl.shaderSource(
    shader,
    source
  );

  gl.compileShader(
    shader
  );

  if (
    !gl.getShaderParameter(
      shader,
      gl.COMPILE_STATUS
    )
  ) {
    const log =
      gl.getShaderInfoLog(
        shader
      ) ||
      "Unknown shader compile error";

    gl.deleteShader(
      shader
    );

    throw new Error(
      log
    );
  }

  return shader;
}

function createProgram(gl) {
  const vs =
    compileShader(
      gl,
      gl.VERTEX_SHADER,
      VERTEX_SHADER
    );

  const fs =
    compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      FRAGMENT_SHADER
    );

  const program =
    gl.createProgram();

  gl.attachShader(
    program,
    vs
  );

  gl.attachShader(
    program,
    fs
  );

  gl.linkProgram(
    program
  );

  gl.deleteShader(
    vs
  );

  gl.deleteShader(
    fs
  );

  if (
    !gl.getProgramParameter(
      program,
      gl.LINK_STATUS
    )
  ) {
    const log =
      gl.getProgramInfoLog(
        program
      ) ||
      "Unknown program link error";

    gl.deleteProgram(
      program
    );

    throw new Error(
      log
    );
  }

  return program;
}

function loadImage(source) {
  if (
    source instanceof
    HTMLImageElement
  ) {
    if (
      source.complete &&
      source.naturalWidth > 0
    ) {
      return Promise.resolve(
        source
      );
    }

    return source
      .decode()
      .then(
        () => source
      );
  }

  if (!source) {
    return Promise.resolve(
      null
    );
  }

  return new Promise(
    (
      resolve,
      reject
    ) => {
      const img =
        new Image();

      try {
        const u =
          new URL(
            String(source),
            window.location.href
          );

        if (
          u.origin !==
          window.location.origin
        ) {
          img.crossOrigin =
            "anonymous";
        }
      } catch {}

      img.onload =
        () =>
          resolve(
            img
          );

      img.onerror =
        () =>
          reject(
            new Error(
              `PaperTexture: failed to load image: ${source}`
            )
          );

      img.src =
        String(source);
    }
  );
}

function makeTexture(
  gl,
  image,
  {
    mipmaps = false
  } = {}
) {
  const texture =
    gl.createTexture();

  gl.bindTexture(
    gl.TEXTURE_2D,
    texture
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_S,
    gl.CLAMP_TO_EDGE
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_T,
    gl.CLAMP_TO_EDGE
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    gl.LINEAR
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR
  );

  gl.pixelStorei(
    gl.UNPACK_FLIP_Y_WEBGL,
    false
  );

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  if (mipmaps) {
    gl.generateMipmap(
      gl.TEXTURE_2D
    );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
  }

  gl.bindTexture(
    gl.TEXTURE_2D,
    null
  );

  return texture;
}

function makeTransparentTexture(gl) {
  const texture =
    gl.createTexture();

  gl.bindTexture(
    gl.TEXTURE_2D,
    texture
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_S,
    gl.CLAMP_TO_EDGE
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_WRAP_T,
    gl.CLAMP_TO_EDGE
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR
  );

  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    gl.LINEAR
  );

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([
      0,
      0,
      0,
      0
    ])
  );

  gl.bindTexture(
    gl.TEXTURE_2D,
    null
  );

  return texture;
}

export function mountPaperTexture(
  canvas,
  options = {}
) {
  if (
    !(
      canvas instanceof
      HTMLCanvasElement
    )
  ) {
    throw new TypeError(
      "mountPaperTexture: first argument must be a canvas"
    );
  }

  const config = {
    ...DEFAULTS,
    ...options
  };

  const gl =
    canvas.getContext(
      "webgl2",
      {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "low-power"
      }
    );

  if (!gl) {
    throw new Error(
      "PaperTexture: WebGL2 is not supported in this browser."
    );
  }

  const program =
    createProgram(
      gl
    );

  gl.useProgram(
    program
  );

  const vao =
    gl.createVertexArray();

  const buffer =
    gl.createBuffer();

  gl.bindVertexArray(
    vao
  );

  gl.bindBuffer(
    gl.ARRAY_BUFFER,
    buffer
  );

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,

      -1,  1,
       1, -1,
       1,  1
    ]),
    gl.STATIC_DRAW
  );

  gl.enableVertexAttribArray(
    0
  );

  gl.vertexAttribPointer(
    0,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.bindVertexArray(
    null
  );

  const uniformNames = [
    "u_resolution",
    "u_pixelRatio",
    "u_imageAspectRatio",

    "u_originX",
    "u_originY",
    "u_worldWidth",
    "u_worldHeight",
    "u_fit",
    "u_scale",
    "u_rotation",
    "u_offsetX",
    "u_offsetY",

    "u_image",
    "u_isImage",

    "u_colorBack",
    "u_colorPaper",
    "u_colorShadow",

    "u_blending",
    "u_distortion",
    "u_clip",
    "u_angle",
    "u_seed",

    "u_roughness",
    "u_roughnessSize",
    "u_roughnessRows",

    "u_fiber",
    "u_fiberSize",

    "u_folds",
    "u_foldSizeX",
    "u_foldSizeY",
    "u_foldOffsetX",
    "u_foldOffsetY",

    "u_wrinkles",
    "u_wrinkleSize",

    "u_crumples",
    "u_crumpleCount",

    "u_drops",
    "u_noiseTexture"
  ];

  const u =
    Object.fromEntries(
      uniformNames.map(
        (name) => [
          name,
          gl.getUniformLocation(
            program,
            name
          )
        ]
      )
    );

  let disposed =
    false;

  let imageTexture =
    makeTransparentTexture(
      gl
    );

  let imageAspectRatio =
    1;

  let isImage =
    false;

  let noiseTexture =
    null;

  let noiseReady =
    false;

  let imageGeneration =
    0;

  const noiseImage =
    getShaderNoiseTexture();

  const onNoiseReady =
    () => {
      if (disposed) {
        return;
      }

      noiseTexture =
        makeTexture(
          gl,
          noiseImage
        );

      noiseReady =
        true;

      render();
    };

  if (
    noiseImage.complete &&
    noiseImage.naturalWidth > 0
  ) {
    onNoiseReady();
  } else {
    noiseImage.addEventListener(
      "load",
      onNoiseReady,
      {
        once: true
      }
    );
  }

  async function setImage(
    source
  ) {
    const generation =
      ++imageGeneration;

    if (!source) {
      if (imageTexture) {
        gl.deleteTexture(
          imageTexture
        );
      }

      imageTexture =
        makeTransparentTexture(
          gl
        );

      imageAspectRatio =
        1;

      isImage =
        false;

      render();

      return;
    }

    try {
      const img =
        await loadImage(
          source
        );

      if (
        disposed ||
        generation !==
        imageGeneration ||
        !img
      ) {
        return;
      }

      const next =
        makeTexture(
          gl,
          img,
          {
            mipmaps: true
          }
        );

      if (imageTexture) {
        gl.deleteTexture(
          imageTexture
        );
      }

      imageTexture =
        next;

      imageAspectRatio =
        img.naturalWidth /
        Math.max(
          1,
          img.naturalHeight
        );

      isImage =
        true;

      render();
    } catch (err) {
      console.error(
        err
      );
    }
  }

  function resize() {
    const rect =
      canvas.getBoundingClientRect();

    const dpr =
      Math.min(
        window.devicePixelRatio ||
        1,

        Math.max(
          1,
          Number(
            config.maxPixelRatio
          ) ||
          1
        )
      );

    const width =
      Math.max(
        1,
        Math.round(
          (
            rect.width ||
            window.innerWidth
          ) *
          dpr
        )
      );

    const height =
      Math.max(
        1,
        Math.round(
          (
            rect.height ||
            window.innerHeight
          ) *
          dpr
        )
      );

    if (
      canvas.width !== width ||
      canvas.height !== height
    ) {
      canvas.width =
        width;

      canvas.height =
        height;
    }

    gl.viewport(
      0,
      0,
      width,
      height
    );

    gl.uniform2f(
      u.u_resolution,
      width,
      height
    );

    gl.uniform1f(
      u.u_pixelRatio,
      dpr
    );
  }

  function setUniforms() {
    const fitValue =
      FIT[config.fit] ??
      FIT.contain;

    gl.uniform1f(
      u.u_imageAspectRatio,
      imageAspectRatio
    );

    gl.uniform1f(
      u.u_originX,
      Number(
        config.originX
      )
    );

    gl.uniform1f(
      u.u_originY,
      Number(
        config.originY
      )
    );

    gl.uniform1f(
      u.u_worldWidth,
      Number(
        config.worldWidth
      )
    );

    gl.uniform1f(
      u.u_worldHeight,
      Number(
        config.worldHeight
      )
    );

    gl.uniform1f(
      u.u_fit,
      fitValue
    );

    gl.uniform1f(
      u.u_scale,
      Math.max(
        0.01,
        Number(
          config.scale
        )
      )
    );

    gl.uniform1f(
      u.u_rotation,
      Number(
        config.rotation
      )
    );

    gl.uniform1f(
      u.u_offsetX,
      Number(
        config.offsetX
      )
    );

    gl.uniform1f(
      u.u_offsetY,
      Number(
        config.offsetY
      )
    );

    gl.uniform1i(
      u.u_isImage,
      isImage
        ? 1
        : 0
    );

    gl.uniform4fv(
      u.u_colorBack,
      parseColor(
        config.colorBack
      )
    );

    gl.uniform4fv(
      u.u_colorPaper,
      parseColor(
        config.colorPaper
      )
    );

    gl.uniform4fv(
      u.u_colorShadow,
      parseColor(
        config.colorShadow
      )
    );

    gl.uniform1f(
      u.u_blending,
      clamp(
        config.blending,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_distortion,
      clamp(
        config.distortion,
        -1,
        1
      )
    );

    gl.uniform1i(
      u.u_clip,
      config.clip
        ? 1
        : 0
    );

    gl.uniform1f(
      u.u_angle,
      Number(
        config.angle
      )
    );

    gl.uniform1f(
      u.u_seed,
      Number(
        config.seed
      )
    );

    gl.uniform1f(
      u.u_roughness,
      clamp(
        config.roughness,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_roughnessSize,
      clamp(
        config.roughnessSize,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_roughnessRows,
      clamp(
        config.roughnessRows,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_fiber,
      clamp(
        config.fiber,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_fiberSize,
      clamp(
        config.fiberSize,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_folds,
      clamp(
        config.folds,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_foldSizeX,
      clamp(
        config.foldSizeX,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_foldSizeY,
      clamp(
        config.foldSizeY,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_foldOffsetX,
      clamp(
        config.foldOffsetX,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_foldOffsetY,
      clamp(
        config.foldOffsetY,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_wrinkles,
      clamp(
        config.wrinkles,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_wrinkleSize,
      clamp(
        config.wrinkleSize,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_crumples,
      clamp(
        config.crumples,
        0,
        1
      )
    );

    gl.uniform1f(
      u.u_crumpleCount,
      clamp(
        config.crumpleCount,
        2,
        15
      )
    );

    gl.uniform1f(
      u.u_drops,
      clamp(
        config.drops,
        0,
        1
      )
    );

    gl.activeTexture(
      gl.TEXTURE0
    );

    gl.bindTexture(
      gl.TEXTURE_2D,
      imageTexture
    );

    gl.uniform1i(
      u.u_image,
      0
    );

    gl.activeTexture(
      gl.TEXTURE1
    );

    gl.bindTexture(
      gl.TEXTURE_2D,
      noiseTexture
    );

    gl.uniform1i(
      u.u_noiseTexture,
      1
    );
  }

  function render() {
    if (
      disposed ||
      !noiseReady
    ) {
      return;
    }

    gl.useProgram(
      program
    );

    resize();

    setUniforms();

    gl.bindVertexArray(
      vao
    );

    gl.drawArrays(
      gl.TRIANGLES,
      0,
      6
    );

    gl.bindVertexArray(
      null
    );
  }

  function update(
    next = {}
  ) {
    const imageChanged =
      Object.prototype.hasOwnProperty.call(
        next,
        "image"
      ) &&
      next.image !==
      config.image;

    Object.assign(
      config,
      next
    );

    if (imageChanged) {
      setImage(
        config.image
      );
    } else {
      render();
    }
  }

  let resizeQueued =
    false;

  function onResize() {
    if (resizeQueued) {
      return;
    }

    resizeQueued =
      true;

    requestAnimationFrame(
      () => {
        resizeQueued =
          false;

        render();
      }
    );
  }

  window.addEventListener(
    "resize",
    onResize,
    {
      passive: true
    }
  );

  const ro =
    typeof ResizeObserver !==
    "undefined"
      ? new ResizeObserver(
          onResize
        )
      : null;

  ro?.observe(
    canvas
  );

  function destroy() {
    if (disposed) {
      return;
    }

    disposed =
      true;

    window.removeEventListener(
      "resize",
      onResize
    );

    ro?.disconnect();

    if (imageTexture) {
      gl.deleteTexture(
        imageTexture
      );
    }

    if (noiseTexture) {
      gl.deleteTexture(
        noiseTexture
      );
    }

    gl.deleteBuffer(
      buffer
    );

    gl.deleteVertexArray(
      vao
    );

    gl.deleteProgram(
      program
    );
  }

  setImage(
    config.image
  );

  render();

  return {
    render,
    update,
    destroy,
    options: config
  };
}

export default mountPaperTexture;