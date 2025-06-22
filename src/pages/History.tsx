import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Search, Filter, Download, Trash2, Eye } from 'lucide-react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import toast from 'react-hot-toast';

interface HistoryItem {
  id: string;
  type: string;
  data: any;
  result: any;
  timestamp: string;
}

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('calculation-history') || '[]');
    setHistory(savedHistory);
    setFilteredHistory(savedHistory);
  }, []);

  useEffect(() => {
    let filtered = history;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.data.annualAmount.toString().includes(searchTerm)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    setFilteredHistory(filtered);
  }, [history, searchTerm, filterType]);

  const typeLabels: Record<string, string> = {
    simple: 'Rente viagère simple',
    reversible: 'Rente viagère réversible',
    temporary: 'Rente temporaire',
    deferred: 'Rente différée',
    growing: 'Rente croissante',
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredHistory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredHistory.map(item => item.id));
    }
  };

  const handleDelete = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('calculation-history', JSON.stringify(updatedHistory));
    setSelectedItems(prev => prev.filter(item => item !== id));
    toast.success('Calcul supprimé');
  };

  const handleBulkDelete = () => {
    const updatedHistory = history.filter(item => !selectedItems.includes(item.id));
    setHistory(updatedHistory);
    localStorage.setItem('calculation-history', JSON.stringify(updatedHistory));
    setSelectedItems([]);
    toast.success(`${selectedItems.length} calcul(s) supprimé(s)`);
  };

  const handleExportSelected = (format: 'pdf' | 'excel') => {
    const selectedData = history.filter(item => selectedItems.includes(item.id));
    
    if (selectedData.length === 0) {
      toast.error('Aucun élément sélectionné');
      return;
    }

    const exportData = {
      type: 'bulk_export',
      calculations: selectedData,
      timestamp: new Date().toISOString(),
    };

    if (format === 'pdf') {
      exportToPDF(exportData);
    } else {
      exportToExcel(exportData);
    }

    toast.success(`Export ${format.toUpperCase()} réussi !`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Historique des calculs
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Consultez et gérez vos calculs précédents
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Rechercher dans l'historique..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="all">Tous les types</option>
              <option value="simple">Rente simple</option>
              <option value="reversible">Rente réversible</option>
              <option value="temporary">Rente temporaire</option>
              <option value="deferred">Rente différée</option>
              <option value="growing">Rente croissante</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-900 rounded-lg">
            <span className="text-sm text-primary-700 dark:text-primary-300">
              {selectedItems.length} élément(s) sélectionné(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleExportSelected('pdf')}
                className="btn-secondary text-sm"
              >
                <Download className="w-4 h-4 mr-1" />
                PDF
              </button>
              <button
                onClick={() => handleExportSelected('excel')}
                className="btn-secondary text-sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Excel
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-1 px-3 rounded-md transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="card overflow-hidden">
        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === filteredHistory.length && filteredHistory.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Montant annuel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valeur actuelle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {typeLabels[item.type] || item.type}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.data.gender === 'male' ? 'Homme' : 'Femme'}, {item.data.age} ans
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      €{item.data.annualAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      €{item.result.presentValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(item.timestamp), 'dd MMM yyyy HH:mm', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            const data = {
                              type: item.type,
                              form: item.data,
                              result: item.result,
                              timestamp: item.timestamp,
                            };
                            exportToPDF(data);
                            toast.success('Export PDF réussi !');
                          }}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          title="Exporter en PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun calcul trouvé
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterType !== 'all' 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par effectuer votre premier calcul'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;