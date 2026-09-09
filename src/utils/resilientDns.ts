import dns from "node:dns";

// 1. Ensure Node prioritizes IPv4 over IPv6 on Windows to prevent getaddrinfo timeouts
try {
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (e) {}

// 2. High-availability public DNS fallback for mission-critical external APIs
if (typeof window === "undefined") {
  try {
    const originalLookup = dns.lookup;
    const resolver = new dns.promises.Resolver();
    // Use Google, Cloudflare, and Quad9 public DNS
    resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4", "9.9.9.9"]);

    const targetDomains = [
      "supabase.co",
      "browserbase.com",
      "googleapis.com",
      "inngest.com",
      "brave.com",
    ];

    if (!(dns as any).__jobvantaResilientDnsPatched) {
      (dns as any).__jobvantaResilientDnsPatched = true;

      const customLookup = function (hostname: any, options: any, callback: any) {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }

        if (
          typeof hostname === "string" &&
          targetDomains.some((d) => hostname === d || hostname.endsWith(`.${d}`))
        ) {
          resolver
            .resolve4(hostname)
            .then((ips) => {
              if (ips && ips.length > 0) {
                if (options && options.all) {
                  callback(null, ips.map((ip) => ({ address: ip, family: 4 })));
                } else {
                  callback(null, ips[0], 4);
                }
              } else {
                originalLookup(hostname, options, callback);
              }
            })
            .catch(() => {
              // Graceful fallback to OS getaddrinfo if resolver fails
              originalLookup(hostname, options, callback);
            });
          return;
        }

        return originalLookup(hostname, options, callback);
      };

      // Preserve __promisify__ symbol if present
      if ((originalLookup as any).__promisify__) {
        (customLookup as any).__promisify__ = (originalLookup as any).__promisify__;
      }

      (dns as any).lookup = customLookup;
    }
  } catch (e) {
    console.warn("[ResilientDNS] Could not initialize resilient DNS resolver:", e);
  }
}

export function initResilientDns(): void {
  // Invoked to guarantee module evaluation
}
