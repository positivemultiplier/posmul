"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  INITIAL_STUDY_GROUPS,
  type StudyGroupChatMessage,
  type StudyGroupRoom,
} from "@/data/study-timer-tools";

const STORAGE_KEY = "housing_pro_study_groups_v1";
const SYNC_EVENT = "housing-pro-study-groups-sync";

export interface GroupMemberProfilePref {
  nickname: string;
  coneEmoji: string;
}

interface PersistedGroupsState {
  customRooms: StudyGroupRoom[];
  joinedRoomIds: string[];
  activeRoomId: string;
  profilesByRoomId: Record<string, GroupMemberProfilePref>;
  chatsByRoomId: Record<string, StudyGroupChatMessage[]>;
}

const DEFAULT_PERSISTED: PersistedGroupsState = {
  customRooms: [],
  joinedRoomIds: ["grp-cert-open", "grp-29th-pass", "grp-2nd-focus"],
  activeRoomId: "grp-29th-pass",
  profilesByRoomId: {},
  chatsByRoomId: {},
};

function readPersisted(): PersistedGroupsState {
  if (typeof window === "undefined") return DEFAULT_PERSISTED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERSISTED;
    const parsed = JSON.parse(raw) as Partial<PersistedGroupsState>;
    return {
      customRooms: Array.isArray(parsed.customRooms) ? parsed.customRooms : [],
      joinedRoomIds: Array.isArray(parsed.joinedRoomIds)
        ? parsed.joinedRoomIds
        : DEFAULT_PERSISTED.joinedRoomIds,
      activeRoomId: parsed.activeRoomId || DEFAULT_PERSISTED.activeRoomId,
      profilesByRoomId: parsed.profilesByRoomId || {},
      chatsByRoomId: parsed.chatsByRoomId || {},
    };
  } catch {
    return DEFAULT_PERSISTED;
  }
}

function writePersisted(next: PersistedGroupsState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // ignore quota error
  }
}

export interface CreateStudyRoomInput {
  title: string;
  password?: string;
  category: string;
  goalHours: number;
  capacity: number;
  notice: string;
  studyType: "general" | "cam";
  joinMethod: "instant" | "approval";
  nicknameRule?: string;
  myNickname: string;
  myConeEmoji: string;
}

export function useStudyGroupsStore() {
  const [persisted, setPersisted] = useState<PersistedGroupsState>(DEFAULT_PERSISTED);

  useEffect(() => {
    setPersisted(readPersisted());
    const handleSync = () => {
      setPersisted(readPersisted());
    };
    window.addEventListener(SYNC_EVENT, handleSync);
    return () => window.removeEventListener(SYNC_EVENT, handleSync);
  }, []);

  const updateStore = useCallback(
    (updater: (prev: PersistedGroupsState) => PersistedGroupsState) => {
      const current = readPersisted();
      const next = updater(current);
      writePersisted(next);
      setPersisted(next);
    },
    []
  );

  const rooms = useMemo(() => {
    const combined = [...persisted.customRooms, ...INITIAL_STUDY_GROUPS];
    return combined.map((room) => {
      const extraChats = persisted.chatsByRoomId[room.id];
      if (!extraChats || extraChats.length === 0) return room;
      return {
        ...room,
        chats: [...room.chats, ...extraChats],
      };
    });
  }, [persisted.customRooms, persisted.chatsByRoomId]);

  const joinedRooms = useMemo(() => {
    const map = new Map(rooms.map((r) => [r.id, r]));
    return persisted.joinedRoomIds
      .map((id) => map.get(id))
      .filter((r): r is StudyGroupRoom => Boolean(r));
  }, [rooms, persisted.joinedRoomIds]);

  const setActiveRoomId = useCallback(
    (roomId: string) => {
      updateStore((prev) => ({ ...prev, activeRoomId: roomId }));
    },
    [updateStore]
  );

  const createAndJoinRoom = useCallback(
    (input: CreateStudyRoomInput): string => {
      const newId = `grp-custom-${Date.now()}`;
      const newRoom: StudyGroupRoom = {
        id: newId,
        title: input.title.trim(),
        category: input.category,
        studyType: input.studyType,
        joinMethod: input.joinMethod,
        password: input.password?.trim() || undefined,
        nicknameRule: input.nicknameRule?.trim() || undefined,
        requiresCam: input.studyType === "cam",
        hasMission: true,
        notice:
          input.notice.trim() ||
          "오늘도 주택관리사(보) 합격을 향해 함께 집중합시다!",
        leaderName: input.myNickname.trim() || "posmul",
        goalHours: input.goalHours,
        capacity: input.capacity,
        memberCount: 1,
        attendancePct: 100,
        isPublic: !input.password?.trim(),
        createdLabel: "오늘 개설",
        createdAtMs: Date.now(),
        members: [],
        chats: [],
      };

      updateStore((prev) => ({
        ...prev,
        customRooms: [newRoom, ...prev.customRooms],
        joinedRoomIds: [...prev.joinedRoomIds, newId],
        activeRoomId: newId,
        profilesByRoomId: {
          ...prev.profilesByRoomId,
          [newId]: {
            nickname: input.myNickname.trim() || "posmul",
            coneEmoji: input.myConeEmoji,
          },
        },
      }));

      return newId;
    },
    [updateStore]
  );

  const joinRoomWithProfile = useCallback(
    (roomId: string, profile: GroupMemberProfilePref) => {
      updateStore((prev) => {
        const nextJoined = prev.joinedRoomIds.includes(roomId)
          ? prev.joinedRoomIds
          : [...prev.joinedRoomIds, roomId];
        return {
          ...prev,
          joinedRoomIds: nextJoined,
          activeRoomId: roomId,
          profilesByRoomId: {
            ...prev.profilesByRoomId,
            [roomId]: {
              nickname: profile.nickname.trim() || "posmul",
              coneEmoji: profile.coneEmoji,
            },
          },
        };
      });
    },
    [updateStore]
  );

  const updateRoomProfile = useCallback(
    (roomId: string, profile: GroupMemberProfilePref) => {
      updateStore((prev) => ({
        ...prev,
        profilesByRoomId: {
          ...prev.profilesByRoomId,
          [roomId]: {
            nickname: profile.nickname.trim() || "posmul",
            coneEmoji: profile.coneEmoji,
          },
        },
      }));
    },
    [updateStore]
  );

  const leaveRoom = useCallback(
    (roomId: string) => {
      updateStore((prev) => {
        const nextJoined = prev.joinedRoomIds.filter((id) => id !== roomId);
        const nextActive =
          prev.activeRoomId === roomId ? nextJoined[0] || "" : prev.activeRoomId;
        return {
          ...prev,
          joinedRoomIds: nextJoined,
          activeRoomId: nextActive,
        };
      });
    },
    [updateStore]
  );

  const addGroupChat = useCallback(
    (roomId: string, msg: StudyGroupChatMessage) => {
      updateStore((prev) => ({
        ...prev,
        chatsByRoomId: {
          ...prev.chatsByRoomId,
          [roomId]: [...(prev.chatsByRoomId[roomId] || []), msg],
        },
      }));
    },
    [updateStore]
  );

  return {
    rooms,
    joinedRoomIds: persisted.joinedRoomIds,
    joinedRooms,
    activeRoomId: persisted.activeRoomId,
    profilesByRoomId: persisted.profilesByRoomId,
    setActiveRoomId,
    createAndJoinRoom,
    joinRoomWithProfile,
    updateRoomProfile,
    leaveRoom,
    addGroupChat,
  };
}
