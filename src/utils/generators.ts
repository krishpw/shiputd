/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { VoxelData } from '../types';
import { COLORS, CONFIG } from './voxelConstants';

// Helper to prevent overlapping voxels
function setBlock(map: Map<string, VoxelData>, x: number, y: number, z: number, color: number) {
    const rx = Math.round(x);
    const ry = Math.round(y);
    const rz = Math.round(z);
    const key = `${rx},${ry},${rz}`;
    map.set(key, { x: rx, y: ry, z: rz, color });
}

function generateSphere(map: Map<string, VoxelData>, cx: number, cy: number, cz: number, r: number, col: number, sy = 1) {
    const r2 = r * r;
    const xMin = Math.floor(cx - r);
    const xMax = Math.ceil(cx + r);
    const yMin = Math.floor(cy - r * sy);
    const yMax = Math.ceil(cy + r * sy);
    const zMin = Math.floor(cz - r);
    const zMax = Math.ceil(cz + r);

    for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
            for (let z = zMin; z <= zMax; z++) {
                const dx = x - cx;
                const dy = (y - cy) / sy;
                const dz = z - cz;
                if (dx * dx + dy * dy + dz * dz <= r2) {
                    setBlock(map, x, y, z, col);
                }
            }
        }
    }
}

function generateTree(map: Map<string, VoxelData>, x: number, z: number, yBase: number) {
    // Trunk
    for (let i = 0; i < 4; i++) setBlock(map, x, yBase + i, z, COLORS.WOOD);
    // Leaves
    generateSphere(map, x, yBase + 4, z, 2.5, COLORS.UTD_GREEN);
}

export const Generators = {
    UTDCampus: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const FLOOR = CONFIG.FLOOR_Y + 1;
        
        // --- The Mall (Ground) ---
        // Extended mall area with patterned concrete
        for (let z = -40; z <= 40; z++) {
            for (let x = -8; x <= 8; x++) {
                // Main concrete paver pattern (strips)
                const isStrip = Math.abs(z) % 4 === 0;
                setBlock(map, x, FLOOR, z, isStrip ? COLORS.DARK_CONCRETE : COLORS.UTD_CONCRETE);
            }
             // Grass flanking the mall
            for (let x = -22; x <= 22; x++) {
                if (Math.abs(x) > 8) {
                    setBlock(map, x, FLOOR, z, COLORS.UTD_GREEN);
                }
            }
        }

        // --- The Trellis & Plaza (North End) ---
        // Iconic white lattice structure
        for (let z = 15; z <= 35; z += 5) {
             // Columns
             for (let y = 0; y < 8; y++) {
                 setBlock(map, -6, FLOOR + y, z, COLORS.WHITE);
                 setBlock(map, -5, FLOOR + y, z, COLORS.WHITE);
                 setBlock(map, 5, FLOOR + y, z, COLORS.WHITE);
                 setBlock(map, 6, FLOOR + y, z, COLORS.WHITE);
             }
             // Beams across
             for (let x = -7; x <= 7; x++) {
                 setBlock(map, x, FLOOR + 8, z, COLORS.WHITE);
                 setBlock(map, x, FLOOR + 9, z, COLORS.WHITE); // Thicker top beam
             }
        }
        // Longitudinal Canopy beams
        for (let z = 15; z <= 35; z++) {
            for (let x = -6; x <= 6; x += 3) {
                setBlock(map, x, FLOOR + 9, z, COLORS.WHITE);
            }
             setBlock(map, -6, FLOOR + 8, z, COLORS.WHITE);
             setBlock(map, 6, FLOOR + 8, z, COLORS.WHITE);
        }
        
        // --- The Plinth (Fountain) - Center ---
        // Tiered circular fountain at the heart of campus
        for (let x = -10; x <= 10; x++) {
            for (let z = -10; z <= 10; z++) {
                const dist = Math.sqrt(x*x + z*z);
                
                // Outer Basin
                if (dist < 9) {
                    setBlock(map, x, FLOOR, z, COLORS.WATER);
                }
                // Rim
                if (dist < 9.5 && dist > 8.5) {
                    setBlock(map, x, FLOOR + 0.5, z, COLORS.UTD_CONCRETE);
                }
                
                // Inner raised platform / seating
                if (dist < 4) {
                     setBlock(map, x, FLOOR + 1, z, COLORS.UTD_CONCRETE);
                }
            }
        }
        // Fountain Mist particles
        for(let i=0; i<15; i++) {
             setBlock(map, (Math.random()-0.5)*5, FLOOR + 2 + Math.random()*2, (Math.random()-0.5)*5, COLORS.WHITE);
        }

        // --- Student Union (West/Left) ---
        // Modern, mix of brick and glass curtain walls
        for (let z = -15; z <= 15; z++) {
            for (let x = -35; x <= -15; x++) {
                // Front facade check
                const isFront = x === -15;
                const isGlass = isFront && (z % 4 !== 0);
                
                for (let y = 0; y < 14; y++) {
                    // Entrance cutout
                    if (isFront && Math.abs(z) < 4 && y < 6) continue;

                    let color = COLORS.BRICK;
                    if (isGlass && y > 1) color = COLORS.GLASS;
                    if (y === 13) color = COLORS.UTD_ORANGE; // Top trim
                    
                    // Add some windows on side
                    if (x === -35 && y % 4 === 2 && z % 2 === 0) color = COLORS.GLASS;

                    setBlock(map, x, FLOOR + y, z, color);
                }
            }
        }
        // Outdoor Seating Area (SU)
        for (let z = -12; z <= 12; z+=4) {
            for (let x = -14; x <= -11; x+=3) {
                 setBlock(map, x, FLOOR + 1, z, COLORS.WOOD); // Bench/Table
            }
        }

        // --- Library / Founders (East/Right) ---
        // Brutalist concrete aesthetic, tall and imposing
        for (let z = -20; z <= 20; z++) {
             for (let x = 15; x <= 30; x++) {
                 // L-shape cutout logic
                 if (x > 15 || z > -15) { 
                     const height = 18;
                     for (let y = 0; y < height; y++) {
                         let color = COLORS.UTD_CONCRETE;
                         // Vertical slit windows characteristic of brutalism
                         if (x === 15 && z % 3 === 0 && y > 2 && y < 16) color = COLORS.BLACK;
                         // Top accent
                         if (y === height - 1) color = COLORS.UTD_ORANGE;
                         
                         setBlock(map, x, FLOOR + y, z, color);
                     }
                 }
             }
        }

        // --- Engineering / ECS Buildings (South) ---
        // Modern glass and metal/gold tones, Skybridge
        for (let x = -20; x <= 20; x++) {
             for (let z = -45; z <= -32; z++) {
                 // Skybridge logic
                 const isBridge = Math.abs(x) < 10;
                 
                 if (isBridge) {
                     // Only build bridge at height
                     for (let y = 6; y < 11; y++) setBlock(map, x, FLOOR + y, z, COLORS.GLASS);
                     // Supports
                     if (Math.abs(x) === 9 && z === -40) {
                         for(let y=0; y<6; y++) setBlock(map, x, FLOOR+y, z, COLORS.UTD_CONCRETE);
                     }
                 } else {
                     // Main building blocks
                     for (let y = 0; y < 12; y++) {
                         // Gold/Copper vertical fins
                         const isFin = (x % 2 === 0);
                         setBlock(map, x, FLOOR + y, z, isFin ? COLORS.GOLD : COLORS.GLASS);
                     }
                 }
             }
        }

        // --- Landscaping ---
        // Rows of Magnolia/Oak trees along the mall
        for (let z = -35; z <= 35; z+=8) {
            if (Math.abs(z) < 12) continue; // Don't block the plinth view
            generateTree(map, -12, z, FLOOR);
            generateTree(map, 12, z, FLOOR);
        }

        return Array.from(map.values());
    },

    Eagle: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        // Branch
        for (let x = -8; x < 8; x++) {
            const y = Math.sin(x * 0.2) * 1.5;
            const z = Math.cos(x * 0.1) * 1.5;
            generateSphere(map, x, y, z, 1.8, COLORS.WOOD);
            if (Math.random() > 0.7) generateSphere(map, x, y + 2, z + (Math.random() - 0.5) * 3, 1.5, COLORS.GREEN);
        }
        // Body
        const EX = 0, EY = 2, EZ = 2;
        generateSphere(map, EX, EY + 6, EZ, 4.5, COLORS.DARK, 1.4);
        // Chest
        for (let x = EX - 2; x <= EX + 2; x++) for (let y = EY + 4; y <= EY + 9; y++) setBlock(map, x, y, EZ + 3, COLORS.LIGHT);
        // Wings (Rough approximation)
        for (let x of [-4, -3, 3, 4]) for (let y = EY + 4; y <= EY + 10; y++) for (let z = EZ - 2; z <= EZ + 3; z++) setBlock(map, x, y, z, COLORS.DARK);
        // Tail
        for (let x = EX - 2; x <= EX + 2; x++) for (let y = EY; y <= EY + 4; y++) for (let z = EZ - 5; z <= EZ - 3; z++) setBlock(map, x, y, z, COLORS.WHITE);
        // Head
        const HY = EY + 12, HZ = EZ + 1;
        generateSphere(map, EX, HY, HZ, 2.8, COLORS.WHITE);
        generateSphere(map, EX, HY - 2, HZ, 2.5, COLORS.WHITE);
        // Talons
        [[-2, 0], [-2, 1], [2, 0], [2, 1]].forEach(o => setBlock(map, EX + o[0], EY + o[1], EZ, COLORS.TALON));
        // Beak
        [[0, 1], [0, 2], [1, 1], [-1, 1]].forEach(o => setBlock(map, EX + o[0], HY, HZ + 2 + o[1], COLORS.GOLD));
        setBlock(map, EX, HY - 1, HZ + 3, COLORS.GOLD);
        // Eyes
        [[-1.5, COLORS.BLACK], [1.5, COLORS.BLACK]].forEach(o => setBlock(map, EX + o[0], HY + 0.5, HZ + 1.5, o[1]));
        [[-1.5, COLORS.WHITE], [1.5, COLORS.WHITE]].forEach(o => setBlock(map, EX + o[0], HY + 1.5, HZ + 1.5, o[1]));

        return Array.from(map.values());
    },
    // Retain other generators for rebuilding fun
    Cat: (): VoxelData[] => {
        const map = new Map<string, VoxelData>();
        const CY = CONFIG.FLOOR_Y + 1; const CX = 0, CZ = 0;
        generateSphere(map, CX - 3, CY + 2, CZ, 2.2, COLORS.DARK, 1.2);
        generateSphere(map, CX + 3, CY + 2, CZ, 2.2, COLORS.DARK, 1.2);
        for (let y = 0; y < 7; y++) {
            const r = 3.5 - (y * 0.2);
            generateSphere(map, CX, CY + 2 + y, CZ, r, COLORS.DARK);
            generateSphere(map, CX, CY + 2 + y, CZ + 2, r * 0.6, COLORS.WHITE);
        }
        for (let y = 0; y < 5; y++) {
            setBlock(map, CX - 1.5, CY + y, CZ + 3, COLORS.WHITE); setBlock(map, CX + 1.5, CY + y, CZ + 3, COLORS.WHITE);
            setBlock(map, CX - 1.5, CY + y, CZ + 2, COLORS.WHITE); setBlock(map, CX + 1.5, CY + y, CZ + 2, COLORS.WHITE);
        }
        const CHY = CY + 9;
        generateSphere(map, CX, CHY, CZ, 3.2, COLORS.LIGHT, 0.8);
        [[-2, 1], [2, 1]].forEach(side => {
            setBlock(map, CX + side[0], CHY + 3, CZ, COLORS.DARK); setBlock(map, CX + side[0] * 0.8, CHY + 3, CZ + 1, COLORS.WHITE);
            setBlock(map, CX + side[0], CHY + 4, CZ, COLORS.DARK);
        });
        for (let i = 0; i < 12; i++) {
            const a = i * 0.3, tx = Math.cos(a) * 4.5, tz = Math.sin(a) * 4.5;
            if (tz > -2) { setBlock(map, CX + tx, CY, CZ + tz, COLORS.DARK); setBlock(map, CX + tx, CY + 1, CZ + tz, COLORS.DARK); }
        }
        setBlock(map, CX - 1, CHY + 0.5, CZ + 2.5, COLORS.GOLD); setBlock(map, CX + 1, CHY + 0.5, CZ + 2.5, COLORS.GOLD);
        setBlock(map, CX - 1, CHY + 0.5, CZ + 3, COLORS.BLACK); setBlock(map, CX + 1, CHY + 0.5, CZ + 3, COLORS.BLACK);
        setBlock(map, CX, CHY, CZ + 3, COLORS.TALON);
        return Array.from(map.values());
    }
};