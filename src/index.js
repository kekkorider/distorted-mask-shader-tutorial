import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Effect } from "@babylonjs/core/Materials/effect";
import { PlaneBuilder } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import "@babylonjs/core/Culling/ray";

import gsap from "gsap";

class App {
  constructor() {
    this.canvas = null;
    this.engine = null;
    this.scene = null;
    this.plane = null;
    this.time = 0;
    this.maskVisibility = { value: 0 };
    this.maskPosition = { x: 0, y: 0 };
  }

  init() {
    this.setup();
    this.addListeners();
  }

  setup() {
    this.canvas = document.querySelector("#app");
    this.engine = new Engine(this.canvas, true, null, true);
    this.scene = new Scene(this.engine);

    // Adding the vertex and fragment shaders to the Babylon's ShaderStore
    Effect.ShadersStore["customVertexShader"] = require("./shader/vertex.glsl");
    Effect.ShadersStore[
      "customFragmentShader"
    ] = require("./shader/fragment.glsl");

    // Creating the shader material using the `custom` shaders we added to the ShaderStore
    const planeMaterial = new ShaderMaterial("PlaneMaterial", this.scene, {
      vertex: "custom",
      fragment: "custom",
      attributes: ["position", "normal", "uv"],
      uniforms: ["worldViewProjection"]
    });
    planeMaterial.backFaceCulling = false;

    // Creating a basic plane and adding the shader material to it
    this.plane = new PlaneBuilder.CreatePlane(
      "Plane",
      { width: 1, height: 1 },
      this.scene
    );
    this.plane.scaling = new Vector3(10, (9 / 16) * 10, 1);
    this.plane.material = planeMaterial;

    // Passing the images to the fragment shader as a `Texture`

    const frontTexture = new Texture(require("./images/lantern.jpg"));
    const backTexture = new Texture(require("./images/lantern-bw.jpg"));
    this.plane.material.setTexture("u_frontTexture", frontTexture);
    this.plane.material.setTexture("u_backTexture", backTexture);

    // Actions on the plane mesh
    this.plane.actionManager = new ActionManager(this.scene);
    this.plane.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () =>
        this.onPlaneHover()
      )
    );
    this.plane.actionManager.registerAction(
      new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () =>
        this.onPlaneLeave()
      )
    );

    // Camera
    const camera = new ArcRotateCamera(
      "Camera",
      -Math.PI / 2,
      Math.PI / 2,
      10,
      Vector3.Zero(),
      this.scene
    );
    // camera.attachControl(this.canvas);

    this.engine.runRenderLoop(() => this.scene.render());

    this.scene.registerBeforeRender(() => {
      this.plane.material.setFloat(
        "uPlaneRatio",
        this.plane.scaling.x / this.plane.scaling.y
      );
      this.plane.material.setFloat(
        "u_maskVisibility",
        this.maskVisibility.value
      );

      this.time++;
      this.plane.material.setFloat("u_time", this.time);

      this.plane.material.setVector2(
        "u_maskPosition",
        new Vector2(this.maskPosition.x, this.maskPosition.y)
      );
    });
  }

  addListeners() {
    window.addEventListener("resize", () => this.engine.resize());
    window.addEventListener("mousemove", () => {
      // Casting a ray whose origin corresponds to the mouse position
      const pickResult = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY
      );

      // Check if the ray intersects something
      if (pickResult.hit) {
        // These result in normalized values that go from -0.5 to 0.5, exactly like the UVs in the shader
        const x = pickResult.pickedPoint.x / this.plane.scaling.x;
        const y = pickResult.pickedPoint.y / this.plane.scaling.y;

        this.maskPosition = { x, y };
      }
    });
  }

  onPlaneHover() {
    gsap.to(this.maskVisibility, {
      duration: 0.5,
      value: 1
    });
  }

  onPlaneLeave() {
    gsap.to(this.maskVisibility, {
      duration: 0.5,
      value: 0
    });
  }
}

const app = new App();
app.init();
