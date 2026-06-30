const buckets = new Map();

/** Simple in-memory rate limiter per key */
export function allowRate(key, maxRequests, windowMs) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= maxRequests;
}

export function rateLimitMiddleware(maxRequests, windowMs, keyFn) {
  return (req, res, next) => {
    const key = keyFn(req);
    if (!allowRate(key, maxRequests, windowMs)) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    next();
  };
}
