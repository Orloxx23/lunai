export function copyToClipboard(
  text: string,
  callback?: (value?: any) => void
) {
  navigator?.clipboard.writeText(text).then(() => {
    callback && callback();
  });
}
