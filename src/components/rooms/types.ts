import type { RoomSnapshotForActor } from "@/platform/coordinator";

export type SendRoomAction = (payload: Record<string, unknown>) => Promise<void>;

export interface GameRoomModuleProps {
  snapshot: RoomSnapshotForActor | null;
  normalizedCode: string;
  isLobby: boolean;
  busy: boolean;
  soundEnabled: boolean;
  sendRoomAction: SendRoomAction;
  setErrorMsg: (msg: string | null) => void;
  onOpenDrawer: () => void;
}

export interface GameConfigModalProps {
  snapshot: RoomSnapshotForActor | null;
  isLobby: boolean;
  busy: boolean;
  sendRoomAction: SendRoomAction;
}
