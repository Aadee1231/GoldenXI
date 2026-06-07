export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  return "http://localhost:3000";
}

export function getInviteUrl(joinCode: string): string {
  return `${getSiteUrl()}/join/${joinCode}`;
}

export function getBracketShareUrl(username: string): string {
  return `${getSiteUrl()}/u/${username}/bracket`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

export async function nativeShare(data: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      return false;
    }
    console.error("Failed to share:", error);
    return false;
  }
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

export function getGroupInviteShareText(groupName: string): string {
  return `Join my GoldenXI World Cup bracket group: ${groupName}. Make your picks and compete with us!`;
}

export function getBracketShareText(): string {
  return "I just made my GoldenXI World Cup bracket. Think you can beat my picks?";
}
