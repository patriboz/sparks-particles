import * as THREE from 'three';
import metaversefile from 'metaversefile';

import {
  Bezier, ColorRange, ConstantValue,
  IntervalValue, PiecewiseBezier, ColorOverLife,
  RenderMode, SizeOverLife, ParticleSystem,
  ParticleEmitter, BatchedParticleRenderer, ConeEmitter, ApplyForce
} from "./three.quarks.esm.js";


const {useApp, useInternals, useFrame} = metaversefile;
const { renderer, camera } = useInternals();

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

let clock;

class TrailDemo {

  batchRenderer;
  groups = [];
  totalTime = 0;
  refreshIndex = 0;
  texture;

  render(delta) {

      this.groups.forEach(group =>
          group.traverse(object => {
              if (object.userData && object.userData.func) {
                  object.userData.func.call(object, delta);
              }
          })
      );

      while (Math.floor(this.totalTime * 5) > this.refreshIndex) {
          if (this.refreshIndex < this.groups.length) {
              this.groups[this.refreshIndex].traverse(object => {
                  if (object instanceof ParticleEmitter) {
                      object.system.restart();
                  }
              });
          }
          this.refreshIndex++;
      }
      this.totalTime += delta;
      if (this.totalTime > 2) {
          this.totalTime = 0;
          this.refreshIndex = 0;
      }

      if (this.batchRenderer)
          this.batchRenderer.update(delta);
  }

  initTrailEffect(index) {
      const group = new THREE.Group();

      const beam = new ParticleSystem(this.batchRenderer, {
          duration: 1,
          looping: false,
          startLife: new IntervalValue(0.8, 1.4),
          startSpeed: new IntervalValue(10, 15),
          startSize: new ConstantValue(0.2),
          startColor: new ColorRange(new THREE.Vector4(1, 0.585716, 0.1691176, 1), new THREE.Vector4(1, 1, 1, 1)),
          worldSpace: true,

          maxParticle: 10,
          emissionOverTime: new ConstantValue(0),
          emissionBursts: [{
              time: 0,
              count: 10,
              cycle: 1,
              interval: 0.01,
              probability: 1,
          }],

          shape: new ConeEmitter({radius: 0.1, angle: 1}),
          texture: this.texture,
          blending: THREE.AdditiveBlending,
          renderMode: RenderMode.Trail,
          rendererEmitterSettings: {
              startLength: new ConstantValue(20),
          },
          startTileIndex: new ConstantValue(0),
          uTileCount: 10,
          vTileCount: 10,
          renderOrder: 0,
      });
      beam.emitter.name = 'beam';
      beam.addBehavior(new SizeOverLife(new PiecewiseBezier([[new Bezier(1, 0.95, 0.75, 0), 0]])));
      beam.addBehavior(new ColorOverLife(new ColorRange(new THREE.Vector4(1, 1, 1, 1), new THREE.Vector4(0, 0, 0, 1))));
      beam.addBehavior(new ApplyForce(new THREE.Vector3(0, -1, 0), new ConstantValue(20)));
      beam.emitter.rotation.x = - Math.PI / 2;
      group.add(beam.emitter);

      group.position.set(0,0);//Math.floor(index / 10) * 2 - 10, 0, (index % 10) * 2 - 10);
      group.visible = false;
      this.scene.add(group);
      this.groups.push(group);
  }

  initScene(scene) {
      this.scene = scene;
      this.scene.background = new THREE.Color(0);
      const geo = new THREE.PlaneBufferGeometry(2000, 2000, 8, 8);
      const mat = new THREE.MeshStandardMaterial({color: 0x222222, side: THREE.DoubleSide});
      const plane = new THREE.Mesh(geo, mat);
      this.scene.add(plane);
      plane.position.set(0, -10, 0);
      plane.lookAt(camera.position);

      const light = new THREE.PointLight(0xffffff, 1, 300);
      light.position.set(0, 20, 0);
      this.scene.add(light);

      this.texture = new THREE.TextureLoader().load("https://patriboz.github.io/spark-particles/assets/textures/texture1.png", (texture) => {
          this.texture.name = "textures/texture1.png";
          this.batchRenderer = new BatchedParticleRenderer();
          this.scene.add(this.batchRenderer);

          for (let i = 0; i < 1; i++) {
              this.initTrailEffect(i);
          }
      });
      return this.scene;
  }
}






export default () => {
  const app = useApp();
  app.name = 'Sparks Particles';
  
  let sparks = new TrailDemo();
  sparks.initScene(app);

  clock = new THREE.Clock();
  

  useFrame(({ timeDiff, timestamp }) => {

    let delta = clock.getDelta();
    sparks.render(delta);
    
    
  });
  
  return app;
};