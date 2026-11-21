export interface SeatDescriptor {
  seatNo: number;
  actorId: string;
  displayName: string;
  avatarSeed?: string;
  connected?: boolean;
}

export type ChannelId = string;

export interface ChannelPermission {
  channelId: ChannelId;
  label: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface MatchEventRecord<TPayload = Record<string, unknown>> {
  eventType: string;
  message: string;
  visibleToSeatNos?: number[] | "all";
  payload?: TPayload;
}

export interface CartridgeTransitionResult<TState, TEvent = MatchEventRecord> {
  state: TState;
  events: TEvent[];
  phaseDeadlineMs: number | null;
}

export interface GameCartridge<
  TConfig = unknown,
  TState = unknown,
  TCommand = unknown,
  TPlayerView = unknown,
> {
  cartridgeId: string;
  title: string;
  subtitle: string;
  description: string;
  minSeats: number;
  maxSeats: number;
  available: boolean;

  defaultConfig(seatCount: number): TConfig;
  validateConfig(
    config: TConfig,
    seatCount: number
  ): { valid: boolean; error?: string };

  createInitialState(input: {
    config: TConfig;
    seats: SeatDescriptor[];
    nowMs: number;
    rng?: () => number;
  }): CartridgeTransitionResult<TState>;

  reduce(input: {
    state: TState;
    command: TCommand;
    actorSeatNo: number;
    nowMs: number;
  }): CartridgeTransitionResult<TState>;

  onPhaseTimeout(input: {
    state: TState;
    nowMs: number;
  }): CartridgeTransitionResult<TState>;

  autoActBots?(input: {
    current: CartridgeTransitionResult<TState>;
    botSeatNos: number[];
    nowMs: number;
  }): CartridgeTransitionResult<TState>;

  projectView(input: {
    state: TState;
    viewerSeatNo: number | null;
  }): TPlayerView;

  resolveChannels(input: {
    state: TState;
    viewerSeatNo: number | null;
  }): ChannelPermission[];

  isMatchOver(state: TState): boolean;
  getWinningFaction(state: TState): string | null;
}
