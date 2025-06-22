import React from 'react';
import { Link } from 'react-router-dom';
import { Calculator, TrendingUp, Clock, FileText, BarChart3, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { name: 'Calculs effectués', value: '127', icon: Calculator, color: 'text-blue-600' },
    { name: 'Rentes calculées', value: '€2.4M', icon: TrendingUp, color: 'text-green-600' },
    { name: 'Temps moyen', value: '2.3s', icon: Clock, color: 'text-yellow-600' },
    { name: 'Rapports générés', value: '45', icon: FileText, color: 'text-purple-600' },
  ];

  const recentCalculations = [
    { id: 1, type: 'Rente viagère simple', amount: '€125,000', date: '2024-01-15', status: 'Terminé' },
    { id: 2, type: 'Rente réversible', amount: '€89,500', date: '2024-01-14', status: 'Terminé' },
    { id: 3, type: 'Rente temporaire', amount: '€67,200', date: '2024-01-14', status: 'En cours' },
    { id: 4, type: 'Rente différée', amount: '€156,800', date: '2024-01-13', status: 'Terminé' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vue d'ensemble de vos calculs actuariels
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/calculator"
            className="btn-primary inline-flex items-center"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Nouveau calcul
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Actions rapides
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/calculator?type=simple"
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors duration-200"
            >
              <Calculator className="w-8 h-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Rente simple</span>
            </Link>
            <Link
              to="/calculator?type=reversible"
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors duration-200"
            >
              <Users className="w-8 h-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Rente réversible</span>
            </Link>
            <Link
              to="/calculator?type=temporary"
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors duration-200"
            >
              <Clock className="w-8 h-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Rente temporaire</span>
            </Link>
            <Link
              to="/calculator?type=deferred"
              className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors duration-200"
            >
              <TrendingUp className="w-8 h-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Rente différée</span>
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Calculs récents
            </h3>
            <Link
              to="/history"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {recentCalculations.map((calc) => (
              <div key={calc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {calc.type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {calc.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {calc.amount}
                  </p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    calc.status === 'Terminé' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {calc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart placeholder */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Évolution des calculs
        </h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">Graphique des tendances</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Disponible avec plus de données</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;