# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Landing Page Particle Background

The immersive background on the landing page is generated using Three.js and can be configured.

### Running the Project

To run the development server:

```bash
npm run dev
```

The landing page will be available at `http://localhost:9002`.

### Tuning Particle Effects

The particle background and its behavior can be customized by passing props to the `<ParticleBackground />` component located in `src/components/landing/hero.tsx`.

Available props in `src/components/ui/ParticleBackground.tsx`:

- `particleCount` (number, default: `5000`): The total number of small, ambient particles. This number is automatically reduced on mobile devices.
- `clusterCount` (number, default: `50`): The number of larger, glowing cluster particles. Also reduced on mobile.
- `particleColor` (string, default: `'#FFFF80'`): The color of the small particles.
- `clusterColor` (string, default: `'#FFD700'`): The color of the larger cluster particles.
- `baseSpeed` (number, default: `0.05`): Controls the floating speed of the base particles.
- `clusterSpeed` (number, default: `0.1`): Controls the floating speed of the cluster particles.

Example usage in `src/components/landing/hero.tsx`:

```tsx
<ParticleBackground 
  particleCount={8000} 
  clusterCount={70}
  particleColor="#E0FFFF" // Light cyan
/>
```

### Disabling Heavy Effects

- **Parallax and Animations**: These effects are automatically disabled if a user's system has the `prefers-reduced-motion` accessibility setting enabled.
- **Cursor Effects**: The cursor halo and ripple effects are also disabled with `prefers-reduced-motion`.
- **WebGL Fallback**: If a user's browser does not support WebGL, the interactive particle background will be replaced by a lightweight static CSS and SVG background.
