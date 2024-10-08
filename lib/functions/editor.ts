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

export function generateUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
