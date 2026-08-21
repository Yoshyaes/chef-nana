// Fixed cap, not a cap at remaining seats — a selector that maxes out at the
// actual remaining count would leak availability. Shared by the client
// selector (convenience only) and the server-side validation (the real gate).
export const MAX_TICKETS_PER_ORDER = 6
