---
title: "Customize SSH Welcome Message for Ubuntu 24.04 LTS"
date: 2025-07-19 11:10:13
tags: 
  - linux
urlname: ubuntu-custom-ssh-welcome
language: en
---

The way to customize the welcome message when logging into an Ubuntu server via SSH is as simple in Ubuntu 24.04 LTS as previous versions (18.04 LTS, 20.04 LTS).

<!--more-->

A default welcome message looks like:

```shell
Welcome to Ubuntu 24.04.2 LTS (GNU/Linux 6.10.10-061010-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

Expanded Security Maintenance for Applications is not enabled.

65 updates can be applied immediately.
36 of these updates are standard security updates.
To see these additional updates run: apt list --upgradable

11 additional security updates can be applied with ESM Apps.
Learn more about enabling ESM Apps service at https://ubuntu.com/esm

Last login: Tue Jul 15 21:47:24 2025 from XXX.XXX.X.XXX
```

Kind of boring, huh?
They are created by running several scripts located in `/etc/update-motd.d/`, 
with the starting number determining the order of execution:

```shell
$ ls /etc/update-motd.d/
00-header     50-motd-news  90-updates-available       91-release-upgrade      95-hwe-eol         98-reboot-required
10-help-text  85-fwupd      91-contract-ua-esm-status  92-unattended-upgrades  98-fsck-at-reboot
```

To customize the welcome message, one can create a new script in this directory, for example:

```shell
sudo nano /etc/update-motd.d/99-custom-welcome
```

In my case, I just want to display some fancy [ASCII art](https://patorjk.com/software/taag/) and a custom message.
I asked ChatGPT to write a script which displays a random ASCII art from several candidates:

```bash
#!/bin/sh

printf "＝＝＝＝＝＝＝　おかえり、プロデューサー　＝＝＝＝＝＝＝\n"

# pick 0…3 from /dev/urandom
n=$(( $(od -An -N2 -tu2 /dev/urandom) % 4 ))

case $n in
  0)
    cat << 'EOF'
 __ .   ..         ,   .  .       ,  .         
/  `|_ *||   _ . .-+-  |\ | _  _.-+-*|. . _. _.
\__.[ )|||  (_)(_| |   | \|(_)(_. | ||(_|(_.(_]
EOF
    ;;
  1)
    cat << 'EOF'
                      _           _         _    _   
                     ( )_        ( )     _ (_ ) (_ ) 
  ___     _      ___ | ,_)   ___ | |__  (_) | |  | | 
/' _ `\ /'_`\  /'___)| |   /'___)|  _ `\| | | |  | | 
| ( ) |( (_) )( (___ | |_ ( (___ | | | || | | |  | | 
(_) (_)`\___/'`\____)`\__)`\____)(_) (_)(_)(___)(___)
EOF
    ;;
  2)
    cat << 'EOF'
                            _         _   _  
                           | |    o  | | | | 
  _  _    __   __ _|_  __  | |       | | | | 
 / |/ |  /  \_/    |  /    |/ \   |  |/  |/  
   |  |_/\__/ \___/|_/\___/|   |_/|_/|__/|__/
EOF
    ;;
  3)
    cat << 'EOF'
                                                 .    . 
                      /            /      .-.   /    /  
 .  .-.  .-._..-. ---/---.-.      /-.     `-'  /    /   
  )/   )(   )(      /   (        /   |   /    /    /    
 '/   (  `-'  `---'/     `---'_.'    |_.(__._/_.-_/_.-  
       `-                                               
EOF
    ;;
esac

printf "＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝\n"
```

Then, make the script executable:

```shell
$ sudo chmod +x /etc/update-motd.d/99-custom-welcome
```

Now, login to server via SSH again, and I can see my custom welcome message:

```shell
Welcome to Ubuntu 24.04.2 LTS (GNU/Linux 6.10.10-061010-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

Expanded Security Maintenance for Applications is not enabled.

65 updates can be applied immediately.
36 of these updates are standard security updates.
To see these additional updates run: apt list --upgradable

11 additional security updates can be applied with ESM Apps.
Learn more about enabling ESM Apps service at https://ubuntu.com/esm

*** System restart required ***
＝＝＝＝＝＝＝　おかえり、プロデューサー　＝＝＝＝＝＝＝
 __ .   ..         ,   .  .       ,  .         
/  `|_ *||   _ . .-+-  |\ | _  _.-+-*|. . _. _.
\__.[ )|||  (_)(_| |   | \|(_)(_. | ||(_|(_.(_]
＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝
Last login: Sat Jul 19 09:53:32 2025 from XXX.XXX.X.XXX
```

One can do more than just displaying ASCII art, as the scripts can execute any shell commands.

---
**References:** 

- https://medium.com/@j.bustarviejo/customizing-your-welcome-message-on-an-ubuntu-server-connection-24a8ebe4a088

- https://debimate.jp/2021/08/14/ubuntu-20-04へsshログインした際に表示されるwelcomeメッセージ/