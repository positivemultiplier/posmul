"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface RealtimeConnectionConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

export interface RealtimeConnectionState {
  status: "connecting" | "connected" | "disconnected" | "error";
  lastConnected?: Date;
  reconnectAttempts: number;
  error?: string;
}

export interface RealtimeMessage<T = any> {
  type: string;
  data: T;
  timestamp: Date;
  id?: string;
}

export interface UseRealtimeConnectionReturn {
  connectionState: RealtimeConnectionState;
  sendMessage: (type: string, data: any) => boolean;
  subscribe: (type: string, handler: (data: any) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
}

const DEFAULT_CONFIG: Required<Omit<RealtimeConnectionConfig, "url">> = {
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  debug: false,
};

export function useRealtimeConnection(
  config: RealtimeConnectionConfig
): UseRealtimeConnectionReturn {
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>({
      status: "disconnected",
      reconnectAttempts: 0,
    });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const subscribersRef = useRef<Map<string, Set<(data: any) => void>>>(
    new Map()
  );
  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });

  const log = useCallback((_message: string, _data?: any) => {
    if (configRef.current.debug) {
      void _message;
      void _data;
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    clearInterval(heartbeatIntervalRef.current);
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "ping", timestamp: Date.now() })
        );
        log("Heartbeat sent");
      }
    }, configRef.current.heartbeatInterval);
  }, [log]);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data);
        message.timestamp = new Date(message.timestamp || Date.now());

        log("Message received", message);

        // Handle pong response
        if (message.type === "pong") {
          return;
        }

        // Notify subscribers
        const handlers = subscribersRef.current.get(message.type);
        if (handlers) {
          handlers.forEach((handler) => {
            try {
              handler(message.data);
            } catch (error) {
              void error;
            }
          });
        }
      } catch (error) {
        void error;
      }
    },
    [log]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      log("Already connected");
      return;
    }

    clearTimers();

    setConnectionState((prev) => ({
      ...prev,
      status: "connecting",
      error: undefined,
    }));

    log("Connecting to", configRef.current.url);

    try {
      const ws = new WebSocket(configRef.current.url);

      ws.onopen = () => {
        log("Connected successfully");
        wsRef.current = ws;
        setConnectionState({
          status: "connected",
          lastConnected: new Date(),
          reconnectAttempts: 0,
        });
        startHeartbeat();
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        log("Connection closed", { code: event.code, reason: event.reason });
        clearTimers();

        setConnectionState((prev) => {
          const newState: RealtimeConnectionState = {
            ...prev,
            status: "disconnected",
          };

          // Auto-reconnect if not manually closed
          if (
            event.code !== 1000 &&
            prev.reconnectAttempts < configRef.current.maxReconnectAttempts
          ) {
            newState.reconnectAttempts = prev.reconnectAttempts + 1;

            reconnectTimeoutRef.current = setTimeout(() => {
              log(`Reconnecting... (attempt ${newState.reconnectAttempts})`);
              connect();
            }, configRef.current.reconnectInterval);
          }

          return newState;
        });
      };

      ws.onerror = (error) => {
        log("WebSocket error", error);
        setConnectionState((prev) => ({
          ...prev,
          status: "error",
          error: "Connection error occurred",
        }));
      };

      wsRef.current = ws;
    } catch (error) {
      log("Failed to create WebSocket", error);
      setConnectionState((prev) => ({
        ...prev,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, [log, handleMessage, startHeartbeat, clearTimers]);

  const disconnect = useCallback(() => {
    log("Disconnecting...");
    clearTimers();

    if (wsRef.current) {
      wsRef.current.close(1000, "Manual disconnect");
      wsRef.current = null;
    }

    setConnectionState({
      status: "disconnected",
      reconnectAttempts: 0,
    });
  }, [log, clearTimers]);

  const sendMessage = useCallback(
    (type: string, data: any): boolean => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        log("Cannot send message - not connected");
        return false;
      }

      const message: RealtimeMessage = {
        type,
        data,
        timestamp: new Date(),
        id: crypto.randomUUID(),
      };

      try {
        wsRef.current.send(JSON.stringify(message));
        log("Message sent", message);
        return true;
      } catch (error) {
        log("Failed to send message", error);
        return false;
      }
    },
    [log]
  );

  const subscribe = useCallback(
    (type: string, handler: (data: any) => void): (() => void) => {
      if (!subscribersRef.current.has(type)) {
        subscribersRef.current.set(type, new Set());
      }

      subscribersRef.current.get(type)!.add(handler);
      log(`Subscribed to ${type}`);

      return () => {
        const handlers = subscribersRef.current.get(type);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            subscribersRef.current.delete(type);
          }
        }
        log(`Unsubscribed from ${type}`);
      };
    },
    [log]
  );

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update config when it changes
  useEffect(() => {
    configRef.current = { ...DEFAULT_CONFIG, ...config };
  }, [config]);

  return {
    connectionState,
    sendMessage,
    subscribe,
    connect,
    disconnect,
  };
}
