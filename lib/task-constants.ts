// Sort order offsets keep pinned and pending groups in separate numeric ranges,
// preventing collisions when both groups use 0-based indexes.
export const PINNED_SORT_OFFSET = 0;
export const PENDING_SORT_OFFSET = 10000;
