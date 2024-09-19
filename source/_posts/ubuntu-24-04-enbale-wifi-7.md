---
title: "Ubuntu 24.04 LTS Upgrade Kernel to Enable Wi-Fi 7"
date: 2024-09-17 13:31:50
tags: 
  - linux
urlname: ubuntu-24-04-enable-wifi-7
language: en
---

I recently upgraded the OS of my PC from Ubuntu 22.04 LTS to 24.04 LTS. 

I want to enable Wi-Fi 7, which works perfectly on the same device with Windows 11, 
but only shows Bluetooth on Ubuntu (both 22.04 LTS and 24.04 LTS).

I found updating linux kernel to the latest version could be a solution:
- https://www.reddit.com/r/Ubuntu/comments/1cfhnmd/ubuntu_2404_lts_qualcomm_ncm865_wifi_7_adapter/
- https://askubuntu.com/questions/1513315/issue-with-wireless-network-connection-on-ubuntu-24-04-lts

## Update nvidia driver

My first attempt to update the kernel failed.
This is because I am using an old version (535) of nvidia driver. (See: https://wiki.ubuntu.com/Kernel/MainlineBuilds)
> First, if one is using select proprietary or out-of-tree modules 
> (e.g. bcmwl, fglrx, NVIDIA proprietary graphics drivers, VirtualBox, etc.) 
> unless there is an extra package available for the version you are testing, 
> you will need to uninstall the module first, in order to test the mainline kernel. 
> If you do not uninstall these modules first, then the upstream kernel may fail to install, or boot.

After updating nvidia driver from 535 to the latest 550 in "Additional Drivers", 
I successfully updated the kernel as follows.

## Upgrade Ubuntu kernel version

Refer to: https://sypalo.com/how-to-upgrade-ubuntu

### Update packages list
```
sudo apt-get update
```

### Upgrade packages
```
sudo apt-get upgrade
```

### Run full upgrade
```
sudo apt-get dist-upgrade
```

### Run cleanup
```
sudo apt-get autoremove
sudo apt-get clean
```

### Change current directory to /tmp (or elsewhere you like)
```
cd /tmp
```

### Download latest stable kernel (choose from https://kernel.ubuntu.com/mainline/)
```
wget -c https://kernel.ubuntu.com/mainline/v6.10.10/amd64/linux-headers-6.10.10-061010_6.10.10-061010.202409121037_all.deb
wget -c https://kernel.ubuntu.com/mainline/v6.10.10/amd64/linux-headers-6.10.10-061010-generic_6.10.10-061010.202409121037_amd64.deb
wget -c https://kernel.ubuntu.com/mainline/v6.10.10/amd64/linux-image-unsigned-6.10.10-061010-generic_6.10.10-061010.202409121037_amd64.deb
wget -c https://kernel.ubuntu.com/mainline/v6.10.10/amd64/linux-modules-6.10.10-061010-generic_6.10.10-061010.202409121037_amd64.deb
```

### Install latest stable kernel
```
sudo dpkg -i *.deb
```

### Reboot system after latest stable kernel upgrade
```
sudo reboot
```

Finally, the Wi-Fi icon appears and I no longer need a LAN cable.
