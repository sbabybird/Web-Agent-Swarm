import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

const Scene = ({ scene }) => {
  if (!scene) return null;

  return (
    <Canvas camera={{ position: scene.camera.position }}>
      {scene.lights.map((light, index) => {
        switch (light.type) {
          case 'ambient':
            return <ambientLight key={index} color={light.color} intensity={light.intensity} />;
          case 'directional':
            return <directionalLight key={index} color={light.color} intensity={light.intensity} position={light.position} />;
          case 'point':
            return <pointLight key={index} color={light.color} intensity={light.intensity} position={light.position} />;
          case 'spot':
            return <spotLight key={index} color={light.color} intensity={light.intensity} position={light.position} />;
          default:
            return null;
        }
      })}
      {scene.objects.map((obj, index) => {
        let geometry;
        switch (obj.geometry.type) {
          case 'box':
            geometry = <boxGeometry args={obj.geometry.args} />;
            break;
          case 'sphere':
            geometry = <sphereGeometry args={obj.geometry.args} />;
            break;
          case 'plane':
            geometry = <planeGeometry args={obj.geometry.args} />;
            break;
          default:
            return null;
        }

        let material;
        switch (obj.material.type) {
          case 'standard':
            material = <meshStandardMaterial {...obj.material} />;
            break;
          case 'physical':
            material = <meshPhysicalMaterial {...obj.material} />;
            break;
          case 'lambert':
            material = <meshLambertMaterial {...obj.material} />;
            break;
          default:
            return null;
        }

        return (
          <mesh key={index} position={obj.transform.position} rotation={obj.transform.rotation} scale={obj.transform.scale}>
            {geometry}
            {material}
          </mesh>
        );
      })}
      <OrbitControls />
    </Canvas>
  );
};

export default Scene;
