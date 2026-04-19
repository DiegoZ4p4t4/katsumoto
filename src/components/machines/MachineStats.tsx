interface MachineStatsProps {
  totalModels: number;
  modelsWithProducts: number;
  totalCompatibilities: number;
}

export function MachineStats({ totalModels, modelsWithProducts, totalCompatibilities }: MachineStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl border border-orange-200 dark:border-orange-800">
        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Total Modelos</p>
        <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{totalModels}</p>
      </div>
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Con Repuestos</p>
        <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{modelsWithProducts}</p>
      </div>
      <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Asociaciones</p>
        <p className="text-xl font-bold text-purple-700 dark:text-purple-300">{totalCompatibilities}</p>
      </div>
    </div>
  );
}
