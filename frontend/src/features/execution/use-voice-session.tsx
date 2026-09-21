import { useState, useRef, useCallback } from "react";
import { Room, RoomEvent, RemoteTrack, RemoteParticipant, Track } from "livekit-client";
import { APP_CONFIG } from "../../config/constants";

export interface LiveMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  time: string;
}

export interface ItemUpdate {
  item_id: string;
  response: string;
  question?: string;
}

export function useVoiceSession() {
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [isAgentSpeaking, setIsAgentSpeaking] = useState<boolean>(false);
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [latestItemUpdate, setLatestItemUpdate] = useState<ItemUpdate | null>(null);
  const [auditSubmittedTrigger, setAuditSubmittedTrigger] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);

  const roomRef = useRef<Room | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeUnitIdRef = useRef<string>(APP_CONFIG.defaultUnitId);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mixedDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const userMicStreamRef = useRef<MediaStream | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const uploadAudioSession = async (audioBlob: Blob, unitId: string) => {
    if (audioBlob.size === 0) return;

    setIsUploadingAudio(true);
    const formData = new FormData();
    formData.append("file", audioBlob, `${unitId}-call.webm`);
    formData.append("unit_id", unitId);

    const token = typeof window !== "undefined" ? localStorage.getItem("sonura_token") : null;
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${APP_CONFIG.apiUrl}/api/v1/audio/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setRecordedAudioUrl(data.signed_url);
      }
    } catch (error) {
      console.error("Failed to upload recorded voice session:", error);
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const setupAudioMixer = async (): Promise<MediaStream | null> => {
    try {
      const userMic = await navigator.mediaDevices.getUserMedia({ audio: true });
      userMicStreamRef.current = userMic;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const destination = audioCtx.createMediaStreamDestination();
      mixedDestinationRef.current = destination;

      const micSource = audioCtx.createMediaStreamSource(userMic);
      micSource.connect(destination);

      return destination.stream;
    } catch (err) {
      console.error("Could not initialize local audio recorder mixer:", err);
      return null;
    }
  };

  const endSession = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }

    if (userMicStreamRef.current) {
      userMicStreamRef.current.getTracks().forEach((track) => track.stop());
      userMicStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    setConnectionState("disconnected");
    setIsAgentSpeaking(false);
  }, []);

  const startSession = useCallback(async (unitId: string = APP_CONFIG.defaultUnitId) => {
    endSession();

    setConnectionState("connecting");
    activeUnitIdRef.current = unitId;
    audioChunksRef.current = [];
    setAuditSubmittedTrigger(false);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("sonura_token") : null;
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const tokenRes = await fetch(`${APP_CONFIG.apiUrl}/api/v1/voice/token`, {
        method: "POST",
        headers,
        body: JSON.stringify({ unit_id: unitId }),
        signal: abortController.signal,
      });

      if (!tokenRes.ok) {
        throw new Error("Unable to obtain LiveKit token");
      }

      const { token: connectionJwt } = await tokenRes.json();
      const mixedStream = await setupAudioMixer();

      if (mixedStream) {
        let options = { mimeType: "audio/webm" };
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options = { mimeType: "audio/webm;codecs=opus" };
        }

        const recorder = new MediaRecorder(mixedStream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const finalBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          await uploadAudioSession(finalBlob, activeUnitIdRef.current);
        };

        recorder.start(1000);
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        const isAgent = participant.identity.includes("agent") ? true : participant.identity.includes("sonura");
        if (isAgent) {
          setConnectionState("connected");
        }
      });

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication, participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElement.play();
          setConnectionState("connected");

          if (audioContextRef.current) {
            if (mixedDestinationRef.current) {
              try {
                const remoteStream = new MediaStream([track.mediaStreamTrack]);
                const remoteSource = audioContextRef.current.createMediaStreamSource(remoteStream);
                remoteSource.connect(mixedDestinationRef.current);
              } catch (mixErr) {
                console.warn("Could not route remote track to audio mixer:", mixErr);
              }
            }
          }
        }
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const isAgentActive = speakers.some((s) => {
          return s.identity.includes("agent") ? true : s.identity.includes("sonura");
        });
        setIsAgentSpeaking(isAgentActive);
      });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const decoder = new TextDecoder();
          const parsed = JSON.parse(decoder.decode(payload));

          if (parsed.type === "checklist_updated") {
            setLatestItemUpdate({
              item_id: parsed.item_id,
              response: parsed.response,
              question: parsed.question,
            });
          }

          if (parsed.type === "audit_submitted") {
            setAuditSubmittedTrigger(true);
          }

          if (parsed.type === "transcript") {
            setLiveMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                sender: parsed.sender || "agent",
                text: parsed.text,
                time: new Date().toLocaleTimeString(),
              },
            ]);
          }
        } catch (err) {
          console.error("Failed to parse LiveKit data packet:", err);
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setConnectionState("disconnected");
        setIsAgentSpeaking(false);
      });

      await room.connect(APP_CONFIG.livekitUrl, connectionJwt);
      await room.localParticipant.enableCameraAndMicrophone();

      const hasAgentAlready = Array.from(room.remoteParticipants.values()).some((p) => {
        return p.identity.includes("agent") ? true : p.identity.includes("sonura");
      });
      if (hasAgentAlready) {
        setConnectionState("connected");
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      if (errorObj.name !== "AbortError") {
        console.error("LiveKit connection failure:", err);
      }
      endSession();
    }
  }, [endSession]);

  return {
    connectionState,
    isAgentSpeaking,
    liveMessages,
    latestItemUpdate,
    auditSubmittedTrigger,
    recordedAudioUrl,
    isUploadingAudio,
    startSession,
    endSession,
  };
}