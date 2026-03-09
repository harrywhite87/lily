/**
 * Scene lighting setup — ambient + directional for even illumination
 * with subtle highlights on the submarine model.
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} color="#b8d4e3" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color="#e8f0ff"
        castShadow={false}
      />
      <directionalLight
        position={[-3, -2, 4]}
        intensity={0.3}
        color="#2ec4b6"
      />
      <pointLight
        position={[0, -5, 3]}
        intensity={0.5}
        color="#c9a84c"
        distance={15}
        decay={2}
      />
    </>
  );
}
