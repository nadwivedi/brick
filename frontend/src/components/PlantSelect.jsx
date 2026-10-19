import { defaultPlantId, pickablePlants, hasManyPlants } from '../lib/plants';

/**
 * Plant picker for entry forms. Hidden while the business has a single plant (entries then go
 * to the default plant); shown with the default plant marked once there are more.
 * - allLabel: adds a "no particular plant" option with this label (e.g. "All Plants" for expenses)
 */
export default function PlantSelect({ plants, value, onChange, allLabel, className = '' }) {
  if (!hasManyPlants(plants)) return null;
  const defaultId = defaultPlantId(plants);
  return (
    <div className={className}>
      <label className="label">Plant</label>
      <select className="input" value={value} onChange={e => onChange(e.target.value)}>
        {allLabel ? <option value="">{allLabel}</option> : !value && <option value="">Select Plant</option>}
        {pickablePlants(plants, value).map(p => (
          <option key={p._id} value={p._id}>{p.name}{p._id === defaultId ? ' (Main)' : ''}</option>
        ))}
      </select>
    </div>
  );
}
