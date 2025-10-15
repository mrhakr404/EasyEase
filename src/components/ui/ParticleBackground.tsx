"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface ParticleBackgroundProps {
  particleCount?: number;
  clusterCount?: number;
  particleColor?: string;
  clusterColor?: string;
  baseSpeed?: number;
  clusterSpeed?: number;
}

export function ParticleBackground({
  particleCount = 5000,
  clusterCount = 50,
  particleColor = '#FFFF80', // Soft yellow
  clusterColor = '#FFD700', // Gold
  baseSpeed = 0.05,
  clusterSpeed = 0.1,
}: ParticleBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    
    setIsReducedMotion(reducedMotionQuery.matches);
    setIsMobile(mobileQuery.matches);
    
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    reducedMotionQuery.addEventListener('change', handleMotionChange);
    mobileQuery.addEventListener('change', handleMobileChange);

    return () => {
      reducedMotionQuery.removeEventListener('change', handleMotionChange);
      mobileQuery.removeEventListener('change', handleMobileChange);
    };
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isReducedMotion) {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
  }, [isReducedMotion]);

  useEffect(() => {
    if (isClient) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [handleMouseMove, isClient]);
  
  useEffect(() => {
    if (!mountRef.current || !isClient) return;

    const finalParticleCount = isMobile ? particleCount / 4 : particleCount;
    const finalClusterCount = isMobile ? clusterCount / 4 : clusterCount;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(finalParticleCount * 3);
    const particlesVelocities = new Float32Array(finalParticleCount);

    for (let i = 0; i < finalParticleCount; i++) {
      particlesPositions[i * 3] = (Math.random() - 0.5) * 15;
      particlesPositions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      particlesPositions[i * 3 + 2] = (Math.random() - 0.5) * 15;
      particlesVelocities[i] = Math.random() * baseSpeed * 0.1 + 0.001;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: particleColor,
      size: 0.015,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    const clustersGeometry = new THREE.BufferGeometry();
    const clustersPositions = new Float32Array(finalClusterCount * 3);
    const clustersVelocities = new Float32Array(finalClusterCount);

    for (let i = 0; i < finalClusterCount; i++) {
        clustersPositions[i * 3] = (Math.random() - 0.5) * 10;
        clustersPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        clustersPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        clustersVelocities[i] = Math.random() * clusterSpeed * 0.1 + 0.001;
    }
    clustersGeometry.setAttribute('position', new THREE.BufferAttribute(clustersPositions, 3));
    const clustersMaterial = new THREE.PointsMaterial({
      color: clusterColor,
      size: isMobile ? 0.08 : 0.12,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    const clusters = new THREE.Points(clustersGeometry, clustersMaterial);
    scene.add(clusters);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener('resize', handleResize);

    let frameId: number;
    
    const animate = () => {
      for (let i = 0; i < finalParticleCount; i++) {
        particlesPositions[i * 3 + 1] -= particlesVelocities[i];
        if (particlesPositions[i * 3 + 1] < -7.5) particlesPositions[i * 3 + 1] = 7.5;
      }
      particlesGeometry.attributes.position.needsUpdate = true;
      
      for (let i = 0; i < finalClusterCount; i++) {
        clustersPositions[i * 3 + 1] -= clustersVelocities[i];
        if (clustersPositions[i * 3 + 1] < -5) clustersPositions[i * 3 + 1] = 5;
      }
      clustersGeometry.attributes.position.needsUpdate = true;
      
      if (!isReducedMotion) {
        const parallaxX = mouse.current.x * 0.5;
        const parallaxY = mouse.current.y * 0.5;
        camera.position.x += (parallaxX - camera.position.x) * 0.02;
        camera.position.y += (parallaxY - camera.position.y) * 0.02;
        camera.lookAt(scene.position);
      }
      
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      clustersGeometry.dispose();
      clustersMaterial.dispose();
    };
  }, [isClient, isReducedMotion, isMobile, particleCount, clusterCount, particleColor, clusterColor, baseSpeed, clusterSpeed]);

  return <div ref={mountRef} className="absolute top-0 left-0 w-full h-full -z-10" />;
}
