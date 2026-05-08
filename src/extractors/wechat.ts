export function isWechatHost(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase() === "mp.weixin.qq.com";
  } catch {
    return false;
  }
}

export function isWechatDeletedHtml(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    lower.includes("该内容已被发布者删除") ||
    lower.includes("此内容因违规无法查看") ||
    lower.includes("内容被删除") ||
    lower.includes("此内容被投诉且经审核涉嫌侵权")
  );
}
