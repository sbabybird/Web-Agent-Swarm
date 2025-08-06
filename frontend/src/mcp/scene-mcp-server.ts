import * as THREE from 'three';
import { createMCPServer, MCPServer } from './pubsub';

export function createSceneMCPServer(scene: THREE.Scene): MCPServer {
  const server = createMCPServer();
  const objects = new Map<string, THREE.Object3D>();

  // Clear the entire scene
  server.handle('scene/clear_scene', async () => {
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    objects.clear();
    return { success: true };
  });

  // Create a mesh
  server.handle('scene/create_mesh', async (params: any) => {
    let geometry;
    switch (params.geometry) {
      case 'SphereGeometry':
        geometry = new THREE.SphereGeometry();
        break;
      case 'PlaneGeometry':
        geometry = new THREE.PlaneGeometry(10, 10);
        break;
      default: // BoxGeometry
        geometry = new THREE.BoxGeometry();
        break;
    }

    let material;
    const materialParams = params.materialParams || {};
    switch (params.material) {
      case 'MeshBasicMaterial':
        material = new THREE.MeshBasicMaterial(materialParams);
        break;
      default: // MeshStandardMaterial
        material = new THREE.MeshStandardMaterial(materialParams);
        break;
    }

    const mesh = new THREE.Mesh(geometry, material);
    if (params.position) mesh.position.set(params.position.x, params.position.y, params.position.z);
    if (params.rotation) mesh.rotation.set(params.rotation.x, params.rotation.y, params.rotation.z);

    scene.add(mesh);
    objects.set(params.id, mesh);
    return { success: true };
  });

  // Set position of an existing object
  server.handle('scene/set_position', async (params: { id: string; position: { x: number; y: number; z: number } }) => {
    const object = objects.get(params.id);
    if (object) {
      object.position.set(params.position.x, params.position.y, params.position.z);
      return { success: true };
    } else {
      return { success: false, error: `Object with id ${params.id} not found` };
    }
  });

  // Add a light to the scene
  server.handle('scene/add_light', async (params: any) => {
    let light;
    const color = new THREE.Color(params.color || 0xffffff);
    const intensity = params.intensity || 1;

    switch (params.type) {
      case 'DirectionalLight':
        light = new THREE.DirectionalLight(color, intensity);
        break;
      case 'PointLight':
        light = new THREE.PointLight(color, intensity);
        break;
      default: // AmbientLight
        light = new THREE.AmbientLight(color, intensity);
        break;
    }

    if (params.position && light.position) {
      light.position.set(params.position.x, params.position.y, params.position.z);
    }

    scene.add(light);
    if (params.id) {
        objects.set(params.id, light);
    }
    return { success: true };
  });

  return server;
}
