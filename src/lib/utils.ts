import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(value: string) {
  return value.toLowerCase().replace(/(^|[\s-])([a-z])/g, (_, separator: string, letter: string) =>
    `${separator}${letter.toUpperCase()}`
  );
}
