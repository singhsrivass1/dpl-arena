// Pure helper functions for converting a single ball event into score deltas.
// Overs are stored as decimals where the integer part is completed overs and
// the first decimal digit is the ball count within the current over (0-5).

export function parseOvers(overs: number): { overPart: number; ballPart: number } {
  const overPart = Math.floor(overs);
  const ballPart = Math.round((overs - overPart) * 10);
  return { overPart, ballPart };
}

export function formatOvers(overPart: number, ballPart: number): number {
  return Math.round((overPart + ballPart / 10) * 10) / 10;
}

export type BallType = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "W" | "Wd" | "Nb";

export const BALL_TYPES: BallType[] = ["0", "1", "2", "3", "4", "5", "6", "W", "Wd", "Nb"];

export interface BallInput {
  runs: number;
  wickets: number;
  overs: number;
  extras: number;
  lastOver: string[];
}

export interface BallResult {
  runs: number;
  wickets: number;
  overs: number;
  extras: number;
  lastOver: string[];
  swapStrike: boolean;
  overCompleted: boolean;
  runValue: number;
  isExtra: boolean;
  isWicket: boolean;
  ballCounts: boolean;
}

/** Compute the new team score state after a single delivery. */
export function computeBall(ballType: BallType, current: BallInput): BallResult {
  const isExtra = ballType === "Wd" || ballType === "Nb";
  const isWicket = ballType === "W";
  const runValue = isExtra ? 1 : isWicket ? 0 : parseInt(ballType, 10);
  const ballCounts = !isExtra;

  const { overPart, ballPart } = parseOvers(current.overs);
  let newOverPart = overPart;
  let newBallPart = ballPart;
  let overCompleted = false;

  if (ballCounts) {
    newBallPart += 1;
    if (newBallPart === 6) {
      newOverPart += 1;
      newBallPart = 0;
      overCompleted = true;
    }
  }

  const newOvers = formatOvers(newOverPart, newBallPart);
  const newRuns = current.runs + runValue;
  const newWickets = current.wickets + (isWicket ? 1 : 0);
  const newExtras = current.extras + (isExtra ? 1 : 0);

  let newLastOver: string[];
  if (ballCounts && newBallPart === 0) {
    // A fresh over begins — start the ball-tracker over.
    newLastOver = [ballType];
  } else {
    newLastOver = [...current.lastOver, ballType].slice(-8);
  }

  const swapForRun = runValue % 2 === 1 && !isWicket;
  const swapStrike = swapForRun !== overCompleted; // XOR

  return {
    runs: newRuns,
    wickets: newWickets,
    overs: newOvers,
    extras: newExtras,
    lastOver: newLastOver,
    swapStrike,
    overCompleted,
    runValue,
    isExtra,
    isWicket,
    ballCounts,
  };
}

/** Increment a bowler's overs figure by one legal ball. */
export function incrementBowlerOvers(overs: number): number {
  const { overPart, ballPart } = parseOvers(overs);
  let newOverPart = overPart;
  let newBallPart = ballPart + 1;
  if (newBallPart === 6) {
    newOverPart += 1;
    newBallPart = 0;
  }
  return formatOvers(newOverPart, newBallPart);
}
