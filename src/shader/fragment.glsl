precision highp float;

// Varyings
varying vec2 vUV;

// Uniforms
uniform float uPlaneRatio;
uniform sampler2D u_frontTexture;
uniform sampler2D u_backTexture;
uniform float u_time;
uniform float u_maskVisibility;
uniform vec2 u_maskPosition;

vec3 Rectangle(in vec2 size, in vec2 st, in vec2 p, in vec3 c) {
  float top = step(1. - (p.y + size.y), 1. - st.y);
  float right = step(1. - (p.x + size.x), 1. - st.x);
  float bottom = step(p.y, st.y);
  float left = step(p.x, st.x);
  return top * right * bottom * left * c;
}

void main() {
  vec2 uv = vUV - 0.5;
  uv.x *= uPlaneRatio;
  vec3 color = vec3(0.0);

  vec2 maskUV = vec2(
    uv.x + sin(u_time * 0.03) * sin(uv.y * 5.0) * 0.15,
    uv.y + cos(u_time * 0.03) * cos(uv.x * 10.0) * 0.15
  );

  vec2 maskSize = vec2(0.3, 0.3);

  vec2 maskPosition = vec2(
    u_maskPosition.x * uPlaneRatio - 0.15,
    u_maskPosition.y - 0.15
  );
  
  vec3 maskColor = vec3(u_maskVisibility);

  vec3 mask = Rectangle(maskSize, maskUV, maskPosition, maskColor);

  vec2 frontImageUV = vec2(
    (uv.x + sin(u_time * 0.04) * sin(uv.y * 10.) * 0.03),
    (uv.y + sin(u_time * 0.03) * cos(uv.x * 15.) * 0.05)
  );

  vec3 frontImage = texture2D(u_frontTexture, frontImageUV * 0.5 + 0.5).rgb * mask;
  vec3 backImage = texture2D(u_backTexture, uv * 0.5 + 0.5).rgb * (1.0 - mask);

  color = backImage + frontImage;

  gl_FragColor = vec4(color, 1.0);
}