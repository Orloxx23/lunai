export function generateProjectName(): string {
  const adjectives = [
    "Brilliant",
    "Silent",
    "Cosmic",
    "Swift",
    "Quantum",
    "Lunar",
    "Bright",
    "Sonic",
    "Nova",
    "Electric",
  ];

  const nouns = [
    "Phoenix",
    "Wave",
    "Falcon",
    "Engine",
    "Orbit",
    "Horizon",
    "Pulse",
    "Drift",
    "Echo",
    "Fusion",
  ];

  const randomNumber = Math.floor(Math.random() * 1000);

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  const projectName = `${randomAdjective}${randomNoun}${randomNumber}`;

  return projectName;
}

export function generateUUID(): string {
  return (([1e7] as any) + -1e3 + -4e3 + -8e3 + -1e11).replace(
    /[018]/g,
    (c: any) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16)
  );
}
