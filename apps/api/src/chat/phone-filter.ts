/**
 * 站内消息禁止直接交换电话号码，逼着双方留在平台内沟通(方便纠纷仲裁/客服介入)。
 * 这里用启发式规则检测：把文本里所有分隔符(空格/短横线/点/括号)去掉后，
 * 找连续 8 位以上数字串——这基本覆盖澳洲手机/座机号、国际区号号码等常见格式。
 * 会有一些误伤(比如长订单号)，但这是个"宁可拦多一点"的安全类功能，可以接受。
 */

const DIGIT_RUN_MIN_LENGTH = 8;

// 匹配数字，允许穿插空格/短横线/点/括号/斜杠等常见电话号码分隔符
const PHONE_LIKE_PATTERN = /(?:\d[\s\-.()/]*){8,}/g;

export function containsPhoneNumber(text: string): boolean {
  if (!text) return false;
  const matches = text.match(PHONE_LIKE_PATTERN);
  if (!matches) return false;
  return matches.some((m) => m.replace(/\D/g, "").length >= DIGIT_RUN_MIN_LENGTH);
}
