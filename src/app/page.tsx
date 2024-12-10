'use client';
import { useState, useEffect } from 'react';
import { 
  Table,
  Database,
  Code,
  Search,
  User,
  RefreshCw,
  BarChart2,
  Activity,
  Clock,
  TrendingUp,
  Heart,
  Github,
  ChevronDown
} from 'lucide-react';

// Update API base URL to use your CORS proxy worker
const ACCOUNT_ID = process.env.NEXT_PUBLIC_ACCOUNT_ID;
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN;
const CORS_PROXY_URL = process.env.NEXT_PUBLIC_CORS_PROXY_URL;

// Update getAuthHeaders to include all necessary headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${API_TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'CF-Account-ID': ACCOUNT_ID
});

// Add error boundary component
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-red-500 bg-red-100 border border-red-400 rounded p-3 mb-4">
    <p className="text-sm">{message}</p>
  </div>
);

// Add constant for system tables
const SYSTEM_TABLES = ['_cf_KV', 'sqlite_sequence', 'sqlite_stat1'];

// Add new types for metrics
interface DatabaseMetrics {
  totalTables: number;
  totalRows: number;
  databaseSize: number;
  lastModified: string;
  queryCount: number;
}

interface TableData {
  name: string;
  // Add other properties if needed
}

// Update the table content section
const TableContent = ({ tableName, data, loading, error }: {
  tableName: string;
  data: any[];
  loading: boolean;
  error: string | null;
}) => {
  const isSystemTable = SYSTEM_TABLES.includes(tableName);

  if (isSystemTable) {
    return (
      <div className="bg-[#1A1A1A] rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#F8F9FA]">{tableName}</h2>
            <p className="text-sm text-yellow-500">Cloudflare System Table</p>
          </div>
        </div>
        
        <div className="bg-[#2E2E2E] rounded-lg p-4">
          <p className="text-[#F8F9FA] text-sm mb-3">
            This is a Cloudflare system table that cannot be accessed directly. These tables are used internally by Cloudflare to manage the database.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-[#F8F9FA]/70">
              <Clock className="w-4 h-4" />
              <span>Used for internal operations</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-[#F8F9FA]/70">
              <Activity className="w-4 h-4" />
              <span>Managed automatically by Cloudflare</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-[#F8F9FA]/70">
              <BarChart2 className="w-4 h-4" />
              <span>Contains system metadata</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isSystemTable) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className={`bg-[#1A1A1A] rounded-lg p-6 h-full transition-all duration-200 ${
      loading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'
    }`}>
      <div className="flex flex-col h-full">
        {/* Table Header */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[#F8F9FA]">{tableName}</h2>
          <p className="text-sm text-[#F8F9FA]/70">
            {data.length} records loaded
          </p>
        </div>

        {/* Table Container with Scrollbars */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <table className="w-full text-sm text-[#F8F9FA]">
              <thead className="sticky top-0 bg-[#1A1A1A] z-10">
                <tr className="border-b border-[#2E2E2E]">
                  {data && data.length > 0 && Object.keys(data[0]).map((column) => (
                    <th 
                      key={column} 
                      className="text-left py-3 px-4 text-[#4B5563] font-medium whitespace-nowrap"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data && data.length > 0 ? (
                  data.map((row, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-[#2E2E2E] hover:bg-[#2E2E2E]/50 transition-colors"
                    >
                      {Object.values(row).map((value: any, i) => (
                        <td 
                          key={i} 
                          className="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]"
                          title={value?.toString() || ''}
                        >
                          {value?.toString() || ''}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td 
                      colSpan={data?.[0] ? Object.keys(data[0]).length : 1} 
                      className="py-8 text-center text-[#4B5563]"
                    >
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Database className="w-8 h-8 text-[#2E2E2E]" />
                        <span className="text-sm">No data available</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  // Existing states
  const [selectedDb, setSelectedDb] = useState<string>('DB');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [view, setView] = useState<'tables' | 'query' | 'analytics'>('tables');
  const [savedQueries, setSavedQueries] = useState<string[]>([
    "SELECT * FROM users;",
    "SELECT * FROM orders WHERE status = 'pending';",
    "SELECT name, email FROM customers;"
  ]);
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

  // Add new states for API data
  const [tables, setTables] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add new state for metrics
  const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Add new state for databases
  const [databases, setDatabases] = useState<any[]>([]);
  const [databasesLoading, setDatabasesLoading] = useState(false);

  // Add state for pagination
  const [recordsToShow, setRecordsToShow] = useState(16); // Initial number of records to show

  // Add loading state for refresh button
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update constants
  const BASE_API_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1`;

  // Add new state for database IDs
  const [databaseIds, setDatabaseIds] = useState<{[key: string]: string}>({});

  // Add new states for SQL query functionality
  const [queryInput, setQueryInput] = useState<string>('');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('queryHistory');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Add new state for search
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Add function to filter tables
  const filteredTables = tables.filter(table => 
    table.name.toLowerCase().includes(tableSearchQuery.toLowerCase())
  );

  // Update fetch functions to use the CORS proxy
  const fetchTables = async (dbName: string) => {
    const dbId = databaseIds[dbName];
    if (!dbId) {
      setError('Database ID not found');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching tables for database:', dbName, 'with ID:', dbId);

      const response = await fetch(`${CORS_PROXY_URL}/query`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dbId,
          sql: "SELECT name FROM sqlite_master WHERE type='table'"
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received table data:', data);

      // Handle the nested response structure
      if (data.result && data.result[0] && data.result[0].results) {
        const tables = data.result[0].results.map((row: any) => ({ name: row.name }));
        console.log('Processed tables:', tables);
        setTables(tables);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      setError('Failed to fetch tables. Please try again later.');
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string, dbName: string) => {
    const dbId = databaseIds[dbName];
    if (!dbId) {
      setError('Database ID not found');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${CORS_PROXY_URL}/query`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dbId,
          sql: `SELECT * FROM ${tableName} LIMIT ${recordsToShow} OFFSET 0`
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received table data:', data);

      // Handle the nested response structure
      if (data.result && data.result[0] && data.result[0].results) {
        setTableData(data.result[0].results);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
      setError('Failed to fetch table data. Please try again later.');
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async (query: string) => {
    const dbId = databaseIds[selectedDb];
    if (!dbId) {
      setError('Database ID not found');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${CORS_PROXY_URL}/query`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dbId,
          sql: query
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setError(null);
      return data.result;
    } catch (err) {
      setError('Failed to execute query. Please try again later.');
      console.error('Error executing query:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update loadMoreRecords function to use CORS proxy
  const loadMoreRecords = () => {
    if (!selectedTable || !selectedDb) return;
    
    const dbId = databaseIds[selectedDb];
    if (!dbId) {
      setError('Database ID not found');
      return;
    }

    const currentOffset = tableData.length;
    const fetchMoreData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${CORS_PROXY_URL}/query`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            dbId,
            sql: `SELECT * FROM ${selectedTable} LIMIT ${recordsToShow} OFFSET ${currentOffset}`
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Handle the nested response structure
        if (data.result && data.result[0] && data.result[0].results) {
          setTableData(prev => [...prev, ...data.result[0].results]);
          setError(null);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching more records:', error);
        setError('Failed to load more records. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMoreData();
  };

  // Update the table selection handler
  const handleTableSelect = (tableName: string) => {
    if (!tableName) return; // Ensure tableName is valid

    setSelectedTable(tableName);
    setTableData([]); // Clear existing data
    setRecordsToShow(16); // Reset pagination
    fetchTableData(tableName, selectedDb); // Pass the current selectedDb
  };

  // Update the refresh button handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchTables(selectedDb);
      if (selectedTable) {
        await fetchTableData(selectedTable, selectedDb);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Update the table list rendering to show system table indicators
  const TableListItem = ({ table, isSelected, onSelect }: { 
    table: string; 
    isSelected: boolean; 
    onSelect: (table: string) => void;
  }) => {
    const isSystemTable = SYSTEM_TABLES.includes(table);

    return (
      <button
        onClick={() => onSelect(table)}
        className={`w-full px-2 py-1.5 text-sm rounded-md flex items-center space-x-2 transition-all duration-200 ease-in-out ${
          isSelected 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-lg'
            : 'text-[#F8F9FA] hover:bg-[#2E2E2E]'
        }`}
      >
        <Table className="w-4 h-4 flex-shrink-0" />
        <span className="font-normal flex-1 text-left">{table}</span>
        {isSystemTable && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
            System
          </span>
        )}
      </button>
    );
  };

  // Add function to fetch metrics
  const fetchMetrics = async () => {
    const dbId = databaseIds[selectedDb];
    if (!dbId) {
      setError('Database ID not found');
      return;
    }

    try {
      setMetricsLoading(true);
      
      // Get tables list
      const tablesResponse = await fetch(`${CORS_PROXY_URL}/query`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dbId,
          sql: "SELECT name FROM sqlite_master WHERE type='table'"
        })
      });

      if (!tablesResponse.ok) {
        throw new Error('Failed to fetch tables');
      }

      const tablesData = await tablesResponse.json();
      const tables = tablesData.result[0].results;
      let totalSize = tablesData.result[0].meta.size_after || 0; // Get size from meta
      
      // Get row counts for each table
      let totalRows = 0;
      for (const table of tables) {
        if (!SYSTEM_TABLES.includes(table.name)) {
          const countResponse = await fetch(`${CORS_PROXY_URL}/query`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              dbId,
              sql: `SELECT COUNT(*) as count FROM "${table.name}"`
            })
          });

          if (countResponse.ok) {
            const countData = await countResponse.json();
            if (countData.result?.[0]?.results?.[0]?.count) {
              totalRows += parseInt(countData.result[0].results[0].count);
            }
            // Update total size if the new response has a larger size
            if (countData.result?.[0]?.meta?.size_after > totalSize) {
              totalSize = countData.result[0].meta.size_after;
            }
          }
        }
      }

      // Update metrics state
      setMetrics({
        totalTables: tables.filter((t: any) => !SYSTEM_TABLES.includes(t.name)).length,
        totalRows,
        databaseSize: totalSize, // Use the size from meta
        lastModified: new Date().toISOString(),
        queryCount: tables.length
      });

      setError(null);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setError('Failed to fetch metrics. Please try again later.');
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  // Add loading state display in the metrics section
  const MetricsCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    loading 
  }: { 
    icon: any;
    title: string;
    value: string | number;
    subtitle: string;
    loading: boolean;
  }) => (
    <div className="bg-[#1A1A1A] rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-500" />
        </div>
        <div>
          <p className="text-sm text-[#F8F9FA]/70">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-[#2E2E2E] animate-pulse rounded mt-1" />
          ) : (
            <h3 className="text-2xl font-bold text-[#F8F9FA]">{value}</h3>
          )}
        </div>
      </div>
      <div className="text-xs text-[#F8F9FA]/50">{subtitle}</div>
    </div>
  );

  // Add useEffect to fetch metrics when analytics view is selected
  useEffect(() => {
    if (view === 'analytics') {
      fetchMetrics();
    }
  }, [view]);

  // Add function to fetch databases
  const fetchDatabases = async () => {
    try {
      setDatabasesLoading(true);
      console.log('Fetching databases through CORS proxy');

      const response = await fetch(`${CORS_PROXY_URL}/databases`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received data:', data);

      if (!data.result || !Array.isArray(data.result)) {
        throw new Error('Invalid response format: expected result array');
      }

      const dbList = data.result;
      
      const dbMapping = dbList.reduce((acc: {[key: string]: string}, db: any) => {
        if (db.name && db.uuid) {
          acc[db.name] = db.uuid;
        }
        return acc;
      }, {});

      console.log('Database mapping:', dbMapping);
      setDatabaseIds(dbMapping);
      setDatabases(dbList);

      // Auto-select first database if available
      if (dbList.length > 0) {
        const firstDb = dbList[0].name;
        setSelectedDb(firstDb);
        
        // Fetch tables for the first database
        try {
          const tablesResponse = await fetch(`${CORS_PROXY_URL}/query`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              dbId: dbMapping[firstDb],
              sql: "SELECT name FROM sqlite_master WHERE type='table'"
            })
          });

          if (tablesResponse.ok) {
            const tablesData = await tablesResponse.json();
            if (tablesData.result?.[0]?.results) {
              const tables = tablesData.result[0].results;
              setTables(tables);

              // Auto-select first non-system table if available
              const firstRegularTable = tables.find((table: any) => 
                !SYSTEM_TABLES.includes(table.name)
              );
              
              if (firstRegularTable) {
                setSelectedTable(firstRegularTable.name);
                // Fetch data for the first table
                fetchTableData(firstRegularTable.name, firstDb);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching initial tables:', error);
        }
      }

      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching databases:', errorMessage);
      setError(`Failed to fetch databases: ${errorMessage}`);
      setDatabases([]);
      setDatabaseIds({});
    } finally {
      setDatabasesLoading(false);
    }
  };

  // Use useEffect to fetch databases on mount
  useEffect(() => {
    fetchDatabases();
  }, []);

  // Update the database selection handler
  const handleDatabaseSelect = async (dbName: string) => {
    try {
      setLoading(true);
      setSelectedDb(dbName);
      setSelectedTable(null);
      setTableData([]);
      
      // Fetch tables for the new database
      await fetchTables(dbName);

      // If we're in analytics view, fetch new metrics
      if (view === 'analytics') {
        await fetchMetrics();
      }
    } catch (error) {
      console.error('Error switching database:', error);
      setError('Failed to switch database');
    } finally {
      setLoading(false);
    }
  };

  // Update useEffect for metrics to depend on selectedDb
  useEffect(() => {
    if (view === 'analytics' && selectedDb) {
      fetchMetrics();
    }
  }, [view, selectedDb]); // Add selectedDb as a dependency

  // Add function to execute SQL query
  const executeCustomQuery = async () => {
    if (!queryInput.trim() || !selectedDb) return;

    const dbId = databaseIds[selectedDb];
    if (!dbId) {
      setQueryError('Database ID not found');
      return;
    }

    try {
      setQueryLoading(true);
      setQueryError(null);
      
      const response = await fetch(`${CORS_PROXY_URL}/query`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dbId,
          sql: queryInput
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].message);
      }

      if (data.result && data.result[0] && data.result[0].results) {
        setQueryResult(data.result[0].results);
        // Add query to history and save to localStorage
        setQueryHistory(prev => {
          const newHistory = [queryInput, ...prev.slice(0, 9)];
          localStorage.setItem('queryHistory', JSON.stringify(newHistory));
          return newHistory;
        });
      } else {
        setQueryResult([]);
      }
    } catch (error) {
      console.error('Query execution error:', error);
      setQueryError(error instanceof Error ? error.message : 'Failed to execute query');
      setQueryResult(null);
    } finally {
      setQueryLoading(false);
    }
  };

  // Add function to remove single query from history
  const removeFromHistory = (indexToRemove: number) => {
    setQueryHistory(prev => {
      const newHistory = prev.filter((_, index) => index !== indexToRemove);
      localStorage.setItem('queryHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Add function to clear all history
  const clearAllHistory = () => {
    setQueryHistory([]);
    localStorage.setItem('queryHistory', JSON.stringify([]));
  };

  // Update the Query section JSX
  {view === 'query' && (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Query Editor Header */}
      <div className="bg-[#1A1A1A] p-4 border-b border-[#2E2E2E]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#F8F9FA]">SQL Query</h2>
              <p className="text-sm text-[#F8F9FA]/70">
                Execute custom SQL queries on {selectedDb}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Query Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Query Input and History */}
        <div className="w-1/2 flex flex-col border-r border-[#2E2E2E] overflow-y-auto">
          {/* Query Input */}
          <div className="h-[300px] p-4">
            <div className="bg-[#1A1A1A] rounded-lg h-full flex flex-col">
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Enter your SQL query here..."
                className="flex-1 bg-[#2E2E2E] text-[#F8F9FA] p-4 rounded-t-lg font-mono text-sm 
                  focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
              <div className="p-4 border-t border-[#2E2E2E] flex justify-between items-center">
                <button
                  onClick={() => setQueryInput('')}
                  className="px-4 py-2 text-sm text-[#F8F9FA]/70 hover:text-[#F8F9FA] 
                    transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={executeCustomQuery}
                  disabled={queryLoading || !queryInput.trim()}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                    ${queryLoading || !queryInput.trim()
                      ? 'bg-[#2E2E2E] text-[#F8F9FA]/50 cursor-not-allowed'
                      : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                    }`}
                >
                  {queryLoading ? 'Executing...' : 'Execute Query'}
                </button>
              </div>
            </div>
          </div>

          {/* Query History */}
          <div className="flex-1 bg-[#1A1A1A] border-t border-[#2E2E2E] flex flex-col">
            <div className="p-4 border-b border-[#2E2E2E] flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#F8F9FA]">Query History</h3>
              {queryHistory.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="px-3 py-1 text-xs text-red-400 hover:text-red-300 
                    transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 overflow-auto custom-scrollbar">
                {queryHistory.length > 0 ? (
                  <div className="p-4 space-y-2">
                    {queryHistory.map((query, index) => (
                      <div
                        key={index}
                        className="group flex items-start space-x-2 p-2 hover:bg-[#2E2E2E] 
                          rounded transition-colors"
                      >
                        <button
                          onClick={() => setQueryInput(query)}
                          className="flex-1 text-left text-sm text-[#F8F9FA]/70 
                            hover:text-[#F8F9FA] truncate"
                        >
                          {query}
                        </button>
                        <button
                          onClick={() => removeFromHistory(index)}
                          className="opacity-0 group-hover:opacity-100 text-red-400 
                            hover:text-red-300 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-[#F8F9FA]/50 text-sm">
                    No query history
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Query Results */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 overflow-auto">
            {queryError ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-500 text-sm">{queryError}</p>
              </div>
            ) : queryLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
              </div>
            ) : queryResult ? (
              <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
                <table className="w-full text-sm text-[#F8F9FA]">
                  <thead>
                    <tr className="border-b border-[#2E2E2E]">
                      {queryResult.length > 0 && Object.keys(queryResult[0]).map((column) => (
                        <th key={column} className="text-left py-2 px-3 text-[#4B5563] font-medium">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.map((row, index) => (
                      <tr key={index} className="border-b border-[#2E2E2E]">
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="py-2 px-3">
                            {value?.toString() || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[#F8F9FA]/50">
                Execute a query to see results
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )}

  // Add custom scrollbar styles to your global CSS
  const customScrollbarStyles = `
    /* Modern scrollbar styles for all elements */
    * {
      scrollbar-width: thin;
      scrollbar-color: #2E2E2E #1A1A1A;
    }

    /* Base scrollbar styles */
    *::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    *::-webkit-scrollbar-track {
      background: #1A1A1A;
      border-radius: 4px;
    }

    *::-webkit-scrollbar-thumb {
      background: #2E2E2E;
      border-radius: 4px;
      border: 2px solid #1A1A1A;
    }

    *::-webkit-scrollbar-thumb:hover {
      background: #3E3E3E;
    }

    *::-webkit-scrollbar-corner {
      background: #1A1A1A;
    }

    /* Hide scrollbars by default, show on hover */
    .custom-scrollbar {
      scrollbar-width: none;  /* Firefox */
      -ms-overflow-style: none;  /* IE and Edge */
    }

    .custom-scrollbar::-webkit-scrollbar {
      display: none;
    }

    /* Show scrollbar on hover */
    .custom-scrollbar:hover {
      scrollbar-width: thin;  /* Firefox */
      -ms-overflow-style: auto;  /* IE and Edge */
    }

    .custom-scrollbar:hover::-webkit-scrollbar {
      display: block;
    }

    /* Hide scrollbars for mobile devices */
    @media (max-width: 768px) {
      * {
        scrollbar-width: none;
      }
      *::-webkit-scrollbar {
        display: none;
      }
    }
  `;

  // Add this style to your page
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = customScrollbarStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="flex h-screen bg-[#1A1A1A] text-white overflow-hidden">
      {/* Left Sidebar - Fixed width */}
      <div className="w-64 bg-[#212121] flex flex-col">
        {/* Panel Header */}
        <div className="p-4 shrink-0">
          <div className="p-3 rounded-xl bg-[#2E2E2E] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[#1A1A1A] font-bold">D1</span>
              </div>
              <span className="font-semibold text-[#F8F9FA] whitespace-nowrap">Explorer</span>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 bg-red-500/10 border border-red-500/20 text-red-400 
                rounded-full hover:bg-red-500/20 hover:text-red-300 transition-all shadow-md 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500/20
                ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel content - Make this section scrollable */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-auto custom-scrollbar">
            {/* Analytics Section */}
            <div className="p-4">
              <h2 className="text-sm font-semibold text-[#F8F9FA] uppercase tracking-wider mb-3 px-3 underline">
                Analytics
              </h2>
              <button
                onClick={() => setView('analytics')}
                className={`w-full px-4 py-2.5 text-sm rounded-xl flex items-center space-x-3 transition-all duration-200 ease-in-out ${
                  view === 'analytics' 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' 
                    : 'text-[#F8F9FA] hover:bg-[#2E2E2E]'
                }`}
              >
                <TrendingUp className="w-4 h-4 flex-shrink-0" />
                <span>Metrics</span>
              </button>
            </div>

            {/* Tools Section */}
            <div className="p-4">
              <h2 className="text-sm font-semibold text-[#F8F9FA] uppercase tracking-wider mb-3 px-3 underline">
                Tools
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => setView('tables')}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl flex items-center space-x-3 transition-all duration-200 ease-in-out border
                    ${view === 'tables' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                      : 'bg-[#2E2E2E] border-transparent text-[#F8F9FA] hover:bg-[#3E3E3E]'
                    }`}
                >
                  <Table className="w-4 h-4 flex-shrink-0" />
                  <span>Tables</span>
                </button>
                <button
                  onClick={() => setView('query')}
                  className={`w-full px-4 py-2.5 text-sm rounded-xl flex items-center space-x-3 transition-all duration-200 ease-in-out border
                    ${view === 'query' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                      : 'bg-[#2E2E2E] border-transparent text-[#F8F9FA] hover:bg-[#3E3E3E]'
                    }`}
                >
                  <Code className="w-4 h-4 flex-shrink-0" />
                  <span>SQL Query</span>
                </button>
              </div>
            </div>

            {/* Database Section */}
            <div className="p-4">
              <h2 className="text-sm font-semibold text-[#F8F9FA] uppercase tracking-wider mb-3 px-3 underline">
                Databases
              </h2>
              <div className="space-y-2">
                {databasesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"/>
                      <span className="text-sm text-[#F8F9FA]/70">Connecting to databases...</span>
                    </div>
                  </div>
                ) : databases.length > 0 ? (
                  databases.map((db, index) => (
                    <button
                      key={`${db.name}-${index}`}
                      onClick={() => handleDatabaseSelect(db.name)}
                      className={`w-full px-4 py-3 text-sm rounded-xl flex items-center space-x-3 
                        transition-all duration-200 ease-in-out border
                        ${selectedDb === db.name
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : 'bg-[#2E2E2E] border-transparent text-[#F8F9FA] hover:bg-[#3E3E3E]'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                        transition-all duration-200 ease-in-out border
                        ${selectedDb === db.name ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/10 border-transparent'}`}>
                        <Database className={`w-4 h-4 transition-colors duration-200 ease-in-out
                          ${selectedDb === db.name ? 'text-emerald-500' : 'text-emerald-500'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="block font-medium">{db.name}</span>
                        <span className={`text-xs ${selectedDb === db.name ? 'text-white/70' : 'text-[#F8F9FA]/50'}`}>
                          {db.tableCount} tables • {db.type}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-[#F8F9FA]/50 text-sm">
                    No databases found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* User Profile - Keep this fixed at bottom */}
        <div className="p-4 bg-[#212121]/80 backdrop-blur-sm shrink-0">
          <a 
            href="https://github.com/malithonline/flareBaseExpoD1"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-xl bg-[#2E2E2E] flex items-center space-x-3 hover:bg-[#3E3E3E] transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-[#006239]/20 flex-shrink-0 flex items-center justify-center">
              <Github className="w-5 h-5 text-[#006239]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-[#F8F9FA]">Made with❤️ by</div>
              <div className="text-sm font-semibold text-[#006239]">Malith Madhuwanthe</div>
            </div>
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Only show error if it exists and the selected table is not a system table */}
        {error && selectedTable && !SYSTEM_TABLES.includes(selectedTable) && <ErrorMessage message={error} />}
        
        {/* Header */}
        <div className="h-12 flex items-center px-6 border-b border-[#2E2E2E]">
          <div className="flex items-center space-x-3">
            {databasesLoading ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-500 border-t-transparent"/>
                <span className="text-sm text-yellow-500 font-medium">Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                <span className="text-sm text-emerald-500 font-medium">Connected</span>
              </div>
            )}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#2E2E2E] border border-[#006239]/20">
              <Database className="w-3.5 h-3.5 text-[#006239]"/>
              <span className="text-sm text-[#F8F9FA] font-medium max-w-[150px] truncate">
                {selectedDb === 'db1' ? 'Production' : 
                 selectedDb === 'db2' ? 'Development' : 
                 selectedDb === 'db3' ? 'Testing' : selectedDb}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {view === 'tables' ? (
            <div className="h-full flex">
              {/* Table List Panel - Fixed width */}
              <div className="w-64 min-w-[16rem] bg-[#1A1A1A] border-r border-[#2E2E2E] flex flex-col">
                {/* Search Input */}
                <div className="p-3 shrink-0">
                  <div className="relative">
                    <input
                      type="text"
                      value={tableSearchQuery}
                      onChange={(e) => setTableSearchQuery(e.target.value)}
                      placeholder="Search tables..."
                      className="w-full bg-[#2E2E2E] text-sm text-[#F8F9FA] rounded-md h-8 px-8 
                        focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-[#4B5563]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#4B5563] absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Tables List - Scrollable */}
                <div className="flex-1 relative">
                  <div className="absolute inset-0 overflow-auto custom-scrollbar">
                    <div className="px-2 py-1 space-y-1">
                      {loading ? (
                        <div className="text-center py-4">Loading...</div>
                      ) : error ? (
                        <div className="text-red-500 text-center py-4">{error}</div>
                      ) : filteredTables.length > 0 ? (
                        filteredTables.map((table, index) => {
                          const isSystemTable = SYSTEM_TABLES.includes(table.name);
                          const isSelected = selectedTable === table.name;
                          
                          return (
                            <div
                              key={`${table.name}-${index}`}
                              className={`w-full px-4 py-2.5 text-sm rounded-xl flex items-center space-x-3 transition-all duration-200 ease-in-out ${
                                isSystemTable 
                                  ? 'text-[#F8F9FA]/50' 
                                  : isSelected
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                                    : 'text-[#F8F9FA] hover:bg-[#2E2E2E]'
                              }`}
                              onClick={() => {
                                if (!isSystemTable) {
                                  setSelectedTable(table.name);
                                  fetchTableData(table.name, selectedDb);
                                }
                              }}
                              style={{ cursor: isSystemTable ? 'not-allowed' : 'pointer' }}
                            >
                              <span className="block font-medium">{table.name}</span>
                              {isSystemTable && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 ml-2">
                                  System
                                </span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-4 text-[#F8F9FA]/50">
                          No tables found
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Content Area - Flexible width */}
              <div className="flex-1 flex flex-col min-w-0 h-full">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                  </div>
                ) : (
                  selectedTable && (
                    <div className="flex flex-col h-full">
                      {/* Table Header */}
                      <div className="p-4 border-b border-[#2E2E2E] shrink-0">
                        <h2 className="text-lg font-semibold text-[#F8F9FA]">{selectedTable}</h2>
                        <p className="text-sm text-[#F8F9FA]/70">
                          {tableData.length} records loaded
                        </p>
                      </div>

                      {/* Table Container with both scrollbars */}
                      <div className="flex-1 p-4 min-h-0">
                        <div className="h-full relative bg-[#1A1A1A] rounded-lg border border-[#2E2E2E]">
                          <div className="absolute inset-0 overflow-auto">
                            <table className="w-full text-sm text-[#F8F9FA]">
                              <thead className="sticky top-0 bg-[#1A1A1A] z-10">
                                <tr className="border-b border-[#2E2E2E]">
                                  {tableData.length > 0 && Object.keys(tableData[0]).map((column) => (
                                    <th 
                                      key={column} 
                                      className="text-left py-3 px-4 text-[#4B5563] font-medium whitespace-nowrap bg-[#1A1A1A]"
                                    >
                                      {column}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {tableData.map((row, index) => (
                                  <tr 
                                    key={index} 
                                    className="border-b border-[#2E2E2E] hover:bg-[#2E2E2E]/50 transition-colors"
                                  >
                                    {Object.values(row).map((value: any, i) => (
                                      <td 
                                        key={i} 
                                        className="py-2 px-4 whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]"
                                        title={value?.toString() || ''}
                                      >
                                        {value?.toString() || ''}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Load More Button */}
                      <div className="p-4 flex justify-center border-t border-[#2E2E2E] shrink-0">
                        {tableData.length >= recordsToShow && (
                          <button
                            onClick={loadMoreRecords}
                            className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 
                              font-medium rounded-md hover:bg-emerald-500/20 transition-colors flex items-center space-x-2"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1A1A1A]" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <span>Load More</span>
                                <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : view === 'query' ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Query Editor Header */}
              <div className="bg-[#1A1A1A] p-4 border-b border-[#2E2E2E]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <Code className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#F8F9FA]">SQL Query</h2>
                      <p className="text-sm text-[#F8F9FA]/70">
                        Execute custom SQL queries on {selectedDb}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Query Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Query Input and History */}
                <div className="w-1/2 flex flex-col border-r border-[#2E2E2E] overflow-y-auto">
                  {/* Query Input */}
                  <div className="h-[300px] p-4">
                    <div className="bg-[#1A1A1A] rounded-lg h-full flex flex-col">
                      <textarea
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder="Enter your SQL query here..."
                        className="flex-1 bg-[#2E2E2E] text-[#F8F9FA] p-4 rounded-t-lg font-mono text-sm 
                          focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                      />
                      <div className="p-4 border-t border-[#2E2E2E] flex justify-between items-center">
                        <button
                          onClick={() => setQueryInput('')}
                          className="px-4 py-2 text-sm text-[#F8F9FA]/70 hover:text-[#F8F9FA] 
                            transition-colors"
                        >
                          Clear
                        </button>
                        <button
                          onClick={executeCustomQuery}
                          disabled={queryLoading || !queryInput.trim()}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                            ${queryLoading || !queryInput.trim()
                              ? 'bg-[#2E2E2E] text-[#F8F9FA]/50 cursor-not-allowed'
                              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'
                            }`}
                        >
                          {queryLoading ? 'Executing...' : 'Execute Query'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Query History */}
                  <div className="flex-1 bg-[#1A1A1A] border-t border-[#2E2E2E] flex flex-col">
                    <div className="p-4 border-b border-[#2E2E2E] flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-[#F8F9FA]">Query History</h3>
                      {queryHistory.length > 0 && (
                        <button
                          onClick={clearAllHistory}
                          className="px-3 py-1 text-xs text-red-400 hover:text-red-300 
                            transition-colors"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 overflow-auto custom-scrollbar">
                        {queryHistory.length > 0 ? (
                          <div className="p-4 space-y-2">
                            {queryHistory.map((query, index) => (
                              <div
                                key={index}
                                className="group flex items-start space-x-2 p-2 hover:bg-[#2E2E2E] 
                                  rounded transition-colors"
                              >
                                <button
                                  onClick={() => setQueryInput(query)}
                                  className="flex-1 text-left text-sm text-[#F8F9FA]/70 
                                    hover:text-[#F8F9FA] truncate"
                                >
                                  {query}
                                </button>
                                <button
                                  onClick={() => removeFromHistory(index)}
                                  className="opacity-0 group-hover:opacity-100 text-red-400 
                                    hover:text-red-300 transition-opacity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-[#F8F9FA]/50 text-sm">
                            No query history
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel - Query Results */}
                <div className="w-1/2 flex flex-col overflow-hidden">
                  <div className="flex-1 p-4 overflow-auto">
                    {queryError ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-red-500 text-sm">{queryError}</p>
                      </div>
                    ) : queryLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                      </div>
                    ) : queryResult ? (
                      <div className="bg-[#1A1A1A] rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-[#F8F9FA]">
                          <thead>
                            <tr className="border-b border-[#2E2E2E]">
                              {queryResult.length > 0 && Object.keys(queryResult[0]).map((column) => (
                                <th key={column} className="text-left py-2 px-3 text-[#4B5563] font-medium">
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.map((row, index) => (
                              <tr key={index} className="border-b border-[#2E2E2E]">
                                {Object.values(row).map((value: any, i) => (
                                  <td key={i} className="py-2 px-3">
                                    {value?.toString() || ''}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-[#F8F9FA]/50">
                        Execute a query to see results
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : view === 'analytics' && (
            <div className="flex-1 p-6">
              {/* Add Database Info Header */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 bg-[#1A1A1A] p-4 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#F8F9FA]">
                      Database: {selectedDb}
                    </h2>
                    <p className="text-sm text-[#F8F9FA]/70">
                      Metrics and Analytics
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricsCard
                    icon={Database}
                    title="Total Tables"
                    value={metrics?.totalTables || 0}
                    subtitle="Excluding system tables"
                    loading={metricsLoading}
                  />
                  <MetricsCard
                    icon={BarChart2}
                    title="Total Records"
                    value={metrics?.totalRows.toLocaleString() || 0}
                    subtitle="Across all tables"
                    loading={metricsLoading}
                  />
                  <MetricsCard
                    icon={Activity}
                    title="Database Size"
                    value={formatBytes(metrics?.databaseSize || 0)}
                    subtitle="Total storage used"
                    loading={metricsLoading}
                  />
                  <MetricsCard
                    icon={Clock}
                    title="Last Modified"
                    value={formatDate(metrics?.lastModified)}
                    subtitle="Last database update"
                    loading={metricsLoading}
                  />
                </div>

                {/* Database Health Section */}
                <div className="bg-[#1A1A1A] rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-[#F8F9FA] mb-4">Database Health</h2>
                  {metricsLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-20 bg-[#2E2E2E] rounded-lg" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#2E2E2E] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-sm text-[#F8F9FA]/70">Storage Usage</span>
                            <div className="text-xl font-semibold text-[#F8F9FA]">
                              {formatBytes(metrics?.databaseSize || 0)}
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#2E2E2E] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-sm text-[#F8F9FA]/70">Average Query Time</span>
                            <div className="text-xl font-semibold text-[#F8F9FA]">
                              {((metrics?.queryCount || 1) / 1000).toFixed(2)}ms
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add utility functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Add or update the formatDate function
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', '');
}
