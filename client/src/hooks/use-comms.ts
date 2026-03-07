import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, ws as wsSchema } from "@shared/routes";
import { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";

export function useMessages(otherId: number) {
  return useQuery({
    queryKey: [api.messages.list.path, otherId],
    queryFn: async () => {
      if (!otherId) return [];
      const url = buildUrl(api.messages.list.path, { otherId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
    enabled: !!otherId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.messages.send.input.parse(data);
      const res = await fetch(api.messages.send.path, {
        method: api.messages.send.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.messages.send.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, data.receiverId] });
    },
  });
}

export function useWebRTC(currentUserId?: number) {
  const [wsConnected, setWsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ senderId: number, signal: any } | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const ws = useRef<WebSocket | null>(null);
  const peer = useRef<Peer.Instance | null>(null);

  useEffect(() => {
    if (!currentUserId) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => setWsConnected(true);
    ws.current.onclose = () => setWsConnected(false);
    
    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'signal') {
          const payload = wsSchema.receive.signal.parse(message.payload);
          
          if (peer.current && !peer.current.destroyed) {
            peer.current.signal(payload.signalData);
          } else {
            setIncomingCall({ senderId: payload.senderId, signal: payload.signalData });
          }
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    return () => {
      if (ws.current) ws.current.close();
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (peer.current) peer.current.destroy();
    };
  }, [currentUserId]);

  const initStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      return mediaStream;
    } catch (err) {
      console.error("Failed to get media stream", err);
      return null;
    }
  };

  const callUser = async (receiverId: number) => {
    const mediaStream = stream || await initStream();
    if (!mediaStream) return;

    peer.current = new Peer({
      initiator: true,
      trickle: false,
      stream: mediaStream,
    });

    peer.current.on('signal', (data) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        const payload = { receiverId, signalData: data };
        ws.current.send(JSON.stringify({ type: 'signal', payload }));
      }
    });

    peer.current.on('stream', (remote) => {
      setRemoteStream(remote);
    });
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    const mediaStream = stream || await initStream();
    if (!mediaStream) return;

    peer.current = new Peer({
      initiator: false,
      trickle: false,
      stream: mediaStream,
    });

    peer.current.on('signal', (data) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        const payload = { receiverId: incomingCall.senderId, signalData: data };
        ws.current.send(JSON.stringify({ type: 'signal', payload }));
      }
    });

    peer.current.on('stream', (remote) => {
      setRemoteStream(remote);
    });

    peer.current.signal(incomingCall.signal);
    setIncomingCall(null);
  };

  const endCall = () => {
    if (peer.current) peer.current.destroy();
    setRemoteStream(null);
    setIncomingCall(null);
  };

  return {
    wsConnected,
    stream,
    remoteStream,
    incomingCall,
    callUser,
    answerCall,
    endCall,
    initStream
  };
}
