import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Calculator as CalcIcon, Download, Save, Info, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';
import { exportToPDF, exportToExcel, exportToJSON } from '../utils/exportUtils';
import { calculateAnnuity } from '../utils/actuarialCalculations';

interface CalculationForm {
  annuityType: string;
  age: number;
  gender: string;
  interestRate: number;
  annualAmount: number;
  mortalityTable: string;
  duration?: number;
  deferralPeriod?: number;
  growthRate?: number;
  reversalRate?: number;
  spouseAge?: number;
}

interface CalculationResult {
  presentValue: number;
  monthlyPayment: number;
  totalPayments: number;
  lifeExpectancy: number;
  projections: Array<{
    year: number;
    payment: number;
    cumulativePayment: number;
    probability: number;
  }>;
}

const Calculator: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CalculationForm>({
    defaultValues: {
      annuityType: searchParams.get('type') || 'simple',
      age: 65,
      gender: 'male',
      interestRate: 2.5,
      annualAmount: 12000,
      mortalityTable: 'TGH05',
      duration: 20,
      deferralPeriod: 0,
      growthRate: 0,
      reversalRate: 60,
      spouseAge: 62,
    }
  });

  const annuityType = watch('annuityType');

  const annuityTypes = [
    { value: 'simple', label: 'Rente viagère simple', description: 'Rente versée jusqu\'au décès' },
    { value: 'reversible', label: 'Rente viagère réversible', description: 'Rente avec réversion au conjoint' },
    { value: 'temporary', label: 'Rente temporaire', description: 'Rente versée pendant une durée limitée' },
    { value: 'deferred', label: 'Rente différée', description: 'Rente commençant après une période d\'attente' },
    { value: 'growing', label: 'Rente croissante', description: 'Rente avec augmentation annuelle' },
  ];

  const mortalityTables = [
    { value: 'TGH05', label: 'TGH05 - Table générationnelle hommes' },
    { value: 'TGF05', label: 'TGF05 - Table générationnelle femmes' },
    { value: 'TV88-90', label: 'TV88-90 - Table viagère unisexe' },
    { value: 'TH00-02', label: 'TH00-02 - Table hommes 2000-2002' },
    { value: 'TF00-02', label: 'TF00-02 - Table femmes 2000-2002' },
  ];

  const onSubmit = async (data: CalculationForm) => {
    setLoading(true);
    try {
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const calculationResult = calculateAnnuity(data);
      setResult(calculationResult);
      
      // Save to history
      const historyItem = {
        id: Date.now().toString(),
        type: data.annuityType,
        data,
        result: calculationResult,
        timestamp: new Date().toISOString(),
      };
      
      const history = JSON.parse(localStorage.getItem('calculation-history') || '[]');
      history.unshift(historyItem);
      localStorage.setItem('calculation-history', JSON.stringify(history.slice(0, 50))); // Keep last 50
      
      toast.success('Calcul effectué avec succès !');
    } catch (error) {
      toast.error('Erreur lors du calcul');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'json') => {
    if (!result) return;
    
    const data = {
      type: annuityType,
      form: watch(),
      result,
      timestamp: new Date().toISOString(),
    };
    
    switch (format) {
      case 'pdf':
        exportToPDF(data);
        break;
      case 'excel':
        exportToExcel(data);
        break;
      case 'json':
        exportToJSON(data);
        break;
    }
    
    toast.success(`Export ${format.toUpperCase()} réussi !`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Calculateur de rentes
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Calculez vos rentes actuarielles avec précision
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Annuity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de rente
                </label>
                <select {...register('annuityType')} className="input-field">
                  {annuityTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {annuityTypes.find(t => t.value === annuityType)?.description}
                </p>
              </div>

              {/* Basic Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Âge
                  </label>
                  <input
                    {...register('age', { required: 'Âge requis', min: 18, max: 100 })}
                    type="number"
                    className="input-field"
                  />
                  {errors.age && (
                    <p className="mt-1 text-xs text-red-600">{errors.age.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sexe
                  </label>
                  <select {...register('gender')} className="input-field">
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taux d'intérêt technique (%)
                </label>
                <input
                  {...register('interestRate', { required: 'Taux requis', min: 0, max: 10 })}
                  type="number"
                  step="0.1"
                  className="input-field"
                />
                {errors.interestRate && (
                  <p className="mt-1 text-xs text-red-600">{errors.interestRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Montant annuel (€)
                </label>
                <input
                  {...register('annualAmount', { required: 'Montant requis', min: 1 })}
                  type="number"
                  className="input-field"
                />
                {errors.annualAmount && (
                  <p className="mt-1 text-xs text-red-600">{errors.annualAmount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Table de mortalité
                </label>
                <select {...register('mortalityTable')} className="input-field">
                  {mortalityTables.map(table => (
                    <option key={table.value} value={table.value}>
                      {table.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Fields */}
              {annuityType === 'temporary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Durée (années)
                  </label>
                  <input
                    {...register('duration', { min: 1, max: 50 })}
                    type="number"
                    className="input-field"
                  />
                </div>
              )}

              {annuityType === 'deferred' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Période de différé (années)
                  </label>
                  <input
                    {...register('deferralPeriod', { min: 0, max: 30 })}
                    type="number"
                    className="input-field"
                  />
                </div>
              )}

              {annuityType === 'growing' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Taux de croissance (%)
                  </label>
                  <input
                    {...register('growthRate', { min: 0, max: 10 })}
                    type="number"
                    step="0.1"
                    className="input-field"
                  />
                </div>
              )}

              {annuityType === 'reversible' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Taux de réversion (%)
                    </label>
                    <input
                      {...register('reversalRate', { min: 0, max: 100 })}
                      type="number"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Âge du conjoint
                    </label>
                    <input
                      {...register('spouseAge', { min: 18, max: 100 })}
                      type="number"
                      className="input-field"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Calcul en cours...
                  </div>
                ) : (
                  <>
                    <CalcIcon className="w-4 h-4 mr-2" />
                    Calculer
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Valeur actuelle
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        €{result.presentValue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalcIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Paiement mensuel
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        €{result.monthlyPayment.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Info className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Espérance de vie
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {result.lifeExpectancy} ans
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Download className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total versé
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        €{result.totalPayments.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Évolution des paiements
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={result.projections}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`€${value.toLocaleString()}`, 'Paiement']}
                        labelFormatter={(label) => `Année ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="payment" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Paiements cumulés
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={result.projections.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`€${value.toLocaleString()}`, 'Cumulé']}
                        labelFormatter={(label) => `Année ${label}`}
                      />
                      <Bar dataKey="cumulativePayment" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Export Actions */}
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Exporter les résultats
                </h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="btn-secondary inline-flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="btn-secondary inline-flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="btn-secondary inline-flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    JSON
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-12">
              <div className="text-center">
                <CalcIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Prêt à calculer
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Remplissez le formulaire et cliquez sur "Calculer" pour voir les résultats
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calculator;