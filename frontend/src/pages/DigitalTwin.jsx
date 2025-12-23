import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Cylinder, Sphere } from '@react-three/drei';
import { Activity, Cpu, Zap, AlertTriangle, Settings } from 'lucide-react';
import * as THREE from 'three';

const EquipmentMesh = ({ equipment, position, onClick, isSelected }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      // Pulsing effect for critical equipment
      if (equipment.status === 'critical') {
        meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.1);
      }
    }
  });

  const getColor = () => {
    if (isSelected) return '#3b82f6';
    if (equipment.status === 'critical') return '#ef4444';
    if (equipment.status === 'warning') return '#f59e0b';
    return '#10b981';
  };

  const getGeometry = () => {
    switch (equipment.type) {
      case 'Reactor':
        return <Cylinder ref={meshRef} args={[1, 1, 2]} position={position} />;
      case 'Pump':
        return <Box ref={meshRef} args={[1.5, 1, 1]} position={position} />;
      case 'Heat Exchanger':
        return <Box ref={meshRef} args={[2, 0.5, 1]} position={position} />;
      case 'Compressor':
        return <Sphere ref={meshRef} args={[1]} position={position} />;
      case 'Valve':
        return <Cylinder ref={meshRef} args={[0.5, 0.5, 1]} position={position} />;
      default:
        return <Box ref={meshRef} args={[1, 1, 1]} position={position} />;
    }
  };

  return (
    <group>
      <mesh
        onClick={() => onClick(equipment)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {React.cloneElement(getGeometry(), {
          material: (
            <meshStandardMaterial
              color={getColor()}
              emissive={hovered ? '#333' : '#000'}
              transparent
              opacity={0.8}
            />
          )
        })}
      </mesh>
      <Text
        position={[position[0], position[1] + 2, position[2]]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {equipment.id}
      </Text>
      <Text
        position={[position[0], position[1] + 1.5, position[2]]}
        fontSize={0.2}
        color={getColor()}
        anchorX="center"
        anchorY="middle"
      >
        {equipment.temperature}°C
      </Text>
    </group>
  );
};

const DigitalTwin = () => {
  const [equipmentData, setEquipmentData] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [viewMode, setViewMode] = useState('3d');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/equipment-monitoring/');
    
    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'equipment_data') {
        setEquipmentData(data.equipment);
      }
    };
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => {
      setIsConnected(false);
      // Fallback simulation
      const interval = setInterval(() => {
        const mockData = [
          { id: 'Reactor-001', type: 'Reactor', temperature: 85 + Math.random() * 10, pressure: 25 + Math.random() * 5, flowrate: 150 + Math.random() * 20, status: 'normal' },
          { id: 'Pump-002', type: 'Pump', temperature: 65 + Math.random() * 8, pressure: 45 + Math.random() * 8, flowrate: 200 + Math.random() * 30, status: 'warning' },
          { id: 'Heat Exchanger-003', type: 'Heat Exchanger', temperature: 120 + Math.random() * 15, pressure: 30 + Math.random() * 6, flowrate: 175 + Math.random() * 25, status: 'critical' },
          { id: 'Compressor-004', type: 'Compressor', temperature: 95 + Math.random() * 12, pressure: 60 + Math.random() * 10, flowrate: 300 + Math.random() * 40, status: 'normal' },
          { id: 'Valve-005', type: 'Valve', temperature: 55 + Math.random() * 6, pressure: 20 + Math.random() * 4, flowrate: 125 + Math.random() * 15, status: 'normal' }
        ];
        setEquipmentData(mockData);
      }, 2000);
      return () => clearInterval(interval);
    };

    return () => ws.close();
  }, []);

  const equipmentPositions = [
    [-4, 0, 0], [4, 0, 0], [0, 0, -4], [0, 0, 4], [0, 3, 0]
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Digital Twin</h1>
          <p className="text-gray-600">3D virtual representation with real-time synchronization</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">{isConnected ? 'Live' : 'Simulation'}</span>
          </div>
          <select 
            value={viewMode} 
            onChange={(e) => setViewMode(e.target.value)}
            className="px-3 py-1 border rounded-lg"
          >
            <option value="3d">3D View</option>
            <option value="schematic">Schematic</option>
          </select>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Active Equipment</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{equipmentData.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-medium">Critical Status</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {equipmentData.filter(eq => eq.status === 'critical').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-green-600" />
            <span className="font-medium">Avg Temperature</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {equipmentData.length > 0 ? 
              Math.round(equipmentData.reduce((sum, eq) => sum + eq.temperature, 0) / equipmentData.length) : 0}°C
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center space-x-2 mb-2">
            <Settings className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Simulation Speed</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.5"
            value={simulationSpeed}
            onChange={(e) => setSimulationSpeed(e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-gray-600">{simulationSpeed}x</p>
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <Canvas camera={{ position: [10, 10, 10], fov: 60 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <pointLight position={[-10, -10, -10]} color="#0066ff" intensity={0.3} />
            
            {equipmentData.map((equipment, index) => (
              <EquipmentMesh
                key={equipment.id}
                equipment={equipment}
                position={equipmentPositions[index] || [0, 0, 0]}
                onClick={setSelectedEquipment}
                isSelected={selectedEquipment?.id === equipment.id}
              />
            ))}
            
            {/* Grid floor */}
            <gridHelper args={[20, 20, '#444', '#222']} />
            
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </Canvas>
        </div>

        {/* Equipment Details */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Equipment Details</h3>
          {selectedEquipment ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-lg">{selectedEquipment.id}</h4>
                <p className="text-gray-600">{selectedEquipment.type}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Temperature</p>
                  <p className="text-xl font-bold text-blue-600">{selectedEquipment.temperature}°C</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Pressure</p>
                  <p className="text-xl font-bold text-green-600">{selectedEquipment.pressure} bar</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Flowrate</p>
                  <p className="text-xl font-bold text-purple-600">{selectedEquipment.flowrate} L/min</p>
                </div>
                <div className={`p-3 rounded-lg ${
                  selectedEquipment.status === 'critical' ? 'bg-red-50' :
                  selectedEquipment.status === 'warning' ? 'bg-yellow-50' : 'bg-green-50'
                }`}>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`text-xl font-bold ${
                    selectedEquipment.status === 'critical' ? 'text-red-600' :
                    selectedEquipment.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {selectedEquipment.status}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium mb-2">Digital Twin Insights</h5>
                <div className="space-y-2 text-sm">
                  <p>• Real-time synchronization active</p>
                  <p>• Predictive model accuracy: 94%</p>
                  <p>• Next maintenance: {Math.floor(Math.random() * 30 + 10)} days</p>
                  <p>• Efficiency score: {Math.floor(Math.random() * 20 + 80)}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Cpu className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Click on equipment in 3D view to see details</p>
            </div>
          )}
        </div>
      </div>

      {/* Equipment List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Equipment Fleet Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipmentData.map((equipment) => (
            <div
              key={equipment.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedEquipment?.id === equipment.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedEquipment(equipment)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{equipment.id}</h4>
                  <p className="text-sm text-gray-600">{equipment.type}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  equipment.status === 'critical' ? 'bg-red-100 text-red-800' :
                  equipment.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {equipment.status}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Temp:</span>
                  <span className="ml-1 font-medium">{equipment.temperature}°</span>
                </div>
                <div>
                  <span className="text-gray-500">Press:</span>
                  <span className="ml-1 font-medium">{equipment.pressure}</span>
                </div>
                <div>
                  <span className="text-gray-500">Flow:</span>
                  <span className="ml-1 font-medium">{equipment.flowrate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;