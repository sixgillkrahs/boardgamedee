type RoomListener = (code: string) => void;

const globalForBus = globalThis as unknown as {
  roomListeners?: Map<string, Set<RoomListener>>;
};

function getListenerMap(): Map<string, Set<RoomListener>> {
  if (!globalForBus.roomListeners) {
    globalForBus.roomListeners = new Map();
  }
  return globalForBus.roomListeners;
}

export function subscribeToRoom(
  code: string,
  listener: RoomListener
): () => void {
  const normalized = code.toUpperCase();
  const map = getListenerMap();
  let set = map.get(normalized);
  if (!set) {
    set = new Set();
    map.set(normalized, set);
  }
  set.add(listener);

  return () => {
    const currentSet = map.get(normalized);
    if (!currentSet) return;
    currentSet.delete(listener);
    if (currentSet.size === 0) {
      map.delete(normalized);
    }
  };
}

export function publishRoomUpdate(code: string): void {
  const normalized = code.toUpperCase();
  const set = getListenerMap().get(normalized);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(normalized);
    } catch {
      // ignore individual listener errors
    }
  }
}
