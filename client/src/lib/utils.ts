import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Random name and username generation
const FIRST_NAMES = [
  "Alex", "Bailey", "Casey", "Dakota", "Elena", "Finley", "Grace", "Harper",
  "Iris", "Jamie", "Kai", "Logan", "Morgan", "Nova", "Owen", "Parker",
  "Quinn", "Riley", "Sam", "Taylor", "Uno", "Vale", "Wade", "Xavier",
  "Yara", "Zola"
];

const LAST_NAMES = [
  "Adams", "Brooks", "Carter", "Davis", "Evans", "Foster", "Green", "Harris",
  "Irving", "James", "King", "Lewis", "Martin", "Nelson", "Owen", "Parker",
  "Quinn", "Roberts", "Smith", "Taylor", "Underwood", "Vaughn", "Walker",
  "Young", "Zimmerman"
];

export function generateRandomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function generateRandomUsername(): string {
  const adjectives = ["cool", "happy", "smart", "brave", "quick", "swift"];
  const animals = ["panda", "tiger", "eagle", "wolf", "fox", "lion"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj}${animal}${num}`;
}
