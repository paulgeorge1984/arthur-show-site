import ftplib, socket, ssl, urllib.request, json, os, sys

def probe(label, fn):
    try:
        fn()
    except Exception as e:
        code = str(e)[:3]
        print(json.dumps({"stage": label, "exc_type": type(e).__name__, "errno": getattr(e, "errno", None), "ftp_code": int(code) if isinstance(e, ftplib.Error) and code.isdigit() else None, "verify_code": getattr(e, "verify_code", None)}))

def main():
    host = os.environ.get("FTP_HOST", "")
    user = os.environ.get("FTP_USERNAME", "")
    pw = os.environ.get("FTP_PASSWORD", "")
    rd = os.environ.get("FTP_REMOTE_DIR", "")
    print(json.dumps({"host_eq_ftp3": host == "ftp3.gmoserver.jp", "host_eq_ftp_arthur": host == "ftp.arthur-show.com", "host_eq_arthur": host == "arthur-show.com"}))

    def dns(target, label):
        ips = {x[4][0] for x in socket.getaddrinfo(target, None)}
        print(json.dumps({"stage": label, "dns_count": len(ips), "eq_58": "210.172.183.58" in ips, "eq_56": "210.172.183.56" in ips, "other": any(ip not in ("210.172.183.58", "210.172.183.56") for ip in ips)}))
    probe("dns_configured", lambda: dns(host, "dns_configured"))
    probe("dns_web", lambda: dns("arthur-show.com", "dns_web"))

    def tcp(tgt, label):
        with socket.create_connection((tgt, 21), timeout=8) as s:
            banner = s.recv(1024)
            print(json.dumps({"stage": label, "banner220": banner.startswith(b"220")}))
    probe("tcp_configured", lambda: tcp(host, "tcp_configured"))
    probe("tcp_canonical", lambda: tcp("ftp3.gmoserver.jp", "tcp_canonical"))

    def https():
        url = "https://arthur-show.com/messages/2026-10-24-stayfastchurch/"
        resp = urllib.request.urlopen(url, timeout=15)
        status = resp.status
        body = resp.read().decode("utf-8", errors="ignore")
        canon = '<link rel="canonical" href="https://arthur-show.com/messages/2026-10-24-stayfastchurch/">' in body
        video = "/embed/4LvYB7vAzIY?rel=0" in body
        print(json.dumps({"https_status": status, "has_canonical": canon, "has_video": video}))
    probe("https", https)

    def connect_only(target, port):
        with socket.create_connection((target, port), timeout=8):
            print(json.dumps({"stage": "connect_only", "target": target, "port": port, "ok": True}))
    for target, port in [("github.com",443),("arthur-show.com",80),("arthur-show.com",443),("ftp3.gmoserver.jp",21),("file3.rentalserver.jp",443)]:
        probe("connect_" + target + "_" + str(port), lambda t=target,p=port: connect_only(t,p))

    def ftps():
        ctx = ssl.create_default_context()
        ftp = ftplib.FTP_TLS(context=ctx)
        ftp.connect(host, 21, timeout=8)
        print('{"ftps_stage":"connected"}')
        ftp.login(user, pw)
        print('{"ftps_stage":"authenticated"}')
        ftp.prot_p()
        ftp.cwd(rd)
        print('{"ftps_stage":"cwd_ok"}')
        items = ftp.nlst()
        print(json.dumps({"ftps_nlst_count": len(items)}))
        ftp.quit()
    probe("ftps", ftps)

if __name__ == "__main__":
    main()
