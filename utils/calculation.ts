import { Material } from '@/types/besse';

export const MATERIAL_PROPERTIES = {
  paper: {
    basePrice: 180,
    processRate: 0.85,
    wasteRate: 0.15,
    co2Profile: 'Low',
  },
  plastic: {
    basePrice: 350,
    processRate: 0.8,
    wasteRate: 0.2,
    co2Profile: 'High',
  },
  metal: {
    basePrice: 600,
    processRate: 0.9,
    wasteRate: 0.1,
    co2Profile: 'Med',
  },
  glass: {
    basePrice: 120,
    processRate: 0.75,
    wasteRate: 0.25,
    co2Profile: 'Low',
  },
  wood: {
    basePrice: 100,
    processRate: 0.9,
    wasteRate: 0.1,
    co2Profile: 'Med',
  },
};

export const QUALITY_MULTIPLIERS = {
  material: { A: 1.25, B: 1.0, C: 0.5 },
  waste: { B: 0.3, C: 0.2, F: 0.1 },
};

export const calculateMaterialValue = (material: Material): number => {
  const materialProps = MATERIAL_PROPERTIES[material.type];
  if (!materialProps) {
    throw new Error(`Invalid material type: ${material.type}`);
  }
  const basePrice = materialProps.basePrice;
  const qualityMultiplier = material.materialOrWaste
    ? QUALITY_MULTIPLIERS.material[material.quality as 'A' | 'B' | 'C']
    : QUALITY_MULTIPLIERS.waste[material.quality as 'B' | 'C' | 'F'];
  return basePrice * material.mass * qualityMultiplier;
};
