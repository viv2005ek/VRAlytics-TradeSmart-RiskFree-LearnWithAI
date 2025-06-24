import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import { Loader2, TrendingUp, TrendingDown, BarChart3, Activity, Zap } from 'lucide-react';
import { yahooFinanceAPI, YahooStockHistory } from '../lib/yahooFinance';

interface PriceChart3DProps {
  symbol: string;
  timeframe: '1D' | '1M' | '1Y';
  showRSI?: boolean;
  showSMA?: boolean;
  className?: string;
}

// 3D Chart Data Point Component
const DataPoint = ({ position, price, isHigh, isLow, index, totalPoints }: {
  position: [number, number, number];
  price: number;
  isHigh: boolean;
  isLow: boolean;
  index: number;
  totalPoints: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      meshRef.current.position.y = position[1] +
        Math.sin(state.clock.elapsedTime * 2 + index * 0.1) * 0.02;
      
      // Rotation animation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5 + index * 0.1;
      
      // Scale animation on hover
      const targetScale = hovered ? 1.5 : (isHigh || isLow ? 1.2 : 1.0);
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const color = isHigh ? '#00d4ff' : isLow ? '#ff5e3a' : '#7fd8ff';
  const emissiveColor = isHigh ? '#004d5c' : isLow ? '#5c1e0f' : '#1e3a5c';

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.03, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={emissiveColor}
        emissiveIntensity={hovered ? 0.8 : 0.3}
        metalness={0.8}
        roughness={0.2}
      />
      
      {/* Holographic glow effect */}
      <mesh scale={hovered ? 2 : 1.5}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.3 : 0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </mesh>
  );
};

// 3D Volume Bar Component
const VolumeBar = ({ position, height, index }: {
  position: [number, number, number];
  height: number;
  index: number;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Pulsing animation
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3 + index * 0.2) * 0.1;
      meshRef.current.scale.y = height * pulse;
      
      // Emissive intensity animation
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 2 + index * 0.1) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={[position[0], position[1] - height/2, position[2] - 1]}>
      <cylinderGeometry args={[0.02, 0.02, height, 8]} />
      <meshStandardMaterial
        color="#7fd8ff"
        emissive="#1e3a5c"
        emissiveIntensity={0.2}
        metalness={0.6}
        roughness={0.4}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
};

// 3D Price Line Component
const PriceLine = ({ points }: { points: THREE.Vector3[] }) => {
  const lineRef = useRef<THREE.Line>(null);

  useFrame((state) => {
    if (lineRef.current) {
      // Ripple effect along the line
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.8 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color="#00d4ff"
      lineWidth={3}
      transparent
      opacity={0.8}
    />
  );
};

// Holographic Grid Component
const HolographicGrid = () => {
  const gridRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (gridRef.current) {
      // Subtle floating animation
      gridRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      
      // Opacity pulsing
      gridRef.current.children.forEach((child, index) => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 2 + index * 0.5) * 0.05;
      });
    }
  });

  const gridLines = [];
  
  // Horizontal grid lines
  for (let i = -2; i <= 2; i += 0.5) {
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[[-2, i, -2], [2, i, -2], [2, i, 2], [-2, i, 2], [-2, i, -2]]}
        color="#7fd8ff"
        transparent
        opacity={0.1}
        lineWidth={1}
      />
    );
  }
  
  // Vertical grid lines
  for (let i = -2; i <= 2; i += 0.5) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[[i, -2, -2], [i, 2, -2], [i, 2, 2], [i, -2, 2], [i, -2, -2]]}
        color="#7fd8ff"
        transparent
        opacity={0.1}
        lineWidth={1}
      />
    );
  }

  return <group ref={gridRef}>{gridLines}</group>;
};

// Floating Particles Component
const FloatingParticles = ({ count = 50 }: { count?: number }) => {
  const particlesRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return { positions, velocities };
  }, [count]);

  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        positions[i * 3] += particles.velocities[i * 3];
        positions[i * 3 + 1] += particles.velocities[i * 3 + 1];
        positions[i * 3 + 2] += particles.velocities[i * 3 + 2];
        
        // Wrap around boundaries
        if (Math.abs(positions[i * 3]) > 4) particles.velocities[i * 3] *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 4) particles.velocities[i * 3 + 1] *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 4) particles.velocities[i * 3 + 2] *= -1;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#7fd8ff"
        size={0.02}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

// Main 3D Chart Scene Component
const Chart3DScene = ({ chartData, timeframe, showRSI, showSMA }: {
  chartData: YahooStockHistory;
  timeframe: '1D' | '1M' | '1Y';
  showRSI?: boolean;
  showSMA?: boolean;
}) => {
  const { camera } = useThree();

  useEffect(() => {
    // Set up camera position for optimal viewing
    camera.position.set(3, 2, 3);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  if (!chartData || chartData.data.length === 0) {
    return null;
  }

  const prices = chartData.data.map(d => d.close);
  const volumes = chartData.data.map(d => d.volume);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const maxVolume = Math.max(...volumes);

  // Create 3D positions for data points
  const dataPoints = chartData.data.map((point, index) => {
    const x = (index / (chartData.data.length - 1)) * 4 - 2; // -2 to 2
    const y = ((point.close - minPrice) / priceRange) * 2 - 1; // -1 to 1
    const z = 0;
    
    return {
      position: [x, y, z] as [number, number, number],
      price: point.close,
      volume: point.volume,
      isHigh: point.close === maxPrice,
      isLow: point.close === minPrice,
      index
    };
  });

  // Create line points for price curve
  const linePoints = dataPoints.map(point => new THREE.Vector3(...point.position));

  // Create SMA line if enabled
  let smaLinePoints: THREE.Vector3[] = [];
  if (showSMA) {
    const smaData = prices.map((_, i) => {
      if (i < 20) return null;
      const slice = prices.slice(i - 20, i);
      return slice.reduce((sum, p) => sum + p, 0) / 20;
    });
    
    smaLinePoints = dataPoints.map((point, i) => {
      if (i < 20) return new THREE.Vector3(point.position[0], 0, point.position[2]);
      const smaValue = smaData[i];
      if (smaValue === null) return new THREE.Vector3(point.position[0], 0, point.position[2]);
      const y = ((smaValue - minPrice) / priceRange) * 2 - 1;
      return new THREE.Vector3(point.position[0], y, point.position[2]);
    });
  }

  return (
    <>
      {/* Holographic Grid */}
      <HolographicGrid />
      
      {/* Floating Particles */}
      <FloatingParticles count={30} />
      
      {/* Price Line */}
      <PriceLine points={linePoints} />
      
      {/* SMA Line if enabled */}
      {showSMA && (
        <Line
          points={smaLinePoints}
          color="#fbbf24"
          lineWidth={2}
          transparent
          opacity={0.7}
          dashed
          dashSize={0.1}
          dashScale={1}
          gapSize={0.05}
        />
      )}
      
      {/* Data Points */}
      {dataPoints.map((point, index) => (
        <DataPoint
          key={index}
          position={point.position}
          price={point.price}
          isHigh={point.isHigh}
          isLow={point.isLow}
          index={index}
          totalPoints={dataPoints.length}
        />
      ))}
      
      {/* Volume Bars */}
      {dataPoints.map((point, index) => (
        <VolumeBar
          key={`vol-${index}`}
          position={point.position}
          height={(point.volume / maxVolume) * 0.5}
          index={index}
        />
      ))}
      
      {/* Price Labels */}
      <Text
        position={[-2.5, 1, 0]}
        fontSize={0.1}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        ${maxPrice.toFixed(2)}
      </Text>
      
      <Text
        position={[-2.5, -1, 0]}
        fontSize={0.1}
        color="#ff5e3a"
        anchorX="center"
        anchorY="middle"
      >
        ${minPrice.toFixed(2)}
      </Text>
      
      {/* Current Price Indicator */}
      <Text
        position={[2.5, dataPoints[dataPoints.length - 1]?.position[1] || 0, 0]}
        fontSize={0.12}
        color="#00d4ff"
        anchorX="center"
        anchorY="middle"
      >
        ${prices[prices.length - 1]?.toFixed(2)}
      </Text>
      
      {/* RSI Visualization if enabled */}
      {showRSI && (
        <group position={[0, -1.5, 0]}>
          <Line
            points={[[-2, 0, 0], [2, 0, 0]]}
            color="#8b5cf6"
            lineWidth={1}
            transparent
            opacity={0.5}
          />
          <Text
            position={[-2.5, 0, 0]}
            fontSize={0.08}
            color="#8b5cf6"
            anchorX="center"
            anchorY="middle"
          >
            RSI
          </Text>
        </group>
      )}
      
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#00d4ff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff5e3a" />
      <spotLight
        position={[0, 5, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        color="#ffffff"
        castShadow
      />
    </>
  );
};

// Main 3D Price Chart Component
export const PriceChart3D: React.FC<PriceChart3DProps> = ({ 
  symbol, 
  timeframe, 
  showRSI = false, 
  showSMA = false, 
  className = '' 
}) => {
  const [chartData, setChartData] = useState<YahooStockHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadChartData();
  }, [symbol, timeframe]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const intervalMap = {
        '1D': { interval: '5m' as const, limit: 78 },
        '1M': { interval: '1d' as const, limit: 30 },
        '1Y': { interval: '1wk' as const, limit: 52 }
      };
      
      const { interval, limit } = intervalMap[timeframe];
      const data = await yahooFinanceAPI.getStockHistory(symbol, interval, limit);
      
      setChartData(data);
    } catch (err) {
      setError('Failed to load 3D chart data');
    } finally {
      setLoading(false);
    }
  };

  const getChangeInfo = () => {
    if (!chartData || chartData.data.length < 2) return null;
    
    const firstPrice = chartData.data[0].close;
    const lastPrice = chartData.data[chartData.data.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    
    return {
      change,
      changePercent,
      isPositive: change >= 0
    };
  };

  const changeInfo = getChangeInfo();

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl p-6 hover:bg-black/15 transition-all duration-300 h-full flex items-center justify-center"
           style={{
             boxShadow: `
               0 8px 32px 0 rgba(0, 0, 0, 0.4),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
               0 0 0 1px rgba(255, 255, 255, 0.05)
             `
           }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-cyan-300">Loading 3D holographic chart...</p>
          <p className="text-gray-400 text-sm mt-2">Initializing Three.js scene</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-black/10 border border-white/20 rounded-2xl p-6 hover:bg-black/15 transition-all duration-300 h-full flex items-center justify-center"
           style={{
             boxShadow: `
               0 8px 32px 0 rgba(0, 0, 0, 0.4),
               inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
               0 0 0 1px rgba(255, 255, 255, 0.05)
             `
           }}>
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={loadChartData}
            className="border border-blue-500/50 hover:border-blue-400 hover:bg-blue-500/10 text-blue-400 px-4 py-2 rounded-lg transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* 3D Canvas */}
      <div className="h-full w-full">
        <Canvas
          camera={{ position: [3, 2, 3], fov: 60 }}
          style={{ background: 'transparent' }}
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
          }}
        >
          <Chart3DScene 
            chartData={chartData} 
            timeframe={timeframe}
            showRSI={showRSI}
            showSMA={showSMA}
          />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxDistance={10}
            minDistance={2}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
        
        {/* Instructions */}
        <div className="absolute bottom-4 right-4 text-xs text-cyan-300/70 bg-black/30 backdrop-blur-sm rounded-lg p-2">
          <p>🖱️ Drag to rotate • 🔍 Scroll to zoom • 📱 Pinch to zoom</p>
        </div>
      </div>
      
      {/* Data Info */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-400 bg-black/30 backdrop-blur-sm rounded-lg p-2">
        <span className="text-cyan-400">3D Holographic</span> • 
        Data: Yahoo Finance • {timeframe} timeframe • 
        {chartData?.data.length || 0} data points • 
        <span className="text-purple-400">WebGL Accelerated</span>
        {showRSI && <span className="text-purple-400"> • RSI</span>}
        {showSMA && <span className="text-green-400"> • SMA</span>}
      </div>
    </div>
  );
};