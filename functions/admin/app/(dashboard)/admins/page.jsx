// app/(dashboard)/admins/page.jsx
'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdmins, getAgents, transferAdmin } from '@/src/features/admins/api';
import RefreshButton from '@/src/components/ui/RefreshButton';
import Pagination from '@/src/components/ui/Pagination';
import FilterBar from '@/src/components/ui/FilterBar';

export default function AdminsListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [highlightedAdminId, setHighlightedAdminId] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedAdminForTransfer, setSelectedAdminForTransfer] = useState(null);
  const [selectedAgentForTransfer, setSelectedAgentForTransfer] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentConfigModal, setShowPaymentConfigModal] = useState(false);
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    enrolledBy: '',
    revenueOperator: '',
    revenueValue: '',
    keysOperator: '',
    keysValue: '',
    usersOperator: '',
    usersValue: '',
  });

  // Store all fetched admins when stats filters are active
  const [allFetchedAdmins, setAllFetchedAdmins] = useState([]);
  const [fetchedTotal, setFetchedTotal] = useState(0);
  
  // Ref to track if we're using stats filters
  const statsFiltersActiveRef = useRef(false);

  // Check if stats filters are active
  const hasStatsFilters = useMemo(() => {
    return (
      (filters.revenueOperator && filters.revenueValue) ||
      (filters.keysOperator && filters.keysValue) ||
      (filters.usersOperator && filters.usersValue)
    );
  }, [filters.revenueOperator, filters.revenueValue, filters.keysOperator, filters.keysValue, filters.usersOperator, filters.usersValue]);

  // Build backend filters (exclude stats filters) - stringify for comparison
  const backendFiltersKey = useMemo(() => {
    const bf = { ...filters };
    delete bf.revenueOperator;
    delete bf.revenueValue;
    delete bf.keysOperator;
    delete bf.keysValue;
    delete bf.usersOperator;
    delete bf.usersValue;
    return JSON.stringify(bf);
  }, [filters.search, filters.status, filters.enrolledBy]);

  // Track previous values to detect actual changes
  const prevBackendFiltersRef = useRef(null);
  const prevHasStatsFiltersRef = useRef(null);
  const prevPaginationRef = useRef(null);
  const hasMountedRef = useRef(false);

  // Fetch agents for filter dropdown
  const fetchAgents = useCallback(async () => {
    try {
      setAgentsLoading(true);
      const payload = await getAgents('limit=1000'); // Get all agents
      const agentsList = Array.isArray(payload) ? payload : payload.data || [];
      setAgents(agentsList);
    } catch (err) {
      console.error('fetchAgents', err);
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  // Fetch admins from API
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      
      // Parse backend filters
      const backendFilters = JSON.parse(backendFiltersKey);
      
      // If stats filters are active, fetch all admins once
      // Otherwise, use normal pagination
      const fetchLimit = hasStatsFilters ? 10000 : pagination.limit;
      const fetchPage = hasStatsFilters ? 1 : pagination.page;
      
      // Build query parameters
      const params = new URLSearchParams({
        page: fetchPage.toString(),
        limit: fetchLimit.toString(),
        includeStats: 'true',
        ...Object.fromEntries(
          Object.entries(backendFilters).filter(([_, v]) => v !== '' && v !== null)
        ),
      });
      
      const payload = await getAdmins(params.toString());
      
      let admins = [];
      let total = 0;
      
      if (payload.pagination) {
        admins = payload.data || [];
        total = payload.pagination.total || 0;
      } else {
        const list = Array.isArray(payload) ? payload : payload.data || [];
        admins = list;
        total = list.length;
      }
      
      // Store fetched data
      setAllFetchedAdmins(admins);
      setFetchedTotal(total);
    } catch (err) {
      console.error('fetchAdmins', err);
      setAllFetchedAdmins([]);
      setFetchedTotal(0);
    } finally {
      setLoading(false);
    }
  }, [hasStatsFilters, pagination.page, pagination.limit, backendFiltersKey]);

  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Only refetch when:
  // 1. Initial mount
  // 2. Backend filters change
  // 3. Stats filters toggle on/off
  // 4. Pagination changes AND stats filters are NOT active
  useEffect(() => {
    const isInitialMount = !hasMountedRef.current;
    const backendFiltersChanged = prevBackendFiltersRef.current !== null && prevBackendFiltersRef.current !== backendFiltersKey;
    const statsFiltersToggled = prevHasStatsFiltersRef.current !== null && prevHasStatsFiltersRef.current !== hasStatsFilters;
    const paginationChanged = prevPaginationRef.current !== null && prevPaginationRef.current !== `${pagination.page}-${pagination.limit}`;
    
    const shouldRefetch = 
      isInitialMount ||
      backendFiltersChanged || 
      statsFiltersToggled || 
      (paginationChanged && !hasStatsFilters);
    
    if (shouldRefetch) {
      prevBackendFiltersRef.current = backendFiltersKey;
      prevHasStatsFiltersRef.current = hasStatsFilters;
      prevPaginationRef.current = `${pagination.page}-${pagination.limit}`;
      hasMountedRef.current = true;
      fetchAdmins();
    }
  }, [backendFiltersKey, hasStatsFilters, pagination.page, pagination.limit, fetchAdmins]);

  // Memoized filtering function
  const applyStatsFilters = useCallback((admins) => {
    let filtered = [...admins];
    
    // Filter by revenue
    if (filters.revenueOperator && filters.revenueValue) {
      const revenueValue = parseFloat(filters.revenueValue);
      filtered = filtered.filter((admin) => {
        const revenue = admin.stats?.packages?.totalAmount || 0;
        if (filters.revenueOperator === '>=') {
          return revenue >= revenueValue;
        } else if (filters.revenueOperator === '<') {
          return revenue < revenueValue;
        }
        return true;
      });
    }
    
    // Filter by keys
    if (filters.keysOperator && filters.keysValue) {
      const keysValue = parseInt(filters.keysValue);
      filtered = filtered.filter((admin) => {
        const availableKeys = admin.stats?.keyStats?.availableKeys || admin.availableKeys || 0;
        if (filters.keysOperator === '>=') {
          return availableKeys >= keysValue;
        } else if (filters.keysOperator === '<') {
          return availableKeys < keysValue;
        }
        return true;
      });
    }
    
    // Filter by users
    if (filters.usersOperator && filters.usersValue) {
      const usersValue = parseInt(filters.usersValue);
      filtered = filtered.filter((admin) => {
        const usersCreated = admin.stats?.usersCreated || 0;
        if (filters.usersOperator === '>=') {
          return usersCreated >= usersValue;
        } else if (filters.usersOperator === '<') {
          return usersCreated < usersValue;
        }
        return true;
      });
    }
    
    return filtered;
  }, [filters.revenueOperator, filters.revenueValue, filters.keysOperator, filters.keysValue, filters.usersOperator, filters.usersValue]);

  // Memoized filtered and paginated results
  const adminsData = useMemo(() => {
    // If stats filters are NOT active, use server pagination data directly
    if (!hasStatsFilters) {
      // When not using stats filters, the data should come from server pagination
      // But we need to apply agent filter if present
      let filtered = [...allFetchedAdmins];
      
      // Apply enrolledBy (agent) filter
      if (filters.enrolledBy && filters.enrolledBy !== '') {
        filtered = filtered.filter((admin) => {
          const adminEnrolledBy = admin.enrolledBy?._id || admin.enrolledBy;
          return adminEnrolledBy === filters.enrolledBy;
        });
      }
      
      // For server-side pagination, we should only have the current page data
      // So return the data as-is with server pagination info
      return {
        data: filtered.slice(0, pagination.limit), // Show only current page
        total: fetchedTotal,
        totalPages: Math.ceil(fetchedTotal / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(fetchedTotal / pagination.limit),
        hasPrevPage: pagination.page > 1,
      };
    }
    
    // If stats filters ARE active, do client-side pagination
    let filtered = [...allFetchedAdmins];
    
    // Apply enrolledBy (agent) filter
    if (filters.enrolledBy && filters.enrolledBy !== '') {
      filtered = filtered.filter((admin) => {
        const adminEnrolledBy = admin.enrolledBy?._id || admin.enrolledBy;
        return adminEnrolledBy === filters.enrolledBy;
      });
    }
    
    // Apply stats filters if active
    if (hasStatsFilters) {
      filtered = applyStatsFilters(filtered);
    }
    
    const filteredTotal = filtered.length;
    const filteredTotalPages = Math.ceil(filteredTotal / pagination.limit);
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginated = filtered.slice(startIndex, endIndex);
    
    return {
      data: paginated,
      total: filteredTotal,
      totalPages: filteredTotalPages,
      hasNextPage: pagination.page < filteredTotalPages,
      hasPrevPage: pagination.page > 1,
    };
  }, [allFetchedAdmins, fetchedTotal, filters.enrolledBy, hasStatsFilters, applyStatsFilters, pagination.page, pagination.limit]);
  
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };
  
  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit });
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    
    // Update URL with new enrolledBy filter
    const url = new URL(window.location);
    if (newFilters.enrolledBy && newFilters.enrolledBy !== '') {
      url.searchParams.set('enrolledBy', newFilters.enrolledBy);
    } else {
      url.searchParams.delete('enrolledBy');
    }
    router.replace(url.pathname + url.search, { scroll: false });
  };
  
  // Reset to page 1 when stats filters toggle
  useEffect(() => {
    const currentHasStatsFilters = hasStatsFilters;
    if (statsFiltersActiveRef.current !== currentHasStatsFilters) {
      statsFiltersActiveRef.current = currentHasStatsFilters;
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [hasStatsFilters]);

  // Get enrolledBy from URL and set initial filter
  useEffect(() => {
    const enrolledByParam = searchParams?.get('enrolledBy');
    if (enrolledByParam && enrolledByParam !== filters.enrolledBy) {
      setFilters(prev => ({ ...prev, enrolledBy: enrolledByParam }));
    }
  }, [searchParams]); // Remove filters.enrolledBy from dependency to prevent loop

  // Clear agent filter after admin selection (when URL has selectedAdmin but no createdBy)
  useEffect(() => {
    const selectedAdminId = searchParams?.get('selectedAdmin');
    const enrolledByParam = searchParams?.get('enrolledBy');
    
    // If we have a selected admin but no enrolledBy parameter, clear the agent filter
    if (selectedAdminId && !enrolledByParam && filters.enrolledBy) {
      setFilters(prev => ({ ...prev, enrolledBy: '' }));
      // Also update URL to remove enrolledBy parameter
      const url = new URL(window.location);
      url.searchParams.delete('enrolledBy');
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [searchParams, filters.enrolledBy, router]);

  // Get selected admin from URL and highlight it
  useEffect(() => {
    const selectedAdminId = searchParams?.get('selectedAdmin');
    if (selectedAdminId) {
      setHighlightedAdminId(selectedAdminId);
      // Scroll to the highlighted admin after data loads
      if (adminsData.data.length > 0) {
        setTimeout(() => {
          const element = document.getElementById(`admin-${selectedAdminId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [searchParams, adminsData.data]);

  // Create agent filter options
  const agentFilterOptions = useMemo(() => {
    const options = [{ value: '', label: 'All Agents' }];
    agents.forEach(agent => {
      const agentId = agent._id || agent.id;
      const name = agent.name || agent.fullName || 'Unknown';
      const email = agent.email || '';
      const mobile = agent.mobile || '';
      
      let label = name;
      if (email || mobile) {
        const contact = [email, mobile].filter(Boolean).join(' | ');
        label = `${name} (${contact})`;
      }
      
      options.push({
        value: agentId,
        label: label
      });
    });
    return options;
  }, [agents]);

  const filterOptions = [
    {
      key: 'enrolledBy',
      label: 'Agent',
      type: 'select',
      options: agentFilterOptions,
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All' },
        { value: 'active', label: 'Active' },
        { value: 'blocked', label: 'Blocked' },
      ],
    },
    {
      key: 'revenue',
      label: 'Revenue',
      type: 'numberRange',
      placeholder: 'Enter amount',
    },
    {
      key: 'keys',
      label: 'Keys',
      type: 'numberRange',
      placeholder: 'Enter count',
    },
    {
      key: 'users',
      label: 'Users',
      type: 'numberRange',
      placeholder: 'Enter count',
    },
  ];

  // Get agent name for display
  const getAgentName = useCallback((agentId) => {
    if (!agentId) return '';
    const agent = agents.find(a => (a._id || a.id) === agentId);
    return agent ? (agent.name || agent.fullName || 'Unknown') : agentId;
  }, [agents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admins</h1>
        </div>
        <div className="flex items-center gap-3">
          {filters.enrolledBy && (
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, enrolledBy: '' }));
                // Also remove enrolledBy from URL
                const url = new URL(window.location);
                url.searchParams.delete('enrolledBy');
                router.replace(url.pathname + url.search, { scroll: false });
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 text-zinc-700 text-sm font-medium hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filter
            </button>
          )}
          <RefreshButton onRefresh={fetchAdmins} disabled={loading} />
          <Link 
            href="/admins/create" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Admin
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search by name, email, or mobile..."
        showSearch={true}
        filterOptions={filterOptions}
      />

      {loading ? (
        <div className="rounded-xl border px-6 py-8 text-center">Loading admins…</div>
      ) : adminsData.data.length === 0 ? (
        <div className="rounded-xl border px-6 py-8 text-center">
          {adminsData.total === 0 ? 'No admins found.' : 'No admins match your filters.'}
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-zinc-900 text-white">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Mobile</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Keys</th>
                  <th className="p-3 text-left">Revenue</th>
                  <th className="p-3 text-left">View Users</th>
                  <th className="p-3 text-left">Veiw Admin Details</th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-zinc-900">
                {adminsData.data.map((a) => {
                  const adminId = a._id || a.id;
                  const isHighlighted = highlightedAdminId === adminId;
                  return (
                <tr 
                  key={adminId}
                  id={`admin-${adminId}`}
                  className={`border-b last:border-b-0 transition-colors ${
                    a.status === 0 ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                  } ${
                    isHighlighted ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500' : ''
                  }`}
                >
                  <td className="p-3">{a.name || a.fullName || '-'}</td>
                  <td className="p-3">{a.email || '-'}</td>
                  <td className="p-3">{a.mobile || '-'}</td>
                  <td className="p-3">
                    {a.status === 0 ? (
                      <span className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded-full dark:bg-red-900/40 dark:text-red-300">
                        Blocked
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold text-emerald-600 bg-emerald-100 rounded-full dark:bg-emerald-900/40 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {a.stats?.keyStats ? (
                      <span>{a.stats.keyStats.availableKeys} / {a.stats.keyStats.totalKeys}</span>
                    ) : (
                      <span>{a.availableKeys || 0} / {a.totalKeys || 0}</span>
                    )}
                  </td>
                  <td className="p-3 text-sm">₹{a.stats?.packages?.totalAmount || 0}</td>
                  <td className="p-3">
                    <Link 
                      href={`/users?createdBy=${adminId}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-md w-full"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      View Users ({a.stats?.usersCreated || 0})
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link 
                      href={`/admins/view/${adminId}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold shadow-sm hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 hover:shadow-md w-full"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </Link>
                  </td>
                </tr>
                );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <Pagination
            page={pagination.page}
            totalPages={adminsData.totalPages}
            onPageChange={handlePageChange}
            hasNextPage={adminsData.hasNextPage}
            hasPrevPage={adminsData.hasPrevPage}
            limit={pagination.limit}
            total={adminsData.total}
            onLimitChange={handleLimitChange}
          />
        </>
      )}
    </div>
  );
}
