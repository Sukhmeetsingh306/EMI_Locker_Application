'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getAgents } from '@/src/features/agents/api';
import RefreshButton from '@/src/components/ui/RefreshButton';
import Pagination from '@/src/components/ui/Pagination';
import FilterBar from '@/src/components/ui/FilterBar';

export default function AgentsListPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [highlightedAgentId, setHighlightedAgentId] = useState(null);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    adminsOperator: '',
    adminsValue: '',
  });

  // Store fetched agents
  const [allFetchedAgents, setAllFetchedAgents] = useState([]);
  const [fetchedTotal, setFetchedTotal] = useState(0);
  
  const prevFiltersRef = useRef(null);
  const prevPaginationRef = useRef(null);
  const prevHasAdminsFilterRef = useRef(null);
  const hasMountedRef = useRef(false);
  const adminsFilterActiveRef = useRef(false);

  // Check if admins filter is active
  const hasAdminsFilter = useMemo(() => {
    return filters.adminsOperator && filters.adminsValue;
  }, [filters.adminsOperator, filters.adminsValue]);

  // Build backend filters (exclude admins filter) - stringify for comparison
  const backendFiltersKey = useMemo(() => {
    const bf = { ...filters };
    delete bf.adminsOperator;
    delete bf.adminsValue;
    return JSON.stringify(bf);
  }, [filters.search, filters.status]);

  // Fetch agents from API
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Parse backend filters
      const backendFilters = JSON.parse(backendFiltersKey);
      
      // If admins filter is active, fetch all agents once
      // Otherwise, use normal pagination
      const fetchLimit = hasAdminsFilter ? 10000 : pagination.limit;
      const fetchPage = hasAdminsFilter ? 1 : pagination.page;
      
      // Build query parameters
      const params = new URLSearchParams({
        page: fetchPage.toString(),
        limit: fetchLimit.toString(),
        ...Object.fromEntries(
          Object.entries(backendFilters).filter(([_, v]) => v !== '' && v !== null)
        ),
      });
      
      const payload = await getAgents(params.toString());
      
      let agents = [];
      let total = 0;
      
      if (payload.pagination) {
        agents = payload.data || [];
        total = payload.pagination.total || 0;
      } else {
        const list = Array.isArray(payload) ? payload : payload.data || [];
        agents = list;
        total = list.length;
      }
      
      // Store fetched data
      setAllFetchedAgents(agents);
      setFetchedTotal(total);
    } catch (err) {
      console.error('fetchAgents', err);
      setAllFetchedAgents([]);
      setFetchedTotal(0);
    } finally {
      setLoading(false);
    }
  }, [hasAdminsFilter, pagination.page, pagination.limit, backendFiltersKey]);

  // Only refetch when:
  // 1. Initial mount
  // 2. Backend filters change
  // 3. Admins filter toggle on/off
  // 4. Pagination changes AND admins filter is NOT active
  useEffect(() => {
    const isInitialMount = !hasMountedRef.current;
    const backendFiltersChanged = prevFiltersRef.current !== null && prevFiltersRef.current !== backendFiltersKey;
    const adminsFilterToggled = prevHasAdminsFilterRef.current !== null && prevHasAdminsFilterRef.current !== hasAdminsFilter;
    const paginationChanged = prevPaginationRef.current !== null && prevPaginationRef.current !== `${pagination.page}-${pagination.limit}`;
    
    const shouldRefetch = 
      isInitialMount ||
      backendFiltersChanged || 
      adminsFilterToggled || 
      (paginationChanged && !hasAdminsFilter);
    
    if (shouldRefetch) {
      prevFiltersRef.current = backendFiltersKey;
      prevHasAdminsFilterRef.current = hasAdminsFilter;
      prevPaginationRef.current = `${pagination.page}-${pagination.limit}`;
      hasMountedRef.current = true;
      fetchAgents();
    }
  }, [backendFiltersKey, hasAdminsFilter, pagination.page, pagination.limit, fetchAgents]);

  // Memoized filtering function
  const applyAdminsFilter = useCallback((agents) => {
    let filtered = [...agents];
    
    // Filter by number of admins (enrollments)
    if (filters.adminsOperator && filters.adminsValue) {
      const adminsValue = parseInt(filters.adminsValue);
      filtered = filtered.filter((agent) => {
        const adminCount = agent.admins ? agent.admins.length : 0;
        if (filters.adminsOperator === '>=') {
          return adminCount >= adminsValue;
        } else if (filters.adminsOperator === '<') {
          return adminCount < adminsValue;
        }
        return true;
      });
    }
    
    return filtered;
  }, [filters.adminsOperator, filters.adminsValue]);

  // Memoized filtered and paginated results
  const agentsData = useMemo(() => {
    // If admins filter is NOT active, use server pagination data directly
    if (!hasAdminsFilter) {
      // When not using admins filter, the data should come from server pagination
      // Return the data as-is with server pagination info
      return {
        data: allFetchedAgents.slice(0, pagination.limit), // Show only current page
        total: fetchedTotal,
        totalPages: Math.ceil(fetchedTotal / pagination.limit),
        hasNextPage: pagination.page < Math.ceil(fetchedTotal / pagination.limit),
        hasPrevPage: pagination.page > 1,
      };
    }
    
    // If admins filter IS active, do client-side pagination
    const filtered = applyAdminsFilter(allFetchedAgents);
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
  }, [allFetchedAgents, fetchedTotal, hasAdminsFilter, applyAdminsFilter, pagination.page, pagination.limit]);
  
  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };
  
  const handleLimitChange = (newLimit) => {
    setPagination({ page: 1, limit: newLimit });
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };
  
  // Reset to page 1 when admins filter toggle
  useEffect(() => {
    const currentHasAdminsFilter = hasAdminsFilter;
    if (adminsFilterActiveRef.current !== currentHasAdminsFilter) {
      adminsFilterActiveRef.current = currentHasAdminsFilter;
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [hasAdminsFilter]);
  
  // Get selected agent from URL and highlight it
  useEffect(() => {
    const selectedAgentId = searchParams?.get('selectedAgent');
    if (selectedAgentId) {
      setHighlightedAgentId(selectedAgentId);
      // Scroll to the highlighted agent after data loads
      if (agentsData.data.length > 0) {
        setTimeout(() => {
          const element = document.getElementById(`agent-${selectedAgentId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [searchParams, agentsData.data]);

  const filterOptions = [
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
      key: 'admins',
      label: 'Admins',
      type: 'numberRange',
      placeholder: 'Enter count',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agents</h1>
        <div className="flex items-center gap-3">
          <RefreshButton onRefresh={fetchAgents} disabled={loading} />
          <Link 
            href="/agents/create" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Agent
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
        <div className="rounded-xl border px-6 py-8 text-center">Loading agents…</div>
      ) : agentsData.data.length === 0 ? (
        <div className="rounded-xl border px-6 py-8 text-center">
          {agentsData.total === 0 ? 'No agents found.' : 'No agents match your filters.'}
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
                  <th className="p-3 text-left">View Admins</th>
                  <th className="p-3 text-left">View Agent Details</th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-zinc-900">
                {agentsData.data.map((a) => {
                  const agentId = a._id || a.id;
                  const isHighlighted = highlightedAgentId === agentId;
                  return (
                <tr 
                  key={agentId}
                  id={`agent-${agentId}`}
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
                  <td className="p-3">
                    <Link 
                      href={`/admins?enrolledBy=${agentId}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold shadow-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-md w-full"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      View Admins ({a.totalEnrollments || 0})
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link 
                      href={`/agents/view/${agentId}`}
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
            totalPages={agentsData.totalPages}
            onPageChange={handlePageChange}
            hasNextPage={agentsData.hasNextPage}
            hasPrevPage={agentsData.hasPrevPage}
            limit={pagination.limit}
            total={agentsData.total}
            onLimitChange={handleLimitChange}
          />
        </>
      )}
    </div>
  );
}

