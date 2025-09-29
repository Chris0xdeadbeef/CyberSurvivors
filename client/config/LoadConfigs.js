export async function loadConfigs(configNames) {
  const results = {};

  for (const name of configNames) {
    try {
      const response = await fetch(`/config/${name}`);
      if (!response.ok) throw new Error(`Erreur lors du chargement de ${name}`);
      results[name] = await response.json();
    } catch (err) {
      console.error(`❌ Impossible de charger la config "${name}" :`, err);
    }
  }

  return results;
}
