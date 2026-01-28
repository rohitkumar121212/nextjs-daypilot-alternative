import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const roomTypes = ['Deluxe', 'Butterfly', 'Strawberry', 'Premium', 'Standard', 'Suite', 'Executive', 'Royal', 'Garden', 'Ocean'];
const roomConfigs = ['1-B 1-N', '2-B 1-N', '1-B 2-N', '2-B 2-N', '3-B 2-N'];

function generateResources() {
  const resources = [];
  let roomCounter = 1;
  
  // Generate 80 groups with 10 rooms each = 800 total rooms
  for (let groupId = 1; groupId <= 80; groupId++) {
    const roomType = roomTypes[groupId % roomTypes.length];
    const children = [];
    
    // Generate 10 rooms per group
    for (let roomInGroup = 1; roomInGroup <= 10; roomInGroup++) {
      const config = roomConfigs[roomCounter % roomConfigs.length];
      children.push({
        id: `R${roomCounter}`,
        name: `Room-${roomCounter} ${config}`,
        cleaning: Math.floor(Math.random() * 3) + 1 // 1-3 hours
      });
      roomCounter++;
    }
    
    resources.push({
      name: `${roomType} Block ${groupId}`,
      id: `G${groupId}`,
      expanded: false, // Keep collapsed for performance
      children
    });
  }
  
  return resources;
}

const resources = generateResources();
const outputPath = path.join(__dirname, 'resources.json');

fs.writeFileSync(outputPath, JSON.stringify(resources, null, 2));
console.log(`Generated ${resources.length} groups with ${resources.reduce((sum, g) => sum + g.children.length, 0)} total rooms`);