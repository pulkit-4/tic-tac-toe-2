// Nakama TypeScript Runtime Type Definitions
// Based on Nakama v3.x runtime API

declare namespace nkruntime {

  export interface Context {
    readonly env: { [key: string]: string };
    readonly executionMode: string;
    readonly node: string;
    readonly version: string;
    readonly headers: { [key: string]: string[] };
    readonly queryParams: { [key: string]: string[] };
    readonly userId: string;
    readonly username: string;
    readonly vars: { [key: string]: string };
    readonly userSessionExp: number;
    readonly sessionId: string;
    readonly clientIp: string;
    readonly clientPort: string;
    readonly matchId: string;
    readonly matchNode: string;
    readonly matchLabel: string;
    readonly matchTickRate: number;
    readonly lang: string;
  }

  export interface Logger {
    debug(format: string, ...params: any[]): void;
    info(format: string, ...params: any[]): void;
    warn(format: string, ...params: any[]): void;
    error(format: string, ...params: any[]): void;
    withField(key: string, value: string): Logger;
    withFields(fields: { [key: string]: string }): Logger;
    getFields(): { [key: string]: string };
  }

  export interface StorageReadRequest {
    collection: string;
    key: string;
    userId: string;
  }

  export interface StorageObject {
    collection: string;
    key: string;
    userId: string;
    value: string;
    version: string;
    permissionRead: number;
    permissionWrite: number;
    createTime: number;
    updateTime: number;
  }

  export interface StorageWriteRequest {
    collection: string;
    key: string;
    userId: string;
    value: string;
    version?: string;
    permissionRead: number;
    permissionWrite: number;
  }

  export interface StorageWriteAck {
    collection: string;
    key: string;
    userId: string;
    version: string;
  }

  export interface StorageDeleteRequest {
    collection: string;
    key: string;
    userId: string;
    version?: string;
  }

  export enum SortOrder {
    ASCENDING = "asc",
    DESCENDING = "desc",
  }

  export enum Operator {
    BEST = "best",
    SET = "set",
    INCREMENT = "incr",
    DECREMENT = "decr",
  }

  export enum ResetSchedule {
    NEVER = "",
    DAILY = "0 0 * * *",
    WEEKLY = "0 0 * * 1",
    MONTHLY = "0 0 1 * *",
  }

  export interface LeaderboardRecord {
    leaderboardId: string;
    ownerId: string;
    username: string;
    score: number;
    subscore: number;
    numScore: number;
    maxNumScore: number;
    metadata: { [key: string]: any };
    createTime: number;
    updateTime: number;
    expiryTime: number;
    rank: number;
  }

  export interface LeaderboardRecordList {
    records: LeaderboardRecord[];
    ownerRecords: LeaderboardRecord[];
    nextCursor: string;
    prevCursor: string;
  }

  export interface Presence {
    userId: string;
    sessionId: string;
    username: string;
    node: string;
    status?: string;
  }

  export interface Match {
    matchId: string;
    authoritative: boolean;
    label: string;
    size: number;
    tickRate: number;
    handlerName: string;
  }

  export interface MatchMessage {
    sender: Presence;
    opCode: number;
    data: Uint8Array;
    reliable: boolean;
    receiveTime: number;
  }

  export interface MatchDispatcher {
    broadcastMessage(
      opcode: number,
      data: string | null,
      presences: Presence[] | null,
      sender: Presence | null,
      reliable?: boolean
    ): void;
    broadcastMessageDeferred(
      opcode: number,
      data: string | null,
      presences: Presence[] | null,
      sender: Presence | null,
      reliable?: boolean
    ): void;
    matchKick(presences: Presence[]): void;
    matchLabelUpdate(label: string): void;
  }

  export type MatchInitFunction<T> = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    params: { [key: string]: string }
  ) => { state: T; tickRate: number; label: string };

  export type MatchJoinAttemptFunction<T> = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: MatchDispatcher,
    tick: number,
    state: T,
    presence: Presence,
    metadata: { [key: string]: any }
  ) => { state: T; accept: boolean; rejectMessage?: string } | null;

  export type MatchJoinFunction<T> = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: MatchDispatcher,
    tick: number,
    state: T,
    presences: Presence[]
  ) => { state: T } | null;

  export type MatchLeaveFunction<T> = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: MatchDispatcher,
    tick: number,
    state: T,
    presences: Presence[]
  ) => { state: T } | null;

  export type MatchLoopFunction<T> = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: MatchDispatcher,
    tick: number,
    state: T,
    messages: MatchMessage[]
  ) => { state: T } | null;

  export type MatchTerminateFunction<T> = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: MatchDispatcher,
    tick: number,
    state: T,
    graceSeconds: number
  ) => { state: T } | null;

  export type MatchSignalFunction<T> = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    dispatcher: MatchDispatcher,
    tick: number,
    state: T,
    data: string
  ) => { state: T; data?: string } | null;

  export interface MatchHandler<T = unknown> {
    matchInit: MatchInitFunction<T>;
    matchJoinAttempt: MatchJoinAttemptFunction<T>;
    matchJoin: MatchJoinFunction<T>;
    matchLeave: MatchLeaveFunction<T>;
    matchLoop: MatchLoopFunction<T>;
    matchTerminate: MatchTerminateFunction<T>;
    matchSignal: MatchSignalFunction<T>;
  }

  export type RpcFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    payload: string
  ) => string;

  export interface MatchmakerEntry {
    ticket: string;
    presence: Presence;
    properties: { [key: string]: string | number | boolean };
  }

  export type MatchmakerMatchedFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    matches: MatchmakerEntry[]
  ) => string | void;

  export interface Tournament {
    id: string;
    title: string;
    description: string;
    category: number;
    sortOrder: string;
    size: number;
    maxSize: number;
    maxNumScore: number;
    canEnter: boolean;
    endActive: number;
    nextReset: number;
    metadata: { [key: string]: any };
    createTime: number;
    startTime: number;
    endTime: number;
    duration: number;
    startActive: number;
  }

  export interface Leaderboard {
    id: string;
    authoritative: boolean;
    sortOrder: string;
    operator: string;
    resetSchedule: string;
    metadata: { [key: string]: any };
    createTime: number;
  }

  export interface Event {
    name: string;
    properties: { [key: string]: string };
    timestamp: number;
    external: boolean;
  }

  export type TournamentEndFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    tournament: Tournament,
    end: number,
    reset: number
  ) => void;

  export type TournamentResetFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    tournament: Tournament,
    end: number,
    reset: number
  ) => void;

  export type LeaderboardResetFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    leaderboard: Leaderboard,
    reset: number
  ) => void;

  export type EventFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    event: Event
  ) => void;

  export interface Initializer {
    registerRpc(id: string, func: RpcFunction): void;
    registerMatch<T>(id: string, handler: MatchHandler<T>): void;
    registerMatchmakerMatched(func: MatchmakerMatchedFunction): void;
    registerTournamentEnd(func: TournamentEndFunction): void;
    registerTournamentReset(func: TournamentResetFunction): void;
    registerLeaderboardReset(func: LeaderboardResetFunction): void;
    registerEvent(id: string, func: EventFunction): void;
  }

  export type InitModule = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    initializer: Initializer
  ) => void;

  export interface Nakama {
    matchCreate(module: string, params?: { [key: string]: string }): string;
    matchList(
      limit: number,
      authoritative: boolean,
      label: string,
      minSize: number,
      maxSize: number,
      query: string
    ): Match[];
    matchGet(matchId: string): Match | null;
    matchSignal(matchId: string, data: string): string;

    storageRead(reads: StorageReadRequest[]): StorageObject[];
    storageWrite(writes: StorageWriteRequest[]): StorageWriteAck[];
    storageDelete(deletes: StorageDeleteRequest[]): void;
    storageList(
      userId: string,
      collection: string,
      limit: number,
      cursor?: string
    ): { objects: StorageObject[]; cursor: string };

    leaderboardCreate(
      id: string,
      authoritative: boolean,
      sortOrder: SortOrder,
      operator: Operator,
      resetSchedule: ResetSchedule,
      metadata: { [key: string]: any },
      enableRanks?: boolean
    ): void;
    leaderboardDelete(id: string): void;
    leaderboardRecordsList(
      id: string,
      ownerIds: string[],
      limit: number,
      cursor?: string,
      expiry?: number
    ): LeaderboardRecordList;
    leaderboardRecordWrite(
      id: string,
      ownerId: string,
      username: string,
      score: number,
      subscore: number,
      metadata: { [key: string]: any },
      operator?: Operator
    ): LeaderboardRecord;
    leaderboardRecordDelete(id: string, ownerId: string): void;

    uuidV4(): string;
    binaryToString(data: Uint8Array): string;
    stringToBinary(str: string): Uint8Array;
    base64Encode(input: string | Uint8Array, padding?: boolean): string;
    base64Decode(input: string, padding?: boolean): Uint8Array;
    md5Hash(input: string): string;
    sha256Hash(input: string): string;

    sqlExec(query: string, parameters?: any[]): { rowsAffected: number };
    sqlQuery(query: string, parameters?: any[]): { [column: string]: any }[];

    httpRequest(
      url: string,
      method: string,
      headers?: { [key: string]: string },
      body?: string,
      timeoutMs?: number
    ): { code: number; headers: { [key: string]: string }; body: string };

    localcacheGet(key: string): any;
    localcachePut(key: string, value: any, ttlSeconds?: number): void;
    localcacheDelete(key: string): void;

    accountGetId(userId: string): Account;
    accountsGetId(userIds: string[]): Account[];
    accountGetUsername(username: string): Account;
    accountUpdateId(
      userId: string,
      params: {
        username?: string;
        display_name?: string;
        timezone?: string;
        location?: string;
        lang_tag?: string;
        avatar_url?: string;
        metadata?: { [key: string]: any };
      }
    ): void;
    accountDeleteId(userId: string, recorded?: boolean): void;

    notificationSend(
      userId: string,
      subject: string,
      content: { [key: string]: any },
      code: number,
      senderId?: string,
      persistent?: boolean
    ): void;

    usersGetId(userIds: string[], facebookIds?: string[]): User[];
    usersGetUsername(usernames: string[]): User[];
    usersBanId(userIds: string[]): void;
    usersUnbanId(userIds: string[]): void;
  }

  export interface Account {
    user: User;
    wallet: string;
    email: string;
    devices: { id: string }[];
    customId: string;
    verifyTime: number;
    disableTime: number;
  }

  export interface User {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    langTag: string;
    location: string;
    timezone: string;
    metadata: { [key: string]: any };
    facebookId: string;
    googleId: string;
    gamecenterId: string;
    steamId: string;
    online: boolean;
    edgeCount: number;
    createTime: number;
    updateTime: number;
  }

  export interface Group {
    id: string;
    creatorId: string;
    name: string;
    description: string;
    langTag: string;
    metadata: { [key: string]: any };
    avatarUrl: string;
    open: boolean;
    edgeCount: number;
    maxCount: number;
    createTime: number;
    updateTime: number;
  }

  export interface WalletLedgerItem {
    id: string;
    userId: string;
    changeset: { [key: string]: number };
    metadata: { [key: string]: any };
    createTime: number;
    updateTime: number;
  }
}
