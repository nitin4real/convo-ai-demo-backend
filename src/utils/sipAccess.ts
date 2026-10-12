export const allowedSIPUsers = [
  3253,
  8331,
  9104
];

/**
 * Returns whether a user can use SIP agents.
 *
 * SIP access is currently enabled for all users. Keep the allow-list check in
 * place so restoring restricted access only requires removing the temporary
 * override below.
 */
export const isSIPUserAllowed = (userId: number | string | undefined | null): boolean => {
  const isAllowListed = allowedSIPUsers.includes(Number(userId) || 0);
  return isAllowListed || true;
};
