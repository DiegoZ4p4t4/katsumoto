import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { queryKeys } from "@/lib/query-keys";
import { useRealtimeStatus } from "@/lib/realtime-context";

type ChannelState = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR";

export function useRealtime(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  const { setStatus } = useRealtimeStatus();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const handleInvalidate = useCallback(
    (keys: readonly unknown[]) => {
      queryClient.invalidateQueries({ queryKey: keys as unknown[] });
    },
    [queryClient]
  );

  useEffect(() => {
    if (!organizationId) return;

    const channelName = `org-${organizationId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "branch_stock",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          handleInvalidate(queryKeys.branches.allStock);
          handleInvalidate(queryKeys.branches.all);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          handleInvalidate(queryKeys.invoices.all);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stock_movements",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          handleInvalidate(queryKeys.movements.all);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cash_registers",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          handleInvalidate(queryKeys.registers.all);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          handleInvalidate(queryKeys.clients.all);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "despatches",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          handleInvalidate(queryKeys.despatches.all);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          handleInvalidate(queryKeys.products.all);
        }
      )
      .subscribe((state: ChannelState, err?: Error) => {
        if (state === "SUBSCRIBED") {
          setStatus("connected");
        } else if (state === "TIMED_OUT" || state === "CHANNEL_ERROR") {
          setStatus("reconnecting");
          if (err) console.error("[realtime] channel error:", err.message);
        } else if (state === "CLOSED") {
          setStatus("disconnected");
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setStatus("disconnected");
    };
  }, [organizationId, handleInvalidate]);

  return { status };
}
