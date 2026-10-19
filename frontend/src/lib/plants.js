// Plants come from /plants with the default plant first

export const defaultPlantId = (plants) => (plants.find(p => p.isDefault) || plants[0])?._id || '';

// Plants that can be picked: active ones, plus the one already chosen (e.g. on an old entry)
export const pickablePlants = (plants, currentId) => plants.filter(p => p.isActive !== false || p._id === currentId);

// Plant fields and filters only matter once a business runs more than one plant
export const hasManyPlants = (plants) => plants.filter(p => p.isActive !== false).length > 1;
