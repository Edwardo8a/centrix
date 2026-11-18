const ResourceRequestCategory = Object.freeze({
  MATERIAL: 'Material',
  ECONOMICO: 'Economico',
  MOBILIARIO: 'Mobiliario',
  PAPELERIA: 'Papeleria',
  EQUIPO: 'Equipo',
  OTRO: 'Otro'
});

const VALID_CATEGORIES = Object.values(ResourceRequestCategory);

function normalizeResourceRequestCategory(category) {
  if (!category || typeof category !== 'string') return null;

  const cleaned = category
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (cleaned === 'material') return ResourceRequestCategory.MATERIAL;
  if (cleaned === 'economico') return ResourceRequestCategory.ECONOMICO;
  if (cleaned === 'mobiliario') return ResourceRequestCategory.MOBILIARIO;
  if (cleaned === 'papeleria') return ResourceRequestCategory.PAPELERIA;
  if (cleaned === 'equipo') return ResourceRequestCategory.EQUIPO;
  if (cleaned === 'otro') return ResourceRequestCategory.OTRO;

  return null;
}

module.exports = {
  ResourceRequestCategory,
  VALID_CATEGORIES,
  normalizeResourceRequestCategory
};
