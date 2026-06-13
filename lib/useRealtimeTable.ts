"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Options {
  orderBy?: string;
  ascending?: boolean;
  filterColumn?: string;
  filterValue?: string;
}

/**
 * Fetches a table once, then keeps the local list in sync via
 * Supabase Realtime postgres_changes events (INSERT/UPDATE/DELETE).
 */
export function useRealtimeTable<T extends { id: string }>(
  table: string,
  options?: Options
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const { orderBy, ascending = true, filterColumn, filterValue } = options || {};

  useEffect(() => {
    let isMounted = true;

    function sortIfNeeded(arr: T[]) {
      if (!orderBy) return arr;
      const key = orderBy as keyof T;
      return [...arr].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av === bv) return 0;
        if (av === null || av === undefined) return 1;
        if (bv === null || bv === undefined) return -1;
        if (av > bv) return ascending ? 1 : -1;
        return ascending ? -1 : 1;
      });
    }

    async function load() {
      let query = supabase.from(table).select("*");
      if (filterColumn && filterValue) {
        query = query.eq(filterColumn, filterValue);
      }
      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }
      const { data: rows, error } = await query;
      if (!error && rows && isMounted) {
        setData(rows as T[]);
      }
      if (isMounted) setLoading(false);
    }
    load();

    const channelName = `realtime:${table}:${filterColumn || "all"}:${filterValue || "all"}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          // If filtering, ignore rows that don't match our filter.
          const row = (payload.new ?? payload.old) as Record<string, unknown>;
          if (filterColumn && filterValue && row[filterColumn] !== filterValue) {
            return;
          }

          setData((current) => {
            if (payload.eventType === "INSERT") {
              const newRow = payload.new as T;
              if (current.some((r) => r.id === newRow.id)) return current;
              return sortIfNeeded([...current, newRow]);
            }
            if (payload.eventType === "UPDATE") {
              const updated = payload.new as T;
              return sortIfNeeded(
                current.map((r) => (r.id === updated.id ? updated : r))
              );
            }
            if (payload.eventType === "DELETE") {
              const oldRow = payload.old as T;
              return current.filter((r) => r.id !== oldRow.id);
            }
            return current;
          });
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, orderBy, ascending, filterColumn, filterValue]);

  return { data, loading, connected };
}
