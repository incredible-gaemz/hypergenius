/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WeatherId } from '../game/fishingLogic';

interface PixelWeatherIconProps {
  weatherId: WeatherId;
  size?: number; // default 16
  className?: string;
}

/**
 * Authentic 16x16 retro pixel-art weather icons rendered with crispEdges SVG.
 */
export const PixelWeatherIcon: React.FC<PixelWeatherIconProps> = ({
  weatherId,
  size = 16,
  className = '',
}) => {
  switch (weatherId) {
    case 'clear':
      // Golden pixel sun with cardinal and diagonal ray spikes
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="crispEdges"
          className={`shrink-0 inline-block align-middle ${className}`}
          aria-label="Clear & Sunny"
        >
          {/* Cardinal Rays */}
          <rect x="7" y="0" width="2" height="2" fill="#f59e0b" />
          <rect x="7" y="14" width="2" height="2" fill="#f59e0b" />
          <rect x="0" y="7" width="2" height="2" fill="#f59e0b" />
          <rect x="14" y="7" width="2" height="2" fill="#f59e0b" />

          {/* Diagonal Corner Rays */}
          <rect x="2" y="2" width="2" height="2" fill="#d97706" />
          <rect x="12" y="2" width="2" height="2" fill="#d97706" />
          <rect x="2" y="12" width="2" height="2" fill="#d97706" />
          <rect x="12" y="12" width="2" height="2" fill="#d97706" />

          {/* Outer Sun Body Border */}
          <rect x="5" y="4" width="6" height="8" fill="#d97706" />
          <rect x="4" y="5" width="8" height="6" fill="#d97706" />

          {/* Core Sun Body */}
          <rect x="5" y="5" width="6" height="6" fill="#fbbf24" />

          {/* Specular Glint */}
          <rect x="6" y="6" width="2" height="2" fill="#fef08a" />
          <rect x="8" y="8" width="2" height="2" fill="#f59e0b" />
        </svg>
      );

    case 'overcast':
      // Pixel overcast cloud bank with layered silver/slate puffs
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="crispEdges"
          className={`shrink-0 inline-block align-middle ${className}`}
          aria-label="Overcast"
        >
          {/* Back cloud silhouette */}
          <rect x="7" y="2" width="5" height="4" fill="#475569" />
          <rect x="6" y="3" width="7" height="4" fill="#64748b" />

          {/* Main Front Cloud Base and Puffs */}
          <rect x="3" y="6" width="10" height="6" fill="#334155" />
          <rect x="2" y="7" width="12" height="4" fill="#334155" />

          {/* Main Cloud Body Highlighting */}
          <rect x="3" y="7" width="10" height="4" fill="#94a3b8" />
          <rect x="4" y="5" width="4" height="4" fill="#cbd5e1" />
          <rect x="7" y="4" width="4" height="4" fill="#e2e8f0" />
          <rect x="10" y="6" width="3" height="3" fill="#cbd5e1" />

          {/* Cloud Highlights and Shadows */}
          <rect x="4" y="5" width="2" height="1" fill="#f8fafc" />
          <rect x="7" y="4" width="3" height="1" fill="#f8fafc" />
          <rect x="2" y="10" width="12" height="1" fill="#475569" />
          <rect x="3" y="11" width="10" height="1" fill="#1e293b" />
        </svg>
      );

    case 'rain':
      // Pixel rain cloud with falling cyan droplets
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="crispEdges"
          className={`shrink-0 inline-block align-middle ${className}`}
          aria-label="Rain"
        >
          {/* Dark Storm Cloud Body */}
          <rect x="3" y="3" width="10" height="5" fill="#334155" />
          <rect x="2" y="4" width="12" height="4" fill="#334155" />
          <rect x="5" y="2" width="5" height="3" fill="#475569" />
          <rect x="4" y="3" width="7" height="4" fill="#64748b" />
          <rect x="5" y="2" width="3" height="1" fill="#94a3b8" />
          <rect x="3" y="7" width="10" height="1" fill="#1e293b" />

          {/* Pixel Rain Drops (diagonal / staggered) */}
          {/* Drop 1 */}
          <rect x="3" y="10" width="1" height="2" fill="#38bdf8" />
          <rect x="2" y="12" width="1" height="2" fill="#0284c7" />

          {/* Drop 2 */}
          <rect x="7" y="9" width="1" height="2" fill="#38bdf8" />
          <rect x="6" y="12" width="1" height="2" fill="#0284c7" />
          <rect x="5" y="14" width="1" height="1" fill="#38bdf8" />

          {/* Drop 3 */}
          <rect x="11" y="10" width="1" height="2" fill="#38bdf8" />
          <rect x="10" y="13" width="1" height="2" fill="#0284c7" />

          {/* Drop 4 */}
          <rect x="14" y="11" width="1" height="2" fill="#0284c7" />
        </svg>
      );

    case 'fog':
      // Pixel mist fog: horizontal layered misty bands
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="crispEdges"
          className={`shrink-0 inline-block align-middle ${className}`}
          aria-label="Misty Fog"
        >
          {/* Band 1 (Top) */}
          <rect x="3" y="2" width="8" height="2" fill="#94a3b8" />
          <rect x="12" y="2" width="2" height="2" fill="#64748b" />

          {/* Band 2 */}
          <rect x="1" y="5" width="4" height="2" fill="#64748b" />
          <rect x="6" y="5" width="9" height="2" fill="#cbd5e1" />

          {/* Band 3 */}
          <rect x="2" y="8" width="7" height="2" fill="#e2e8f0" />
          <rect x="10" y="8" width="5" height="2" fill="#94a3b8" />

          {/* Band 4 */}
          <rect x="0" y="11" width="9" height="2" fill="#94a3b8" />
          <rect x="11" y="11" width="4" height="2" fill="#64748b" />

          {/* Band 5 (Bottom) */}
          <rect x="3" y="14" width="8" height="1" fill="#475569" />
          <rect x="12" y="14" width="2" height="1" fill="#334155" />
        </svg>
      );

    case 'windy':
      // Pixel windy gusts with curled tail spirals
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          shapeRendering="crispEdges"
          className={`shrink-0 inline-block align-middle ${className}`}
          aria-label="Windy"
        >
          {/* Top Gust Line with Curl */}
          <rect x="1" y="3" width="9" height="2" fill="#38bdf8" />
          <rect x="10" y="2" width="3" height="2" fill="#38bdf8" />
          <rect x="13" y="3" width="2" height="3" fill="#0284c7" />
          <rect x="11" y="5" width="2" height="2" fill="#0284c7" />

          {/* Middle Gust Line with Curl */}
          <rect x="0" y="8" width="11" height="2" fill="#7dd3fc" />
          <rect x="11" y="7" width="3" height="2" fill="#7dd3fc" />
          <rect x="14" y="8" width="2" height="3" fill="#38bdf8" />
          <rect x="12" y="10" width="2" height="2" fill="#0284c7" />

          {/* Bottom Gust Stream */}
          <rect x="2" y="13" width="8" height="2" fill="#38bdf8" />
          <rect x="11" y="12" width="2" height="2" fill="#0284c7" />
        </svg>
      );

    default:
      return null;
  }
};
